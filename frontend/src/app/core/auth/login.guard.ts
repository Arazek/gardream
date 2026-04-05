import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

/** Prevents authenticated users from landing on /login — redirects them to the app. */
export const loginGuard: CanActivateFn = async () => {
  const keycloak = inject(KeycloakService);
  const router = inject(Router);

  try {
    console.log('[loginGuard] Checking if already authenticated...');

    // Wait for Keycloak to be ready (with timeout)
    const authenticated = await Promise.race([
      keycloak.isLoggedIn(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Auth check timeout')), 3000)
      ),
    ]);

    console.log('[loginGuard] authenticated:', authenticated);
    return !authenticated || router.createUrlTree(['/tabs/home']);
  } catch (err) {
    console.warn('[loginGuard] Auth check timeout or error, allowing login:', err);
    // On timeout/error, allow user to see login page
    return true;
  }
};
