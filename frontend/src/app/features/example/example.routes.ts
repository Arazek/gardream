import { Routes } from '@angular/router';

export const exampleRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/example-list/example-list.page').then((m) => m.ExampleListPage),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/example-detail/example-detail.page').then((m) => m.ExampleDetailPage),
  },
];
