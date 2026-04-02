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
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Keycloak init timeout')), 10000)
    );

    return Promise.race([
      keycloak.init({
        config: environment.keycloak,
        initOptions: {
          checkLoginIframe: false,
          silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html',
          pkceMethod: 'S256',
          onLoad: 'check-sso',
        },
        enableBearerInterceptor: false,
        loadUserProfileAtStartUp: false,
      }),
      timeoutPromise,
    ]).catch((err) => {
      console.error(
        '[Keycloak] Initialization failed or timed out. Make sure Keycloak is running and the ' +
        'self-signed cert at ' + environment.keycloak.url + ' is trusted in your browser.',
        err,
      );
      return false;
    });
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
