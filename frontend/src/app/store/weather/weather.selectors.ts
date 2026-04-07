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

export const selectTomorrowRainExpected = createSelector(
  selectRainDays,
  rainDays => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return rainDays.includes(tomorrow.toISOString().slice(0, 10));
  },
);

export const selectTomorrowPrecipitation = createSelector(
  selectForecast,
  forecast => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toISOString().slice(0, 10);
    const tomorrowForecast = forecast.find(d => d.date === tomorrowDateStr);
    return tomorrowForecast
      ? { mm: tomorrowForecast.precipitation_mm, probability: tomorrowForecast.precipitation_probability }
      : null;
  },
);
