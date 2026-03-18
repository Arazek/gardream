import { Component, OnInit, inject } from '@angular/core';
import {
  IonContent, IonList, IonItem, IonLabel, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, idCardOutline, logOutOutline, shieldCheckmarkOutline,
} from 'ionicons/icons';
import { KeycloakProfile } from 'keycloak-js';

import { AuthService } from '../../core/auth/auth.service';
import { PageHeaderComponent, SectionComponent, AvatarComponent, DividerComponent } from '../../shared';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    IonContent, IonList, IonItem, IonLabel, IonIcon,
    PageHeaderComponent, SectionComponent, AvatarComponent, DividerComponent,
  ],
  styleUrl: './profile.page.scss',
  template: `
    <app-page-header title="Profile" />

    <ion-content class="profile-content">

      <div class="profile-hero">
        <app-avatar [name]="fullName" size="xl" class="profile-hero__avatar" />
        <h1 class="profile-hero__name">{{ fullName || '—' }}</h1>
        <p class="profile-hero__email">{{ profile?.email || '—' }}</p>
      </div>

      <app-divider />

      <app-section title="Account details">
        <ion-list lines="none" class="profile-list">

          <ion-item class="profile-item">
            <ion-icon slot="start" name="person-outline" class="profile-item__icon" />
            <ion-label>
              <p class="profile-item__label">First name</p>
              <p class="profile-item__value">{{ profile?.firstName || '—' }}</p>
            </ion-label>
          </ion-item>

          <ion-item class="profile-item">
            <ion-icon slot="start" name="person-outline" class="profile-item__icon" />
            <ion-label>
              <p class="profile-item__label">Last name</p>
              <p class="profile-item__value">{{ profile?.lastName || '—' }}</p>
            </ion-label>
          </ion-item>

          <ion-item class="profile-item">
            <ion-icon slot="start" name="mail-outline" class="profile-item__icon" />
            <ion-label>
              <p class="profile-item__label">Email</p>
              <p class="profile-item__value">{{ profile?.email || '—' }}</p>
            </ion-label>
          </ion-item>

          <ion-item class="profile-item">
            <ion-icon slot="start" name="id-card-outline" class="profile-item__icon" />
            <ion-label>
              <p class="profile-item__label">Username</p>
              <p class="profile-item__value">{{ profile?.username || '—' }}</p>
            </ion-label>
          </ion-item>

          <ion-item class="profile-item">
            <ion-icon slot="start" name="shield-checkmark-outline" class="profile-item__icon" />
            <ion-label>
              <p class="profile-item__label">Email verified</p>
              <p class="profile-item__value">{{ profile?.emailVerified ? 'Yes' : 'No' }}</p>
            </ion-label>
          </ion-item>

        </ion-list>
      </app-section>

      <app-divider />

      <app-section title="Session">
        <ion-list lines="none" class="profile-list">
          <ion-item
            class="profile-item profile-item--danger"
            button
            detail="false"
            (click)="logout()"
          >
            <ion-icon slot="start" name="log-out-outline" class="profile-item__icon" />
            <ion-label>Sign out</ion-label>
          </ion-item>
        </ion-list>
      </app-section>

    </ion-content>
  `,
})
export class ProfilePage implements OnInit {
  private auth = inject(AuthService);

  profile: KeycloakProfile | null = null;

  get fullName(): string {
    if (!this.profile) return '';
    return [this.profile.firstName, this.profile.lastName].filter(Boolean).join(' ');
  }

  constructor() {
    addIcons({ personOutline, mailOutline, idCardOutline, logOutOutline, shieldCheckmarkOutline });
  }

  async ngOnInit(): Promise<void> {
    this.profile = await this.auth.getProfile();
  }

  logout(): void {
    this.auth.logout();
  }
}
