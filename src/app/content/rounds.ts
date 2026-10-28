import { pick, shuffle, type Random } from '../random.ts';
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
import { hindiLevel1, hindiLevel2 } from './hindi.ts';
import { numbersLevel1, numbersLevel2, numbersLevel3 } from './numbers.ts';
import type { Question, WeakIds } from './question.ts';
import {
  reasoningLevel1,
  reasoningLevel2,
  reasoningLevel3,
} from './reasoning.ts';

const LEVELS: Record<
  string,
  Record<number, (random: Random, weak: WeakIds) => Question[]>
> = {
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
  hindi: { 1: hindiLevel1, 2: hindiLevel2 },
};

export function hasLevel(area: string, level: number): boolean {
  return LEVELS[area]?.[level] !== undefined;
}

export function buildRound(
  area: string,
  level: number,
  random: Random,
  weak: WeakIds,
): Question[] {
  const build = LEVELS[area]?.[level];
  if (!build) throw new Error(`No level ${level} in area "${area}"`);
  return build(random, weak);
}

export const MOCK_LENGTH = 12;

/** A question and the area it was drawn from. */
export interface AreaQuestion {
  readonly area: string;
  readonly question: Question;
}

/** Questions spread as evenly as possible over every area with levels, each from any level, shuffled. */
export function buildMockTest(random: Random): AreaQuestion[] {
  const areas = Object.keys(LEVELS);
  const share = Math.floor(MOCK_LENGTH / areas.length);
  const extra = shuffle(random, areas).slice(0, MOCK_LENGTH % areas.length);
  const questions = areas.flatMap((area) =>
    questionsFromAnyLevel(area, share + (extra.includes(area) ? 1 : 0), random),
  );
  return shuffle(random, questions);
}

function questionsFromAnyLevel(
  area: string,
  count: number,
  random: Random,
): AreaQuestion[] {
  const levels = Object.values(LEVELS[area]!);
  const perLevel = new Map<(typeof levels)[number], number>();
  for (let i = 0; i < count; i++) {
    const build = pick(random, levels);
    perLevel.set(build, (perLevel.get(build) ?? 0) + 1);
  }
  // One round per level keeps two questions from the same level apart.
  return [...perLevel].flatMap(([build, n]) =>
    build(random, new Set())
      .slice(0, n)
      .map((question) => ({ area, question })),
  );
}
