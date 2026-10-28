import type { Random } from '../random.ts';
import {
  glyph,
  optionsFor,
  practiceOrder,
  ROUND_LENGTH,
  type Item,
  type Question,
  type WeakIds,
} from './question.ts';

/** Things a child mixes up, offered first as wrong answers. */
const LOOK_ALIKES = [
  ['fruit:apple', 'vegetable:tomato', 'fruit:cherry'],
  ['animal:tiger', 'animal:lion', 'animal:leopard'],
  ['animal:horse', 'animal:zebra'],
  ['animal:sheep', 'animal:goat'],
  ['bird:hen', 'bird:rooster'],
  ['bird:duck', 'bird:swan'],
  ['body:foot', 'body:leg'],
  ['body:mouth', 'body:tongue', 'body:tooth'],
  ['vehicle:bus', 'vehicle:trolley bus', 'vehicle:van'],
  ['vehicle:boat', 'vehicle:speedboat', 'vehicle:canoe'],
  ['family:grandmother', 'family:mother', 'family:sister'],
  ['family:grandfather', 'family:father', 'family:brother'],
];

function items(
  kind: string,
  rows: readonly (readonly [string, string])[],
): Item[] {
  return rows.map(([name, emoji]) => {
    const id = `${kind}:${name}`;
    const group = LOOK_ALIKES.find((g) => g.includes(id)) ?? [];
    return {
      id,
      name,
      visual: glyph(emoji),
      lookAlikes: group.filter((other) => other !== id),
    };
  });
}

const FRUITS = items('fruit', [
  ['apple', '🍎'],
  ['banana', '🍌'],
  ['mango', '🥭'],
  ['orange', '🍊'],
  ['watermelon', '🍉'],
  ['strawberry', '🍓'],
  ['pineapple', '🍍'],
  ['cherry', '🍒'],
  ['pear', '🍐'],
  ['coconut', '🥥'],
]);

const VEGETABLES = items('vegetable', [
  ['tomato', '🍅'],
  ['carrot', '🥕'],
  ['potato', '🥔'],
  ['onion', '🧅'],
  ['brinjal', '🍆'],
  ['corn', '🌽'],
  ['cucumber', '🥒'],
  ['broccoli', '🥦'],
  ['garlic', '🧄'],
  ['chilli', '🌶️'],
]);

const ANIMALS = items('animal', [
  ['cow', '🐮'],
  ['dog', '🐶'],
  ['cat', '🐱'],
  ['lion', '🦁'],
  ['tiger', '🐯'],
  ['leopard', '🐆'],
  ['sheep', '🐑'],
  ['horse', '🐴'],
  ['pig', '🐷'],
  ['goat', '🐐'],
  ['elephant', '🐘'],
  ['monkey', '🐒'],
  ['frog', '🐸'],
  ['snake', '🐍'],
  ['giraffe', '🦒'],
  ['zebra', '🦓'],
  ['rabbit', '🐰'],
  ['camel', '🐪'],
]);

const BIRDS = items('bird', [
  ['parrot', '🦜'],
  ['peacock', '🦚'],
  ['duck', '🦆'],
  ['owl', '🦉'],
  ['eagle', '🦅'],
  ['hen', '🐔'],
  ['rooster', '🐓'],
  ['penguin', '🐧'],
  ['flamingo', '🦩'],
  ['swan', '🦢'],
]);

/** Sounds only one of them makes, so a sound has one right answer. */
const SOUNDS: Record<string, string> = {
  'animal:cow': 'moo',
  'animal:dog': 'woof',
  'animal:cat': 'meow',
  'animal:lion': 'roar',
  'animal:sheep': 'baa',
  'animal:horse': 'neigh',
  'animal:pig': 'oink',
  'animal:goat': 'maa',
  'animal:frog': 'croak',
  'animal:snake': 'hiss',
  'bird:duck': 'quack',
  'bird:owl': 'hoot',
  'bird:hen': 'cluck',
  'bird:rooster': 'cock-a-doodle-doo',
};

const BODY_PARTS = items('body', [
  ['nose', '👃'],
  ['ear', '👂'],
  ['eye', '👁️'],
  ['mouth', '👄'],
  ['tongue', '👅'],
  ['tooth', '🦷'],
  ['hand', '✋'],
  ['foot', '🦶'],
  ['leg', '🦵'],
]);

const ROAD = items('vehicle', [
  ['car', '🚗'],
  ['bus', '🚌'],
  ['trolley bus', '🚎'],
  ['van', '🚐'],
  ['bicycle', '🚲'],
  ['auto rickshaw', '🛺'],
  ['truck', '🚚'],
  ['scooter', '🛵'],
  ['tractor', '🚜'],
]);

const SKY = items('vehicle', [
  ['aeroplane', '✈️'],
  ['helicopter', '🚁'],
  ['rocket', '🚀'],
]);

