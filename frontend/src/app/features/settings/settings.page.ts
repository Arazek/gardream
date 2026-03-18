import { Component, OnInit, inject } from '@angular/core';
import {
  IonContent, IonList, IonItem, IonLabel,
  IonSegment, IonSegmentButton, IonIcon, IonRippleEffect,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, chevronForward } from 'ionicons/icons';
import { KeycloakProfile } from 'keycloak-js';

import { AuthService } from '../../core/auth/auth.service';
import { ThemeService, ColorScheme, Accent } from '../../core/theme/theme.service';
import {
  PageHeaderComponent, SectionComponent, DividerComponent, AvatarComponent,
} from '../../shared';

interface AccentOption { value: Accent; color: string; label: string; }

const ACCENT_OPTIONS: AccentOption[] = [
  { value: null,    color: '#3880ff', label: 'Blue'  },
  { value: 'clay',  color: '#b5603a', label: 'Clay'  },
  { value: 'moss',  color: '#4a7c59', label: 'Moss'  },
  { value: 'dune',  color: '#9b7b4e', label: 'Dune'  },
  { value: 'slate', color: '#5b7fa6', label: 'Slate' },
];

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    IonContent, IonList, IonItem, IonLabel,
    IonSegment, IonSegmentButton, IonIcon, IonRippleEffect,
    PageHeaderComponent, SectionComponent, DividerComponent, AvatarComponent,
  ],
  styleUrl: './settings.page.scss',
  template: `
    <app-page-header title="Settings" />

    <ion-content class="settings-content">

      <!-- Profile -->
      <div class="settings-profile">
        <app-avatar [name]="fullName" size="xl" />
        <div class="settings-profile__info">
          <p class="settings-profile__name">{{ fullName }}</p>
          <p class="settings-profile__email">{{ profile?.email }}</p>
        </div>
      </div>

      <app-divider />

      <!-- Appearance -->
      <app-section title="Appearance">
        <ion-list lines="none" class="settings-list">

          <ion-item class="settings-item">
            <ion-label>Color scheme</ion-label>
            <ion-segment
              class="settings-segment"
              [value]="theme.scheme()"
              (ionChange)="onSchemeChange($event)"
            >
              <ion-segment-button value="light">Light</ion-segment-button>
              <ion-segment-button value="system">Auto</ion-segment-button>
              <ion-segment-button value="dark">Dark</ion-segment-button>
            </ion-segment>
          </ion-item>

          <ion-item class="settings-item">
            <ion-label>Accent color</ion-label>
            <div class="accent-picker">
              @for (opt of accentOptions; track opt.label) {
                <button
                  class="accent-swatch ion-activatable"
                  [class.accent-swatch--active]="theme.accent() === opt.value"
                  [style.--swatch-color]="opt.color"
                  [attr.aria-label]="opt.label"
                  (click)="onAccentChange(opt.value)"
                >
                  <ion-ripple-effect />
                </button>
              }
            </div>
          </ion-item>

        </ion-list>
      </app-section>

      <app-divider />

      <!-- Account -->
      <app-section title="Account">
        <ion-list lines="none" class="settings-list">
          <ion-item
            class="settings-item settings-item--danger"
            button
            detail="false"
            (click)="logout()"
          >
            <ion-icon slot="start" name="log-out-outline" />
            <ion-label>Sign out</ion-label>
          </ion-item>
        </ion-list>
      </app-section>

    </ion-content>
  `,
})
export class SettingsPage implements OnInit {
  readonly theme = inject(ThemeService);
  readonly accentOptions = ACCENT_OPTIONS;

  profile: KeycloakProfile | null = null;

  get fullName(): string {
    if (!this.profile) return '';
    return [this.profile.firstName, this.profile.lastName].filter(Boolean).join(' ');
  }

  constructor(private auth: AuthService) {
    addIcons({ logOutOutline, chevronForward });
  }

  async ngOnInit(): Promise<void> {
    this.profile = await this.auth.getProfile();
  }

  onSchemeChange(event: CustomEvent): void {
    this.theme.setScheme(event.detail.value as ColorScheme);
  }

  onAccentChange(accent: Accent): void {
    this.theme.setAccent(accent);
  }

  logout(): void {
    this.auth.logout();
  }
}
