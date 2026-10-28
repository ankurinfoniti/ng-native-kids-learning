import type { Routes } from '@angular/router';
import { Area } from './area/area.ts';
import { Home } from './home/home.ts';
import { Oral } from './oral/oral.ts';
import { Parent } from './parent/parent.ts';
import { MockResults } from './results/mock-results.ts';
import { Results } from './results/results.ts';
import { Round } from './round/round.ts';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'area/:area', component: Area },
  { path: 'round/:area/:level', component: Round },
  { path: 'mock', component: Round, data: { mock: true } },
  { path: 'mock-results/:takenAt', component: MockResults },
  { path: 'results/:score', component: Results },
  { path: 'oral', component: Oral },
  { path: 'parent', component: Parent },
];
