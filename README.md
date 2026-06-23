# Distributed Web Application

This project is a distributed microservices web application built with:

* Angular frontend
* Spring Boot API Gateway
* Spring Boot Product Service
* Node.js Order Service
* Eureka Discovery Server
* Spring Cloud Config Server
* Keycloak Authentication Server
* RabbitMQ Message Broker
* MySQL Product Database
* MongoDB Order Database
* Prometheus and Grafana Monitoring
* Docker Compose deployment
* Kubernetes deployment

---

## 1. Project Architecture

The application is composed of several independent services:

| Service          | Technology          | Role                                |
| ---------------- | ------------------- | ----------------------------------- |
| Frontend         | Angular + Nginx     | User interface                      |
| API Gateway      | Spring Boot         | Single entry point for backend APIs |
| Discovery Server | Eureka              | Service discovery                   |
| Config Server    | Spring Cloud Config | Centralized configuration           |
| Product Service  | Spring Boot         | Product management and stock update |
| Order Service    | Node.js             | Order management                    |
| Keycloak         | Keycloak 24         | Authentication and authorization    |
| RabbitMQ         | RabbitMQ Management | Asynchronous communication          |
| MySQL            | MySQL 8             | Product database                    |
| MongoDB          | MongoDB 7           | Order database                      |
| Prometheus       | Prometheus          | Metrics collection                  |
| Grafana          | Grafana             | Metrics visualization               |

---

## 2. Communication Between Services

### Synchronous Communication

Synchronous communication is used when a service needs an immediate response.

Examples:

* Frontend calls API Gateway.
* API Gateway routes requests to Product Service.
* API Gateway routes requests to Order Service.
* Order Service can call Product Service to check product information.

Example flow:

```text
Frontend → API Gateway → Product Service
Frontend → API Gateway → Order Service
```

---

### Asynchronous Communication

Asynchronous communication is done using RabbitMQ.

When an order is created, Order Service sends an event to RabbitMQ. Product Service consumes this event and decreases the product quantity.

Example flow:

```text
Order Service → RabbitMQ → Product Service → MySQL
```

This allows services to stay decoupled.

---

## 3. Databases

Each microservice has its own database.

| Service         | Database |
| --------------- | -------- |
| Product Service | MySQL    |
| Order Service   | MongoDB  |

Product data is stored in MySQL.

Order data is stored in MongoDB.

---

## 4. Authentication

Authentication is handled by Keycloak.

Default users:

| Username  | Password | Role        |
| --------- | -------- | ----------- |
| adminuser | admin123 | ADMIN, USER |
| testuser  | test123  | USER        |

Keycloak admin credentials:

```text
Username: admin
Password: admin
```

---

# Part 1 — Docker Compose Deployment

## 5. Launch the Application with Docker Compose

Open PowerShell and run:

```powershell
cd C:\Users\GIGABYTE\distributed-web-app
docker compose up -d
```

Check running containers:

```powershell
docker compose ps
```

Expected containers:

```text
mysql-db
mongo-order
rabbitmq
keycloak
discovery-server
config-server
product-service
order-service
api-gateway
frontend
prometheus
grafana
```

---

## 6. Docker Compose URLs

| Tool        | URL                    | Credentials   |
| ----------- | ---------------------- | ------------- |
| Frontend    | http://localhost:4200  | App login     |
| API Gateway | http://localhost:8088  | JWT required  |
| Eureka      | http://localhost:8761  | No login      |
| Keycloak    | http://localhost:9090  | admin / admin |
| RabbitMQ    | http://localhost:15672 | admin / admin |
| Prometheus  | http://localhost:9091  | No login      |
| Grafana     | http://127.0.0.1:19090 | admin / admin |

---

## 7. Docker Compose Demo Scenario

### Step 1 — Open the frontend

```text
http://localhost:4200
```

Login using:

```text
adminuser / admin123
```

or:

```text
testuser / test123
```

---

### Step 2 — Create a product

Example:

```text
Name: Test Product
Price: 100
Quantity: 10
```

---

### Step 3 — Create an order

Create an order using the same product.

Example:

