const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8082;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27018/orderdb";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((error) => console.error("MongoDB connection error:", error.message));

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

app.get("/", (req, res) => {
  res.send("Order Service is running");
});

app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
    res.status(500).json({ message: error.message });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/orders", async (req, res) => {
  try {
    const order = new Order({
      productId: req.body.productId,
      quantity: req.body.quantity,
      status: req.body.status || "CREATED"
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put("/orders/:id/status", async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete("/orders/:id", async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
});