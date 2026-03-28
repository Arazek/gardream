import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { CropsActions } from './crops.actions';
import { CropsApiService } from '../../../core/api/crops-api.service';

@Injectable()
export class CropsEffects {
  constructor(private actions$: Actions, private api: CropsApiService) {}

  loadCrops$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CropsActions.loadCrops),
      switchMap(({ category }) =>
        this.api.getAll(category).pipe(
          map(crops => CropsActions.loadCropsSuccess({ crops })),
          catchError(err => of(CropsActions.loadCropsFailure({ error: err.message }))),
        ),
      ),
    ),
  );

  loadCrop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CropsActions.loadCrop),
      switchMap(({ id }) =>
        this.api.getOne(id).pipe(
          map(crop => CropsActions.loadCropSuccess({ crop })),
          catchError(err => of(CropsActions.loadCropFailure({ error: err.message }))),
        ),
      ),
    ),
  );
}
