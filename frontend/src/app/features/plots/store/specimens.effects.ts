import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { SpecimensApiService } from '../../../core/api/specimens-api.service';
import { SpecimensActions } from './specimens.actions';
import { PlotsActions } from './plots.actions';

@Injectable()
export class SpecimensEffects {
  loadSpecimen$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.loadSpecimen),
      switchMap(({ plotId, slotId }) =>
        this.api.getBySlot(plotId, slotId).pipe(
          map((specimen) => SpecimensActions.loadSpecimenSuccess({ specimen })),
          catchError((error) =>
            of(SpecimensActions.loadSpecimenFailure({ error: error.message }))
          )
        )
      )
    )
  );

  loadSpecimenById$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.loadSpecimenById),
      switchMap(({ specimenId }) =>
        this.api.getById(specimenId).pipe(
          map((specimen) => SpecimensActions.loadSpecimenByIdSuccess({ specimen })),
          catchError((error) =>
            of(SpecimensActions.loadSpecimenByIdFailure({ error: error.message }))
          )
        )
      )
    )
  );

  updateSpecimen$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.updateSpecimen),
      switchMap(({ plotId, slotId, payload }) =>
        this.api.update(plotId, slotId, payload).pipe(
          map((specimen) => SpecimensActions.updateSpecimenSuccess({ specimen })),
          catchError((error) =>
            of(SpecimensActions.updateSpecimenFailure({ error: error.message }))
          )
        )
      )
    )
  );

  uploadPhoto$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SpecimensActions.uploadPhoto),
      switchMap(({ plotId, slotId, file, takenAt, note }) =>
        this.api.uploadPhoto(plotId, slotId, file, takenAt, note).pipe(
          map((specimen) => SpecimensActions.uploadPhotoSuccess({ specimen })),
          catchError((error) =>
            of(SpecimensActions.uploadPhotoFailure({ error: error.message }))
          )
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

  constructor(private actions$: Actions, private api: SpecimensApiService) {}
}
