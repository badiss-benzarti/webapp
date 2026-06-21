import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AuthService } from './auth';
import { Product } from '../models/product';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = '/api/products';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.baseUrl, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.baseUrl, product, {
      headers: this.authService.getAuthHeaders()
    });
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getOrdersCount(productId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${productId}/orders-count`, {
      headers: this.authService.getAuthHeaders()
    });
  }
}
