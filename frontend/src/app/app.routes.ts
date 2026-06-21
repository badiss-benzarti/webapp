import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Products } from './pages/products/products';
import { Orders } from './pages/orders/orders';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'products',
    component: Products,
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    component: Orders,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'products'
  }
];
