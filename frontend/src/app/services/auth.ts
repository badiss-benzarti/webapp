import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenUrl = '/auth/realms/distributed-app/protocol/openid-connect/token';
  private clientId = 'api-gateway';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    const body = new URLSearchParams();
    body.set('grant_type', 'password');
    body.set('client_id', this.clientId);
    body.set('username', username);
    body.set('password', password);

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    return this.http.post(this.tokenUrl, body.toString(), { headers }).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('username', username);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('username');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
      'Content-Type': 'application/json'
    });
  }

  getRoles(): string[] {
    const token = this.getToken();

    if (!token) {
      return [];
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.realm_access?.roles || [];
    } catch {
      return [];
    }
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isUser(): boolean {
    return this.hasRole('USER');
  }
}
