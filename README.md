# Distributed Web Application

## Project Description

This project is a distributed web application based on a microservices architecture.
The application manages products and orders using multiple backend services, databases, and Docker containers.

The goal of the project is to demonstrate:

* Microservices architecture
* REST API communication
* Docker-based infrastructure
* Database integration
* Service separation
* Future integration with Eureka, API Gateway, Keycloak, Feign Client, RabbitMQ, and a simple frontend

---

## Technologies Used

### Backend

* Java 17
* Spring Boot
* Spring Data JPA
* MySQL
* Node.js
* Express.js
* MongoDB

### Infrastructure

* Docker
* Docker Compose
* RabbitMQ
* Keycloak

### Tools

* IntelliJ IDEA
* Visual Studio Code
* Postman
* Git / GitHub

---

## Project Structure

```text
distributed-web-app/
│
├── product-service/
├── order-service/
├── discovery-server/
├── api-gateway/
├── config-server/
├── frontend/
├── docs/
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## Docker Services

The project uses Docker Compose to run the required infrastructure services.

### Services

| Service             | Description                  |  Port |
| ------------------- | ---------------------------- | ----: |
| MySQL               | Database for Product Service | 13307 |
| MongoDB             | Database for Order Service   | 27018 |
| RabbitMQ            | Message broker               |  5672 |
| RabbitMQ Management | RabbitMQ dashboard           | 15672 |
| Keycloak            | Authentication server        |  9090 |

---

## Run Docker Services

From the main project folder:

```bash
docker compose up -d
```

Check running containers:

```bash
docker ps
```

Stop services:

```bash
docker compose down
```

---

## Product Service

### Description

The Product Service is a Spring Boot microservice responsible for managing products.

### Technology

* Spring Boot
* Spring Data JPA
* MySQL Docker database

### Port

```text
8081
```

### Database Configuration

The Product Service connects to MySQL using:

```properties
spring.datasource.url=jdbc:mysql://127.0.0.1:13307/productdb
spring.datasource.username=root
spring.datasource.password=root
```

---

## Product Entity

```text
Product
- id
- name
- price
- quantity
```

---

## Product API Endpoints

| Method | Endpoint         | Description        |
| ------ | ---------------- | ------------------ |
| GET    | `/products`      | Get all products   |
| GET    | `/products/{id}` | Get product by ID  |
| POST   | `/products`      | Create new product |
| PUT    | `/products/{id}` | Update product     |
| DELETE | `/products/{id}` | Delete product     |

---

## Test Product Service

### Get all products

```http
GET http://localhost:8081/products
```

### Create product

```http
POST http://localhost:8081/products
```

Body:

```json
{
  "name": "Laptop",
  "price": 1200,
  "quantity": 10
}
```

### Update product

```http
PUT http://localhost:8081/products/1
```

Body:

```json
{
  "name": "Gaming Laptop",
  "price": 1500,
  "quantity": 5
}
```

### Delete product

```http
DELETE http://localhost:8081/products/1
```

---

## Order Service

### Description

The Order Service will be a Node.js microservice responsible for managing orders.

### Technology

* Node.js
* Express.js
* MongoDB

### Port

```text
8082
```

### Planned Order Entity

```text
Order
- id
- productId
- quantity
- status
- createdAt
```

### Planned Endpoints

| Method | Endpoint                            | Description             |
| ------ | ----------------------------------- | ----------------------- |
| GET    | `/orders`                           | Get all orders          |
| GET    | `/orders/{id}`                      | Get order by ID         |
| POST   | `/orders`                           | Create new order        |
| PUT    | `/orders/{id}/status`               | Update order status     |
| DELETE | `/orders/{id}`                      | Delete order            |
| GET    | `/orders/count/product/{productId}` | Count orders by product |

---

## RabbitMQ

RabbitMQ will be used for asynchronous communication between services.

Example planned scenario:

```text
When an order is created:
Order Service sends ORDER_CREATED event to RabbitMQ.
Product Service receives the event and decreases product stock.
```

RabbitMQ dashboard:

```text
http://localhost:15672
```

Login:

```text
Username: admin
Password: admin
```

---

## Keycloak

Keycloak will be used for authentication and authorization.

Keycloak dashboard:

```text
http://localhost:9090
```

Login:

```text
Username: admin
Password: admin
```

Planned roles:

```text
USER
ADMIN
```

---

## Future Architecture

```text
Frontend
   |
   v
API Gateway
   |
   |----> Product Service ----> MySQL
   |
   |----> Order Service   ----> MongoDB
   |
   |----> Keycloak
   |
   |----> Eureka Discovery Server

Order Service ---- RabbitMQ ---- Product Service
```

---

## Next Steps

* Add Order Service with Node.js and MongoDB
* Add Eureka Discovery Server
* Register services in Eureka
* Add API Gateway
* Add Config Server
* Add Keycloak security
* Add Feign Client for synchronous communication
* Add RabbitMQ for asynchronous communication
* Add simple frontend
* Dockerize all microservices
* Add documentation and screenshots

---

## Git Workflow

Create a new branch for each major feature:

```bash
git checkout -b order-service
```

After finishing a feature:

```bash
git add .
git commit -m "Add order service with MongoDB"
git push
```

---

## Current Status

Completed:

* Docker Compose setup
* MySQL Docker container
* MongoDB Docker container
* RabbitMQ Docker container
* Keycloak Docker container
* Product Service CRUD
* Product Service connected to MySQL Docker
* Product API tested with Postman

In progress:

* Order Service with Node.js and MongoDB
