import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';
import { ExampleActions } from './example.actions';
import { ExampleApiService } from '../services/example-api.service';

@Injectable()
export class ExampleEffects {
  constructor(
    private actions$: Actions,
    private api: ExampleApiService,
  ) {}

  loadItems$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExampleActions.loadItems),
      switchMap(() => {
        console.log('[ExampleEffects] loadItems dispatched');
        return this.api.getAll().pipe(
          map((items) => {
            console.log('[ExampleEffects] loadItems success, count:', items.length);
            return ExampleActions.loadItemsSuccess({ items });
          }),
          catchError((error) => {
            console.error('[ExampleEffects] loadItems failure:', error.status, error.message);
            return of(ExampleActions.loadItemsFailure({ error: error.message }));
          }),
        );
      }),
    ),
  );

  createItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExampleActions.createItem),
      mergeMap(({ title, description }) =>
        this.api.create({ title, description }).pipe(
          map((item) => ExampleActions.createItemSuccess({ item })),
          catchError((error) =>
            of(ExampleActions.createItemFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  );

  updateItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExampleActions.updateItem),
      mergeMap(({ id, title, description }) =>
        this.api.update(id, { title, description }).pipe(
          map((item) => ExampleActions.updateItemSuccess({ item })),
          catchError((error) =>
            of(ExampleActions.updateItemFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  );

  deleteItem$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ExampleActions.deleteItem),
      mergeMap(({ id }) =>
        this.api.delete(id).pipe(
          map(() => ExampleActions.deleteItemSuccess({ id })),
          catchError((error) =>
            of(ExampleActions.deleteItemFailure({ error: error.message })),
          ),
        ),
      ),
    ),
  );
}
