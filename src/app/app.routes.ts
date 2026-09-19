import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'test',
    title: 'Страница для тестирования',
    loadComponent: () => import('./pages/test-page/test-page').then((c) => c.TestPage),
    // canActivate: [AuthGuardService],
    // children: [
    //   {
    //     path: 'selections',
    //     loadComponent: () => import('./modules/data/components/page-data/selections/selections').then(c => c.Selections),
    //     // canActivate: [AuthGuardService]
    //   }
    // ]
  },
  {
    path: '**',
    redirectTo: 'test',
  },
];
