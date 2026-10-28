import type { Random } from '../random.ts';
import {
  awarenessLevel1,
  awarenessLevel2,
  awarenessLevel3,
} from './awareness.ts';
import {
  conceptsLevel1,
  conceptsLevel2,
  conceptsLevel3,
  conceptsLevel4,
} from './concepts.ts';
import {
  englishLevel1,
  englishLevel2,
  englishLevel3,
  englishLevel4,
} from './english.ts';
import { numbersLevel1, numbersLevel2, numbersLevel3 } from './numbers.ts';
import type { Question } from './question.ts';
import {
  reasoningLevel1,
  reasoningLevel2,
  reasoningLevel3,
} from './reasoning.ts';

const LEVELS: Record<string, Record<number, (random: Random) => Question[]>> = {
  english: {
    1: englishLevel1,
    2: englishLevel2,
    3: englishLevel3,
    4: englishLevel4,
  },
  numbers: { 1: numbersLevel1, 2: numbersLevel2, 3: numbersLevel3 },
  concepts: {
    1: conceptsLevel1,
    2: conceptsLevel2,
    3: conceptsLevel3,
    4: conceptsLevel4,
  },
  awareness: {
    1: awarenessLevel1,
    2: awarenessLevel2,
    3: awarenessLevel3,
  },
  reasoning: { 1: reasoningLevel1, 2: reasoningLevel2, 3: reasoningLevel3 },
};

export function hasLevel(area: string, level: number): boolean {
  return LEVELS[area]?.[level] !== undefined;
}

export function buildRound(
  area: string,
  level: number,
  random: Random,
): Question[] {
  const build = LEVELS[area]?.[level];
  if (!build) throw new Error(`No level ${level} in area "${area}"`);
  return build(random);
}
