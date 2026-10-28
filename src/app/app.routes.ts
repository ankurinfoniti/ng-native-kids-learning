import type { Routes } from '@angular/router';
import { Area } from './area/area.ts';
import { Home } from './home/home.ts';
import { Parent } from './parent/parent.ts';
import { Results } from './results/results.ts';
import { Round } from './round/round.ts';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'area/:area', component: Area },
  { path: 'round/:area/:level', component: Round },
  { path: 'results/:score', component: Results },
  { path: 'parent', component: Parent },
];
