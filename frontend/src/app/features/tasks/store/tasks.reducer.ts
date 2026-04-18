import { createReducer, on } from '@ngrx/store';
import { TasksActions } from './tasks.actions';
import { TasksState, initialTasksState } from './tasks.state';

export const tasksReducer = createReducer(
  initialTasksState,

  on(TasksActions.loadTasks, state => ({ ...state, loading: true, error: null })),
  on(TasksActions.loadTasksSuccess, (state, { tasks }) => ({ ...state, tasks, loading: false })),
  on(TasksActions.loadTasksFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(TasksActions.loadAllPendingTasks, state => ({ ...state, loading: true, error: null })),
  on(TasksActions.loadAllPendingTasksSuccess, (state, { tasks }) => ({ ...state, pendingTasks: tasks, loading: false })),
  on(TasksActions.loadAllPendingTasksFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(TasksActions.createTaskSuccess, (state, { task }) => ({
    ...state, tasks: [...state.tasks, task],
  })),
  on(TasksActions.updateTaskSuccess, (state, { task }) => ({
    ...state, tasks: state.tasks.map(t => t.id === task.id ? task : t),
  })),
  on(TasksActions.deleteTaskSuccess, (state, { id }) => ({
    ...state, tasks: state.tasks.filter(t => t.id !== id),
  })),
  on(TasksActions.markTasksCompletedSuccess, (state, { ids }) => {
    const idSet = new Set(ids);
    return {
      ...state,
      tasks: state.tasks.map(t => idSet.has(t.id) ? { ...t, completed: true } : t),
      pendingTasks: state.pendingTasks.map(t => idSet.has(t.id) ? { ...t, completed: true } : t),
    };
  }),
  on(TasksActions.deleteOverdueTasksSuccess, (state, { ids }) => {
    const idSet = new Set(ids);
    return {
      ...state,
      tasks: state.tasks.filter(t => !idSet.has(t.id)),
      pendingTasks: state.pendingTasks.filter(t => !idSet.has(t.id)),
    };
  }),
  on(TasksActions.setSelectedDate, (state, { date }) => ({ ...state, selectedDate: date })),
);
