import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { forkJoin, from, of } from 'rxjs';
import { SpecimensActions } from './specimens.actions';
import { PlotsActions } from './plots.actions';
import { selectSelectedPlotSlots } from './plots.selectors';
import { LocalDbService } from '../../../core/db/local-db.service';
import { SpecimensApiService } from '../../../core/api/specimens-api.service';
import { SyncService } from '../../../core/sync/sync.service';

@Injectable()
export class SpecimensEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private db = inject(LocalDbService);
  private api = inject(SpecimensApiService);
  private sync = inject(SyncService);

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
              catchError((err) => {
                // 404 — slot may still be syncing (tmp_ ID not on server yet)
                if (err.status === 404) {
                  return from(this.sync.sync()).pipe(
                    switchMap(async () => {
                      // After sync completes, directly query DB for real slot ID
                      const slots = await this.db.getSlotsByPlot(plotId);
                      // The slot ID should match or include our original
                      const slot = slots.find(
                        s => s.id === slotId || (slotId.includes('tmp_') && s.id.endsWith(slotId.replace('tmp_', '')))
                      );
                      return slot?.id ?? slotId;
                    }),
                    switchMap(newSlotId =>
                      this.api.getBySlot(plotId, newSlotId)
                    ),
                    map(s => SpecimensActions.loadSpecimenSuccess({ specimen: s })),
                    catchError(retryErr =>
                      of(SpecimensActions.loadSpecimenFailure({
                        error: retryErr.message,
                      }))
                    ),
                  );
                }
                return of(SpecimensActions.loadSpecimenFailure({ error: err.message }));
              }),
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
