import type { Routes } from '@angular/router';
import { Home } from './home/home.ts';
import { Results } from './results/results.ts';
import { Round } from './round/round.ts';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'round/:area/:level', component: Round },
  { path: 'results/:score', component: Results },
];
