import { createReducer, on } from '@ngrx/store';
import { SpecimensActions } from './specimens.actions';
import { initialSpecimensState, SpecimensState } from './specimens.state';

export const specimensReducer = createReducer(
  initialSpecimensState,

  // Load Specimen
  on(SpecimensActions.loadSpecimen, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(SpecimensActions.loadSpecimenSuccess, (state, { specimen }) => ({
    ...state,
    loading: false,
    specimensBySlotId: {
      ...state.specimensBySlotId,
      [specimen.plot_slot_id]: specimen,
    },
    specimensById: {
      ...state.specimensById,
      [specimen.id]: specimen,
    },
  })),
  on(SpecimensActions.loadSpecimenFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Load Specimen By Id
  on(SpecimensActions.loadSpecimenById, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(SpecimensActions.loadSpecimenByIdSuccess, (state, { specimen }) => ({
    ...state,
    loading: false,
    specimensBySlotId: {
      ...state.specimensBySlotId,
      [specimen.plot_slot_id]: specimen,
    },
    specimensById: {
      ...state.specimensById,
      [specimen.id]: specimen,
    },
  })),
  on(SpecimensActions.loadSpecimenByIdFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Update Specimen
  on(SpecimensActions.updateSpecimen, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(SpecimensActions.updateSpecimenSuccess, (state, { specimen }) => ({
    ...state,
    loading: false,
    specimensBySlotId: {
      ...state.specimensBySlotId,
      [specimen.plot_slot_id]: specimen,
    },
    specimensById: {
      ...state.specimensById,
      [specimen.id]: specimen,
    },
  })),
  on(SpecimensActions.updateSpecimenFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Upload Photo
  on(SpecimensActions.uploadPhoto, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(SpecimensActions.uploadPhotoSuccess, (state, { specimen }) => ({
    ...state,
    loading: false,
    specimensBySlotId: {
      ...state.specimensBySlotId,
      [specimen.plot_slot_id]: specimen,
    },
    specimensById: {
      ...state.specimensById,
      [specimen.id]: specimen,
    },
  })),
  on(SpecimensActions.uploadPhotoFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // Clear Error
  on(SpecimensActions.clearError, (state) => ({
    ...state,
    error: null,
  }))
);
