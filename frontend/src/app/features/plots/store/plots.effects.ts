import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, mergeMap, of, switchMap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { PlotsActions } from './plots.actions';
import { LocalDbService } from '../../../core/db/local-db.service';
import { TaskGeneratorService } from '../../../core/task-generator/task-generator.service';
import type { Plot, PlotSlot } from './plots.state';

@Injectable()
export class PlotsEffects {
  private actions$ = inject(Actions);
  private db = inject(LocalDbService);
  private taskGen = inject(TaskGeneratorService);

  loadPlots$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.loadPlots),
      switchMap(() =>
        from(this.db.getAllPlots()).pipe(
          map(plots => PlotsActions.loadPlotsSuccess({ plots })),
          catchError(err => of(PlotsActions.loadPlotsFailure({ error: err.message }))),
        )
      )
    )
  );

  createPlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.createPlot),
      mergeMap(({ payload }) => {
        const now = new Date().toISOString();
        const plot: Plot = {
          id: `tmp_${uuidv4()}`,
          user_id: '',
          name: payload.name,
          plot_type: payload.plot_type,
          rows: payload.rows,
          cols: payload.cols,
          substrate: payload.substrate ?? null,
          watering_days: payload.watering_days ?? [],
          fertilise_days: payload.fertilise_days ?? [],
          crop_count: 0,
          created_at: now,
          updated_at: now,
        };
        return from(
          this.db.upsertPlots([plot]).then(() =>
            this.db.addToOutbox({
              entity_type: 'plot',
              entity_id: plot.id,
              operation: 'create',
              payload: JSON.stringify(payload),
            })
          )
        ).pipe(
          map(() => PlotsActions.createPlotSuccess({ plot })),
          catchError(err => of(PlotsActions.createPlotFailure({ error: err.message }))),
        );
      })
    )
  );

  updatePlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updatePlot),
      mergeMap(({ id, payload }) =>
        from(
          this.db.updatePlotLocal(id, payload as Partial<Plot>)
            .then(() => this.db.addToOutbox({
              entity_type: 'plot',
              entity_id: id,
              operation: 'update',
              payload: JSON.stringify(payload),
            }))
            .then(() => this.db.getAllPlots())
            .then(plots => plots.find(p => p.id === id)!)
        ).pipe(
          map(plot => PlotsActions.updatePlotSuccess({ plot })),
          catchError(err => of(PlotsActions.updatePlotFailure({ error: err.message }))),
        )
      )
    )
  );

  deletePlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.deletePlot),
      mergeMap(({ id }) =>
        from(
          this.db.deletePlotLocal(id).then(() =>
            this.db.addToOutbox({
              entity_type: 'plot',
              entity_id: id,
              operation: 'delete',
              payload: JSON.stringify({ id }),
            })
          )
        ).pipe(
          map(() => PlotsActions.deletePlotSuccess({ id })),
          catchError(err => of(PlotsActions.deletePlotFailure({ error: err.message }))),
        )
      )
    )
  );

  loadSlots$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.loadSlots),
      mergeMap(({ plotId }) =>
        from(this.db.getSlotsByPlot(plotId)).pipe(
          map(slots => PlotsActions.loadSlotsSuccess({ plotId, slots })),
          catchError(err => of(PlotsActions.loadSlotsFailure({ error: err.message }))),
        )
      )
    )
  );

  createSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.createSlot),
      mergeMap(({ plotId, payload }) => {
        const now = new Date().toISOString();
        const slot: PlotSlot = {
          id: `tmp_${uuidv4()}`,
          plot_id: plotId,
          crop_id: payload.crop_id,
          row: payload.row,
          col: payload.col,
          sow_date: payload.sow_date,
          watering_days_override: payload.watering_days_override ?? null,
          watering_interval_weeks: payload.watering_interval_weeks ?? 1,
          fertilise_days_override: payload.fertilise_days_override ?? null,
          fertilise_interval_weeks: payload.fertilise_interval_weeks ?? 1,
          germination_date: null,
          created_at: now,
          updated_at: now,
        };
        return from(
          this.db.insertSlot(slot)
            .then(() => this.db.addToOutbox({
              entity_type: 'plot_slot',
              entity_id: slot.id,
              operation: 'create',
              payload: JSON.stringify({ plotId, ...payload }),
            }))
            .then(async () => {
              const plots = await this.db.getAllPlots();
              const plot = plots.find(p => p.id === plotId);
              const crop = await this.db.getCropById(payload.crop_id);
              if (plot && crop) {
                const tasks = this.taskGen.generate(slot, plot, crop, '');
                await this.db.insertTasksBulk(tasks);
              }
              return crop ?? undefined;
            })
        ).pipe(
          map((crop) => PlotsActions.createSlotSuccess({ plotId, slot: { ...slot, crop: crop ?? undefined } })),
          catchError(err => of(PlotsActions.createSlotFailure({ error: err.message }))),
        );
      })
    )
  );

  updateSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updateSlot),
      mergeMap(({ plotId, slotId, payload }) =>
        from(
          this.db.updateSlotLocal(slotId, payload as Partial<PlotSlot>)
            .then(() => this.db.addToOutbox({
              entity_type: 'plot_slot',
              entity_id: slotId,
              operation: 'update',
              payload: JSON.stringify({ plotId, ...payload }),
            }))
            .then(() => this.db.getSlotsByPlot(plotId))
            .then(slots => slots.find(s => s.id === slotId)!)
        ).pipe(
          map(slot => PlotsActions.updateSlotSuccess({ plotId, slot })),
          catchError(err => of(PlotsActions.updateSlotFailure({ error: err.message }))),
        )
      )
    )
  );

  deleteSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.deleteSlot),
      mergeMap(({ plotId, slotId }) =>
        from(
          this.db.deleteSlotLocal(slotId)
            .then(() => this.db.addToOutbox({
              entity_type: 'plot_slot',
              entity_id: slotId,
              operation: 'delete',
              payload: JSON.stringify({ plotId, slotId }),
            }))
        ).pipe(
          map(() => PlotsActions.deleteSlotSuccess({ plotId, slotId })),
          catchError(err => of(PlotsActions.deleteSlotFailure({ error: err.message }))),
        )
      )
    )
  );

  markGerminated$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.markGerminated),
      mergeMap(({ plotId, slotId }) => {
        const today = new Date().toISOString().slice(0, 10);
        return from(
          this.db.updateSlotLocal(slotId, { germination_date: today } as any)
            .then(() => this.db.addToOutbox({
              entity_type: 'plot_slot',
              entity_id: slotId,
              operation: 'update',
              payload: JSON.stringify({ plotId, germination_date: today }),
            }))
            .then(() => this.db.getSlotsByPlot(plotId))
            .then(slots => slots.find(s => s.id === slotId)!)
        ).pipe(
          map(slot => PlotsActions.markGerminatedSuccess({ plotId, slot })),
          catchError(err => of(PlotsActions.markGerminatedFailure({ error: err.message }))),
        );
      })
    )
  );

  transplantSlot$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.transplantSlot),
      mergeMap(({ plotId, slotId, targetPlotId, targetRow, targetCol }) => {
        return from((async () => {
          const slots = await this.db.getSlotsByPlot(plotId);
          const sourceSlot = slots.find(s => s.id === slotId);
          if (!sourceSlot) throw new Error('Source slot not found');

          const now = new Date().toISOString();
          const newSlot: PlotSlot = {
            id: `tmp_${uuidv4()}`,
            plot_id: targetPlotId,
            crop_id: sourceSlot.crop_id,
            row: targetRow,
            col: targetCol,
            sow_date: sourceSlot.sow_date,
            watering_days_override: null,
            watering_interval_weeks: 1,
            fertilise_days_override: null,
            fertilise_interval_weeks: 1,
            germination_date: null,
            created_at: now,
            updated_at: now,
            crop: sourceSlot.crop,
          };

          await this.db.insertSlot(newSlot);
          await this.db.deleteSlotLocal(slotId);
          await this.db.addToOutbox({
            entity_type: 'plot_slot',
            entity_id: slotId,
            operation: 'transplant',
            payload: JSON.stringify({ plotId, slotId, targetPlotId, targetRow, targetCol, newSlotId: newSlot.id }),
          });

          const plots = await this.db.getAllPlots();
          const targetPlot = plots.find(p => p.id === targetPlotId);
          const crop = await this.db.getCropById(newSlot.crop_id);
          if (targetPlot && crop) {
            const tasks = this.taskGen.generate(newSlot, targetPlot, crop, '');
            await this.db.insertTasksBulk(tasks);
          }

          return newSlot;
        })()).pipe(
          map(newSlot => PlotsActions.transplantSlotSuccess({ sourcePlotId: plotId, slotId, newSlot })),
          catchError(err => of(PlotsActions.transplantSlotFailure({ error: err.message }))),
        );
      })
    )
  );

  updateSlotSchedule$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PlotsActions.updateSlotSchedule),
      mergeMap(({ plotId, slotId, watering_days_override, watering_interval_weeks, fertilise_days_override, fertilise_interval_weeks }) =>
        from((async () => {
          await this.db.updateSlotLocal(slotId, {
            watering_days_override,
            watering_interval_weeks,
            fertilise_days_override,
            fertilise_interval_weeks,
          } as Partial<PlotSlot>);

          await this.db.addToOutbox({
            entity_type: 'plot_slot',
            entity_id: slotId,
            operation: 'update',
            payload: JSON.stringify({ plotId, watering_days_override, watering_interval_weeks, fertilise_days_override, fertilise_interval_weeks }),
          });

          const today = new Date().toISOString().slice(0, 10);
          await this.db.deleteFutureUncompletedTasksForSlot(slotId, ['water', 'fertilise'], today);

          const slots = await this.db.getSlotsByPlot(plotId);
          const slot = slots.find(s => s.id === slotId);
          const plots = await this.db.getAllPlots();
          const plot = plots.find(p => p.id === plotId);
          const crop = slot ? await this.db.getCropById(slot.crop_id) : null;

          if (slot && plot && crop) {
            const tasks = this.taskGen.generate(slot, plot, crop, '', today, ['water', 'fertilise']);
            await this.db.insertTasksBulk(tasks);
          }

          return slots.find(s => s.id === slotId)!;
        })()).pipe(
          map(slot => PlotsActions.updateSlotScheduleSuccess({ plotId, slot })),
          catchError(err => of(PlotsActions.updateSlotScheduleFailure({ error: err.message }))),
        )
      )
    )
  );
}
