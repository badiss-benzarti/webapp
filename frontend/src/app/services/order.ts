import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth';
import { Order } from '../models/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private baseUrl = '/api/orders';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(this.baseUrl, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createOrder(order: { productId: number; quantity: number }): Observable<Order> {
    return this.http.post<Order>(this.baseUrl, order, {
      headers: this.authService.getAuthHeaders()
    });
  }

  cancelOrder(orderId: string): Observable<any> {
    return this.http.put(`${this.baseUrl}/${orderId}/cancel`, {}, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
