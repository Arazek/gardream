import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const keycloak = inject(KeycloakService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('[errorInterceptor] status:', error.status, '| url:', req.url);
      if (error.status === 401) {
        const authenticated = keycloak.isLoggedIn();
        console.log('[errorInterceptor] 401 — authenticated:', authenticated);
        if (!authenticated) {
          console.log('[errorInterceptor] navigating to /login');
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    }),
  );
};
