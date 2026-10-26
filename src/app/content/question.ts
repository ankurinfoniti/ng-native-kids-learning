import { shuffle, type Random } from '../random.ts';
import type { Language } from '../speaker.ts';

export const ROUND_LENGTH = 10;

export interface Item {
  /** Stable across releases, for saved progress: `number:7`. */
  readonly id: string;
  /** What is spoken, and the tile's accessibility label. */
  readonly name: string;
  readonly glyph: string;
  /** Ids of items that look or sound like this one, preferred as distractors. */
  readonly lookAlikes?: readonly string[];
}

export interface Question {
  readonly instruction: string;
  readonly language: Language;
  /** Glyphs shown above the options, such as the objects to count. */
  readonly prompt?: readonly string[];
  readonly options: readonly Item[];
  readonly answerId: string;
  /** Spoken when the second try is also wrong. */
  readonly answerLine: string;
}

/** The answer plus distractors from its look-alikes first, then the pool, in shuffled order. */
export function optionsFor(
  answer: Item,
  pool: readonly Item[],
  count: number,
  random: Random,
): Item[] {
  const others = pool.filter((item) => item.id !== answer.id);
  const isLookAlike = (item: Item) =>
    answer.lookAlikes?.includes(item.id) ?? false;
  const distractors = [
    ...shuffle(random, others.filter(isLookAlike)),
    ...shuffle(
      random,
      others.filter((item) => !isLookAlike(item)),
    ),
  ].slice(0, count - 1);
  return shuffle(random, [answer, ...distractors]);
}
