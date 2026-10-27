import { shuffle, type Random } from '../random.ts';
import type { Language } from '../speaker.ts';

export const ROUND_LENGTH = 10;

/** Stars for a round's first-try correct answers out of 10. */
export function starsFor(score: number): number {
  if (score >= 9) return 3;
  if (score >= 7) return 2;
  if (score >= 5) return 1;
  return 0;
}

export interface Item {
  /** Stable across releases, for saved progress: `number:7`. */
  readonly id: string;
  /** What is spoken, and the tile's accessibility label. */
  readonly name: string;
  readonly glyph: string;
  /** Ids of items that look or sound like this one, closest first, preferred as distractors. */
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

/** The answer plus distractors from its look-alikes first, closest first, then the pool, in shuffled order. */
export function optionsFor(
  answer: Item,
  pool: readonly Item[],
  count: number,
  random: Random,
): Item[] {
  const others = pool.filter((item) => item.id !== answer.id);
  const lookAlikes = (answer.lookAlikes ?? []).flatMap((id) =>
    others.filter((item) => item.id === id),
  );
  const distractors = [
    ...lookAlikes,
    ...shuffle(
      random,
      others.filter((item) => !lookAlikes.includes(item)),
    ),
  ].slice(0, count - 1);
  return shuffle(random, [answer, ...distractors]);
}
