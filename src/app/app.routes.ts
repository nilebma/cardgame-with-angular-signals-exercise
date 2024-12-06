import { Routes } from '@angular/router';
import { canLeaveGameGuard } from './features/activegame/guards/can-leave-game.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./features/homepage/pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'activegame',
    loadComponent: () => import('./activegame/activegame.page').then( m => m.ActivegamePage),
    canDeactivate: [canLeaveGameGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];
