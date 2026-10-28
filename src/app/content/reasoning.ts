import { pick, shuffle, type Random } from '../random.ts';
import { KINDS } from './awareness.ts';
import {
  fromWritten,
  practiceOrder,
  ROUND_LENGTH,
  type Item,
  type Question,
  type Visual,
  type WeakIds,
  type WrittenQuestion,
} from './question.ts';

type Thing = Item & { readonly visual: Extract<Visual, { kind: 'glyph' }> };

function things<K extends string>(emoji: Record<K, string>): Record<K, Thing> {
  return Object.fromEntries(
    Object.entries<string>(emoji).map(([name, glyph]) => [
      name,
      { id: `thing:${name}`, name, visual: { kind: 'glyph', glyph } },
    ]),
  ) as Record<K, Thing>;
}

const T = things({
  sock: '🧦',
  shoe: '👟',
  toothbrush: '🪥',
  tooth: '🦷',
  cup: '☕',
  teapot: '🫖',
  lock: '🔒',
  key: '🔑',
  pen: '🖊️',
  paper: '📄',
  needle: '🪡',
  thread: '🧵',
  bread: '🍞',
  butter: '🧈',
  'rain cloud': '🌧️',
  umbrella: '☂️',
  bee: '🐝',
  honey: '🍯',
  cow: '🐄',
  milk: '🥛',
  hen: '🐔',
  egg: '🥚',
  dog: '🐶',
  bone: '🦴',
  monkey: '🐒',
  banana: '🍌',
  hand: '✋',
  glove: '🧤',
  ball: '⚽',
  goal: '🥅',
  apple: '🍎',
  rocket: '🚀',
  car: '🚗',
  fish: '🐟',
  grapes: '🍇',
  cherry: '🍒',
  star: '⭐',
  moon: '🌙',
  sun: '☀️',
  heart: '❤️',
  flower: '🌸',
  'red circle': '🔴',
  'orange circle': '🟠',
  'yellow circle': '🟡',
  'green circle': '🟢',
  'blue circle': '🔵',
  'purple circle': '🟣',
  'red square': '🟥',
  'yellow square': '🟨',
  'green square': '🟩',
  'blue square': '🟦',
  'up arrow': '⬆️',
  'right arrow': '➡️',
  'down arrow': '⬇️',
  'left arrow': '⬅️',
});

/** "Which one goes with the sock?", with two things that do not. */
function pair(
  thing: Thing,
  partner: Thing,
  wrong: readonly [Thing, Thing],
): WrittenQuestion {
  return {
    instruction: `Which one goes with the ${thing.name}?`,
    prompt: [thing.visual.glyph],
    answer: partner,
    wrong,
    answerLine: `The ${partner.name} goes with the ${thing.name}.`,
  };
}

const PAIRS: readonly WrittenQuestion[] = [
  pair(T.sock, T.shoe, [T.apple, T.rocket]),
  pair(T.toothbrush, T.tooth, [T.car, T.banana]),
  pair(T.cup, T.teapot, [T.dog, T.ball]),
  pair(T.lock, T.key, [T.fish, T.ball]),
  pair(T.pen, T.paper, [T.cow, T.egg]),
  pair(T.needle, T.thread, [T.banana, T.car]),
  pair(T.bread, T.butter, [T.sock, T.key]),
  pair(T['rain cloud'], T.umbrella, [T.bone, T.egg]),
  pair(T.bee, T.honey, [T.shoe, T.pen]),
  pair(T.cow, T.milk, [T.lock, T.glove]),
  pair(T.hen, T.egg, [T.thread, T.paper]),
  pair(T.dog, T.bone, [T.umbrella, T.teapot]),
  pair(T.monkey, T.banana, [T.key, T.sock]),
  pair(T.hand, T.glove, [T.honey, T.egg]),
  pair(T.ball, T.goal, [T.milk, T.tooth]),
];

const byAnswer = (written: WrittenQuestion) => written.answer.id;

export const reasoningLevel1 = (random: Random, weak: WeakIds): Question[] =>
  practiceOrder(random, PAIRS, weak, byAnswer)
    .slice(0, ROUND_LENGTH)
    .map((written) => fromWritten(written, random));

