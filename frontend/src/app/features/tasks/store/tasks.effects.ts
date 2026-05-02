import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, mergeMap, of, switchMap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { TasksActions } from './tasks.actions';
import { Task } from './tasks.state';
import { selectSelectedDate } from './tasks.selectors';
import { LocalDbService } from '../../../core/db/local-db.service';
import { SyncService } from '../../../core/sync/sync.service';

@Injectable()
export class TasksEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private db = inject(LocalDbService);
  private sync = inject(SyncService);

  loadAllPendingTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.loadAllPendingTasks),
      switchMap(() =>
        from(this.db.getPendingTasks()).pipe(
          map(tasks => { console.log('[TasksEffect] getPendingTasks result:', tasks.length, tasks); return TasksActions.loadAllPendingTasksSuccess({ tasks }); }),
          catchError(err => of(TasksActions.loadAllPendingTasksFailure({ error: err.message }))),
        )
      )
    )
  );

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

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.createTask),
      mergeMap(({ payload }) =>
        from(
          (async () => {
            const now = new Date().toISOString();
            const task: Task = {
              id: `tmp_${uuidv4()}`,
              user_id: '',
              plot_slot_id: payload.plot_slot_id ?? null,
              type: payload.type,
              title: payload.title ?? null,
              note: payload.note ?? null,
              due_date: payload.due_date,
              completed: false,
              completed_at: null,
              created_at: now,
              updated_at: now,
            };
            await this.db.upsertTasks([task]);
            await this.db.addToOutbox({
              entity_type: 'task',
              entity_id: task.id,
              operation: 'create',
              payload: JSON.stringify(payload),
            });
            const rewritten = await this.sync.push();
            const realId = rewritten[task.id];
            if (realId) {
              const serverTask = await this.db.getTaskById(realId);
              if (serverTask) return serverTask;
            }
            return task;
          })()
        ).pipe(
          map(task => TasksActions.createTaskSuccess({ task })),
          catchError(err => of(TasksActions.createTaskFailure({ error: err.message }))),
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
            .then(() => this.sync.push())
            .then(rewritten => this.db.getTaskById(rewritten[id] ?? id))
        ).pipe(
          map(task => {
            if (task) return TasksActions.updateTaskSuccess({ task });
            // ID was rewritten — reload all from DB to sync store
            return TasksActions.loadAllPendingTasks();
          }),
          catchError(err => of(TasksActions.updateTaskFailure({ error: err.message }))),
        )
      )
    )
  );

  markTasksCompleted$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.markTasksCompleted),
      mergeMap(({ ids }) =>
        from(this.db.markTasksCompleted(ids)).pipe(
          map(() => TasksActions.markTasksCompletedSuccess({ ids })),
          catchError(err => of(TasksActions.markTasksCompletedFailure({ error: err.message }))),
        )
      )
    )
  );

  deleteOverdueTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteOverdueTasks),
      mergeMap(() =>
        from(this.db.deleteOverdueTasks()).pipe(
          map(ids => TasksActions.deleteOverdueTasksSuccess({ ids })),
          catchError(err => of(TasksActions.deleteOverdueTasksFailure({ error: err.message }))),
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TasksActions.deleteTask),
      mergeMap(({ id }) =>
        from(
          this.db.deleteTaskLocal(id)
            .then(() => this.db.addToOutbox({
              entity_type: 'task',
              entity_id: id,
              operation: 'delete',
              payload: JSON.stringify({ id }),
            }))
            .then(() => this.sync.push())
        ).pipe(
          map(() => TasksActions.deleteTaskSuccess({ id })),
          catchError(err => of(TasksActions.deleteTaskFailure({ error: err.message }))),
        )
      )
    )
  );
}
