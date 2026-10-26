import { pick, shuffle, type Random } from '../random.ts';
import {
  optionsFor,
  ROUND_LENGTH,
  type Item,
  type Question,
} from './question.ts';

const LOOK_ALIKES: Record<number, readonly number[]> = { 6: [9], 9: [6] };

const COUNTABLES = [
  { glyph: '🍎', plural: 'apples' },
  { glyph: '⭐', plural: 'stars' },
  { glyph: '🐟', plural: 'fish' },
  { glyph: '🎈', plural: 'balloons' },
  { glyph: '🚗', plural: 'cars' },
] as const;

const OPTION_COUNT = 3;

function numberItem(n: number): Item {
  return {
    id: `number:${n}`,
    name: String(n),
    glyph: String(n),
    lookAlikes: LOOK_ALIKES[n]?.map((other) => `number:${other}`),
  };
}

type Template = (
  answer: number,
  pool: readonly Item[],
  random: Random,
) => Question;

function question(
  answer: number,
  pool: readonly Item[],
  random: Random,
  instruction: string,
  prompt?: readonly string[],
): Question {
  const item = pool[answer - 1]!;
  return {
    instruction,
    language: 'en',
    prompt,
    options: optionsFor(item, pool, OPTION_COUNT, random),
    answerId: item.id,
    answerLine: `The answer is ${answer}.`,
  };
}

const recognise: Template = (n, pool, random) =>
  question(n, pool, random, `Tap the number ${n}`);

const count: Template = (n, pool, random) => {
  const thing = pick(random, COUNTABLES);
  return question(
    n,
    pool,
    random,
    `How many ${thing.plural}?`,
    Array(n).fill(thing.glyph),
  );
};

const after: Template = (n, pool, random) =>
  question(n, pool, random, `What comes after ${n - 1}?`, [
    String(n - 1),
    '❓',
  ]);

const before: Template = (n, pool, random) =>
  question(n, pool, random, `What comes before ${n + 1}?`, [
    '❓',
    String(n + 1),
  ]);

function numbersRound(max: number, random: Random): Question[] {
  const pool = Array.from({ length: max }, (_, i) => numberItem(i + 1));
  const answers = shuffle(
    random,
    pool.map((_, i) => i + 1),
  ).slice(0, ROUND_LENGTH);
  return answers.map((n) => {
    const templates = [
      recognise,
      count,
      ...(n > 1 ? [after] : []),
      ...(n < max ? [before] : []),
    ];
    return pick(random, templates)(n, pool, random);
  });
}

export const numbersLevel1 = (random: Random): Question[] =>
  numbersRound(10, random);
