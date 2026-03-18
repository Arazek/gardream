import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logoGoogle, logoFacebook, logoApple } from 'ionicons/icons';

export type SocialProvider = 'google' | 'facebook' | 'apple';

const PROVIDER_CONFIG: Record<SocialProvider, { label: string; icon: string }> = {
  google:   { label: 'Continue with Google',   icon: 'logo-google' },
  facebook: { label: 'Continue with Facebook', icon: 'logo-facebook' },
  apple:    { label: 'Continue with Apple',    icon: 'logo-apple' },
};

@Component({
  selector: 'app-social-login-button',
  standalone: true,
  imports: [NgClass, IonButton, IonIcon],
  styleUrl: './social-login-button.component.scss',
  template: `
    <ion-button
      class="social-btn"
      [ngClass]="'social-btn--' + provider"
      expand="block"
      fill="outline"
      (click)="login.emit(provider)"
    >
      <ion-icon slot="start" [name]="config.icon" />
      {{ config.label }}
    </ion-button>
  `,
})
export class SocialLoginButtonComponent {
  @Input() provider: SocialProvider = 'google';
  @Output() login = new EventEmitter<SocialProvider>();

  get config() {
    return PROVIDER_CONFIG[this.provider];
  }

  constructor() {
    addIcons({ logoGoogle, logoFacebook, logoApple });
  }
}
