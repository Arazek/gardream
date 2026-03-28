import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { WeatherData } from './weather.state';

export const WeatherActions = createActionGroup({
  source: 'Weather',
  events: {
    'Load Weather': props<{ lat: number; lon: number }>(),
    'Load Weather Success': props<{ data: WeatherData }>(),
    'Load Weather Failure': props<{ error: string }>(),
  },
});
