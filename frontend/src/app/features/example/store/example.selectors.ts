import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ExampleState } from './example.state';

export const selectExampleState = createFeatureSelector<ExampleState>('example');

export const selectAllItems = createSelector(
  selectExampleState,
  (state) => state.items,
);

export const selectLoading = createSelector(
  selectExampleState,
  (state) => state.loading,
);

export const selectError = createSelector(
  selectExampleState,
  (state) => state.error,
);

export const selectSelectedId = createSelector(
  selectExampleState,
  (state) => state.selectedId,
);

export const selectSelectedItem = createSelector(
  selectAllItems,
  selectSelectedId,
  (items, id) => items.find((i) => i.id === id) ?? null,
);
