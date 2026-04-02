import { ActionReducerMap } from '@ngrx/store';
import { routerReducer, RouterReducerState } from '@ngrx/router-store';
import { exampleReducer } from '../features/example/store/example.reducer';
import { ExampleState } from '../features/example/store/example.state';
import { ExampleEffects } from '../features/example/store/example.effects';
import { cropsReducer } from '../features/crops/store/crops.reducer';
import { CropsState } from '../features/crops/store/crops.state';
import { CropsEffects } from '../features/crops/store/crops.effects';
import { plotsReducer } from '../features/plots/store/plots.reducer';
import { PlotsState } from '../features/plots/store/plots.state';
import { PlotsEffects } from '../features/plots/store/plots.effects';
import { specimensReducer } from '../features/plots/store/specimens.reducer';
import { SpecimensState } from '../features/plots/store/specimens.state';
import { SpecimensEffects } from '../features/plots/store/specimens.effects';
import { tasksReducer } from '../features/tasks/store/tasks.reducer';
import { TasksState } from '../features/tasks/store/tasks.state';
import { TasksEffects } from '../features/tasks/store/tasks.effects';
import { weatherReducer } from './weather/weather.reducer';
import { WeatherState } from './weather/weather.state';
import { WeatherEffects } from './weather/weather.effects';
import { notificationsReducer } from './notifications/notifications.reducer';
import { NotificationsState } from './notifications/notifications.state';
import { NotificationsEffects } from './notifications/notifications.effects';

export interface AppState {
  router: RouterReducerState;
  example: ExampleState;
  crops: CropsState;
  plots: PlotsState;
  specimens: SpecimensState;
  tasks: TasksState;
  weather: WeatherState;
  notifications: NotificationsState;
}

export const rootReducers: ActionReducerMap<AppState> = {
  router: routerReducer,
  example: exampleReducer,
  crops: cropsReducer,
  plots: plotsReducer,
  specimens: specimensReducer,
  tasks: tasksReducer,
  weather: weatherReducer,
  notifications: notificationsReducer,
};

export const rootEffects = [ExampleEffects, CropsEffects, PlotsEffects, SpecimensEffects, TasksEffects, WeatherEffects, NotificationsEffects];
