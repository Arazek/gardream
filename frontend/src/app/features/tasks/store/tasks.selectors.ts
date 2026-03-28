import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TasksState } from './tasks.state';

export const selectTasksState = createFeatureSelector<TasksState>('tasks');

export const selectAllTasks = createSelector(selectTasksState, s => s.tasks);
export const selectTasksLoading = createSelector(selectTasksState, s => s.loading);
export const selectTasksError = createSelector(selectTasksState, s => s.error);
export const selectSelectedDate = createSelector(selectTasksState, s => s.selectedDate);

export const selectTasksForDate = (date: string) => createSelector(
  selectAllTasks,
  tasks => tasks.filter(t => t.due_date === date),
);

export const selectPendingTasks = createSelector(
  selectAllTasks,
  tasks => tasks.filter(t => !t.completed),
);

export const selectCompletedTasks = createSelector(
  selectAllTasks,
  tasks => tasks.filter(t => t.completed),
);

export const selectTodayTasks = createSelector(
  selectAllTasks, selectSelectedDate,
  (tasks, date) => date ? tasks.filter(t => t.due_date === date) : [],
);