const WATER = items('vehicle', [
  ['boat', '⛵'],
  ['ship', '🚢'],
  ['speedboat', '🚤'],
  ['canoe', '🛶'],
]);

const VEHICLES = [...ROAD, ...SKY, ...WATER];

const FAMILY = items('family', [
  ['grandmother', '👵'],
  ['grandfather', '👴'],
  ['mother', '👩'],
  ['father', '👨'],
  ['sister', '👧'],
  ['brother', '👦'],
  ['baby', '👶'],
]);

/** Kinds of thing a child tells apart: a fruit is not different from a vegetable, nor a bird from an animal. */
export const KINDS: readonly (readonly Item[])[] = [
  [...FRUITS, ...VEGETABLES],
  [...ANIMALS, ...BIRDS],
  BODY_PARTS,
  VEHICLES,
  FAMILY,
];

interface Ask {
  readonly item: Item;
  /** The items its wrong answers are drawn from. */
  readonly pool: readonly Item[];
  readonly instruction: string;
  readonly answerLine: string;
}

/** "Tap the banana", among others from the pool. */
function nameAsks(pool: readonly Item[]): Ask[] {
  return pool.map((item) => ({
    item,
    pool,
    instruction: `Tap the ${item.name}`,
    answerLine: `This is the ${item.name}.`,
  }));
}

/** "Which one is a vegetable?": each answer among wrong answers from the pool, which the phrase does not fit. */
function categoryAsks(
  answers: readonly Item[],
  pool: readonly Item[],
  phrase: string,
): Ask[] {
  return answers.map((item) => ({
    item,
    pool,
    instruction: `Which one ${phrase}?`,
    answerLine: `The ${item.name} ${phrase}.`,
  }));
}

/** Ten asks from the level's mix, none about the same item twice. */
function awarenessRound(
  asks: readonly Ask[],
  optionCount: number,
  random: Random,
  weak: WeakIds,
): Question[] {
  const seen = new Set<string>();
  return practiceOrder(random, asks, weak, (ask) => ask.item.id)
    .filter((ask) => !seen.has(ask.item.id) && seen.add(ask.item.id))
    .slice(0, ROUND_LENGTH)
    .map((ask) => ({
      instruction: ask.instruction,
      language: 'en',
      options: optionsFor(ask.item, ask.pool, optionCount, random),
      answerId: ask.item.id,
      answerLine: ask.answerLine,
    }));
}

const LEVEL_1 = [
  ...nameAsks([...FRUITS, ...VEGETABLES]),
  ...categoryAsks(FRUITS, VEGETABLES, 'is a fruit'),
  ...categoryAsks(VEGETABLES, FRUITS, 'is a vegetable'),
  ...categoryAsks(VEGETABLES, FRUITS, 'is not a fruit'),
  ...categoryAsks(FRUITS, VEGETABLES, 'is not a vegetable'),
];

export const awarenessLevel1 = (random: Random, weak: WeakIds): Question[] =>
  awarenessRound(LEVEL_1, 3, random, weak);

/** "Which animal says moo?", among the others that make a sound. */
function soundAsks(): Ask[] {
  const pool = [...ANIMALS, ...BIRDS].filter((item) => SOUNDS[item.id]);
  return pool.map((item) => {
    const sound = SOUNDS[item.id]!;
    const kind = BIRDS.includes(item) ? 'bird' : 'animal';
    return {
      item,
      pool,
      instruction: `Which ${kind} says ${sound}?`,
      answerLine: `The ${item.name} says ${sound}.`,
    };
  });
}

const LEVEL_2 = [
  ...nameAsks([...ANIMALS, ...BIRDS]),
  ...soundAsks(),
  ...categoryAsks(BIRDS, ANIMALS, 'is a bird'),
  ...categoryAsks(ANIMALS, BIRDS, 'is not a bird'),
];

export const awarenessLevel2 = (random: Random, weak: WeakIds): Question[] =>
  awarenessRound(LEVEL_2, 4, random, weak);

/** "Which one flies in the sky?": each kind of vehicle among the other kinds. */
function vehicleKindAsks(kind: readonly Item[], phrase: string): Ask[] {
  return categoryAsks(
    kind,
    VEHICLES.filter((item) => !kind.includes(item)),
    phrase,
  );
}

const LEVEL_3 = [
  ...nameAsks(BODY_PARTS),
  ...nameAsks(VEHICLES),
  ...nameAsks(FAMILY),
  ...vehicleKindAsks(SKY, 'flies in the sky'),
  ...vehicleKindAsks(WATER, 'goes on water'),
  ...vehicleKindAsks(ROAD, 'goes on the road'),
];

export const awarenessLevel3 = (random: Random, weak: WeakIds): Question[] =>
  awarenessRound(LEVEL_3, 4, random, weak);
