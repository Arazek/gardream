import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Task, TaskCreate, TaskUpdate } from './tasks.state';

export const TasksActions = createActionGroup({
  source: 'Tasks',
  events: {
    'Load Tasks': props<{ due_date?: string; completed?: boolean }>(),
    'Load Tasks Success': props<{ tasks: Task[] }>(),
    'Load Tasks Failure': props<{ error: string }>(),

    'Load All Pending Tasks': emptyProps(),
    'Load All Pending Tasks Success': props<{ tasks: Task[] }>(),
    'Load All Pending Tasks Failure': props<{ error: string }>(),

    'Create Task': props<{ payload: TaskCreate }>(),
    'Create Task Success': props<{ task: Task }>(),
    'Create Task Failure': props<{ error: string }>(),

    'Update Task': props<{ id: string; payload: TaskUpdate }>(),
    'Update Task Success': props<{ task: Task }>(),
    'Update Task Failure': props<{ error: string }>(),

    'Delete Task': props<{ id: string }>(),
    'Delete Task Success': props<{ id: string }>(),
    'Delete Task Failure': props<{ error: string }>(),

    'Mark Tasks Completed': props<{ ids: string[] }>(),
    'Mark Tasks Completed Success': props<{ ids: string[] }>(),
    'Mark Tasks Completed Failure': props<{ error: string }>(),

    'Delete Overdue Tasks': emptyProps(),
    'Delete Overdue Tasks Success': props<{ ids: string[] }>(),
    'Delete Overdue Tasks Failure': props<{ error: string }>(),

    'Set Selected Date': props<{ date: string | null }>(),
  },
});
