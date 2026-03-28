import { createReducer, on } from '@ngrx/store';
import { WeatherActions } from './weather.actions';
import { initialWeatherState } from './weather.state';

export const weatherReducer = createReducer(
  initialWeatherState,
  on(WeatherActions.loadWeather, s => ({ ...s, loading: true, error: null })),
  on(WeatherActions.loadWeatherSuccess, (s, { data }) => ({
    ...s,
    loading: false,
    data,
    lastUpdated: new Date().toISOString(),
  })),
  on(WeatherActions.loadWeatherFailure, (s, { error }) => ({ ...s, loading: false, error })),
);
