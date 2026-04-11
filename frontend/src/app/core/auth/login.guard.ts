import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Keycloak from 'keycloak-js';

/** Prevents authenticated users from landing on /login — redirects them to the app. */
export const loginGuard: CanActivateFn = () => {
  const keycloak = inject(Keycloak);
  const router = inject(Router);

  const authenticated = !!keycloak.authenticated;
  console.log('[loginGuard] authenticated:', authenticated);
  return !authenticated || router.createUrlTree(['/tabs/home']);
};
