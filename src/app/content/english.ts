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

/** Each letter as said by name, not by its sound. */
const LETTERS = [
  ['A', 'ay'],
  ['B', 'bee'],
  ['C', 'see'],
  ['D', 'dee'],
  ['E', 'ee'],
  ['F', 'ef'],
  ['G', 'jee'],
  ['H', 'aitch'],
  ['I', 'eye'],
  ['J', 'jay'],
  ['K', 'kay'],
  ['L', 'el'],
  ['M', 'em'],
  ['N', 'en'],
  ['O', 'oh'],
  ['P', 'pee'],
  ['Q', 'cue'],
  ['R', 'are'],
  ['S', 'ess'],
  ['T', 'tee'],
  ['U', 'you'],
  ['V', 'vee'],
  ['W', 'double you'],
  ['X', 'ex'],
  ['Y', 'why'],
  ['Z', 'zed'],
] as const;

/** Letters a child mixes up, offered first as wrong answers. */
const LOOK_ALIKES = ['CGOQ', 'EF', 'bdpq', 'mnw'];

function letterItem(
  kind: 'upper' | 'lower',
  letter: string,
  name: string,
): Item {
  const group = LOOK_ALIKES.find((g) => g.includes(letter)) ?? '';
  return {
    id: `letter-${kind}:${letter}`,
    name,
    visual: glyph(letter),
    lookAlikes: [...group]
      .filter((other) => other !== letter)
      .map((other) => `letter-${kind}:${other}`),
  };
}

const CAPITALS = LETTERS.map(([letter, name]) =>
  letterItem('upper', letter, name),
);

const SMALLS = LETTERS.map(([letter, name]) =>
  letterItem('lower', letter.toLowerCase(), name),
);

/** One picture word per letter, A to Z, for starting sounds. */
const WORDS = [
  ['apple', '🍎'],
  ['banana', '🍌'],
  ['cat', '🐱'],
  ['dog', '🐶'],
  ['elephant', '🐘'],
  ['fish', '🐟'],
  ['grapes', '🍇'],
  ['horse', '🐴'],
  ['ice cream', '🍦'],
  ['juice', '🧃'],
  ['kite', '🪁'],
  ['lion', '🦁'],
  ['monkey', '🐒'],
  ['nose', '👃'],
  ['orange', '🍊'],
  ['parrot', '🦜'],
  ['queen', '👸'],
  ['rabbit', '🐇'],
  ['snake', '🐍'],
  ['tiger', '🐯'],
  ['umbrella', '☂️'],
  ['violin', '🎻'],
  ['watermelon', '🍉'],
  ['x-ray', '🩻'],
  ['yo-yo', '🪀'],
  ['zebra', '🦓'],
] as const;

const PICTURES: readonly Item[] = WORDS.map(([word, emoji]) => ({
  id: `word:${word}`,
  name: word,
  visual: glyph(emoji),
}));

interface EnglishLevel {
  readonly pool: readonly Item[];
  readonly optionCount: number;
  ask(index: number): { instruction: string; prompt?: readonly string[] };
}

function englishRound(
  level: EnglishLevel,
  random: Random,
  weak: WeakIds,
): Question[] {
  const indexes = practiceOrder(
    random,
    LETTERS.map((_, i) => i),
    weak,
    (i) => level.pool[i]!.id,
  ).slice(0, ROUND_LENGTH);
  return indexes.map((i) => {
    const item = level.pool[i]!;
    return {
      ...level.ask(i),
      language: 'en',
      options: optionsFor(item, level.pool, level.optionCount, random),
      answerId: item.id,
      answerLine: `The answer is ${item.name}.`,
    };
  });
}

export const englishLevel1 = (random: Random, weak: WeakIds): Question[] =>
  englishRound(
    {
      pool: CAPITALS,
      optionCount: 3,
      ask: (i) => ({ instruction: `Tap the letter ${LETTERS[i]![1]}` }),
    },
    random,
    weak,
  );

export const englishLevel2 = (random: Random, weak: WeakIds): Question[] =>
  englishRound(
    {
      pool: SMALLS,
      optionCount: 4,
      ask: (i) => ({ instruction: `Tap the letter ${LETTERS[i]![1]}` }),
    },
    random,
    weak,
  );

export const englishLevel3 = (random: Random, weak: WeakIds): Question[] =>
  englishRound(
    {
      pool: SMALLS,
      optionCount: 4,
      ask: (i) => {
        const [letter, name] = LETTERS[i]!;
        return {
          instruction: `Find small ${name} for big ${name}`,
          prompt: [letter],
        };
      },
    },
    random,
    weak,
  );

export const englishLevel4 = (random: Random, weak: WeakIds): Question[] =>
  englishRound(
    {
      pool: PICTURES,
      optionCount: 4,
      ask: (i) => {
        const [letter, name] = LETTERS[i]!;
        return {
          instruction: `Which one starts with ${name}?`,
          prompt: [letter, letter.toLowerCase()],
        };
      },
    },
    random,
    weak,
  );
