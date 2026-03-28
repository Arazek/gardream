import { Routes } from '@angular/router';

export const plotsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./plots.page').then((m) => m.PlotsPage),
  },
  {
    path: 'new',
    loadComponent: () => import('./plot-new.page').then((m) => m.PlotNewPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./plot-detail.page').then((m) => m.PlotDetailPage),
  },
];