/** Ten different odd ones out, each among three of another kind. */
export const reasoningLevel2 = (random: Random, weak: WeakIds): Question[] =>
  practiceOrder(random, KINDS.flat(), weak, (item) => item.id)
    .slice(0, ROUND_LENGTH)
    .map((odd) => {
      const others = pick(
        random,
        KINDS.filter((kind) => !kind.includes(odd)),
      );
      return fromWritten(
        {
          instruction: 'Which one is different?',
          answer: odd,
          wrong: shuffle(random, others).slice(0, 3),
          answerLine: `The ${odd.name} is different.`,
        },
        random,
      );
    });

const NEXT = 'What comes next?';

/** Patterns the generator does not make: AAB, ABB, AABB, ABCD and ABBB. */
const WRITTEN_PATTERNS: readonly WrittenQuestion[] = [
  {
    instruction: NEXT,
    prompt: ['🍎', '🍎', '🍌', '🍎', '🍎', '🍌', '🍎', '🍎', '❓'],
    answer: T.banana,
    wrong: [T.apple, T.grapes, T.cherry],
    answerLine: 'The banana comes next.',
  },
  {
    instruction: NEXT,
    prompt: ['⭐', '🌙', '🌙', '⭐', '🌙', '🌙', '⭐', '🌙', '❓'],
    answer: T.moon,
    wrong: [T.star, T.sun, T.heart],
    answerLine: 'The moon comes next.',
  },
  {
    instruction: NEXT,
    prompt: ['🔴', '🔴', '🔵', '🔵', '🔴', '🔴', '🔵', '❓'],
    answer: T['blue circle'],
    wrong: [T['red circle'], T['yellow circle'], T['green circle']],
    answerLine: 'The blue circle comes next.',
  },
  {
    instruction: NEXT,
    prompt: ['⬆️', '➡️', '⬇️', '⬅️', '⬆️', '➡️', '⬇️', '❓'],
    answer: T['left arrow'],
    wrong: [T['up arrow'], T['right arrow'], T['down arrow']],
    answerLine: 'The left arrow comes next.',
  },
  {
    instruction: NEXT,
    prompt: ['🟥', '🟩', '🟩', '🟩', '🟥', '🟩', '🟩', '🟩', '🟥', '❓'],
    answer: T['green square'],
    wrong: [T['red square'], T['blue square'], T['yellow square']],
    answerLine: 'The green square comes next.',
  },
];

const COLOURS = [
  T['red circle'],
  T['orange circle'],
  T['yellow circle'],
  T['green circle'],
  T['blue circle'],
  T['purple circle'],
];

const PATTERN_THINGS = [
  T.star,
  T.moon,
  T.sun,
  T.heart,
  T.flower,
  T.apple,
  T.ball,
  T.fish,
];

/** An AB or ABC pattern, shown for more than one repeat, with the answer next. */
function pattern(answer: Thing, random: Random): WrittenQuestion {
  const set = COLOURS.includes(answer) ? COLOURS : PATTERN_THINGS;
  const others = shuffle(
    random,
    set.filter((item) => item !== answer),
  );
  const period = random.next() < 0.5 ? 2 : 3;
  const shown = period + 2 + Math.floor(random.next() * 2);
  const cycle = others.slice(0, period - 1);
  cycle.splice(shown % period, 0, answer);
  return {
    instruction: NEXT,
    prompt: [
      ...Array.from(
        { length: shown },
        (_, i) => cycle[i % period]!.visual.glyph,
      ),
      '❓',
    ],
    answer,
    wrong: others.slice(0, 3),
    answerLine: `The ${answer.name} comes next.`,
  };
}

/** Three written patterns and the rest made up, none with the same answer. */
export const reasoningLevel3 = (random: Random, weak: WeakIds): Question[] => {
  const written = practiceOrder(random, WRITTEN_PATTERNS, weak, byAnswer).slice(
    0,
    3,
  );
  const made = practiceOrder(
    random,
    [...COLOURS, ...PATTERN_THINGS],
    weak,
    (item) => item.id,
  )
    .filter((item) => !written.some((w) => w.answer === item))
    .slice(0, ROUND_LENGTH - written.length)
    .map((answer) => pattern(answer, random));
  return shuffle(random, [...written, ...made]).map((w) =>
    fromWritten(w, random),
  );
};
