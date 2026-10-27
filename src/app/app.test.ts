import { HardwareBack, type HardwareBackSource } from '@ng-native/device';
import {
  cleanup,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from '@ng-native/testing';
import { expect, test } from 'vitest';
import { App } from './app.ts';
import { provideApp } from './app.config.ts';
import { ProgressStore, type ProgressDoc } from './progress/progress-store.ts';
import { ADVANCE_DELAY_MS } from './round/round.ts';
import { Random } from './random.ts';
import { Speaker, type Language } from './speaker.ts';

type Utterance = { text: string; language: Language };

class RecordingSpeaker implements Speaker {
  readonly log: (Utterance | 'stop')[] = [];

  get spoken(): Utterance[] {
    return this.log.filter((entry): entry is Utterance => entry !== 'stop');
  }

  get lastSpoken(): Utterance | undefined {
    return this.spoken.at(-1);
  }

  speak(text: string, language: Language): void {
    this.log.push({ text, language });
  }

  stop(): void {
    this.log.push('stop');
  }
}

class SequenceRandom implements Random {
  private index = 0;
  constructor(private readonly values: readonly number[]) {}

  next(): number {
    const value = this.values[this.index % this.values.length]!;
    this.index++;
    return value;
  }
}

/** Repeatable pseudo-random numbers (mulberry32), for rounds long enough to need variety. */
class SeededRandom implements Random {
  constructor(private seed: number) {}

  next(): number {
    let t = (this.seed = (this.seed + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

/** Seeded, with values the test can put next in line for a pick made after the round is built. */
class SteeredRandom extends SeededRandom {
  private readonly queued: number[] = [];

  queue(...values: number[]): void {
    this.queued.push(...values);
  }

  override next(): number {
    return this.queued.shift() ?? super.next();
  }
}

/** Android's back button, pressed by the test. The latest listener is asked first, as on a device. */
class FakeBackButton implements HardwareBackSource {
  private listeners: (() => boolean)[] = [];

  subscribe(listener: () => boolean): () => void {
    this.listeners.push(listener);
    return () =>
      (this.listeners = this.listeners.filter((l) => l !== listener));
  }

  press(): void {
    [...this.listeners].reverse().some((listener) => listener());
  }
}

/** The phone's storage, kept as the JSON text a real store would write. */
class InMemoryProgressStore implements ProgressStore {
  private saved: string | null;

  constructor(doc?: ProgressDoc) {
    this.saved = doc ? JSON.stringify(doc) : null;
  }

  async load(): Promise<unknown> {
    return this.saved === null ? null : JSON.parse(this.saved);
  }

  async save(doc: ProgressDoc): Promise<void> {
    this.saved = JSON.stringify(doc);
  }
}

async function renderApp(
  store = new InMemoryProgressStore(),
  random: Random = new SequenceRandom([0.42, 0.07, 0.91, 0.66, 0.23, 0.58]),
  advanceDelay = 0,
) {
  const speaker = new RecordingSpeaker();
  const backButton = new FakeBackButton();
  await render(App, {
    providers: [
      provideApp(),
      { provide: Speaker, useValue: speaker },
      { provide: ProgressStore, useValue: store },
      { provide: Random, useValue: random },
      { provide: ADVANCE_DELAY_MS, useValue: advanceDelay },
      { provide: HardwareBack.SOURCE, useValue: backButton },
    ],
  });
  return { speaker, backButton, store, user: userEvent.setup() };
}

const INSTRUCTION =
  /^(Tap the number \d+|How many \w+\?|What comes (after|before) \d+\?|What comes between \d+ and \d+\?|Which is the (biggest|smallest) number\?)$/;

/** Numbers levels 2 and 3 opened, as after two 3-star rounds. */
function numbersUnlockedStore() {
  return new InMemoryProgressStore({
    version: 1,
    bestStars: { numbers: { 1: 3, 2: 3 } },
    unlocked: { numbers: [2, 3] },
  });
}

/** A seed whose level 2 round has between, biggest and smallest, and whose level 3 round asks for a mirrored number. */
const VARIED_SEED = 19;

/** An advance delay no test outlasts, so feedback stays on screen to be inspected. */
const HOLD_FEEDBACK = 60_000;

test('the home screen opens a Numbers round that speaks its first question', async () => {
  const { speaker, user } = await renderApp();

  expect(screen.getByText('Bal Vatika Prep')).toBeTruthy();
  await startLevel1(user);

  await screen.findByText('1 / 10');
  expect(speaker.lastSpoken?.language).toBe('en');
  expect(speaker.lastSpoken?.text).toMatch(INSTRUCTION);
  expect(answerTiles()).toHaveLength(3);
});

test('ten first-try answers end on Results with 3 stars and the spoken score', async () => {
  const { speaker, user } = await renderApp();
  await startLevel1(user);

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const labels = answerTiles().map(
      (node) => node.props['accessibilityLabel'],
    );
    expect(new Set(labels).size).toBe(3);
    await user.press(tile(solve(speaker)));
  }

  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
  expect(speaker.lastSpoken).toEqual({
    text: 'You got 10 out of 10!',
    language: 'en',
  });
});

test('a wrong first tap greys that tile and says "Try again!"; a right second tap scores nothing', async () => {
  const { speaker, user } = await renderApp();
  await startLevel1(user);
  await screen.findByText('1 / 10');
  const answer = solve(speaker);
  const wrong = wrongTiles(answer)[0]!;

  await user.press(wrong);

  expect(speaker.lastSpoken).toEqual({ text: 'Try again!', language: 'en' });
  expect(
    screen.getByRole('button', {
      name: String(wrong.props['accessibilityLabel']),
      disabled: true,
    }),
  ).toBeTruthy();
  expect(screen.getByText('1 / 10')).toBeTruthy();

  await user.press(tile(answer));
  await screen.findByText('2 / 10');
  await finishCorrectly(user, speaker, 2);

  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
  expect(speaker.lastSpoken?.text).toBe('You got 9 out of 10!');
});

test('a second wrong tap speaks the right answer, then moves on', async () => {
  const { speaker, user } = await renderApp();
  await startLevel1(user);
  await screen.findByText('1 / 10');
  const answer = solve(speaker);
  const [first, second] = wrongTiles(answer);

  await user.press(first!);
  await user.press(second!);

  expect(speaker.spoken).toContainEqual({
    text: `The answer is ${answer}.`,
    language: 'en',
  });
  await screen.findByText('2 / 10');
  await finishCorrectly(user, speaker, 2);
  expect(speaker.lastSpoken?.text).toBe('You got 9 out of 10!');
});

test.each([
  [8, 2],
  [7, 2],
  [6, 1],
  [5, 1],
])('%i first-try answers earn %i stars', async (score, stars) => {
  const { speaker, user } = await renderApp();
  await startLevel1(user);
  await playRound(user, speaker, score);

  expect(
    await screen.findByRole('image', { name: `${stars} of 3 stars` }),
  ).toBeTruthy();
  expect(speaker.lastSpoken?.text).toBe(`You got ${score} out of 10!`);
  expect(screen.queryByText("Let's practise again!")).toBeNull();
});

test('fewer than 5 first-try answers earn no stars and an invitation to practise again', async () => {
  const { speaker, user } = await renderApp();
  await startLevel1(user);
  await playRound(user, speaker, 4);

  expect(
    await screen.findByRole('image', { name: '0 of 3 stars' }),
  ).toBeTruthy();
  expect(screen.getByText("Let's practise again!")).toBeTruthy();
  expect(speaker.lastSpoken?.text).toBe(
    "You got 4 out of 10! Let's practise again!",
  );
});

test('a right first tap is praised in English with a phrase picked at random', async () => {
  const random = new SteeredRandom(1);
  const { speaker, user } = await renderApp(undefined, random);
  await startLevel1(user);
  await screen.findByText('1 / 10');

  random.queue(0.99);
  await user.press(tile(solve(speaker)));

  expect(speaker.spoken).toContainEqual({
    text: 'You got it!',
    language: 'en',
  });

  await screen.findByText('2 / 10');
  random.queue(0.3);
  await user.press(tile(solve(speaker)));

  expect(speaker.spoken).toContainEqual({ text: 'Super!', language: 'en' });
});

test('a right second tap is praised too, though it scores nothing', async () => {
  const random = new SteeredRandom(1);
  const { speaker, user } = await renderApp(undefined, random);
  await startLevel1(user);
  await screen.findByText('1 / 10');
  const answer = solve(speaker);

  await user.press(wrongTiles(answer)[0]!);
  random.queue(0);
  await user.press(tile(answer));

  expect(speaker.spoken).toContainEqual({ text: 'Well done!', language: 'en' });
});

test('the tile tapped right is celebrated with a star; the others are not', async () => {
  const { speaker, user } = await renderApp(
    undefined,
    undefined,
    HOLD_FEEDBACK,
  );
  await startLevel1(user);
  await screen.findByText('1 / 10');
  const answer = solve(speaker);
  expect(screen.queryByTestId('praise-star')).toBeNull();

  await user.press(tile(answer));

  expect(within(tile(answer)).getByTestId('praise-star')).toBeTruthy();
  for (const other of wrongTiles(answer)) {
    expect(within(other).queryByTestId('praise-star')).toBeNull();
  }
});

test('an answer shown after two misses is not celebrated', async () => {
  const { speaker, user } = await renderApp(
    undefined,
    undefined,
    HOLD_FEEDBACK,
  );
  await startLevel1(user);
  await screen.findByText('1 / 10');
  const answer = solve(speaker);
  const [first, second] = wrongTiles(answer);

  await user.press(first!);
  await user.press(second!);

  expect(speaker.lastSpoken?.text).toBe(`The answer is ${answer}.`);
  expect(screen.queryByTestId('praise-star')).toBeNull();
});

type User = ReturnType<typeof userEvent.setup>;

test('the speaker button says the question again', async () => {
  const { speaker, user } = await renderApp();
  await startLevel1(user);
  await screen.findByText('1 / 10');
  const question = speaker.lastSpoken!;

  await user.press(screen.getByRole('button', { name: 'Hear again' }));

  expect(speaker.spoken).toEqual([question, question]);
});

test('the back button leaves a round for its levels and stops the voice', async () => {
  const { speaker, backButton, user } = await renderApp();
  await startLevel1(user);
  await screen.findByText('1 / 10');

  backButton.press();

  await waitFor(() => expect(screen.queryByText('1 / 10')).toBeNull());
  expect(screen.getByRole('button', { name: /^Level 1, / })).toBeTruthy();
  expect(speaker.log.at(-1)).toBe('stop');
});

test('the back button leaves Results for the levels, then Home', async () => {
  const { speaker, backButton, user } = await renderApp();
  await startLevel1(user);
  await playRound(user, speaker, 10);
  await screen.findByRole('image', { name: '3 of 3 stars' });

  backButton.press();

  await waitFor(() =>
    expect(screen.queryByRole('image', { name: /of 3 stars$/ })).toBeNull(),
  );
  expect(screen.queryByText(/ \/ 10$/)).toBeNull();
  expect(speaker.log.at(-1)).toBe('stop');
  expect(screen.getByRole('button', { name: /^Level 1, / })).toBeTruthy();

  backButton.press();

  await waitFor(() =>
    expect(screen.queryByRole('button', { name: /^Level 1, / })).toBeNull(),
  );
  expect(screen.getByRole('button', { name: /^Numbers, / })).toBeTruthy();
});

test('Numbers lists three levels: level 1 open, levels 2 and 3 locked', async () => {
  const { user } = await renderApp();
  expect(
    screen.getByRole('button', { name: 'Numbers, 0 of 3 stars' }),
  ).toBeTruthy();

  await user.press(screen.getByRole('button', { name: /^Numbers, / }));

  expect(
    await screen.findByRole('button', { name: 'Level 1, 0 of 3 stars' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Level 2, locked' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Level 3, locked' })).toBeTruthy();
});

test('a locked level does not start', async () => {
  const { speaker, user } = await renderApp();
  await user.press(screen.getByRole('button', { name: /^Numbers, / }));

  await user.press(
    await screen.findByRole('button', { name: 'Level 2, locked' }),
  );

  expect(screen.queryByText(/ \/ 10$/)).toBeNull();
  expect(speaker.spoken).toEqual([]);
  expect(screen.getByRole('button', { name: 'Level 2, locked' })).toBeTruthy();
});

test('3 stars unlocks the next level and shows on the levels and the Home tile', async () => {
  const { speaker, backButton, user } = await renderApp();
  await startLevel1(user);
  await playRound(user, speaker, 10);
  await screen.findByRole('image', { name: '3 of 3 stars' });

  backButton.press();

  expect(
    await screen.findByRole('button', { name: 'Level 1, 3 of 3 stars' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Level 2, 0 of 3 stars' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Level 3, locked' })).toBeTruthy();

  backButton.press();

  expect(
    await screen.findByRole('button', { name: 'Numbers, 3 of 3 stars' }),
  ).toBeTruthy();
});

test('fewer than 3 stars keeps the next level locked', async () => {
  const { speaker, backButton, user } = await renderApp();
  await startLevel1(user);
  await playRound(user, speaker, 8);
  await screen.findByRole('image', { name: '2 of 3 stars' });

  backButton.press();

  expect(
    await screen.findByRole('button', { name: 'Level 1, 2 of 3 stars' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Level 2, locked' })).toBeTruthy();
});

test('a worse round keeps the best stars', async () => {
  const { speaker, backButton, user } = await renderApp();
  await startLevel1(user);
  await playRound(user, speaker, 8);
  await screen.findByRole('image', { name: '2 of 3 stars' });
  backButton.press();

  await user.press(
    await screen.findByRole('button', { name: 'Level 1, 2 of 3 stars' }),
  );
  await playRound(user, speaker, 5);
  await screen.findByRole('image', { name: '1 of 3 stars' });
  backButton.press();

  expect(
    await screen.findByRole('button', { name: 'Level 1, 2 of 3 stars' }),
  ).toBeTruthy();
});

test('progress survives a fresh render with the same store', async () => {
  const first = await renderApp();
  await startLevel1(first.user);
  await playRound(first.user, first.speaker, 10);
  await screen.findByRole('image', { name: '3 of 3 stars' });
  cleanup();

  const { user } = await renderApp(first.store);

  await user.press(
    await screen.findByRole('button', { name: 'Numbers, 3 of 3 stars' }),
  );
  expect(
    await screen.findByRole('button', { name: 'Level 1, 3 of 3 stars' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Level 2, 0 of 3 stars' }),
  ).toBeTruthy();
});

test.each([
  [2, 20, 10],
  [3, 50, 20],
])(
  'level %i plays ten questions on 1-%i with 4 tiles, counting at most %i objects',
  async (level, max, countCap) => {
    const { speaker, user } = await renderApp(numbersUnlockedStore());
    await startLevel(user, level);

    for (let n = 1; n <= 10; n++) {
      await screen.findByText(`${n} / 10`);
      expect(speaker.lastSpoken?.text).toMatch(INSTRUCTION);
      const numbers = tileNumbers();
      expect(new Set(numbers).size).toBe(4);
      for (const value of numbers) {
        expect(value).toBeGreaterThanOrEqual(1);
        expect(value).toBeLessThanOrEqual(max);
      }
      if (speaker.lastSpoken!.text.startsWith('How many')) {
        expect(promptGlyphs().length).toBeLessThanOrEqual(countCap);
      }
      await user.press(tile(solve(speaker)));
    }

    expect(
      await screen.findByRole('image', { name: '3 of 3 stars' }),
    ).toBeTruthy();
    expect(speaker.lastSpoken?.text).toBe('You got 10 out of 10!');
  },
);

test('a "between" question shows both numbers around a gap and takes the number in the middle', async () => {
  const { speaker, user } = await renderApp(
    numbersUnlockedStore(),
    new SeededRandom(VARIED_SEED),
  );
  await startLevel(user, 2);
  let betweens = 0;

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const between = /^What comes between (\d+) and (\d+)\?$/.exec(
      speaker.lastSpoken!.text,
    );
    if (!between) {
      await user.press(tile(solve(speaker)));
      continue;
    }
    betweens++;
    const [low, high] = [Number(between[1]), Number(between[2])];
    expect(high - low).toBe(2);
    expect(promptGlyphs()).toEqual([String(low), '❓', String(high)]);
    await user.press(tile(low + 1));
  }

  expect(betweens).toBeGreaterThan(0);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('"biggest" and "smallest" questions are answered by the biggest or smallest tile', async () => {
  const { speaker, user } = await renderApp(
    numbersUnlockedStore(),
    new SeededRandom(VARIED_SEED),
  );
  await startLevel(user, 2);
  const asked = new Set<string>();

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const which = /^Which is the (biggest|smallest) number\?$/.exec(
      speaker.lastSpoken!.text,
    );
    if (which) asked.add(which[1]!);
    await user.press(tile(solve(speaker)));
  }

  expect([...asked].sort()).toEqual(['biggest', 'smallest']);
  expect(speaker.lastSpoken?.text).toBe('You got 10 out of 10!');
});

test('"Tap the number" offers look-alikes: 6 and 9, 12 and 21, 13 and 31, and a neighbouring number', async () => {
  const mirrors: Record<number, number> = {
    6: 9,
    9: 6,
    12: 21,
    21: 12,
    13: 31,
    31: 13,
  };
  const { speaker, user } = await renderApp(
    numbersUnlockedStore(),
    new SeededRandom(VARIED_SEED),
  );
  await startLevel(user, 3);
  let mirrored = 0;

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const recognise = /^Tap the number (\d+)$/.exec(speaker.lastSpoken!.text);
    if (recognise) {
      const answer = Number(recognise[1]);
      const numbers = tileNumbers();
      expect(numbers.some((value) => Math.abs(value - answer) === 1)).toBe(
        true,
      );
      const mirror = mirrors[answer];
      if (mirror !== undefined) {
        expect(numbers).toContain(mirror);
        mirrored++;
      }
    }
    await user.press(tile(solve(speaker)));
  }

  expect(mirrored).toBeGreaterThan(0);
});

/** From Home, through the Numbers levels, into level 1. */
async function startLevel1(user: User) {
  await startLevel(user, 1);
}

async function startLevel(user: User, level: number) {
  await user.press(screen.getByRole('button', { name: /^Numbers, / }));
  await user.press(
    await screen.findByRole('button', {
      name: new RegExp(`^Level ${level}, \\d`),
    }),
  );
}

/** Plays a whole round: the first misses are put right on the second try, the rest are right first time. */
async function playRound(
  user: User,
  speaker: RecordingSpeaker,
  firstTryCorrect: number,
) {
  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const answer = solve(speaker);
    if (n <= 10 - firstTryCorrect) await user.press(wrongTiles(answer)[0]!);
    await user.press(tile(answer));
  }
}

async function finishCorrectly(
  user: User,
  speaker: RecordingSpeaker,
  from: number,
) {
  for (let n = from; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    await user.press(tile(solve(speaker)));
  }
  await screen.findByRole('image', { name: /of 3 stars$/ });
}

function wrongTiles(answer: number) {
  return answerTiles().filter(
    (node) => node.props['accessibilityLabel'] !== String(answer),
  );
}

function answerTiles() {
  return screen
    .queryAllByRole('button')
    .filter((node) =>
      /^\d+$/.test(String(node.props['accessibilityLabel'] ?? '')),
    );
}

function tileNumbers() {
  return answerTiles().map((node) => Number(node.props['accessibilityLabel']));
}

function tile(answer: number) {
  return screen.getByRole('button', { name: String(answer) });
}

function promptGlyphs() {
  return within(screen.getByTestId('prompt'))
    .getAllByText(/.+/u)
    .map((node) => node.children.map((raw) => raw.props['text']).join(''));
}

/** Works the answer out from the spoken instruction, the way a child who understood it would. */
function solve(speaker: RecordingSpeaker): number {
  const text = speaker.spoken.findLast((u) => INSTRUCTION.test(u.text))!.text;
  const n = Number(/\d+/.exec(text)?.[0]);
  if (text.startsWith('Tap the number')) return n;
  if (text.startsWith('What comes after')) return n + 1;
  if (text.startsWith('What comes before')) return n - 1;
  if (text.startsWith('What comes between')) return n + 1;
  if (text.includes('biggest')) return Math.max(...tileNumbers());
  if (text.includes('smallest')) return Math.min(...tileNumbers());
  return promptGlyphs().length;
}
