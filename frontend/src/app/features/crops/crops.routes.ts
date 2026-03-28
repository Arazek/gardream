import { Routes } from '@angular/router';

export const cropsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./crops.page').then((m) => m.CropsPage),
  },
  {
    path: ':id',
    loadComponent: () => import('./crop-detail.page').then((m) => m.CropDetailPage),
  },
];
