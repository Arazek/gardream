import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  const authenticated = await keycloak.isLoggedIn();
  console.log('[authGuard] url:', route.url.toString(), '| authenticated:', authenticated);
  return authenticated || router.createUrlTree(['/login']);
};
