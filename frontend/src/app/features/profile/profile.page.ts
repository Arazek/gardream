import { Component, OnInit, inject, effect, Injector, runInInjectionContext } from '@angular/core';
import {
  IonList, IonItem, IonLabel, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline, mailOutline, idCardOutline, logOutOutline, shieldCheckmarkOutline,
} from 'ionicons/icons';
import { KeycloakProfile } from 'keycloak-js';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationService, AppNotification } from '../../core/notifications/notification.service';
import { NotificationCentreComponent } from '../home/components/notification-centre/notification-centre.component';
import { TopAppBarComponent, NavAction, SectionComponent, AvatarComponent, DividerComponent, PageContentComponent, PageBodyWrapperComponent } from '../../shared';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    IonList, IonItem, IonLabel, IonIcon,
    TopAppBarComponent, SectionComponent, AvatarComponent, DividerComponent, PageContentComponent, PageBodyWrapperComponent, NotificationCentreComponent,
  ],
  styleUrl: './profile.page.scss',
  template: `
    <app-top-app-bar title="Profile" [actions]="topBarActions" (actionClick)="onTopBarAction($event)" />

    <app-notification-centre
      [open]="notificationCentreOpen"
      [notifications]="notifications"
      (closed)="notificationCentreOpen = false"
      (markAllRead)="notificationService.markAllRead()"
      (dismiss)="notificationService.dismiss($event)"
    />

    <app-page-content class="profile-content">
      <app-page-body-wrapper>

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

      </app-page-body-wrapper>
    </app-page-content>
  `,
})
export class ProfilePage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly injector = inject(Injector);
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;
  notifications: AppNotification[] = [];

  readonly topBarActions: NavAction[] = [
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
  ];

  profile: KeycloakProfile | null = null;

  get fullName(): string {
    if (!this.profile) return '';
    return [this.profile.firstName, this.profile.lastName].filter(Boolean).join(' ');
  }

  constructor() {
    addIcons({ personOutline, mailOutline, idCardOutline, logOutOutline, shieldCheckmarkOutline });
    runInInjectionContext(this.injector, () => {
      effect(() => {
        this.notifications = this.notificationService.notifications();
        this.updateTopBarBadge();
      });
    });
  }

  ngOnInit(): Promise<void> {
    return this.auth.getProfile().then(profile => {
      this.profile = profile;
    });
  }

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    }
  }

  private updateTopBarBadge(): void {
    const notifAction = this.topBarActions.find(a => a.id === 'notifications');
    if (notifAction) {
      notifAction.badge = this.notificationService.unreadCount();
    }
  }

  logout(): void {
    this.auth.logout();
  }
}
