import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WeatherState } from './weather.state';

export const selectWeatherState = createFeatureSelector<WeatherState>('weather');

export const selectWeatherData    = createSelector(selectWeatherState, s => s.data);
export const selectWeatherLoading = createSelector(selectWeatherState, s => s.loading);
export const selectCurrentWeather = createSelector(selectWeatherState, s => s.data?.current ?? null);
export const selectForecast       = createSelector(selectWeatherState, s => s.data?.forecast ?? []);

export const selectRainDays = createSelector(
  selectForecast,
  forecast => forecast.filter(d => d.rain_expected).map(d => d.date),
);

export const selectTodayRainExpected = createSelector(
  selectRainDays,
  rainDays => rainDays.includes(new Date().toISOString().slice(0, 10)),
);
