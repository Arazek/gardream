import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Keycloak from 'keycloak-js';

export const authGuard: CanActivateFn = (route) => {
  const keycloak = inject(Keycloak);
  const router = inject(Router);

  const authenticated = !!keycloak.authenticated;
  console.log('[authGuard] url:', route.url.toString(), '| authenticated:', authenticated);
  return authenticated || router.createUrlTree(['/login']);
};
