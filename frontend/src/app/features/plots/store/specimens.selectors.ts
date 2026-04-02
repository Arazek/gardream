import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SpecimensState, Specimen } from './specimens.state';

export const selectSpecimensState = createFeatureSelector<SpecimensState>('specimens');

export const selectSpecimensBySlotId = createSelector(
  selectSpecimensState,
  (state: SpecimensState) => state.specimensBySlotId
);

export const selectSpecimensById = createSelector(
  selectSpecimensState,
  (state: SpecimensState) => state.specimensById
);

export const selectSpecimenBySlotId = (slotId: string) =>
  createSelector(
    selectSpecimensBySlotId,
    (specimensBySlotId) => specimensBySlotId[slotId]
  );

export const selectSpecimenById = (specimenId: string) =>
  createSelector(
    selectSpecimensById,
    (specimensById) => specimensById[specimenId]
  );

export const selectSpecimensLoading = createSelector(
  selectSpecimensState,
  (state: SpecimensState) => state.loading
);

export const selectSpecimensError = createSelector(
  selectSpecimensState,
  (state: SpecimensState) => state.error
);
