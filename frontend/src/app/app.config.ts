import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideRouterStore } from '@ngrx/router-store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { rootReducers, rootEffects } from './store';
import { environment } from '../environments/environment';

function initializeKeycloak(keycloak: KeycloakService) {
  return () => {
    console.log('[Keycloak] Starting initialization with config:', environment.keycloak);

    const initPromise = keycloak
      .init({
        config: environment.keycloak,
        initOptions: {
          checkLoginIframe: false,
          silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
          pkceMethod: 'S256',
          onLoad: 'check-sso',
          silentCheckSsoFallback: false,
        },
        enableBearerInterceptor: false,
        loadUserProfileAtStartUp: false,
      })
      .then((authenticated) => {
        console.log('[Keycloak] Initialization complete. Authenticated:', authenticated);
        return authenticated;
      })
      .catch((err) => {
        console.warn('[Keycloak] Initialization failed, continuing unauthenticated:', err);
        return false;
      });

    // Wait for Keycloak, but give up after 10s so a dead server doesn't hang the app.
    const timeout = new Promise<boolean>((resolve) =>
      setTimeout(() => {
        console.warn('[Keycloak] Init timed out after 10s, continuing unauthenticated.');
        resolve(false);
      }, 10000)
    );

    return Promise.race([initPromise, timeout]);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    provideIonicAngular(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideStore(rootReducers),
    provideEffects(rootEffects),
    provideRouterStore(),
    provideStoreDevtools({ maxAge: 25, logOnly: environment.production }),
    KeycloakAngularModule,
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService],
    },
  ],
};
