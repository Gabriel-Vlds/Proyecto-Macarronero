// Guard para bloquear rutas si no hay sesion activa.
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigateByUrl('/login');
    return false;
  }

  const requiredRole = route.data?.['role'] as string | undefined;
  if (requiredRole && auth.user()?.role !== requiredRole) {
    router.navigateByUrl('/');
    return false;
  }

  return true;
};
