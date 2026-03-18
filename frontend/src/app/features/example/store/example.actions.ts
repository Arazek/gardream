import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ExampleItem } from './example.state';

export const ExampleActions = createActionGroup({
  source: 'Example',
  events: {
    'Load Items': emptyProps(),
    'Load Items Success': props<{ items: ExampleItem[] }>(),
    'Load Items Failure': props<{ error: string }>(),

    'Create Item': props<{ title: string; description?: string }>(),
    'Create Item Success': props<{ item: ExampleItem }>(),
    'Create Item Failure': props<{ error: string }>(),

    'Update Item': props<{ id: string; title?: string; description?: string }>(),
    'Update Item Success': props<{ item: ExampleItem }>(),
    'Update Item Failure': props<{ error: string }>(),

    'Delete Item': props<{ id: string }>(),
    'Delete Item Success': props<{ id: string }>(),
    'Delete Item Failure': props<{ error: string }>(),

    'Select Item': props<{ id: string | null }>(),
  },
});
