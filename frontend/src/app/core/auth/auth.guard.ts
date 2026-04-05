import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route) => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  try {
    console.log('[authGuard] Checking authentication for:', route.url.toString());

    // Wait for Keycloak to be ready (with timeout)
    const authenticated = await Promise.race([
      keycloak.isLoggedIn(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      ),
    ]);

    console.log('[authGuard] url:', route.url.toString(), '| authenticated:', authenticated);
    return authenticated || router.createUrlTree(['/login']);
  } catch (err) {
    console.error('[authGuard] Error checking authentication:', err);
    // On auth check failure, redirect to login
    return router.createUrlTree(['/login']);
  }
};
