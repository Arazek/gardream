import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError, throwError, timeout } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(KeycloakService);

  if (!req.url.includes('/api/')) {
    return next(req);
  }

  return from(keycloak.getToken()).pipe(
    timeout(5000), // 5 second timeout for token fetch
    switchMap((token) => {
      console.log('[authInterceptor] url:', req.url, '| token present:', !!token, '| token prefix:', token ? token.substring(0, 20) + '...' : 'NONE');
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(authReq);
    }),
    catchError((err) => {
      console.error('[authInterceptor] Failed to get token:', err);
      // If token fetch fails, try request without auth token
      return next(req);
    }),
  );
};
