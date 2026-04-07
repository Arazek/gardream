import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer.component';
import { IconContainerComponent, IconContainerVariant } from '../../../../shared/components/icon-container/icon-container.component';
import { TimeAgoPipe } from '../../../../shared/pipes/time-ago.pipe';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { AppNotification } from '../../../../core/notifications/notification.service';
import { IonButton } from '@ionic/angular/standalone';

const ICON_BY_TYPE: Record<string, string> = {
  rain: 'cloud_queue',
  overdue: 'warning_amber',
  harvest: 'agriculture',
};

const VARIANT_BY_TYPE: Record<string, IconContainerVariant> = {
  rain: 'primary',
  overdue: 'secondary',
  harvest: 'primary',
};

@Component({
  selector: 'app-notification-centre',
  standalone: true,
  imports: [
    CommonModule,
    DrawerComponent,
    IconContainerComponent,
    TimeAgoPipe,
    EmptyStateComponent,
    IonButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-drawer
      [open]="open"
      [title]="'Notifications'"
      [position]="'right'"
      (closed)="onClose()"
    >
      @if (notifications.length > 0) {
        <div class="notification-centre__header-action">
          <ion-button (click)="onMarkAllRead()" fill="clear" size="small">
            Mark all read
          </ion-button>
        </div>
      }

      @if (notifications.length === 0) {
        <app-empty-state
          icon="notifications_none"
          title="No notifications"
          message="You're all caught up!"
        />
      } @else {
        <div class="notification-centre__list">
          @for (notif of notifications; track notif.id) {
            <div class="notification-item" [class.notification-item--unread]="!notif.read">
              <div class="notification-item__icon">
                <app-icon-container [icon]="getIcon(notif.type)" [variant]="getVariant(notif.type)" />
              </div>
              <div class="notification-item__content">
                <h3 class="notification-item__title">{{ notif.title }}</h3>
                <p class="notification-item__message">{{ notif.message }}</p>
                <span class="notification-item__time">{{ notif.timestamp | timeAgo }}</span>
              </div>
              <button
                class="notification-item__dismiss"
                (click)="onDismiss(notif.id)"
                [attr.aria-label]="'Dismiss ' + notif.title"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          }
        </div>
      }
    </app-drawer>
  `,
  styleUrl: './notification-centre.component.scss',
})
export class NotificationCentreComponent {
  @Input() open = false;
  @Input() notifications: AppNotification[] = [];
  @Output() closed = new EventEmitter<void>();
  @Output() markAllRead = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<string>();

  getIcon(type: string): string {
    return ICON_BY_TYPE[type] || 'notifications';
  }

  getVariant(type: string): IconContainerVariant {
    return VARIANT_BY_TYPE[type] || 'primary';
  }

  onClose(): void {
    this.closed.emit();
  }

  onMarkAllRead(): void {
    this.markAllRead.emit();
  }

  onDismiss(id: string): void {
    this.dismiss.emit(id);
  }
}
