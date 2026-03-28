import { createReducer, on } from '@ngrx/store';
import { NotificationsActions } from './notifications.actions';
import { initialNotificationsState } from './notifications.state';

export const notificationsReducer = createReducer(
  initialNotificationsState,

  on(NotificationsActions.loadSettings, state => ({ ...state, loading: true, error: null })),
  on(NotificationsActions.loadSettingsSuccess, (state, { data }) => ({
    ...state, loading: false,
    morning_reminder: data.morning_reminder,
    evening_reminder: data.evening_reminder,
    in_app_alerts: data.in_app_alerts,
  })),
  on(NotificationsActions.loadSettingsFailure, (state, { error }) => ({ ...state, loading: false, error })),

  on(NotificationsActions.updateSettings, state => ({ ...state, saving: true, error: null })),
  on(NotificationsActions.updateSettingsSuccess, (state, { data }) => ({
    ...state, saving: false,
    morning_reminder: data.morning_reminder,
    evening_reminder: data.evening_reminder,
    in_app_alerts: data.in_app_alerts,
  })),
  on(NotificationsActions.updateSettingsFailure, (state, { error }) => ({ ...state, saving: false, error })),
);
