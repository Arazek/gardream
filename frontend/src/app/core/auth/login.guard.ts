import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

/** Prevents authenticated users from landing on /login — redirects them to the app. */
export const loginGuard: CanActivateFn = async () => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  const authenticated = await keycloak.isLoggedIn();
  console.log('[loginGuard] authenticated:', authenticated);
  return !authenticated || router.createUrlTree(['/tabs/home']);
};
