import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NotificationsState } from './notifications.state';

export const selectNotificationsState = createFeatureSelector<NotificationsState>('notifications');

export const selectMorningReminder = createSelector(selectNotificationsState, s => s.morning_reminder);
export const selectEveningReminder = createSelector(selectNotificationsState, s => s.evening_reminder);
export const selectInAppAlerts = createSelector(selectNotificationsState, s => s.in_app_alerts);
export const selectNotificationsLoading = createSelector(selectNotificationsState, s => s.loading);
export const selectNotificationsSaving = createSelector(selectNotificationsState, s => s.saving);
