import { shuffle, weightedShuffle, type Random } from '../random.ts';
import type { Language } from '../speaker.ts';

export const ROUND_LENGTH = 10;

/** How much likelier a weak item is to be asked than any other. */
export const WEAK_WEIGHT = 3;

/** Ids of the items to practise more: the weak spots in the area being played. */
export type WeakIds = ReadonlySet<string>;

/** Asks in random order, those about weak items likelier to come first. */
export function practiceOrder<T>(
  random: Random,
  asks: readonly T[],
  weak: WeakIds,
  idOf: (ask: T) => string,
): T[] {
  return weightedShuffle(random, asks, (ask) =>
    weak.has(idOf(ask)) ? WEAK_WEIGHT : 1,
  );
}

/** Stars for a round's first-try correct answers out of 10. */
export function starsFor(score: number): number {
  if (score >= 9) return 3;
  if (score >= 7) return 2;
  if (score >= 5) return 1;
  return 0;
}

export type Shape = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star';
export type Size = 'big' | 'small' | 'tall' | 'short';
export type Place = 'on' | 'under' | 'in' | 'out';

/** How an item is drawn on its tile. */
export type Visual =
  | { readonly kind: 'glyph'; readonly glyph: string; readonly size?: Size }
  | { readonly kind: 'swatch'; readonly colour: string }
  | { readonly kind: 'shape'; readonly shape: Shape }
  /** One emoji placed against another: a cat on a box. */
  | {
      readonly kind: 'scene';
      readonly subject: string;
      readonly place: Place;
      readonly thing: string;
    };

export function glyph(text: string): Visual {
  return { kind: 'glyph', glyph: text };
}

export interface Item {
  /** Stable across releases, for saved progress: `number:7`. */
  readonly id: string;
  /** What is spoken, and the tile's accessibility label. */
  readonly name: string;
  readonly visual: Visual;
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

/** A question written out in full rather than made from a template. */
export interface WrittenQuestion {
  readonly instruction: string;
  readonly prompt?: readonly string[];
  readonly answer: Item;
  /** Every wrong answer shown, so their number sets the tile count. */
  readonly wrong: readonly Item[];
  readonly answerLine: string;
}

export function fromWritten(
  written: WrittenQuestion,
  random: Random,
): Question {
  return {
    instruction: written.instruction,
    language: 'en',
    prompt: written.prompt,
    options: shuffle(random, [written.answer, ...written.wrong]),
    answerId: written.answer.id,
    answerLine: written.answerLine,
  };
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