```text
Quantity: 2
```

---

### Step 4 — Check stock update

Expected result:

```text
Product quantity: 10 → 8
```

This proves that RabbitMQ asynchronous communication works.

---

## 8. Monitoring with Prometheus and Grafana

Prometheus collects metrics from Spring Boot services using:

```text
/actuator/prometheus
```

Prometheus URL:

```text
http://localhost:9091
```

Go to:

```text
Status → Targets
```

Expected targets:

```text
api-gateway        UP
config-server      UP
discovery-server   UP
product-service    UP
```

Grafana URL:

```text
http://127.0.0.1:19090
```

Login:

```text
admin / admin
```

Dashboard panels:

```text
JVM Memory Usage
Microservices Status
HTTP Requests Count
```

---

## 9. Stop Docker Compose Safely

Use:

```powershell
docker compose stop
```

Do not use this unless you want to delete the databases:

```powershell
docker compose down -v
```

---

# Part 2 — Kubernetes Deployment

## 10. Kubernetes Requirements

Before launching Kubernetes, make sure:

* Docker Desktop is running.
* Kubernetes is enabled in Docker Desktop.
* The node is ready.

Check Kubernetes:

```powershell
kubectl get nodes
```

Expected:

```text
desktop-control-plane   Ready
```

---

## 11. Stop Docker Compose Before Kubernetes

To avoid port conflicts:

```powershell
cd C:\Users\GIGABYTE\distributed-web-app
docker compose stop
```

---

## 12. Launch the Application on Kubernetes

Apply Kubernetes files:

```powershell
cd C:\Users\GIGABYTE\distributed-web-app

kubectl apply -f .\k8s\00-namespace.yaml
kubectl apply -f .\k8s\01-secrets.yaml
kubectl apply -f .\k8s\02-infra.yaml
kubectl apply -f .\k8s\03-discovery-config.yaml
kubectl apply -f .\k8s\04-product-order.yaml
kubectl apply -f .\k8s\05-keycloak-gateway.yaml
kubectl apply -f .\k8s\06-frontend.yaml
```

Apply Keycloak realm import:

```powershell
kubectl create configmap keycloak-realm `
  --from-file=distributed-app-realm.json=.\keycloak\import\distributed-app-realm.json `
  -n distributed-web-app `
  --dry-run=client -o yaml | kubectl apply -f -
