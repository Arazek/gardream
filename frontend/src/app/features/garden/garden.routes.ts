import { Routes } from '@angular/router';

export const gardenRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/garden-dashboard/garden-dashboard.page').then(
        (m) => m.GardenDashboardPage,
      ),
  },
  {
    path: 'builder',
    loadComponent: () =>
      import('./pages/garden-builder/garden-builder.page').then(
        (m) => m.GardenBuilderPage,
      ),
  },
  {
    path: 'crop/:id',
    loadComponent: () =>
      import('./pages/crop-detail/crop-detail.page').then(
        (m) => m.CropDetailPage,
      ),
  },
];
