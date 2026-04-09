import { Component, OnInit, inject, effect, Injector, runInInjectionContext } from '@angular/core';
import {
  IonList, IonItem, IonLabel,
  IonSegment, IonSegmentButton, IonIcon, IonToggle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline, chevronForward } from 'ionicons/icons';
import { KeycloakProfile } from 'keycloak-js';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

import { AuthService } from '../../core/auth/auth.service';
import { ThemeService, ColorScheme } from '../../core/theme/theme.service';
import { NotificationService, AppNotification } from '../../core/notifications/notification.service';
import { NotificationCentreComponent } from '../home/components/notification-centre/notification-centre.component';
import {
  TopAppBarComponent, NavAction, SectionComponent, DividerComponent, AvatarComponent, PageContentComponent, PageBodyWrapperComponent,
} from '../../shared';
import { NotificationsActions } from '../../store/notifications/notifications.actions';
import {
  selectMorningReminder, selectEveningReminder, selectInAppAlerts, selectNotificationsSaving,
} from '../../store/notifications/notifications.selectors';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    IonList, IonItem, IonLabel,
    IonSegment, IonSegmentButton, IonIcon, IonToggle,
    TopAppBarComponent, SectionComponent, DividerComponent, AvatarComponent, PageContentComponent, PageBodyWrapperComponent, NotificationCentreComponent,
  ],
  styleUrl: './settings.page.scss',
  template: `
    <app-top-app-bar title="Settings" [actions]="topBarActions" (actionClick)="onTopBarAction($event)" />

    <app-notification-centre
      [open]="notificationCentreOpen"
      [notifications]="notifications"
      (closed)="notificationCentreOpen = false"
      (markAllRead)="notificationService.markAllRead()"
      (dismiss)="notificationService.dismiss($event)"
    />

    <app-page-content class="settings-content">
      <app-page-body-wrapper class="settings-body">

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

          </ion-list>
        </app-section>

        <app-divider />

        <!-- Notifications -->
        <app-section title="Notifications">
          <ion-list lines="none" class="settings-list">

            <ion-item class="settings-item">
              <ion-label>
                <p>Morning reminder</p>
                <p class="settings-item__hint">Daily task summary in the morning</p>
              </ion-label>
              <ion-toggle
                slot="end"
                [checked]="morningReminder()"
                [disabled]="saving()"
                (ionChange)="onToggle('morning_reminder', $event)"
              />
            </ion-item>

            <ion-item class="settings-item">
              <ion-label>
                <p>Evening reminder</p>
                <p class="settings-item__hint">Upcoming tasks for tomorrow</p>
              </ion-label>
              <ion-toggle
                slot="end"
                [checked]="eveningReminder()"
                [disabled]="saving()"
                (ionChange)="onToggle('evening_reminder', $event)"
              />
            </ion-item>

            <ion-item class="settings-item">
              <ion-label>
                <p>In-app alerts</p>
                <p class="settings-item__hint">Overdue tasks and weather warnings</p>
              </ion-label>
              <ion-toggle
                slot="end"
                [checked]="inAppAlerts()"
                [disabled]="saving()"
                (ionChange)="onToggle('in_app_alerts', $event)"
              />
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

      </app-page-body-wrapper>
    </app-page-content>
  `,
})
export class SettingsPage implements OnInit {
  private readonly store = inject(Store);
  private readonly injector = inject(Injector);
  readonly theme = inject(ThemeService);
  readonly notificationService = inject(NotificationService);

  notificationCentreOpen = false;
  notifications: AppNotification[] = [];

  readonly topBarActions: NavAction[] = [
    { id: 'notifications', icon: 'notifications', label: 'Notifications' },
  ];

  // Signals
  readonly morningReminder = toSignal(this.store.select(selectMorningReminder), { initialValue: false });
  readonly eveningReminder = toSignal(this.store.select(selectEveningReminder), { initialValue: false });
  readonly inAppAlerts = toSignal(this.store.select(selectInAppAlerts), { initialValue: false });
  readonly saving = toSignal(this.store.select(selectNotificationsSaving), { initialValue: false });

  profile: KeycloakProfile | null = null;

  get fullName(): string {
    if (!this.profile) return '';
    return [this.profile.firstName, this.profile.lastName].filter(Boolean).join(' ');
  }

  constructor(private auth: AuthService) {
    addIcons({ logOutOutline, chevronForward });
    runInInjectionContext(this.injector, () => {
      effect(() => {
        this.notifications = this.notificationService.notifications();
        this.updateTopBarBadge();
      });
    });
  }

  async ngOnInit(): Promise<void> {
    this.profile = await this.auth.getProfile();
    this.store.dispatch(NotificationsActions.loadSettings());
  }

  onTopBarAction(id: string): void {
    if (id === 'notifications') {
      this.notificationCentreOpen = true;
    }
  }

  onSchemeChange(event: CustomEvent): void {
    this.theme.setScheme(event.detail.value as ColorScheme);
  }

  onToggle(field: 'morning_reminder' | 'evening_reminder' | 'in_app_alerts', event: CustomEvent): void {
    this.store.dispatch(NotificationsActions.updateSettings({ payload: { [field]: event.detail.checked } }));
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