```

Apply Keycloak import configuration:

```powershell
kubectl apply -f .\k8s\05-keycloak-only.yaml
```

Restart Keycloak:

```powershell
kubectl rollout restart deployment keycloak -n distributed-web-app
kubectl rollout status deployment/keycloak -n distributed-web-app
```

Check pods:

```powershell
kubectl get pods -n distributed-web-app
```

Expected:

```text
api-gateway        1/1 Running
config-server      1/1 Running
discovery-server   1/1 Running
frontend           1/1 Running
keycloak           1/1 Running
mongo-order        1/1 Running
mysql-db           1/1 Running
order-service      1/1 Running
product-service    1/1 Running
rabbitmq           1/1 Running
```

Check services:

```powershell
kubectl get svc -n distributed-web-app
```

---

## 13. Kubernetes Port-Forward Commands

Open separate PowerShell terminals for each command.

Frontend:

```powershell
kubectl port-forward svc/frontend 4200:80 -n distributed-web-app
```

API Gateway:

```powershell
kubectl port-forward svc/api-gateway 8088:8088 -n distributed-web-app
```

Keycloak:

```powershell
kubectl port-forward svc/keycloak 9093:8080 -n distributed-web-app
```

Eureka:

```powershell
kubectl port-forward svc/discovery-server 8761:8761 -n distributed-web-app
```

RabbitMQ:

```powershell
kubectl port-forward svc/rabbitmq 15672:15672 -n distributed-web-app
```

---

## 14. Kubernetes URLs

| Tool        | URL                    | Credentials   |
| ----------- | ---------------------- | ------------- |
| Frontend    | http://127.0.0.1:4200  | App login     |
| API Gateway | http://127.0.0.1:8088  | JWT required  |
| Keycloak    | http://127.0.0.1:9093  | admin / admin |
| Eureka      | http://127.0.0.1:8761  | No login      |
| RabbitMQ    | http://127.0.0.1:15672 | admin / admin |

---

## 15. Kubernetes Demo Scenario

1. Open frontend:

```text
http://127.0.0.1:4200
```

2. Login:

```text
adminuser / admin123
```

3. Create product:

```text
Quantity: 10
```

4. Create order:

```text
Quantity: 2
```

5. Refresh product list.

Expected:

```text
Quantity: 10 → 8
```

---

## 16. Why Frontend Does Not Appear in Eureka

The frontend does not appear in Eureka because it is not a backend microservice.

The frontend is an Angular static application served by Nginx.

Eureka registers backend services only:

```text
API-GATEWAY
CONFIG-SERVER
PRODUCT-SERVICE
ORDER-SERVICE
```

---

# Part 3 — Useful Restart and Debug Commands

## 17. Docker Compose Restart Commands

Restart one service:

```powershell
docker compose restart service-name
```

Examples:

```powershell
docker compose restart order-service
docker compose restart product-service
docker compose restart api-gateway
docker compose restart rabbitmq
docker compose restart mysql-db
docker compose restart mongo-order
```

Restart RabbitMQ communication flow:

```powershell
docker exec rabbitmq rabbitmq-diagnostics -q ping
docker compose restart order-service
docker compose restart product-service
```

Check logs:

```powershell
docker compose logs --tail=100 order-service
docker compose logs --tail=100 product-service
docker compose logs --tail=100 api-gateway
docker compose logs --tail=100 rabbitmq
```

---

## 18. Kubernetes Restart Commands

Restart one deployment:

```powershell
kubectl rollout restart deployment service-name -n distributed-web-app
```

Examples:

```powershell
kubectl rollout restart deployment order-service -n distributed-web-app
kubectl rollout restart deployment product-service -n distributed-web-app
kubectl rollout restart deployment api-gateway -n distributed-web-app
kubectl rollout restart deployment rabbitmq -n distributed-web-app
kubectl rollout restart deployment mysql-db -n distributed-web-app
kubectl rollout restart deployment mongo-order -n distributed-web-app
```

Check rollout:

```powershell
kubectl rollout status deployment/order-service -n distributed-web-app
```

Check pods:

```powershell
kubectl get pods -n distributed-web-app
```

Check logs:

```powershell
kubectl logs -n distributed-web-app -l app=order-service --tail=100
kubectl logs -n distributed-web-app -l app=product-service --tail=100
kubectl logs -n distributed-web-app -l app=api-gateway --tail=100
kubectl logs -n distributed-web-app -l app=rabbitmq --tail=100
```

---

# Part 4 — Common Problems and Fixes

## 19. Quantity Does Not Change After Order

This usually means RabbitMQ communication failed.

Expected flow:

```text
Order Service → RabbitMQ → Product Service → MySQL
```

### Docker Compose fix

```powershell
cd C:\Users\GIGABYTE\distributed-web-app

docker exec rabbitmq rabbitmq-diagnostics -q ping

docker compose restart order-service
Start-Sleep -Seconds 20
docker compose logs --tail=80 order-service

docker compose restart product-service
Start-Sleep -Seconds 30
docker compose logs --tail=80 product-service
```

Look for:

```text
RabbitMQ connected successfully
```

Open RabbitMQ:

```text
http://localhost:15672
```

Check:

```text
Queues and Streams → order.created.queue
Consumers = 1
```

---

### Kubernetes fix

```powershell
kubectl rollout restart deployment order-service -n distributed-web-app
Start-Sleep -Seconds 20
kubectl logs -n distributed-web-app -l app=order-service --tail=80

