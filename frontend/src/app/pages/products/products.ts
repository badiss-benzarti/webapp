import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductService } from '../../services/product';
import { OrderService } from '../../services/order';
import { AuthService } from '../../services/auth';
import { Product } from '../../models/product';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {
  products: Product[] = [];

  newProduct = {
    name: '',
    price: 0,
    quantity: 0
  };

  orderProductId = 0;
  orderQuantity = 1;

  countProductId = 0;
  ordersCountResult: any = null;

  message = '';
  error = '';

  constructor(
    private productService: ProductService,
    private orderService: OrderService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.clearMessages();

    this.productService.getProducts().subscribe({
      next: (data) => {
        this.products = data;
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  createProduct(): void {
    this.clearMessages();

    this.productService.createProduct(this.newProduct).subscribe({
      next: () => {
        this.message = 'Product created successfully.';
        this.newProduct = { name: '', price: 0, quantity: 0 };
        this.loadProducts();
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  deleteProduct(id: number): void {
    this.clearMessages();

    this.productService.deleteProduct(id).subscribe({
      next: (response) => {
        this.message = response.message || 'Product deleted successfully.';
        this.loadProducts();
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  selectProductForOrder(id: number): void {
    this.orderProductId = id;
    this.orderQuantity = 1;
  }

  placeOrder(): void {
  this.clearMessages();

  if (!this.orderProductId || this.orderProductId <= 0) {
    this.error = 'Please select a valid product ID.';
    return;
  }

  if (!this.orderQuantity || this.orderQuantity <= 0) {
    this.error = 'Quantity must be greater than 0.';
    return;
  }

  this.orderService.createOrder({
    productId: this.orderProductId,
    quantity: this.orderQuantity
  }).subscribe({
    next: (response: any) => {
      this.message = response.message || 'Order created successfully. Stock should decrease.';
      setTimeout(() => this.loadProducts(), 800);
    },
    error: (err) => {
      this.handleError(err);
    }
  });
}
  getOrdersCount(): void {
    this.clearMessages();

    this.productService.getOrdersCount(this.countProductId).subscribe({
      next: (response) => {
        this.ordersCountResult = response;
      },
      error: (err) => {
        this.handleError(err);
      }
    });
  }

  clearMessages(): void {
    this.message = '';
    this.error = '';
    this.ordersCountResult = null;
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
    this.error = 'Resource not found.';
  } else if (err.status === 500) {
    this.error = 'Server error. Check if all microservices are running.';
  } else if (err.status === 0) {
    this.error = 'API Gateway is not reachable.';
  } else {
    this.error = err.error?.message || err.message || 'Unknown error.';
  } }
}
