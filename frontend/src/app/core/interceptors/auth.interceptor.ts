import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, of, switchMap, catchError, timeout } from 'rxjs';
import Keycloak from 'keycloak-js';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const keycloak = inject(Keycloak);

  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // updateToken(30) refreshes the access token if it expires within 30 seconds,
  // ensuring we never send a stale token to the API.
  return from(keycloak.updateToken(30)).pipe(
    timeout(5000),
    switchMap(() => of(keycloak.token ?? '')),
    catchError((err) => {
      console.error('[authInterceptor] Failed to refresh/get token:', err);
      return of('');
    }),
    switchMap((token) => {
      console.log('[authInterceptor] url:', req.url, '| token present:', !!token, '| token prefix:', token ? token.substring(0, 20) + '...' : 'NONE');
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;
      return next(authReq);
    }),
  );
};
