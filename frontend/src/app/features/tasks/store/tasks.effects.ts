import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';
import { TasksActions } from './tasks.actions';
import { TasksApiService } from '../../../core/api/tasks-api.service';

@Injectable()
export class TasksEffects {
  constructor(private actions$: Actions, private api: TasksApiService) {}

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTasks),
      switchMap(({ due_date, completed }) =>
        this.api.getAll({ due_date, completed }).pipe(
          map(tasks => TasksActions.loadTasksSuccess({ tasks })),
          catchError(err => of(TasksActions.loadTasksFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.createTask),
      mergeMap(({ payload }) =>
        this.api.create(payload).pipe(
          map(task => TasksActions.createTaskSuccess({ task })),
          catchError(err => of(TasksActions.createTaskFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.updateTask),
      mergeMap(({ id, payload }) =>
        this.api.update(id, payload).pipe(
          map(task => TasksActions.updateTaskSuccess({ task })),
          catchError(err => of(TasksActions.updateTaskFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteTask),
      mergeMap(({ id }) =>
        this.api.delete(id).pipe(
          map(() => TasksActions.deleteTaskSuccess({ id })),
          catchError(err => of(TasksActions.deleteTaskFailure({ error: err.message }))),
        ),
      ),
    ),
  );
}
