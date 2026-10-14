import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/search/search').then((module) => module.Search),
  },
  {
    path: 'history',
    title: 'Search history',
    loadComponent: () => import('./pages/history/history').then((module) => module.History),
  },
];
