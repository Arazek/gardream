import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Crop, CropCategory } from './crops.state';

export const CropsActions = createActionGroup({
  source: 'Crops',
  events: {
    'Load Crops': props<{ category?: CropCategory }>(),
    'Load Crops Success': props<{ crops: Crop[] }>(),
    'Load Crops Failure': props<{ error: string }>(),

    'Load Crop': props<{ id: string }>(),
    'Load Crop Success': props<{ crop: Crop }>(),
    'Load Crop Failure': props<{ error: string }>(),

    'Select Crop': props<{ id: string | null }>(),
    'Set Category Filter': props<{ category: CropCategory | null }>(),
  },
});
