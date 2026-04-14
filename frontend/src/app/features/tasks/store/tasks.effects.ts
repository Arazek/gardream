import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, mergeMap, of, switchMap } from 'rxjs';
import { TasksActions } from './tasks.actions';
import { LocalDbService } from '../../../core/db/local-db.service';

@Injectable()
export class TasksEffects {
  private actions$ = inject(Actions);
  private db = inject(LocalDbService);

  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadTasks),
      switchMap(({ due_date, completed }) =>
        from(this.db.getTasksByDate(due_date ?? new Date().toISOString().slice(0, 10))).pipe(
          map(tasks => {
            const filtered = completed !== undefined
              ? tasks.filter(t => t.completed === completed)
              : tasks;
            return TasksActions.loadTasksSuccess({ tasks: filtered });
          }),
          catchError(err => of(TasksActions.loadTasksFailure({ error: err.message }))),
        )
      )
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.updateTask),
      mergeMap(({ id, payload }) =>
        from(
          this.db.updateTaskLocal(id, payload)
            .then(() => this.db.addToOutbox({
              entity_type: 'task',
              entity_id: id,
              operation: 'update',
              payload: JSON.stringify(payload),
            }))
            .then(() => this.db.getTasksByDate(new Date().toISOString().slice(0, 10)))
            .then(tasks => tasks.find(t => t.id === id)!)
        ).pipe(
          map(task => TasksActions.updateTaskSuccess({ task })),
          catchError(err => of(TasksActions.updateTaskFailure({ error: err.message }))),
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteTask),
      mergeMap(({ id }) =>
        from(
          this.db.deleteTaskLocal(id).then(() =>
            this.db.addToOutbox({
              entity_type: 'task',
              entity_id: id,
              operation: 'delete',
              payload: JSON.stringify({ id }),
            })
          )
        ).pipe(
          map(() => TasksActions.deleteTaskSuccess({ id })),
          catchError(err => of(TasksActions.deleteTaskFailure({ error: err.message }))),
        )
      )
    )
  );
}
