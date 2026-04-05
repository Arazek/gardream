import { createReducer, on } from '@ngrx/store';
import { PlotsActions } from './plots.actions';
import { PlotsState, initialPlotsState } from './plots.state';

export const plotsReducer = createReducer(
  initialPlotsState,

  on(PlotsActions.loadPlots, state => ({ ...state, loading: true, error: null })),
  on(PlotsActions.loadPlotsSuccess, (state, { plots }) => ({ ...state, plots, loading: false })),
  on(PlotsActions.loadPlotsFailure, (state, { error }) => ({ ...state, error, loading: false })),

  on(PlotsActions.createPlotSuccess, (state, { plot }) => ({
    ...state, plots: [...state.plots, plot],
  })),
  on(PlotsActions.updatePlotSuccess, (state, { plot }) => ({
    ...state, plots: state.plots.map(p => p.id === plot.id ? plot : p),
  })),
  on(PlotsActions.deletePlotSuccess, (state, { id }) => ({
    ...state,
    plots: state.plots.filter(p => p.id !== id),
    selectedPlotId: state.selectedPlotId === id ? null : state.selectedPlotId,
  })),
  on(PlotsActions.selectPlot, (state, { id }) => ({ ...state, selectedPlotId: id })),

  on(PlotsActions.loadSlots, state => ({ ...state, slotsLoading: true })),
  on(PlotsActions.loadSlotsSuccess, (state, { plotId, slots }) => ({
    ...state, slotsById: { ...state.slotsById, [plotId]: slots }, slotsLoading: false,
  })),
  on(PlotsActions.loadSlotsFailure, (state, { error }) => ({ ...state, error, slotsLoading: false })),

  on(PlotsActions.createSlotSuccess, (state, { plotId, slot }) => ({
    ...state,
    plots: state.plots.map(p => p.id === plotId ? { ...p, crop_count: p.crop_count + 1 } : p),
    slotsById: {
      ...state.slotsById,
      [plotId]: [...(state.slotsById[plotId] ?? []), slot],
    },
  })),
  on(PlotsActions.updateSlotSuccess, (state, { plotId, slot }) => ({
    ...state,
    slotsById: {
      ...state.slotsById,
      [plotId]: (state.slotsById[plotId] ?? []).map(s =>
        s.id === slot.id ? { ...slot, crop: slot.crop ?? s.crop } : s
      ),
    },
  })),
  on(PlotsActions.deleteSlotSuccess, (state, { plotId, slotId }) => ({
    ...state,
    plots: state.plots.map(p => p.id === plotId ? { ...p, crop_count: Math.max(0, p.crop_count - 1) } : p),
    slotsById: {
      ...state.slotsById,
      [plotId]: (state.slotsById[plotId] ?? []).filter(s => s.id !== slotId),
    },
  })),
);
