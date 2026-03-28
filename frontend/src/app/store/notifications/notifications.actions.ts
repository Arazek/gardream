import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { NotificationSettingsUpdate } from '../../features/tasks/store/tasks.state';

export interface NotificationsData {
  morning_reminder: boolean;
  evening_reminder: boolean;
  in_app_alerts: boolean;
}

export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    'Load Settings': emptyProps(),
    'Load Settings Success': props<{ data: NotificationsData }>(),
    'Load Settings Failure': props<{ error: string }>(),
    'Update Settings': props<{ payload: NotificationSettingsUpdate }>(),
    'Update Settings Success': props<{ data: NotificationsData }>(),
    'Update Settings Failure': props<{ error: string }>(),
  },
});
