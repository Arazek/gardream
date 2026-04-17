import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Task } from '../../features/tasks/store/tasks.state';

const NOTIFICATION_HOUR = 8; // 8 AM local time

@Injectable({ providedIn: 'root' })
export class LocalNotificationsService {

  async requestPermission(): Promise<boolean> {
    try {
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    } catch {
      return false; // permission API not available in web context
    }
  }

  buildNotificationTitle(task: Task, slotLabel: string): string {
    const verbMap: Record<string, string> = {
      water: 'water',
      fertilise: 'fertilise',
      prune: 'prune',
      harvest: 'harvest',
      check: 'check on',
      custom: 'tend to',
    };
    const verb = verbMap[task.type] ?? 'tend to';
    return `Time to ${verb} your ${slotLabel}`;
  }

  async scheduleTaskNotifications(
    tasks: Task[],
    slotLabels: Record<string, string>, // slotId → "CropName in PlotName"
  ): Promise<void> {
    await this.cancelAll();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysOut = new Date(today);
    thirtyDaysOut.setDate(today.getDate() + 30);

    const upcoming = tasks.filter(t => {
      const d = new Date(t.due_date + 'T12:00:00');
      return !t.completed && d >= today && d <= thirtyDaysOut && t.plot_slot_id && slotLabels[t.plot_slot_id];
    });

    if (upcoming.length === 0) return;

    const notifications = upcoming.map((t, i) => {
      const dueDate = new Date(t.due_date + 'T12:00:00');
      dueDate.setHours(NOTIFICATION_HOUR, 0, 0, 0);
      return {
        id: i + 1,
        title: 'Garden Task',
        body: this.buildNotificationTitle(t, slotLabels[t.plot_slot_id!]),
        schedule: { at: dueDate },
        extra: { taskId: t.id },
      };
    });

    try {
      await LocalNotifications.schedule({ notifications });
    } catch {
      // Scheduling not available in web context — silently skip
    }
  }

  async cancelAll(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
    } catch {
      // Not available in web context
    }
  }
}
