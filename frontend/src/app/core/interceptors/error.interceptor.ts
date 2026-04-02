import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('[errorInterceptor] status:', error.status, '| url:', req.url);

      // Handle 401 Unauthorized (token expired or invalid)
      if (error.status === 401) {
        console.log('[errorInterceptor] 401 Unauthorized — token expired/invalid');

        // Clear the expired token from storage
        localStorage.removeItem('auth_token');

        // Redirect to login
        console.log('[errorInterceptor] redirecting to /login');
        router.navigate(['/login']);

        throw error;
      }

      return throwError(() => error);
    }),
  );
};
