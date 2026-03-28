import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { loginGuard } from './core/auth/login.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'tabs',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./core/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    loadComponent: () =>
      import('./features/tabs/tabs.page').then((m) => m.TabsPage),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('./features/home/home.routes').then((m) => m.homeRoutes),
      },
      {
        path: 'calendar',
        loadChildren: () =>
          import('./features/calendar/calendar.routes').then((m) => m.calendarRoutes),
      },
      {
        path: 'library',
        loadChildren: () =>
          import('./features/crops/crops.routes').then((m) => m.cropsRoutes),
      },
      {
        path: 'plots',
        loadChildren: () =>
          import('./features/plots/plots.routes').then((m) => m.plotsRoutes),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((m) => m.profileRoutes),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./features/settings/settings.routes').then((m) => m.settingsRoutes),
      },
      {
        path: 'example',
        loadChildren: () =>
          import('./features/example/example.routes').then((m) => m.exampleRoutes),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'tabs',
  },
];
