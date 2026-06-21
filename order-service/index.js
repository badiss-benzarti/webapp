const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const { Eureka } = require("eureka-js-client");
const amqp = require("amqplib");
require("dotenv").config();

const app = express();

app.use(express.json());

// =======================
// Environment variables
// =======================

const PORT = process.env.PORT || 8082;

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27018/orderdb";

const RABBITMQ_URL =
  process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5672";

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL || "http://localhost:8081";

const EUREKA_HOST = process.env.EUREKA_HOST || "localhost";
const EUREKA_PORT = process.env.EUREKA_PORT || 8761;
const SERVICE_HOSTNAME = process.env.SERVICE_HOSTNAME || "localhost";

const ORDER_CREATED_QUEUE = "order.created.queue";
const ORDER_CANCELLED_QUEUE = "order.cancelled.queue";

let rabbitChannel = null;

// =======================
// MongoDB connection
// =======================

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

// =======================
// RabbitMQ connection
// =======================

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    rabbitChannel = await connection.createChannel();

    await rabbitChannel.assertQueue(ORDER_CREATED_QUEUE, {
      durable: true
    });

    await rabbitChannel.assertQueue(ORDER_CANCELLED_QUEUE, {
      durable: true
    });

    console.log("RabbitMQ connected successfully");
  } catch (error) {
    console.error("RabbitMQ connection error:", error.message);
  }
}

function publishOrderCreatedEvent(order) {
  if (!rabbitChannel) {
    console.error("RabbitMQ channel is not available");
    return;
  }

  const event = {
    productId: order.productId,
    quantity: order.quantity
  };

  rabbitChannel.sendToQueue(
    ORDER_CREATED_QUEUE,
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,
      contentType: "application/json"
    }
  );

  console.log("Order created event sent to RabbitMQ:", event);
}

function publishOrderCancelledEvent(order) {
  if (!rabbitChannel) {
    console.error("RabbitMQ channel is not available");
    return;
  }

  const event = {
    productId: order.productId,
    quantity: order.quantity
  };

  rabbitChannel.sendToQueue(
    ORDER_CANCELLED_QUEUE,
    Buffer.from(JSON.stringify(event)),
    {
      persistent: true,
      contentType: "application/json"
    }
  );

  console.log("Order cancelled event sent to RabbitMQ:", event);
}

// =======================
// Eureka client
// =======================

const eurekaClient = new Eureka({
  instance: {
    app: "ORDER-SERVICE",
    instanceId: `ORDER-SERVICE:${PORT}`,
    hostName: SERVICE_HOSTNAME,
    ipAddr: SERVICE_HOSTNAME,

    statusPageUrl: `http://${SERVICE_HOSTNAME}:${PORT}/`,
    healthCheckUrl: `http://${SERVICE_HOSTNAME}:${PORT}/health`,
    homePageUrl: `http://${SERVICE_HOSTNAME}:${PORT}/`,

    port: {
      "$": Number(PORT),
      "@enabled": true
    },

    vipAddress: "ORDER-SERVICE",

    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn"
    }
  },

  eureka: {
    host: EUREKA_HOST,
    port: Number(EUREKA_PORT),
    servicePath: "/eureka/apps/"
  }
});

// =======================
// Order schema
// =======================

const orderSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      default: "CREATED"
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model("Order", orderSchema);

// =======================
// Product stock validation
// =======================

async function validateProductStock(productId, requestedQuantity) {
  try {
    if (!productId || productId <= 0) {
      return {
        valid: false,
        message: "Product ID must be valid"
      };
    }

    if (!requestedQuantity || requestedQuantity <= 0) {
      return {
        valid: false,
        message: "Quantity must be greater than 0"
      };
    }

    const response = await axios.get(
      `${PRODUCT_SERVICE_URL}/products/${productId}`
    );

    const product = response.data;

    if (!product) {
      return {
        valid: false,
        message: "Product not found"
      };
    }

    if (requestedQuantity > product.quantity) {
      return {
        valid: false,
        message: `Not enough stock. Available quantity is ${product.quantity}`
      };
    }

    return {
      valid: true,
      product: product
    };
  } catch (error) {
    return {
      valid: false,
      message: "Product Service is not available or product does not exist"
    };
  }
}

// =======================
// Routes
// =======================

app.get("/", (req, res) => {
  res.send("Order Service is running");
});

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "ORDER-SERVICE"
  });
});

// Get all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Count orders by product ID
app.get("/orders/count/product/:productId", async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const count = await Order.countDocuments({
      productId: productId
    });

    res.json({
      productId: productId,
      ordersCount: count
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Get order by ID
app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// Create order
app.post("/orders", async (req, res) => {
  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity);

    const validation = await validateProductStock(productId, quantity);

    if (!validation.valid) {
      return res.status(400).json({
        scenario: "Order creation validation",
        message: validation.message
      });
    }

    const order = new Order({
      productId: productId,
      quantity: quantity,
      status: "CREATED"
    });

    const savedOrder = await order.save();

    publishOrderCreatedEvent(savedOrder);

    res.status(201).json({
      scenario: "RabbitMQ Scenario 1 - Order created and stock decreased",
      message:
        "Order created successfully. Product stock will be decreased by RabbitMQ.",
      order: savedOrder
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

// Update order status
app.put("/orders/:id/status", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status
      },
      {
        new: true
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.json({
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

// Cancel order
app.put("/orders/:id/cancel", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    if (order.status === "CANCELLED") {
      return res.status(400).json({
        message: "Order is already cancelled"
      });
    }

    order.status = "CANCELLED";

    const cancelledOrder = await order.save();

    publishOrderCancelledEvent(cancelledOrder);

    res.json({
      scenario: "RabbitMQ Scenario 2 - Order cancelled and stock restored",
      message:
        "Order cancelled successfully. Product stock will be restored by RabbitMQ.",
      order: cancelledOrder
    });
  } catch (error) {
    res.status(400).json({
      message: error.message
    });
  }
});

// Delete order
app.delete("/orders/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.json({
      message: "Order deleted successfully",
      order: deletedOrder
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// =======================
// Start server
// =======================

app.listen(PORT, async () => {
  console.log(`Order Service running on port ${PORT}`);
  console.log(`Mongo URI: ${MONGO_URI}`);
  console.log(`RabbitMQ URL: ${RABBITMQ_URL}`);
  console.log(`Product Service URL: ${PRODUCT_SERVICE_URL}`);
  console.log(`Eureka: http://${EUREKA_HOST}:${EUREKA_PORT}/eureka`);

  await connectRabbitMQ();

  eurekaClient.start((error) => {
    if (error) {
      console.error("Eureka registration failed:", error);
    } else {
      console.log("ORDER-SERVICE registered with Eureka");
    }
  });
});