import type { Random } from '../random.ts';
import {
  optionsFor,
  practiceOrder,
  ROUND_LENGTH,
  type Item,
  type Place,
  type Question,
  type Shape,
  type Size,
  type WeakIds,
} from './question.ts';

/** Each colour, with the ones a child mixes it up with offered first as wrong answers. */
const COLOURS = [
  { name: 'red', colour: '#e53935', lookAlikes: ['pink', 'orange'] },
  { name: 'blue', colour: '#1e88e5', lookAlikes: ['purple', 'green'] },
  { name: 'yellow', colour: '#fdd835', lookAlikes: ['orange'] },
  { name: 'green', colour: '#43a047', lookAlikes: ['blue'] },
  { name: 'orange', colour: '#fb8c00', lookAlikes: ['red', 'yellow'] },
  { name: 'purple', colour: '#8e24aa', lookAlikes: ['blue', 'pink'] },
  { name: 'pink', colour: '#f48fb1', lookAlikes: ['red', 'purple'] },
  { name: 'black', colour: '#212121', lookAlikes: ['brown'] },
  { name: 'white', colour: '#ffffff', lookAlikes: ['yellow'] },
  { name: 'brown', colour: '#795548', lookAlikes: ['black', 'orange'] },
] as const;

const COLOUR_ITEMS: readonly Item[] = COLOURS.map((c) => ({
  id: `colour:${c.name}`,
  name: c.name,
  visual: { kind: 'swatch', colour: c.colour },
  lookAlikes: c.lookAlikes.map((other) => `colour:${other}`),
}));

const SHAPES = [
  { shape: 'circle', lookAlikes: [] },
  { shape: 'square', lookAlikes: ['rectangle'] },
  { shape: 'triangle', lookAlikes: [] },
  { shape: 'rectangle', lookAlikes: ['square'] },
  { shape: 'star', lookAlikes: [] },
] as const satisfies readonly {
  shape: Shape;
  lookAlikes: readonly Shape[];
}[];

const SHAPE_ITEMS: readonly Item[] = SHAPES.map((s) => ({
  id: `shape:${s.shape}`,
  name: s.shape,
  visual: { kind: 'shape', shape: s.shape },
  lookAlikes: s.lookAlikes.map((other) => `shape:${other}`),
}));

/** Each thing drawn in two sizes, the other size offered first as the wrong answer. */
function sizedItems(
  sizes: readonly [Size, Size],
  things: readonly (readonly [string, string])[],
): Item[] {
  return things.flatMap(([thing, emoji]) =>
    sizes.map((size) => ({
      id: `size:${size}:${thing}`,
      name: `${size} ${thing}`,
      visual: { kind: 'glyph', glyph: emoji, size },
      lookAlikes: sizes
        .filter((other) => other !== size)
        .map((other) => `size:${other}:${thing}`),
    })),
  );
}

const BIG_SMALL = sizedItems(
  ['big', 'small'],
  [
    ['elephant', '🐘'],
    ['dog', '🐶'],
    ['ball', '⚽'],
    ['apple', '🍎'],
    ['car', '🚗'],
    ['cat', '🐱'],
  ],
);

const TALL_SHORT = sizedItems(
  ['tall', 'short'],
  [
    ['tree', '🌳'],
    ['giraffe', '🦒'],
    ['building', '🏢'],
    ['candle', '🕯️'],
  ],
);

const PLACE_WORDS: Record<Place, string> = {
  on: 'on',
  under: 'under',
  in: 'in',
  out: 'out of',
};

/** Pairs of things the first can sit on, under, in or out of. */
const SCENES = [
  ['cat', '🐱', 'box', '📦'],
  ['ball', '⚽', 'basket', '🧺'],
  ['dog', '🐶', 'car', '🚗'],
  ['teddy', '🧸', 'bucket', '🪣'],
] as const;

/** Each scene's four pictures, asked for in turn; the other three are the wrong answers. */
const PLACE_ASKS: readonly Ask[] = SCENES.flatMap(
  ([subject, subjectGlyph, thing, thingGlyph]) => {
    const places = Object.keys(PLACE_WORDS) as Place[];
    const pool: Item[] = places.map((place) => ({
      id: `place:${subject}-${place}-${thing}`,
      name: `${subject} ${PLACE_WORDS[place]} the ${thing}`,
      visual: {
        kind: 'scene',
        subject: subjectGlyph,
        place,
        thing: thingGlyph,
      },
    }));
    return pool.map((item, i) => ({
      item,
      pool,
      instruction: `Tap the ${item.name}`,
      answerLine: `The ${subject} is ${PLACE_WORDS[places[i]!]} the ${thing}.`,
    }));
  },
);

interface Ask {
  readonly item: Item;
  /** The items its wrong answers are drawn from. */
  readonly pool: readonly Item[];
  readonly instruction: string;
  readonly answerLine: string;
}

function conceptsRound(
  asks: readonly Ask[],
  optionCount: number,
  random: Random,
): Question[] {
  return asks.map((ask) => ({
    instruction: ask.instruction,
    language: 'en',
    options: optionsFor(ask.item, ask.pool, optionCount, random),
    answerId: ask.item.id,
    answerLine: ask.answerLine,
  }));
}

const byId = (item: Item) => item.id;

export const conceptsLevel1 = (random: Random, weak: WeakIds): Question[] =>
  conceptsRound(
    practiceOrder(random, COLOUR_ITEMS, weak, byId)
      .slice(0, ROUND_LENGTH)
      .map((item) => ({
        item,
        pool: COLOUR_ITEMS,
        instruction: `Tap ${item.name}`,
        answerLine: `This is ${item.name}.`,
      })),
    3,
    random,
  );

/** Five shapes fill a round of ten by each being asked twice, never twice running. */
export const conceptsLevel2 = (random: Random, weak: WeakIds): Question[] => {
  const first = practiceOrder(random, SHAPE_ITEMS, weak, byId);
  const second = practiceOrder(random, SHAPE_ITEMS, weak, byId);
  if (second[0] === first.at(-1)) second.push(second.shift()!);
  return conceptsRound(
    [...first, ...second].slice(0, ROUND_LENGTH).map((item) => ({
      item,
      pool: SHAPE_ITEMS,
      instruction: `Tap the ${item.name}`,
      answerLine: `This is a ${item.name}.`,
    })),
    4,
    random,
  );
};

export const conceptsLevel3 = (random: Random, weak: WeakIds): Question[] =>
  conceptsRound(
    practiceOrder(random, [...BIG_SMALL, ...TALL_SHORT], weak, byId)
      .slice(0, ROUND_LENGTH)
      .map((item) => ({
        item,
        pool: BIG_SMALL.includes(item) ? BIG_SMALL : TALL_SHORT,
        instruction: `Tap the ${item.name}`,
        answerLine: `This is the ${item.name}.`,
      })),
    4,
    random,
  );

export const conceptsLevel4 = (random: Random, weak: WeakIds): Question[] =>
  conceptsRound(
    practiceOrder(random, PLACE_ASKS, weak, (ask) => ask.item.id).slice(
      0,
      ROUND_LENGTH,
    ),
    4,
    random,
  );
