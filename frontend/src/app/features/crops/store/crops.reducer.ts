import { createReducer, on } from '@ngrx/store';
import { CropsActions } from './crops.actions';
import { CropsState, initialCropsState } from './crops.state';

export const cropsReducer = createReducer(
  initialCropsState,

  on(CropsActions.loadCrops, (state, { category }) => ({
    ...state, loading: true, error: null, categoryFilter: category ?? null,
  })),
  on(CropsActions.loadCropsSuccess, (state, { crops }) => ({
    ...state, items: crops, loading: false,
  })),
  on(CropsActions.loadCropsFailure, (state, { error }) => ({
    ...state, error, loading: false,
  })),

  on(CropsActions.loadCropSuccess, (state, { crop }) => ({
    ...state,
    items: state.items.find(c => c.id === crop.id)
      ? state.items.map(c => c.id === crop.id ? crop : c)
      : [...state.items, crop],
    loading: false,
  })),

  on(CropsActions.selectCrop, (state, { id }) => ({ ...state, selectedId: id })),
  on(CropsActions.setCategoryFilter, (state, { category }) => ({ ...state, categoryFilter: category })),
);
