// Interceptor para adjuntar el token en llamadas HTTP al backend.
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const isPublicGetRequest =
    req.method === 'GET' &&
    (/\/courses(?:\/\d+)?$/.test(req.url) || /\/kits$/.test(req.url));

  if (isPublicGetRequest) {
    return next(req);
  }

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
