export interface NotificationsState {
  morning_reminder: boolean;
  evening_reminder: boolean;
  in_app_alerts: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export const initialNotificationsState: NotificationsState = {
  morning_reminder: true,
  evening_reminder: true,
  in_app_alerts: true,
  loading: false,
  saving: false,
  error: null,
};
