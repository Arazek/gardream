import { Component } from '@angular/core';
import { IonContent, IonButton } from '@ionic/angular/standalone';

import { AuthService } from './auth.service';
import { LogoComponent, DividerComponent, SocialLoginButtonComponent, SocialProvider } from '../../shared';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [IonContent, IonButton, LogoComponent, DividerComponent, SocialLoginButtonComponent],
  styleUrl: './login.page.scss',
  template: `
    <ion-content class="login-content">
      <div class="login-layout">

        <div class="login-brand">
          <app-logo appName="PWA Template" size="lg" />
          <h1 class="login-brand__name">PWA Template</h1>
          <p class="login-brand__tagline">Sign in to continue</p>
        </div>

        <div class="login-actions">
          <app-social-login-button provider="google" (login)="loginWithKeycloak()" />
          <app-social-login-button provider="facebook" (login)="loginWithKeycloak()" />
          <app-social-login-button provider="apple" (login)="loginWithKeycloak()" />

          <app-divider label="or" />

          <ion-button expand="block" fill="solid" (click)="loginWithKeycloak()">
            Sign in with email
          </ion-button>
        </div>

      </div>
    </ion-content>
  `,
})
export class LoginPage {
  constructor(private auth: AuthService) {}

  loginWithKeycloak(): void {
    this.auth.login();
  }
}
