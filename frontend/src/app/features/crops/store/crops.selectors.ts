import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CropsState } from './crops.state';

export const selectCropsState = createFeatureSelector<CropsState>('crops');

export const selectAllCrops = createSelector(selectCropsState, s => s.items);
export const selectCropsLoading = createSelector(selectCropsState, s => s.loading);
export const selectCropsError = createSelector(selectCropsState, s => s.error);
export const selectSelectedCropId = createSelector(selectCropsState, s => s.selectedId);
export const selectCategoryFilter = createSelector(selectCropsState, s => s.categoryFilter);

export const selectSelectedCrop = createSelector(
  selectAllCrops, selectSelectedCropId,
  (items, id) => items.find(c => c.id === id) ?? null,
);

export const selectFilteredCrops = createSelector(
  selectAllCrops, selectCategoryFilter,
  (items, category) => category ? items.filter(c => c.category === category) : items,
);
