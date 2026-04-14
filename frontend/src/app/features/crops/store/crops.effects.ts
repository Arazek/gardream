import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { CropsActions } from './crops.actions';
import { LocalDbService } from '../../../core/db/local-db.service';

@Injectable()
export class CropsEffects {
  private actions$ = inject(Actions);
  private db = inject(LocalDbService);

  loadCrops$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CropsActions.loadCrops),
      switchMap(() =>
        from(this.db.getAllCrops()).pipe(
          map(crops => CropsActions.loadCropsSuccess({ crops })),
          catchError(err => of(CropsActions.loadCropsFailure({ error: err.message }))),
        )
      )
    )
  );

  loadCrop$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CropsActions.loadCrop),
      switchMap(({ id }) =>
        from(this.db.getCropById(id)).pipe(
          map(crop => {
            if (!crop) throw new Error(`Crop ${id} not found in local DB`);
            return CropsActions.loadCropSuccess({ crop });
          }),
          catchError(err => of(CropsActions.loadCropFailure({ error: err.message }))),
        )
      )
    )
  );
}
