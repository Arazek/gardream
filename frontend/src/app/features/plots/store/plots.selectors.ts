import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PlotsState } from './plots.state';

export const selectPlotsState = createFeatureSelector<PlotsState>('plots');

export const selectAllPlots = createSelector(selectPlotsState, s => s.plots);
export const selectPlotsLoading = createSelector(selectPlotsState, s => s.loading);
export const selectPlotsError = createSelector(selectPlotsState, s => s.error);
export const selectSelectedPlotId = createSelector(selectPlotsState, s => s.selectedPlotId);
export const selectSlotsLoading = createSelector(selectPlotsState, s => s.slotsLoading);

export const selectSelectedPlot = createSelector(
  selectAllPlots, selectSelectedPlotId,
  (plots, id) => plots.find(p => p.id === id) ?? null,
);

export const selectSlotsForPlot = (plotId: string) => createSelector(
  selectPlotsState,
  s => s.slotsById[plotId] ?? [],
);

export const selectSelectedPlotSlots = createSelector(
  selectPlotsState, selectSelectedPlotId,
  (state, id) => id ? (state.slotsById[id] ?? []) : [],
);