kubectl rollout restart deployment product-service -n distributed-web-app
Start-Sleep -Seconds 30
kubectl logs -n distributed-web-app -l app=product-service --tail=80
```

Open RabbitMQ:

```powershell
kubectl port-forward svc/rabbitmq 15672:15672 -n distributed-web-app
```

Then open:

```text
http://127.0.0.1:15672
```

---

## 20. API Orders Returns 500

Check Order Service logs.

Docker Compose:

```powershell
docker compose logs --tail=150 order-service
docker compose logs --tail=100 api-gateway
```

Kubernetes:

```powershell
kubectl logs -n distributed-web-app -l app=order-service --tail=150
kubectl logs -n distributed-web-app -l app=api-gateway --tail=100
```

Common causes:

```text
MongoDB not ready
RabbitMQ not ready
Order Service started too early
Eureka not ready
```

Restart order:

```powershell
docker compose restart mongo-order rabbitmq
docker compose restart order-service api-gateway
```

or in Kubernetes:

```powershell
kubectl rollout restart deployment mongo-order -n distributed-web-app
kubectl rollout restart deployment rabbitmq -n distributed-web-app
kubectl rollout restart deployment order-service -n distributed-web-app
kubectl rollout restart deployment api-gateway -n distributed-web-app
```

---

## 21. RabbitMQ Channel Closed

Docker Compose:

```powershell
docker exec rabbitmq rabbitmq-diagnostics -q ping
docker compose restart order-service
docker compose restart product-service
```

Kubernetes:

```powershell
kubectl rollout restart deployment order-service -n distributed-web-app
kubectl rollout restart deployment product-service -n distributed-web-app
```

---

## 22. Clear Databases for a Fresh Test

### Docker Compose

Stop app services:

```powershell
docker compose stop frontend api-gateway product-service order-service
```

Keep databases running:

```powershell
docker compose up -d mysql-db mongo-order rabbitmq
```

Clear MongoDB orders:

```powershell
docker exec mongo-order mongosh orderdb --eval "db.getCollectionNames().forEach(c => db[c].deleteMany({}))"
```

Check MySQL tables:

```powershell
docker exec mysql-db mysql -uroot -proot productdb -e "SHOW TABLES;"
```

Clear products table:

```powershell
docker exec mysql-db mysql -uroot -proot productdb -e "SET FOREIGN_KEY_CHECKS=0; TRUNCATE TABLE products; SET FOREIGN_KEY_CHECKS=1;"
```

Restart app:

```powershell
docker compose up -d product-service order-service api-gateway frontend
```

---

### Kubernetes

Because Kubernetes uses temporary storage in this project, restarting database pods can reset the data.

```powershell
kubectl rollout restart deployment mysql-db -n distributed-web-app
kubectl rollout restart deployment mongo-order -n distributed-web-app
kubectl rollout restart deployment rabbitmq -n distributed-web-app
kubectl rollout restart deployment product-service -n distributed-web-app
kubectl rollout restart deployment order-service -n distributed-web-app
kubectl rollout restart deployment api-gateway -n distributed-web-app
```

---

## 23. Dangerous Commands to Avoid

Do not use these unless you intentionally want to delete data:

```powershell
docker compose down -v
docker volume rm
docker system prune --volumes
kubectl delete namespace distributed-web-app
```

Use this instead for normal stop:

```powershell
docker compose stop
```

or for Kubernetes:

```powershell
kubectl scale deployment --all --replicas=0 -n distributed-web-app
```

---

# Part 5 — Git Commands

## 24. Push to Kubernetes Branch

Create branch:

```powershell
git checkout -b kubernetes
```

If branch already exists:

```powershell
git checkout kubernetes
```

Add files:

```powershell
git add .
```

Commit:

```powershell
git commit -m "Add Kubernetes deployment and monitoring configuration"
```

Push:

```powershell
git push -u origin kubernetes
```

---

## 25. Check Current Branch

```powershell
git branch --show-current
```

---

## 26. Check Git Status

```powershell
git status
```

---

# Final Notes

This project demonstrates:

* Microservices architecture
* Synchronous communication
* Asynchronous communication with RabbitMQ
* Service discovery with Eureka
* Centralized configuration
* JWT authentication with Keycloak
* Database per service
* Docker Compose deployment
* Kubernetes orchestration
* Monitoring with Prometheus and Grafana

Prometheus and Grafana are configured in the Docker Compose environment.

Kubernetes is used to demonstrate orchestration and deployment of the distributed application.
