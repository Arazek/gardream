import { ActionReducerMap } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { exampleReducer } from '../features/example/store/example.reducer';
import { ExampleState } from '../features/example/store/example.state';
import { ExampleEffects } from '../features/example/store/example.effects';

export interface AppState {
  router: RouterReducerState;
  example: ExampleState;
}

export const rootReducers: ActionReducerMap<AppState> = {
  router: routerReducer,
  example: exampleReducer,
};

export const rootEffects = [ExampleEffects];
