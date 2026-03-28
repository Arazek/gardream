import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { NotificationsActions } from './notifications.actions';
import { NotificationsApiService } from '../../core/api/notifications-api.service';

@Injectable()
export class NotificationsEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(NotificationsApiService);

  loadSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.loadSettings),
      switchMap(() =>
        this.api.get().pipe(
          map(data => NotificationsActions.loadSettingsSuccess({ data })),
          catchError(err => of(NotificationsActions.loadSettingsFailure({ error: err.message ?? 'Failed to load settings' }))),
        ),
      ),
    ),
  );

  updateSettings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationsActions.updateSettings),
      switchMap(({ payload }) =>
        this.api.update(payload).pipe(
          map(data => NotificationsActions.updateSettingsSuccess({ data })),
          catchError(err => of(NotificationsActions.updateSettingsFailure({ error: err.message ?? 'Failed to save settings' }))),
        ),
      ),
    ),
  );
}
