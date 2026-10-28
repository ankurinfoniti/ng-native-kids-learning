import { pick, type Random } from '../random.ts';
import {
  glyph,
  optionsFor,
  practiceOrder,
  ROUND_LENGTH,
  type Item,
  type Question,
  type WeakIds,
} from './question.ts';

/** Numbers a child mixes up with n, closest first: 6 and 9 turned over, digits swapped (12/21), then its neighbours. */
function lookAlikes(n: number): number[] {
  const turned = Number(
    String(n).replace(/[69]/g, (digit) => (digit === '6' ? '9' : '6')),
  );
  const swapped = Number([...String(n)].reverse().join(''));
  // 10 reversed is 01; a single digit reverses to itself and is dropped below.
  const mirrors = n % 10 === 0 ? [turned] : [turned, swapped];
  return [...new Set([...mirrors, n - 1, n + 1])].filter(
    (m) => m !== n && m > 0,
  );
}

const COUNTABLES = [
  { glyph: '🍎', plural: 'apples' },
  { glyph: '⭐', plural: 'stars' },
  { glyph: '🐟', plural: 'fish' },
  { glyph: '🎈', plural: 'balloons' },
  { glyph: '🚗', plural: 'cars' },
] as const;

interface NumbersLevel {
  readonly max: number;
  /** The most objects shown in a counting question. */
  readonly countCap: number;
  readonly optionCount: number;
}

function numberItem(n: number): Item {
  return {
    id: `number:${n}`,
    name: String(n),
    visual: glyph(String(n)),
    lookAlikes: lookAlikes(n).map((other) => `number:${other}`),
  };
}

interface Ask {
  readonly instruction: string;
  readonly prompt?: readonly string[];
  /** Which other numbers may be offered beside the answer; any of the level's by default. */
  readonly offers?: (m: number) => boolean;
}

/** A way of asking for the number n. */
interface Template {
  fits(n: number, level: NumbersLevel): boolean;
  ask(n: number, random: Random): Ask;
}

const recognise: Template = {
  fits: () => true,
  ask: (n) => ({ instruction: `Tap the number ${n}` }),
};

const count: Template = {
  fits: (n, level) => n <= level.countCap,
  ask: (n, random) => {
    const thing = pick(random, COUNTABLES);
    return {
      instruction: `How many ${thing.plural}?`,
      prompt: Array(n).fill(thing.glyph),
    };
  },
};

const after: Template = {
  fits: (n) => n > 1,
  ask: (n) => ({
    instruction: `What comes after ${n - 1}?`,
    prompt: [String(n - 1), '❓'],
  }),
};

const before: Template = {
  fits: (n, level) => n < level.max,
  ask: (n) => ({
    instruction: `What comes before ${n + 1}?`,
    prompt: ['❓', String(n + 1)],
  }),
};

const between: Template = {
  fits: (n, level) => n > 1 && n < level.max,
  ask: (n) => ({
    instruction: `What comes between ${n - 1} and ${n + 1}?`,
    prompt: [String(n - 1), '❓', String(n + 1)],
  }),
};

const biggest: Template = {
  fits: (n, level) => n >= level.optionCount,
  ask: (n) => ({
    instruction: 'Which is the biggest number?',
    offers: (m) => m < n,
  }),
};

const smallest: Template = {
  fits: (n, level) => n <= level.max - level.optionCount + 1,
  ask: (n) => ({
    instruction: 'Which is the smallest number?',
    offers: (m) => m > n,
  }),
};

const LATER_TEMPLATES = [
  recognise,
  count,
  after,
  before,
  between,
  biggest,
  smallest,
];

function numbersRound(
  level: NumbersLevel,
  templates: readonly Template[],
  random: Random,
  weak: WeakIds,
): Question[] {
  const pool = Array.from({ length: level.max }, (_, i) => numberItem(i + 1));
  const answers = practiceOrder(
    random,
    pool.map((_, i) => i + 1),
    weak,
    (n) => pool[n - 1]!.id,
  ).slice(0, ROUND_LENGTH);
  return answers.map((n) => {
    const fitting = templates.filter((template) => template.fits(n, level));
    const { offers, ...ask } = pick(random, fitting).ask(n, random);
    const item = pool[n - 1]!;
    const offered = offers ? pool.filter((_, i) => offers(i + 1)) : pool;
    return {
      ...ask,
      language: 'en',
      options: optionsFor(item, offered, level.optionCount, random),
      answerId: item.id,
      answerLine: `The answer is ${n}.`,
    };
  });
}

export const numbersLevel1 = (random: Random, weak: WeakIds): Question[] =>
  numbersRound(
    { max: 10, countCap: 10, optionCount: 3 },
    [recognise, count, after, before],
    random,
    weak,
  );

export const numbersLevel2 = (random: Random, weak: WeakIds): Question[] =>
  numbersRound(
    { max: 20, countCap: 10, optionCount: 4 },
    LATER_TEMPLATES,
    random,
    weak,
  );

export const numbersLevel3 = (random: Random, weak: WeakIds): Question[] =>
  numbersRound(
    { max: 50, countCap: 20, optionCount: 4 },
    LATER_TEMPLATES,
    random,
    weak,
  );
