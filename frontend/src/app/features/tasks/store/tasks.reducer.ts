import { createReducer, on } from '@ngrx/store';
import { TasksActions } from './tasks.actions';
import { TasksState, initialTasksState } from './tasks.state';

export const tasksReducer = createReducer(
  initialTasksState,

  on(TasksActions.loadTasks, state => ({ ...state, loading: true, error: null })),
  on(TasksActions.loadTasksSuccess, (state, { tasks }) => ({ ...state, tasks, loading: false })),
  on(TasksActions.loadTasksFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(TasksActions.createTaskSuccess, (state, { task }) => ({
    ...state, tasks: [...state.tasks, task],
  })),
  on(TasksActions.updateTaskSuccess, (state, { task }) => ({
    ...state, tasks: state.tasks.map(t => t.id === task.id ? task : t),
  })),
  on(TasksActions.deleteTaskSuccess, (state, { id }) => ({
    ...state, tasks: state.tasks.filter(t => t.id !== id),
  })),
  on(TasksActions.setSelectedDate, (state, { date }) => ({ ...state, selectedDate: date })),
);
