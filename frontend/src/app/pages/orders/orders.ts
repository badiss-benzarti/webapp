import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { Order } from '../../models/order';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders implements OnInit {
  orders: Order[] = [];

  newOrder = {
    productId: 0,
    quantity: 1
  };

  cancelOrderId = '';

  message = '';
  error = '';

  constructor(
    private orderService: OrderService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.clearMessages();

    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders = data;
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  createOrder(): void {
    this.clearMessages();

    this.orderService.createOrder(this.newOrder).subscribe({
      next: () => {
        this.message = 'Order created. RabbitMQ should decrease product stock.';
        this.newOrder = { productId: 0, quantity: 1 };
        this.loadOrders();
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  cancelOrder(id?: string): void {
  this.clearMessages();

  const orderId = id || this.cancelOrderId;

  if (!orderId) {
    this.error = 'Please enter a valid order ID.';
    return;
  }

  this.orderService.cancelOrder(orderId).subscribe({
    next: (response: any) => {
      this.message = response.message || 'Order cancelled. RabbitMQ should restore product stock.';
      this.cancelOrderId = '';
      this.loadOrders();
    },
    error: (err) => {
      this.handleError(err);
    }
  });
}

  clearMessages(): void {
    this.message = '';
    this.error = '';
  }
handleError(err: any): void {
  console.error(err);

  if (err.status === 401) {
    this.error = 'Session expired. Please login again.';
  } else if (err.status === 403) {
    this.error = 'You do not have permission for this action.';
  } else if (err.status === 400) {
    this.error = err.error?.message || 'Bad request. Check your data.';
  } else if (err.status === 404) {
    this.error = 'Order not found.';
  } else if (err.status === 500) {
    this.error = 'Order Service error. Make sure order-service is running on port 8082.';
  } else if (err.status === 0) {
    this.error = 'API Gateway or Order Service is not reachable.';
  } else {
    this.error = err.error?.message || err.message || 'Unknown error.';
  }
}
}
