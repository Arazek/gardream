import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { from, of } from 'rxjs';
import { SpecimensActions } from './specimens.actions';
import { PlotsActions } from './plots.actions';
import { LocalDbService } from '../../../core/db/local-db.service';
import { SpecimensApiService } from '../../../core/api/specimens-api.service';

@Injectable()
export class SpecimensEffects {
  private actions$ = inject(Actions);
  private db = inject(LocalDbService);
  private api = inject(SpecimensApiService);

  loadSpecimen$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.loadSpecimen),
      switchMap(({ plotId, slotId }) =>
        from(this.db.getSpecimenBySlot(slotId)).pipe(
          switchMap(specimen => {
            if (specimen) {
              return of(SpecimensActions.loadSpecimenSuccess({ specimen }));
            }
            // Not in local DB — fall back to server
            return this.api.getBySlot(plotId, slotId).pipe(
              map(s => SpecimensActions.loadSpecimenSuccess({ specimen: s })),
              catchError(err => of(SpecimensActions.loadSpecimenFailure({ error: err.message }))),
            );
          }),
          catchError(err => of(SpecimensActions.loadSpecimenFailure({ error: err.message }))),
        )
      )
    )
  );

  loadSpecimenById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.loadSpecimenById),
      switchMap(({ specimenId }) =>
        this.api.getById(specimenId).pipe(
          map(specimen => SpecimensActions.loadSpecimenByIdSuccess({ specimen })),
          catchError(err => of(SpecimensActions.loadSpecimenByIdFailure({ error: err.message }))),
        )
      )
    )
  );

  updateSpecimen$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.updateSpecimen),
      switchMap(({ plotId, slotId, payload }) =>
        this.api.update(plotId, slotId, payload).pipe(
          map(specimen => SpecimensActions.updateSpecimenSuccess({ specimen })),
          catchError(err => of(SpecimensActions.updateSpecimenFailure({ error: err.message }))),
        )
      )
    )
  );

  uploadPhoto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.uploadPhoto),
      switchMap(({ plotId, slotId, file, takenAt, note }) =>
        this.api.uploadPhoto(plotId, slotId, file, takenAt, note).pipe(
          map(specimen => SpecimensActions.uploadPhotoSuccess({ specimen })),
          catchError(err => of(SpecimensActions.uploadPhotoFailure({ error: err.message }))),
        )
      )
    )
  );

  // When a slot's sow_date changes, the backend recalculates current_stage and
  // progress_pct. Reload the specimen so the UI reflects the updated values.
  reloadSpecimenAfterSlotUpdate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updateSlotSuccess),
      map(({ plotId, slot }) =>
        SpecimensActions.loadSpecimen({ plotId, slotId: slot.id })
      )
    )
  );
}
