import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { HttpClient } from '@angular/common/http';
import { catchError, map, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { WeatherActions } from './weather.actions';
import { WeatherData } from './weather.state';
import { environment } from '../../../environments/environment';

@Injectable()
export class WeatherEffects {
  private readonly actions$ = inject(Actions);
  private readonly http = inject(HttpClient);

  loadWeather$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WeatherActions.loadWeather),
      switchMap(({ lat, lon }) =>
        this.http.get<WeatherData>(`${environment.apiUrl}/weather`, { params: { lat, lon } }).pipe(
          map(data => WeatherActions.loadWeatherSuccess({ data })),
          catchError(err => of(WeatherActions.loadWeatherFailure({ error: err.message ?? 'Weather fetch failed' }))),
        ),
      ),
    ),
  );
}
