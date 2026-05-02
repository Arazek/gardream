import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('[errorInterceptor] status:', error.status, '| url:', req.url);

      // Handle 401/403 Unauthorized (token expired/invalid or missing)
      if (error.status === 401 || error.status === 403) {
        console.log(`[errorInterceptor] ${error.status} — not authenticated`);

        // Clear any stale auth state
        localStorage.removeItem('auth_token');

        // Only redirect to login if not already there (avoid redirect loops)
        if (!router.url.startsWith('/login')) {
          console.log('[errorInterceptor] redirecting to /login');
          router.navigate(['/login']);
        }

        throw error;
      }

      return throwError(() => error);
    }),
  );
};
