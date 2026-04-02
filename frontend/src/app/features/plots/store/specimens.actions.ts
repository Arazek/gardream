import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Specimen, SpecimenUpdate } from './specimens.state';

export const SpecimensActions = createActionGroup({
  source: 'Specimens',
  events: {
    'Load Specimen': props<{ plotId: string; slotId: string }>(),
    'Load Specimen Success': props<{ specimen: Specimen }>(),
    'Load Specimen Failure': props<{ error: string }>(),

    'Load Specimen By Id': props<{ specimenId: string }>(),
    'Load Specimen By Id Success': props<{ specimen: Specimen }>(),
    'Load Specimen By Id Failure': props<{ error: string }>(),

    'Update Specimen': props<{ plotId: string; slotId: string; payload: SpecimenUpdate }>(),
    'Update Specimen Success': props<{ specimen: Specimen }>(),
    'Update Specimen Failure': props<{ error: string }>(),

    'Upload Photo': props<{ plotId: string; slotId: string; file: File; takenAt?: string; note?: string }>(),
    'Upload Photo Success': props<{ specimen: Specimen }>(),
    'Upload Photo Failure': props<{ error: string }>(),

    'Clear Error': emptyProps(),
  },
});
