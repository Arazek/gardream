import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, from, switchMap } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const keycloak = inject(KeycloakService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('[errorInterceptor] status:', error.status, '| url:', req.url);

      // Handle 401 Unauthorized (token expired or invalid)
      if (error.status === 401) {
        return from(keycloak.isLoggedIn()).pipe(
          switchMap(async (authenticated) => {
            console.log('[errorInterceptor] 401 Unauthorized — token expired/invalid, authenticated:', authenticated);

            // Clear the expired token from storage
            localStorage.removeItem('auth_token');

            // Redirect to login
            console.log('[errorInterceptor] redirecting to /login');
            await router.navigate(['/login']);

            throw error;
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
