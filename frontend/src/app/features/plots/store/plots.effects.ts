import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';
import { PlotsActions } from './plots.actions';
import { PlotsApiService } from '../../../core/api/plots-api.service';

@Injectable()
export class PlotsEffects {
  constructor(private actions$: Actions, private api: PlotsApiService) {}

  loadPlots$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.loadPlots),
      switchMap(() =>
        this.api.getAll().pipe(
          map(plots => PlotsActions.loadPlotsSuccess({ plots })),
          catchError(err => of(PlotsActions.loadPlotsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  createPlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.createPlot),
      mergeMap(({ payload }) =>
        this.api.create(payload).pipe(
          map(plot => PlotsActions.createPlotSuccess({ plot })),
          catchError(err => of(PlotsActions.createPlotFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  updatePlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updatePlot),
      mergeMap(({ id, payload }) =>
        this.api.update(id, payload).pipe(
          map(plot => PlotsActions.updatePlotSuccess({ plot })),
          catchError(err => of(PlotsActions.updatePlotFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  deletePlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.deletePlot),
      mergeMap(({ id }) =>
        this.api.delete(id).pipe(
          map(() => PlotsActions.deletePlotSuccess({ id })),
          catchError(err => of(PlotsActions.deletePlotFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  loadSlots$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.loadSlots),
      switchMap(({ plotId }) =>
        this.api.getSlots(plotId).pipe(
          map(slots => PlotsActions.loadSlotsSuccess({ plotId, slots })),
          catchError(err => of(PlotsActions.loadSlotsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  createSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.createSlot),
      mergeMap(({ plotId, payload }) =>
        this.api.createSlot(plotId, payload).pipe(
          map(slot => PlotsActions.createSlotSuccess({ plotId, slot })),
          catchError(err => of(PlotsActions.createSlotFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  updateSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updateSlot),
      mergeMap(({ plotId, slotId, payload }) =>
        this.api.updateSlot(plotId, slotId, payload).pipe(
          map(slot => PlotsActions.updateSlotSuccess({ plotId, slot })),
          catchError(err => of(PlotsActions.updateSlotFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  deleteSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.deleteSlot),
      mergeMap(({ plotId, slotId }) =>
        this.api.deleteSlot(plotId, slotId).pipe(
          map(() => PlotsActions.deleteSlotSuccess({ plotId, slotId })),
          catchError(err => of(PlotsActions.deleteSlotFailure({ error: err.message }))),
        ),
      ),
    ),
  );
}
