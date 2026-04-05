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

// ─── KPI Selectors ────────────────────────────────────────────────────────────

export const selectAllSlots = createSelector(
  selectPlotsState,
  state => Object.values(state.slotsById).flat(),
);

export const selectCropsNearHarvest = createSelector(selectAllSlots, slots => {
  const today = new Date();
  return slots.filter(s => {
    if (!s.crop || !s.sow_date) return false;
    const harvest = new Date(s.sow_date + 'T00:00:00');
    harvest.setDate(harvest.getDate() + s.crop.days_to_harvest);
    const daysLeft = Math.ceil((harvest.getTime() - today.getTime()) / 86_400_000);
    return daysLeft >= 0 && daysLeft <= 14;
  });
});

export const selectNextHarvest = createSelector(selectAllSlots, slots => {
  const today = new Date();
  let min: { daysLeft: number; cropName: string } | null = null;
  for (const s of slots) {
    if (!s.crop || !s.sow_date) continue;
    const harvest = new Date(s.sow_date + 'T00:00:00');
    harvest.setDate(harvest.getDate() + s.crop.days_to_harvest);
    const daysLeft = Math.ceil((harvest.getTime() - today.getTime()) / 86_400_000);
    if (daysLeft >= 0 && (!min || daysLeft < min.daysLeft)) {
      min = { daysLeft, cropName: s.crop.name };
    }
  }
  return min;
});

export const selectStageDistribution = createSelector(selectAllSlots, slots => {
  const keys = ['germinating', 'seedling', 'vegetative', 'flowering', 'harvest-ready'];
  const dist: Record<string, number> = Object.fromEntries(keys.map(k => [k, 0]));
  const today = new Date();
  for (const s of slots) {
    if (!s.crop || !s.sow_date) continue;
    const days = Math.floor((today.getTime() - new Date(s.sow_date + 'T00:00:00').getTime()) / 86_400_000);
    const g = s.crop.days_to_germination;
    const h = s.crop.days_to_harvest;
    let stage: string;
    if (days < g)            stage = 'germinating';
    else if (days < g * 2)   stage = 'seedling';
    else if (days < h * 0.5) stage = 'vegetative';
    else if (days < h * 0.8) stage = 'flowering';
    else                     stage = 'harvest-ready';
    dist[stage]++;
  }
  return dist;
});

export const selectAvgProgress = createSelector(selectAllSlots, slots => {
  const valid = slots.filter(s => s.crop && s.sow_date);
  if (!valid.length) return 0;
  const today = new Date();
  const sum = valid.reduce((acc, s) => {
    const days = Math.floor((today.getTime() - new Date(s.sow_date + 'T00:00:00').getTime()) / 86_400_000);
    return acc + Math.min(100, Math.round(days / s.crop!.days_to_harvest * 100));
  }, 0);
  return Math.round(sum / valid.length);
});
