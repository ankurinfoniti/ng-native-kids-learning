import type { Random } from '../random.ts';
import { numbersLevel1 } from './numbers.ts';
import type { Question } from './question.ts';

const LEVELS: Record<string, Record<number, (random: Random) => Question[]>> = {
  numbers: { 1: numbersLevel1 },
};

export function buildRound(area: string, level: number, random: Random): Question[] {
  const build = LEVELS[area]?.[level];
  if (!build) throw new Error(`No level ${level} in area "${area}"`);
  return build(random);
}
