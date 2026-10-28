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

/** स्वर, अ to अः. */
const VOWELS = [
  'अ',
  'आ',
  'इ',
  'ई',
  'उ',
  'ऊ',
  'ऋ',
  'ए',
  'ऐ',
  'ओ',
  'औ',
  'अं',
  'अः',
];

/** व्यंजन, क to ज्ञ. */
const CONSONANTS = [
  'क',
  'ख',
  'ग',
  'घ',
  'ङ',
  'च',
  'छ',
  'ज',
  'झ',
  'ञ',
  'ट',
  'ठ',
  'ड',
  'ढ',
  'ण',
  'त',
  'थ',
  'द',
  'ध',
  'न',
  'प',
  'फ',
  'ब',
  'भ',
  'म',
  'य',
  'र',
  'ल',
  'व',
  'श',
  'ष',
  'स',
  'ह',
  'क्ष',
  'त्र',
  'ज्ञ',
];

/** Letters that sound alike are named as children learn them; the rest are named by themselves. */
const NAMES: Record<string, string> = {
  श: 'शलगम वाला श',
  ष: 'षट्कोण वाला ष',
  स: 'सपेरे वाला स',
};

/** Letters a child mixes up, offered first as wrong answers. */
const LOOK_ALIKES = [
  ['ब', 'व'],
  ['घ', 'ध'],
  ['म', 'भ'],
  ['प', 'ष'],
  ['उ', 'ऊ'],
  ['इ', 'ई'],
];

function letterItem(kind: 'vowel' | 'consonant', letter: string): Item {
  const group = LOOK_ALIKES.find((g) => g.includes(letter)) ?? [];
  return {
    id: `hindi-${kind}:${letter}`,
    name: NAMES[letter] ?? letter,
    visual: glyph(letter),
    lookAlikes: group
      .filter((other) => other !== letter)
      .map((other) => `hindi-${kind}:${other}`),
  };
}

function hindiRound(
  pool: readonly Item[],
  optionCount: number,
  random: Random,
  weak: WeakIds,
): Question[] {
  return practiceOrder(random, pool, weak, (item) => item.id)
    .slice(0, ROUND_LENGTH)
    .map((item) => ({
      instruction: `${item.name} पर टैप करो`,
      language: 'hi',
      options: optionsFor(item, pool, optionCount, random),
      answerId: item.id,
      answerLine: `यह ${item.name} है।`,
    }));
}

const VOWEL_ITEMS = VOWELS.map((letter) => letterItem('vowel', letter));
const CONSONANT_ITEMS = CONSONANTS.map((letter) =>
  letterItem('consonant', letter),
);

export const hindiLevel1 = (random: Random, weak: WeakIds): Question[] =>
  hindiRound(VOWEL_ITEMS, 3, random, weak);

export const hindiLevel2 = (random: Random, weak: WeakIds): Question[] =>
  hindiRound(CONSONANT_ITEMS, 4, random, weak);
