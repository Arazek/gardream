import { Injectable, inject, signal, computed, effect, runInInjectionContext, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectTomorrowRainExpected, selectTomorrowPrecipitation } from '../../store/weather/weather.selectors';
import { selectOverdueTasks, selectOverdueWaterTasksWithLabels } from '../../features/tasks/store/tasks.selectors';
import { selectCropsNearHarvest } from '../../features/plots/store/plots.selectors';
import { selectInAppAlerts } from '../../store/notifications/notifications.selectors';

export type NotificationType = 'rain' | 'overdue' | 'water' | 'harvest';
export type AlertVariant = 'info' | 'warning' | 'error' | 'success';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  variant: AlertVariant;
  timestamp: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private store = inject(Store);
  private injector = inject(Injector);

  notifications = signal<AppNotification[]>([]);
  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  constructor() {
    runInInjectionContext(this.injector, () => {
      this.initNotificationWatchers();
    });
  }

  private initNotificationWatchers(): void {
    // Watch rain alert
    let rainNotificationId: string | null = null;
    effect(() => {
      const inAppAlertsEnabled = this.store.selectSignal(selectInAppAlerts)();
      if (!inAppAlertsEnabled) return;

      const rainExpected = this.store.selectSignal(selectTomorrowRainExpected)();
      const precip = this.store.selectSignal(selectTomorrowPrecipitation)();

      if (rainExpected) {
        if (!rainNotificationId) {
          rainNotificationId = this.generateId();
          const message = precip
            ? `Rain forecast tomorrow (${precip.mm}mm, ${precip.probability}% chance)`
            : 'Rain forecast for tomorrow';
          this.add({
            id: rainNotificationId,
            type: 'rain',
            title: 'Rain expected tomorrow',
            message,
            variant: 'info',
            timestamp: new Date(),
            read: false,
          });
        }
      } else {
        if (rainNotificationId) {
          this.dismiss(rainNotificationId);
          rainNotificationId = null;
        }
      }
    });

    // Watch overdue non-water tasks (generic count)
    let overdueNotificationId: string | null = null;
    effect(() => {
      const inAppAlertsEnabled = this.store.selectSignal(selectInAppAlerts)();
      if (!inAppAlertsEnabled) return;

      const overdueTasks = this.store.selectSignal(selectOverdueTasks)();
      const nonWater = overdueTasks.filter(t => t.type !== 'water');
      const count = nonWater.length;

      if (count > 0) {
        if (!overdueNotificationId) {
          overdueNotificationId = this.generateId();
          const plural = count > 1 ? 's' : '';
          this.add({
            id: overdueNotificationId,
            type: 'overdue',
            title: `${count} overdue task${plural}`,
            message: 'Check your calendar to catch up',
            variant: 'warning',
            timestamp: new Date(),
            read: false,
          });
        }
      } else {
        if (overdueNotificationId) {
          this.dismiss(overdueNotificationId);
          overdueNotificationId = null;
        }
      }
    });

    // Watch overdue watering tasks — one notification per crop
    const waterNotifIds = new Map<string, string>(); // taskId → notifId
    effect(() => {
      const inAppAlertsEnabled = this.store.selectSignal(selectInAppAlerts)();
      if (!inAppAlertsEnabled) {
        waterNotifIds.forEach(id => this.dismiss(id));
        waterNotifIds.clear();
        return;
      }

      const waterTasks = this.store.selectSignal(selectOverdueWaterTasksWithLabels)();
      const currentTaskIds = new Set(waterNotifIds.keys());

      waterTasks.forEach(({ task, label }) => {
        if (!waterNotifIds.has(task.id)) {
          const id = this.generateId();
          waterNotifIds.set(task.id, id);
          this.add({
            id,
            type: 'water',
            title: `Time to water`,
            message: `${label} needs watering`,
            variant: 'warning',
            timestamp: new Date(),
            read: false,
          });
        }
        currentTaskIds.delete(task.id);
      });

      currentTaskIds.forEach(oldTaskId => {
        const id = waterNotifIds.get(oldTaskId);
        if (id) { this.dismiss(id); waterNotifIds.delete(oldTaskId); }
      });
    });

    // Watch crops near harvest
    let harvestNotificationIds = new Map<string, string>();
    effect(() => {
      const inAppAlertsEnabled = this.store.selectSignal(selectInAppAlerts)();
      if (!inAppAlertsEnabled) {
        harvestNotificationIds.forEach(id => this.dismiss(id));
        harvestNotificationIds.clear();
        return;
      }

      const nearHarvest = this.store.selectSignal(selectCropsNearHarvest)();
      const currentIds = new Set(harvestNotificationIds.keys());

      nearHarvest.forEach(slot => {
        if (!harvestNotificationIds.has(slot.id)) {
          const id = this.generateId();
          harvestNotificationIds.set(slot.id, id);
          const cropName = slot.crop?.name || 'Crop';
          this.add({
            id,
            type: 'harvest',
            title: `${cropName} ready soon`,
            message: `${cropName} ready to harvest soon`,
            variant: 'info',
            timestamp: new Date(),
            read: false,
          });
        }
        currentIds.delete(slot.id);
      });

      currentIds.forEach(oldSlotId => {
        const id = harvestNotificationIds.get(oldSlotId);
        if (id) {
          this.dismiss(id);
          harvestNotificationIds.delete(oldSlotId);
        }
      });
    });
  }

  private add(notification: AppNotification): void {
    this.notifications.update(notifs => [...notifs, notification]);
  }

  markAllRead(): void {
    this.notifications.update(notifs =>
      notifs.map(n => ({ ...n, read: true })),
    );
  }

  dismiss(id: string): void {
    this.notifications.update(notifs => notifs.filter(n => n.id !== id));
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
