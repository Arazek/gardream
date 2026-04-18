import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Plot, PlotCreate, PlotUpdate, PlotSlot, PlotSlotCreate, PlotSlotUpdate } from './plots.state';

export const PlotsActions = createActionGroup({
  source: 'Plots',
  events: {
    'Load Plots': emptyProps(),
    'Load Plots Success': props<{ plots: Plot[] }>(),
    'Load Plots Failure': props<{ error: string }>(),

    'Create Plot': props<{ payload: PlotCreate }>(),
    'Create Plot Success': props<{ plot: Plot }>(),
    'Create Plot Failure': props<{ error: string }>(),

    'Update Plot': props<{ id: string; payload: PlotUpdate }>(),
    'Update Plot Success': props<{ plot: Plot }>(),
    'Update Plot Failure': props<{ error: string }>(),

    'Delete Plot': props<{ id: string }>(),
    'Delete Plot Success': props<{ id: string }>(),
    'Delete Plot Failure': props<{ error: string }>(),

    'Select Plot': props<{ id: string | null }>(),

    'Load Slots': props<{ plotId: string }>(),
    'Load Slots Success': props<{ plotId: string; slots: PlotSlot[] }>(),
    'Load Slots Failure': props<{ error: string }>(),

    'Create Slot': props<{ plotId: string; payload: PlotSlotCreate }>(),
    'Create Slot Success': props<{ plotId: string; slot: PlotSlot }>(),
    'Create Slot Failure': props<{ error: string }>(),

    'Update Slot': props<{ plotId: string; slotId: string; payload: PlotSlotUpdate }>(),
    'Update Slot Success': props<{ plotId: string; slot: PlotSlot }>(),
    'Update Slot Failure': props<{ error: string }>(),

    'Delete Slot': props<{ plotId: string; slotId: string }>(),
    'Delete Slot Success': props<{ plotId: string; slotId: string }>(),
    'Delete Slot Failure': props<{ error: string }>(),

    'Update Slot Schedule': props<{ plotId: string; slotId: string; watering_days_override: number[] | null; watering_interval_weeks: number; fertilise_days_override: number[] | null; fertilise_interval_weeks: number }>(),
    'Update Slot Schedule Success': props<{ plotId: string; slot: PlotSlot }>(),
    'Update Slot Schedule Failure': props<{ error: string }>(),

    'Mark Germinated': props<{ plotId: string; slotId: string }>(),
    'Mark Germinated Success': props<{ plotId: string; slot: PlotSlot }>(),
    'Mark Germinated Failure': props<{ error: string }>(),

    'Transplant Slot': props<{ plotId: string; slotId: string; targetPlotId: string; targetRow: number; targetCol: number }>(),
    'Transplant Slot Success': props<{ sourcePlotId: string; slotId: string; newSlot: PlotSlot }>(),
    'Transplant Slot Failure': props<{ error: string }>(),
  },
});
