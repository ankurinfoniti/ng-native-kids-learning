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

  async clear(): Promise<void> {
    this.saved = null;
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
function numbersUnlockedStore(items?: ProgressDoc['items']) {
  return new InMemoryProgressStore({
    version: 1,
    bestStars: { numbers: { 1: 3, 2: 3 } },
    unlocked: { numbers: [2, 3] },
    items,
  });
}

/** A seed whose level 2 round has between, biggest and smallest, and whose level 3 round asks for a mirrored number. */
const VARIED_SEED = 19;

/** A seed whose level 3 round leaves out 37, unless 37 is weak. */
const WEAK_SEED = 1;

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

test('the Parent button on Home opens best stars for every area and level', async () => {
  const { user } = await renderApp(
    new InMemoryProgressStore({
      version: 1,
      bestStars: { numbers: { 1: 3, 2: 2 }, english: { 1: 1 } },
      unlocked: { numbers: [2, 3] },
    }),
  );

  await user.press(screen.getByRole('button', { name: 'Parent' }));

  for (const name of [
    'Numbers level 1, 3 of 3 stars',
    'Numbers level 2, 2 of 3 stars',
    'Numbers level 3, 0 of 3 stars',
    'English level 1, 1 of 3 stars',
    'English level 4, 0 of 3 stars',
    'Concepts level 4, 0 of 3 stars',
    'General awareness level 3, 0 of 3 stars',
    'Reasoning level 3, 0 of 3 stars',
    'Hindi level 2, 0 of 3 stars',
  ]) {
    expect(await screen.findByRole('image', { name })).toBeTruthy();
  }
  expect(screen.getByText('No weak spots yet')).toBeTruthy();
});

test('a number missed first time in 2 rounds is a weak spot on the Parent screen; one missed once is not', async () => {
  const { speaker, backButton, user } = await renderApp();
  await startLevel1(user);
  await playRoundMissing(user, speaker, [7]);
  backButton.press();
  await replayLevel1(user);
  await playRoundMissing(user, speaker, [7, 3]);
  backButton.press();
  backButton.press();

  await user.press(await screen.findByRole('button', { name: 'Parent' }));

  expect(await screen.findByText('7 · Numbers')).toBeTruthy();
  expect(screen.queryByText('3 · Numbers')).toBeNull();
  expect(screen.queryByText('No weak spots yet')).toBeNull();
});

test('a weak spot stays after 2 right first tries in a row and leaves after 3', async () => {
  const { speaker, backButton, user } = await renderApp();
  await startLevel1(user);
  for (const missed of [[7], [7], []]) {
    await playRoundMissing(user, speaker, missed);
    backButton.press();
    await replayLevel1(user);
  }
  await playRoundMissing(user, speaker, []);
  backButton.press();
  backButton.press();
  await user.press(await screen.findByRole('button', { name: 'Parent' }));

  expect(await screen.findByText('7 · Numbers')).toBeTruthy();

  backButton.press();
  await waitFor(() => expect(screen.queryByText('Weak spots')).toBeNull());
  await startLevel1(user);
  await playRoundMissing(user, speaker, []);
  backButton.press();
  backButton.press();
  await user.press(await screen.findByRole('button', { name: 'Parent' }));

  expect(await screen.findByText('No weak spots yet')).toBeTruthy();
  expect(screen.queryByText('7 · Numbers')).toBeNull();
});

test('Reset progress asks first, and only clears the saved stars and weak spots once confirmed', async () => {
  const store = new InMemoryProgressStore({
    version: 1,
    bestStars: { numbers: { 1: 3 } },
    unlocked: { numbers: [2] },
    items: {
      'number:7': {
        area: 'numbers',
        name: '7',
        recent: [false, false],
        streak: 0,
        weak: true,
      },
    },
  });
  const { backButton, user } = await renderApp(store);
  await user.press(screen.getByRole('button', { name: 'Parent' }));
  await user.press(
    await screen.findByRole('button', { name: 'Reset progress' }),
  );

  expect(screen.getByText('Clear all stars and weak spots?')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: 'Cancel' }));

  expect(screen.queryByText('Clear all stars and weak spots?')).toBeNull();
  expect(
    screen.getByRole('image', { name: 'Numbers level 1, 3 of 3 stars' }),
  ).toBeTruthy();
  expect(screen.getByText('7 · Numbers')).toBeTruthy();

  await user.press(screen.getByRole('button', { name: 'Reset progress' }));
  await user.press(screen.getByRole('button', { name: 'Yes, reset' }));

  expect(
    await screen.findByRole('image', { name: 'Numbers level 1, 0 of 3 stars' }),
  ).toBeTruthy();
  expect(screen.getByText('No weak spots yet')).toBeTruthy();
  expect(await store.load()).toBeNull();

  backButton.press();
  expect(
    await screen.findByRole('button', { name: 'Numbers, 0 of 3 stars' }),
  ).toBeTruthy();
  cleanup();

  const fresh = await renderApp(store);
  await fresh.user.press(
    screen.getByRole('button', { name: 'Numbers, 0 of 3 stars' }),
  );
  expect(
    await screen.findByRole('button', { name: 'Level 2, locked' }),
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

test('a weak number is asked in a Numbers level 3 round that leaves it out when it is not weak', async () => {
  const weak37 = {
    'number:37': {
      area: 'numbers',
      name: '37',
      recent: [false, false],
      streak: 0,
      weak: true,
    },
  };
  const askedWith = async (items?: ProgressDoc['items']) => {
    const { speaker, user } = await renderApp(
      numbersUnlockedStore(items),
      new SeededRandom(WEAK_SEED),
    );
    await startLevel(user, 3);
    const asked = await playRoundAsked(user, speaker);
    cleanup();
    return asked;
  };

  const notWeak = await askedWith();
  const weak = await askedWith(weak37);

  expect(notWeak).not.toContain(37);
  expect(weak).toContain(37);
  expect(new Set(weak).size).toBe(10);
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

test('English lists four levels: level 1 open, levels 2 to 4 locked', async () => {
  const { user } = await renderApp();
  expect(
    screen.getByRole('button', { name: 'English, 0 of 3 stars' }),
  ).toBeTruthy();

  await user.press(screen.getByRole('button', { name: /^English, / }));

  expect(
    await screen.findByRole('button', { name: 'Level 1, 0 of 3 stars' }),
  ).toBeTruthy();
  for (const level of [2, 3, 4]) {
    expect(
      screen.getByRole('button', { name: `Level ${level}, locked` }),
    ).toBeTruthy();
  }
});

test('English level 1 asks for ten capital letters by name, with 3 tiles each', async () => {
  const { speaker, user } = await renderApp();
  await startLevel(user, 1, 'English');

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const asked = /^Tap the letter (.+)$/.exec(speaker.lastSpoken!.text);
    expect(asked).not.toBeNull();
    expect(speaker.lastSpoken?.language).toBe('en');
    const tiles = optionTiles();
    expect(tiles).toHaveLength(3);
    for (const node of tiles) {
      const glyph = tileGlyph(node);
      expect(glyph).toMatch(/^[A-Z]$/);
      expect(node.props['accessibilityLabel']).toBe(LETTER_NAMES[glyph]);
    }
    await user.press(screen.getByRole('button', { name: asked![1] }));
  }

  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
  expect(speaker.lastSpoken?.text).toBe('You got 10 out of 10!');
});

test('English level 4 asks which picture starts with a letter, showing the letter big and small', async () => {
  const { speaker, user } = await renderApp(englishUnlockedStore());
  await startLevel(user, 4, 'English');

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const asked = /^Which one starts with (.+)\?$/.exec(
      speaker.lastSpoken!.text,
    );
    expect(asked).not.toBeNull();
    expect(speaker.lastSpoken?.language).toBe('en');
    const letter = letterNamed(asked![1]!);
    expect(promptGlyphs()).toEqual([letter, letter.toLowerCase()]);
    const tiles = optionTiles();
    expect(tiles).toHaveLength(4);
    for (const node of tiles)
      expect(tileGlyph(node)).toMatch(/\p{Emoji_Presentation}|\uFE0F/u);
    const starters = tiles.filter((node) =>
      String(node.props['accessibilityLabel']).startsWith(letter.toLowerCase()),
    );
    expect(starters).toHaveLength(1);
    await user.press(starters[0]!);
  }

  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('English level 1 offers capital look-alikes first: C G O Q, and E F', async () => {
  const { speaker, user } = await renderApp(
    undefined,
    new SeededRandom(ENGLISH_SEED),
  );
  await startLevel(user, 1, 'English');
  let lookAlikes = 0;

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const name = /^Tap the letter (.+)$/.exec(speaker.lastSpoken!.text)![1]!;
    const letter = letterNamed(name);
    const group = ['CGOQ', 'EF'].find((g) => g.includes(letter));
    if (group) {
      lookAlikes++;
      const others = optionTiles()
        .map(tileGlyph)
        .filter((glyph) => glyph !== letter);
      const fromGroup = others.filter((glyph) => group.includes(glyph));
      expect(fromGroup).toHaveLength(Math.min(2, group.length - 1));
    }
    await user.press(screen.getByRole('button', { name }));
  }

  expect(lookAlikes).toBeGreaterThan(0);
});

test('English level 2 asks for small letters by name, offering look-alikes first: b d p q, and m n w', async () => {
  const { speaker, user } = await renderApp(
    englishUnlockedStore(),
    new SeededRandom(ENGLISH_SEED),
  );
  await startLevel(user, 2, 'English');
  let lookAlikes = 0;

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const name = /^Tap the letter (.+)$/.exec(speaker.lastSpoken!.text)![1]!;
    const letter = letterNamed(name).toLowerCase();
    const tiles = optionTiles();
    expect(tiles).toHaveLength(4);
    for (const node of tiles) {
      const glyph = tileGlyph(node);
      expect(glyph).toMatch(/^[a-z]$/);
      expect(node.props['accessibilityLabel']).toBe(
        LETTER_NAMES[glyph.toUpperCase()],
      );
    }
    const group = ['bdpq', 'mnw'].find((g) => g.includes(letter));
    if (group) {
      lookAlikes++;
      expect(tiles.map(tileGlyph)).toEqual(expect.arrayContaining([...group]));
    }
    await user.press(screen.getByRole('button', { name }));
  }

  expect(lookAlikes).toBeGreaterThan(0);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('English level 3 shows a capital letter and asks for its small letter among 4', async () => {
  const { speaker, user } = await renderApp(englishUnlockedStore());
  await startLevel(user, 3, 'English');

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const [capital] = promptGlyphs();
    const name = LETTER_NAMES[capital!];
    expect(speaker.lastSpoken).toEqual({
      text: `Find small ${name} for big ${name}`,
      language: 'en',
    });
    const tiles = optionTiles();
    expect(tiles).toHaveLength(4);
    for (const node of tiles) expect(tileGlyph(node)).toMatch(/^[a-z]$/);
    await user.press(
      tiles.find((node) => tileGlyph(node) === capital!.toLowerCase())!,
    );
  }

  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('3 stars in English level 1 opens English level 2 only, and shows on the English tile', async () => {
  const { speaker, backButton, user } = await renderApp();
  await startLevel(user, 1, 'English');
  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const name = /^Tap the letter (.+)$/.exec(speaker.lastSpoken!.text)![1]!;
    await user.press(screen.getByRole('button', { name }));
  }
  await screen.findByRole('image', { name: '3 of 3 stars' });

  backButton.press();

  expect(
    await screen.findByRole('button', { name: 'Level 1, 3 of 3 stars' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Level 2, 0 of 3 stars' }),
  ).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Level 3, locked' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Level 4, locked' })).toBeTruthy();

  backButton.press();

  expect(
    await screen.findByRole('button', { name: 'English, 3 of 3 stars' }),
  ).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Numbers, 0 of 3 stars' }),
  ).toBeTruthy();
});

test('Concepts lists four levels and level 1 asks for ten colours, each tile a drawn swatch', async () => {
  const { speaker, user } = await renderApp();
  expect(
    screen.getByRole('button', { name: 'Concepts, 0 of 3 stars' }),
  ).toBeTruthy();
  await user.press(screen.getByRole('button', { name: /^Concepts, / }));
  for (const level of [2, 3, 4]) {
    expect(
      await screen.findByRole('button', { name: `Level ${level}, locked` }),
    ).toBeTruthy();
  }
  await user.press(screen.getByRole('button', { name: /^Level 1, \d/ }));
  const asked = new Set<string>();

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const colour = /^Tap (\w+)$/.exec(speaker.lastSpoken!.text)![1]!;
    expect(speaker.lastSpoken?.language).toBe('en');
    asked.add(colour);
    const tiles = optionTiles();
    expect(tiles).toHaveLength(3);
    for (const node of tiles) {
      expect(COLOURS).toContain(node.props['accessibilityLabel']);
      expect(within(node).getByTestId('swatch')).toBeTruthy();
      expect(within(node).queryAllByText(/.+/u)).toHaveLength(0);
    }
    await user.press(screen.getByRole('button', { name: colour }));
  }

  expect([...asked].sort()).toEqual([...COLOURS].sort());
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('a colour missed twice is shown and named', async () => {
  const { speaker, user } = await renderApp();
  await startLevel(user, 1, 'Concepts');
  await screen.findByText('1 / 10');
  const colour = /^Tap (\w+)$/.exec(speaker.lastSpoken!.text)![1]!;
  const [first, second] = optionTiles().filter(
    (node) => node.props['accessibilityLabel'] !== colour,
  );

  await user.press(first!);
  await user.press(second!);

  expect(speaker.spoken).toContainEqual({
    text: `This is ${colour}.`,
    language: 'en',
  });
});

const COLOURS = [
  'red',
  'blue',
  'yellow',
  'green',
  'orange',
  'purple',
  'pink',
  'black',
  'white',
  'brown',
];

test('Concepts level 2 asks for shapes among 4 drawn shapes', async () => {
  const { speaker, user } = await renderApp(conceptsUnlockedStore());
  await startLevel(user, 2, 'Concepts');
  const asked = new Set<string>();

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const shape = /^Tap the (\w+)$/.exec(speaker.lastSpoken!.text)![1]!;
    asked.add(shape);
    const tiles = optionTiles();
    expect(tiles).toHaveLength(4);
    for (const node of tiles) {
      expect(SHAPES).toContain(node.props['accessibilityLabel']);
      expect(within(node).getByTestId('shape')).toBeTruthy();
    }
    await user.press(screen.getByRole('button', { name: shape }));
  }

  expect([...asked].sort()).toEqual([...SHAPES].sort());
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('a shape missed twice is shown and named', async () => {
  const { speaker, user } = await renderApp(conceptsUnlockedStore());
  await startLevel(user, 2, 'Concepts');
  await screen.findByText('1 / 10');
  const shape = /^Tap the (\w+)$/.exec(speaker.lastSpoken!.text)![1]!;
  const [first, second] = optionTiles().filter(
    (node) => node.props['accessibilityLabel'] !== shape,
  );

  await user.press(first!);
  await user.press(second!);

  expect(speaker.spoken).toContainEqual({
    text: `This is a ${shape}.`,
    language: 'en',
  });
});

const SHAPES = ['circle', 'square', 'triangle', 'rectangle', 'star'];

test('Concepts level 3 asks for the big, small, tall or short one, drawn beside its opposite', async () => {
  const { speaker, user } = await renderApp(conceptsUnlockedStore());
  await startLevel(user, 3, 'Concepts');
  const opposite: Record<string, string> = {
    big: 'small',
    small: 'big',
    tall: 'short',
    short: 'tall',
  };
  const asked = new Set<string>();

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const [, size, thing] = /^Tap the (big|small|tall|short) (.+)$/.exec(
      speaker.lastSpoken!.text,
    )!;
    asked.add(size!);
    expect(optionTiles()).toHaveLength(4);
    const answer = screen.getByRole('button', { name: `${size} ${thing}` });
    const pair = screen.getByRole('button', {
      name: `${opposite[size!]} ${thing}`,
    });
    expect(tileGlyph(answer)).toBe(tileGlyph(pair));
    const larger = size === 'big' || size === 'tall';
    expect(drawnHeight(answer) > drawnHeight(pair)).toBe(larger);
    if (size === 'big' || size === 'small') {
      expect(drawnWidth(answer) > drawnWidth(pair)).toBe(larger);
    } else {
      expect(drawnWidth(answer)).toBe(drawnWidth(pair));
    }
    await user.press(answer);
  }

  expect(asked.size).toBeGreaterThan(1);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('Concepts level 4 asks for one thing on, under, in or out of another, among 4 pictures of the two', async () => {
  const { speaker, user } = await renderApp(conceptsUnlockedStore());
  await startLevel(user, 4, 'Concepts');
  const places = ['on', 'under', 'in', 'out of'];

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const [, subject, place, thing] =
      /^Tap the (\w+) (on|under|in|out of) the (\w+)$/.exec(
        speaker.lastSpoken!.text,
      )!;
    expect(
      optionTiles()
        .map((node) => node.props['accessibilityLabel'])
        .sort(),
    ).toEqual(places.map((p) => `${subject} ${p} the ${thing}`).sort());
    const on = sceneGlyphs(`${subject} on the ${thing}`);
    const under = sceneGlyphs(`${subject} under the ${thing}`);
    expect(on).toHaveLength(2);
    expect(under).toEqual([...on].reverse());
    await user.press(
      screen.getByRole('button', { name: `${subject} ${place} the ${thing}` }),
    );
  }

  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('General awareness lists three levels and level 1 asks about fruits and vegetables, among 3 emoji tiles', async () => {
  const { speaker, user } = await renderApp(
    undefined,
    new SeededRandom(AWARENESS_SEED),
  );
  expect(
    screen.getByRole('button', { name: 'General awareness, 0 of 3 stars' }),
  ).toBeTruthy();
  await user.press(
    screen.getByRole('button', { name: /^General awareness, / }),
  );
  for (const level of [2, 3]) {
    expect(
      await screen.findByRole('button', { name: `Level ${level}, locked` }),
    ).toBeTruthy();
  }
  await user.press(screen.getByRole('button', { name: /^Level 1, \d/ }));
  const asked = new Set<string>();
  let lookAlikes = 0;

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const text = speaker.lastSpoken!.text;
    expect(speaker.lastSpoken?.language).toBe('en');
    asked.add(
      text.startsWith('Tap the ')
        ? 'name'
        : text.includes(' not ')
          ? 'odd'
          : 'category',
    );
    const tiles = optionTiles();
    expect(tiles).toHaveLength(3);
    for (const node of tiles) {
      expect([...FRUITS, ...VEGETABLES]).toContain(
        node.props['accessibilityLabel'],
      );
      expect(tileGlyph(node)).toMatch(/\p{Emoji_Presentation}|\uFE0F/u);
    }
    const name = /^Tap the (.+)$/.exec(text)?.[1];
    if (name && RED_ROUND.includes(name)) {
      lookAlikes++;
      expect(
        tiles.map((node) => node.props['accessibilityLabel']).sort(),
      ).toEqual([...RED_ROUND].sort());
    }
    await user.press(awarenessAnswer(text));
  }

  expect([...asked].sort()).toEqual(['category', 'name', 'odd']);
  expect(lookAlikes).toBeGreaterThan(0);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('General awareness level 2 asks which animal or bird makes a sound, among 4 animals and birds', async () => {
  const { speaker, user } = await renderApp(
    awarenessUnlockedStore(),
    new SeededRandom(AWARENESS_SEED),
  );
  await startLevel(user, 2, 'General awareness');
  let sounds = 0;
  let birds = 0;

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const text = speaker.lastSpoken!.text;
    const tiles = optionTiles();
    expect(tiles).toHaveLength(4);
    for (const node of tiles) {
      expect([...ANIMALS, ...BIRDS]).toContain(
        node.props['accessibilityLabel'],
      );
    }
    const sound = /^Which (animal|bird) says (.+)\?$/.exec(text);
    if (sound) {
      sounds++;
      const maker = SOUNDS[sound[2]!]!;
      expect(sound[1] === 'bird').toBe(BIRDS.includes(maker));
      await user.press(screen.getByRole('button', { name: maker }));
      continue;
    }
    if (text === 'Which one is a bird?') birds++;
    await user.press(awarenessAnswer(text));
  }

  expect(sounds).toBeGreaterThan(0);
  expect(birds).toBeGreaterThan(0);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('General awareness level 3 asks for body parts among body parts, and for vehicles and family members', async () => {
  const { speaker, user } = await renderApp(
    awarenessUnlockedStore(),
    new SeededRandom(AWARENESS_SEED),
  );
  await startLevel(user, 3, 'General awareness');
  const asked = new Set<string>();

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const text = speaker.lastSpoken!.text;
    const labels = optionTiles().map((node) =>
      String(node.props['accessibilityLabel']),
    );
    expect(labels).toHaveLength(4);
    const name = /^Tap the (.+)$/.exec(text)?.[1];
    const list = [BODY_PARTS, VEHICLES, FAMILY].find((l) =>
      l.includes(name ?? labels[0]!),
    )!;
    for (const label of labels) expect(list).toContain(label);
    if (name && BODY_PARTS.includes(name)) asked.add('body part');
    if (name && FAMILY.includes(name)) asked.add('family');
    if (!name) asked.add('vehicle kind');
    await user.press(awarenessAnswer(text));
  }

  expect([...asked].sort()).toEqual(['body part', 'family', 'vehicle kind']);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('Reasoning lists three levels and level 1 asks which one goes with a pictured thing, among 3 tiles', async () => {
  const { speaker, user } = await renderApp(
    undefined,
    new SeededRandom(REASONING_SEED),
  );
  expect(
    screen.getByRole('button', { name: 'Reasoning, 0 of 3 stars' }),
  ).toBeTruthy();
  await user.press(screen.getByRole('button', { name: /^Reasoning, / }));
  for (const level of [2, 3]) {
    expect(
      await screen.findByRole('button', { name: `Level ${level}, locked` }),
    ).toBeTruthy();
  }
  await user.press(screen.getByRole('button', { name: /^Level 1, \d/ }));
  const asked = new Set<string>();

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    expect(speaker.lastSpoken?.language).toBe('en');
    const thing = /^Which one goes with the (.+)\?$/.exec(
      speaker.lastSpoken!.text,
    )![1]!;
    expect(promptGlyphs()).toEqual([PAIRS[thing]![0]]);
    expect(optionTiles()).toHaveLength(3);
    asked.add(thing);
    await user.press(screen.getByRole('button', { name: PAIRS[thing]![1] }));
  }

  expect(asked.size).toBe(10);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('Reasoning level 2 asks which one is different, among 3 of one kind and 1 of another', async () => {
  const { speaker, user } = await renderApp(
    reasoningUnlockedStore(),
    new SeededRandom(REASONING_SEED),
  );
  await startLevel(user, 2, 'Reasoning');
  const odd = new Set<string>();

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    expect(speaker.lastSpoken?.text).toBe('Which one is different?');
    const tiles = optionTiles();
    expect(tiles).toHaveLength(4);
    const kinds = tiles.map((node) =>
      KINDS.findIndex((kind) =>
        kind.includes(String(node.props['accessibilityLabel'])),
      ),
    );
    const different = tiles.filter(
      (_, i) => kinds.filter((kind) => kind === kinds[i]).length === 1,
    );
    expect(different).toHaveLength(1);
    expect(new Set(kinds).size).toBe(2);
    odd.add(String(different[0]!.props['accessibilityLabel']));
    await user.press(different[0]!);
  }

  expect(odd.size).toBe(10);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('Reasoning level 3 asks what comes next in a pattern of things or colours, among 4 tiles', async () => {
  const { speaker, user } = await renderApp(
    reasoningUnlockedStore(),
    new SeededRandom(REASONING_SEED),
  );
  await startLevel(user, 3, 'Reasoning');
  const periods = new Set<number>();
  let colours = 0;

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    expect(speaker.lastSpoken?.text).toBe('What comes next?');
    const glyphs = promptGlyphs();
    expect(glyphs.pop()).toBe('❓');
    const period = [1, 2, 3, 4].find((p) =>
      glyphs.every((g, i) => i < p || g === glyphs[i - p]),
    )!;
    expect(glyphs.length).toBeGreaterThan(period);
    periods.add(period);
    if (glyphs.every((g) => COLOUR_GLYPHS.includes(g))) colours++;
    const next = glyphs[glyphs.length - period];
    const tiles = optionTiles();
    expect(tiles).toHaveLength(4);
    const answers = tiles.filter((node) => tileGlyph(node) === next);
    expect(answers).toHaveLength(1);
    await user.press(answers[0]!);
  }

  expect([...periods].sort()).toEqual([2, 3, 4]);
  expect(colours).toBeGreaterThan(0);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('Hindi lists two levels and level 1 asks in Hindi for ten vowels, among 3 vowel tiles, look-alikes first: उ ऊ, इ ई', async () => {
  const { speaker, user } = await renderApp();
  expect(
    screen.getByRole('button', { name: 'Hindi, 0 of 3 stars' }),
  ).toBeTruthy();
  await user.press(screen.getByRole('button', { name: /^Hindi, / }));
  expect(
    await screen.findByRole('button', { name: 'Level 2, locked' }),
  ).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Level 3, / })).toBeNull();
  await user.press(screen.getByRole('button', { name: /^Level 1, \d/ }));
  const asked = new Set<string>();

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    expect(speaker.lastSpoken?.language).toBe('hi');
    const letter = hindiAsked(speaker);
    expect(HINDI_VOWELS).toContain(letter);
    const tiles = optionTiles();
    expect(tiles).toHaveLength(3);
    for (const node of tiles) {
      expect(HINDI_VOWELS).toContain(tileGlyph(node));
      expect(node.props['accessibilityLabel']).toBe(tileGlyph(node));
    }
    const partner = VOWEL_LOOK_ALIKES[letter];
    if (partner) expect(tiles.map(tileGlyph)).toContain(partner);
    asked.add(letter);
    await user.press(hindiTile(letter));
  }

  expect(asked.size).toBe(10);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('Hindi level 2 asks for consonants among 4, offering look-alikes first: ब व, घ ध, म भ, प ष', async () => {
  const { speaker, user } = await renderApp(
    new InMemoryProgressStore({
      version: 1,
      bestStars: { hindi: { 1: 3 } },
      unlocked: { hindi: [2] },
    }),
    new SeededRandom(HINDI_SEED),
  );
  await startLevel(user, 2, 'Hindi');
  let lookAlikes = 0;

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    expect(speaker.lastSpoken?.language).toBe('hi');
    const letter = hindiAsked(speaker);
    expect(HINDI_CONSONANTS).toContain(letter);
    const tiles = optionTiles();
    expect(tiles).toHaveLength(4);
    for (const node of tiles)
      expect(HINDI_CONSONANTS).toContain(tileGlyph(node));
    const partner = ['बव', 'घध', 'मभ', 'पष']
      .find((pair) => pair.includes(letter))
      ?.replace(letter, '');
    if (partner) {
      lookAlikes++;
      expect(tiles.map(tileGlyph)).toContain(partner);
    }
    await user.press(hindiTile(letter));
  }

  expect(lookAlikes).toBeGreaterThan(0);
  expect(
    await screen.findByRole('image', { name: '3 of 3 stars' }),
  ).toBeTruthy();
});

test('Hindi letters that sound alike are asked for by the word children learn them with', async () => {
  const { speaker, user } = await renderApp(
    new InMemoryProgressStore({
      version: 1,
      bestStars: { hindi: { 1: 3 } },
      unlocked: { hindi: [2] },
    }),
    new SeededRandom(HINDI_SEED),
  );
  await startLevel(user, 2, 'Hindi');
  const named = new Set<string>();

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    for (const node of optionTiles()) {
      const glyph = tileGlyph(node);
      expect(node.props['accessibilityLabel']).toBe(SIBILANTS[glyph] ?? glyph);
      if (SIBILANTS[glyph]) named.add(glyph);
    }
    await user.press(hindiTile(hindiAsked(speaker)));
  }

  expect(named.size).toBeGreaterThan(0);
});

test('in Hindi, "Try again", the shown answer and praise are all spoken in Hindi', async () => {
  const random = new SteeredRandom(HINDI_SEED);
  const { speaker, user } = await renderApp(undefined, random);
  await startLevel(user, 1, 'Hindi');
  await screen.findByText('1 / 10');
  const first = hindiAsked(speaker);
  const [miss, secondMiss] = optionTiles().filter(
    (node) => tileGlyph(node) !== first,
  );

  await user.press(miss!);
  expect(speaker.lastSpoken).toEqual({
    text: 'फिर से कोशिश करो!',
    language: 'hi',
  });
  await user.press(secondMiss!);
  expect(speaker.lastSpoken).toEqual({
    text: `यह ${first} है।`,
    language: 'hi',
  });

  await screen.findByText('2 / 10');
  random.queue(0);
  await user.press(hindiTile(hindiAsked(speaker)));
  expect(speaker.spoken).toContainEqual({ text: 'शाबाश!', language: 'hi' });

  await screen.findByText('3 / 10');
  random.queue(0.99);
  await user.press(hindiTile(hindiAsked(speaker)));
  expect(speaker.spoken).toContainEqual({ text: 'वाह!', language: 'hi' });
});

/** श, ष and स sound the same; each is named after its picture word. */
const SIBILANTS: Record<string, string> = {
  श: 'शलगम वाला श',
  ष: 'षट्कोण वाला ष',
  स: 'सपेरे वाला स',
};

/** A seed whose Hindi level 2 round asks for a letter with a look-alike, and shows a sibilant. */
const HINDI_SEED = 1;

const HINDI_CONSONANTS = [
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

const HINDI_VOWELS = [
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

/** Each look-alike vowel, and the one it is mixed up with. */
const VOWEL_LOOK_ALIKES: Record<string, string> = {
  उ: 'ऊ',
  ऊ: 'उ',
  इ: 'ई',
  ई: 'इ',
};

/** The letter the last "... पर टैप करो" asked for: its name ends with the letter itself. */
function hindiAsked(speaker: RecordingSpeaker): string {
  const text = speaker.spoken.findLast((u) =>
    / पर टैप करो$/.test(u.text),
  )!.text;
  return text
    .replace(/ पर टैप करो$/, '')
    .split(' ')
    .at(-1)!;
}

function hindiTile(letter: string) {
  const found = optionTiles().filter((node) => tileGlyph(node) === letter);
  expect(found).toHaveLength(1);
  return found[0]!;
}

/** Coloured circles and squares, as a colour pattern draws them. */
const COLOUR_GLYPHS = [...'🔴🟠🟡🟢🔵🟣🟤⚫⚪🟥🟧🟨🟩🟦🟪🟫⬛⬜'];

/** Each pictured thing, and the thing that goes with it. */
const PAIRS: Record<string, readonly [string, string]> = {
  sock: ['🧦', 'shoe'],
  toothbrush: ['🪥', 'tooth'],
  cup: ['☕', 'teapot'],
  lock: ['🔒', 'key'],
  pen: ['🖊️', 'paper'],
  needle: ['🪡', 'thread'],
  bread: ['🍞', 'butter'],
  'rain cloud': ['🌧️', 'umbrella'],
  bee: ['🐝', 'honey'],
  cow: ['🐄', 'milk'],
  hen: ['🐔', 'egg'],
  dog: ['🐶', 'bone'],
  monkey: ['🐒', 'banana'],
  hand: ['✋', 'glove'],
  ball: ['⚽', 'goal'],
};

/** A seed whose Reasoning rounds ask every kind of pattern. */
const REASONING_SEED = 1;

/** Reasoning levels 2 and 3 opened, as after two 3-star rounds. */
function reasoningUnlockedStore() {
  return new InMemoryProgressStore({
    version: 1,
    bestStars: { reasoning: { 1: 3, 2: 3 } },
    unlocked: { reasoning: [2, 3] },
  });
}

const FRUITS = [
  'apple',
  'banana',
  'mango',
  'orange',
  'watermelon',
  'strawberry',
  'pineapple',
  'cherry',
  'pear',
  'coconut',
];
const VEGETABLES = [
  'tomato',
  'carrot',
  'potato',
  'onion',
  'brinjal',
  'corn',
  'cucumber',
  'broccoli',
  'garlic',
  'chilli',
];
/** 🍎 🍅 🍒, offered together. */
const RED_ROUND = ['apple', 'tomato', 'cherry'];
const ANIMALS = [
  'cow',
  'dog',
  'cat',
  'lion',
  'tiger',
  'leopard',
  'sheep',
  'horse',
  'pig',
  'goat',
  'elephant',
  'monkey',
  'frog',
  'snake',
  'giraffe',
  'zebra',
  'rabbit',
  'camel',
];
const BIRDS = [
  'parrot',
  'peacock',
  'duck',
  'owl',
  'eagle',
  'hen',
  'rooster',
  'penguin',
  'flamingo',
  'swan',
];
/** Who makes each sound. */
const SOUNDS: Record<string, string> = {
  moo: 'cow',
  woof: 'dog',
  meow: 'cat',
  roar: 'lion',
  baa: 'sheep',
  neigh: 'horse',
  oink: 'pig',
  maa: 'goat',
  croak: 'frog',
  hiss: 'snake',
  quack: 'duck',
  hoot: 'owl',
  cluck: 'hen',
  'cock-a-doodle-doo': 'rooster',
};
const BODY_PARTS = [
  'nose',
  'ear',
  'eye',
  'mouth',
  'tongue',
  'tooth',
  'hand',
  'foot',
  'leg',
];
const SKY = ['aeroplane', 'helicopter', 'rocket'];
const WATER = ['boat', 'ship', 'speedboat', 'canoe'];
const ROAD = [
  'car',
  'bus',
  'trolley bus',
  'van',
  'bicycle',
  'auto rickshaw',
  'truck',
  'scooter',
  'tractor',
];
const VEHICLES = [...ROAD, ...SKY, ...WATER];
const FAMILY = [
  'grandmother',
  'grandfather',
  'mother',
  'father',
  'sister',
  'brother',
  'baby',
];

/** Kinds of thing a child tells apart: a fruit is not different from a vegetable, nor a bird from an animal. */
const KINDS = [
  [...FRUITS, ...VEGETABLES],
  [...ANIMALS, ...BIRDS],
  BODY_PARTS,
  VEHICLES,
  FAMILY,
];

/** What each "Which one ...?" picks out. */
const CATEGORIES: Record<string, readonly string[]> = {
  'is a fruit': FRUITS,
  'is a vegetable': VEGETABLES,
  'is a bird': BIRDS,
  'flies in the sky': SKY,
  'goes on water': WATER,
  'goes on the road': ROAD,
};

/** The tile a child who knew the answer would tap, checking it is the only one that fits. */
function awarenessAnswer(text: string) {
  const name = /^Tap the (.+)$/.exec(text)?.[1];
  if (name) return screen.getByRole('button', { name });
  const category = /^Which one (.+)\?$/.exec(text)![1]!;
  const negated = category.startsWith('is not ');
  const members = CATEGORIES[category.replace('is not ', 'is ')]!;
  const fits = optionTiles().filter(
    (node) =>
      members.includes(String(node.props['accessibilityLabel'])) !== negated,
  );
  expect(fits).toHaveLength(1);
  return fits[0]!;
}

/** A seed whose General awareness rounds ask every kind of question, including one with look-alikes. */
const AWARENESS_SEED = 15;

/** General awareness levels 2 and 3 opened, as after two 3-star rounds. */
function awarenessUnlockedStore() {
  return new InMemoryProgressStore({
    version: 1,
    bestStars: { awareness: { 1: 3, 2: 3 } },
    unlocked: { awareness: [2, 3] },
  });
}

/** The glyphs of a picture tile, top to bottom. */
function sceneGlyphs(name: string) {
  const tile = screen.getByRole('button', { name });
  return within(within(tile).getByTestId('scene'))
    .getAllByText(/.+/u)
    .map((node) => node.children.map((raw) => raw.props['text']).join(''));
}

/** A tile's glyph, as tall as its font scaled by any vertical stretch. */
function drawnHeight(tile: ReturnType<typeof optionTiles>[number]) {
  const text = within(tile).getAllByText(/.+/u)[0]!;
  const transform = (text.props['transform'] ?? []) as { scaleY?: number }[];
  const stretch = transform.find((t) => t.scaleY !== undefined)?.scaleY ?? 1;
  return Number(text.props['fontSize']) * stretch;
}

function drawnWidth(tile: ReturnType<typeof optionTiles>[number]) {
  return Number(within(tile).getAllByText(/.+/u)[0]!.props['fontSize']);
}

/** Concepts levels 2 to 4 opened, as after three 3-star rounds. */
function conceptsUnlockedStore() {
  return new InMemoryProgressStore({
    version: 1,
    bestStars: { concepts: { 1: 3, 2: 3, 3: 3 } },
    unlocked: { concepts: [2, 3, 4] },
  });
}

/** A seed whose English level 1 and 2 rounds each ask for a letter with look-alikes. */
const ENGLISH_SEED = 1;

/** English levels 2 to 4 opened, as after three 3-star rounds. */
function englishUnlockedStore() {
  return new InMemoryProgressStore({
    version: 1,
    bestStars: { english: { 1: 3, 2: 3, 3: 3 } },
    unlocked: { english: [2, 3, 4] },
  });
}

function letterNamed(name: string): string {
  return Object.keys(LETTER_NAMES).find((l) => LETTER_NAMES[l] === name)!;
}
const LETTER_NAMES: Record<string, string> = {
  A: 'ay',
  B: 'bee',
  C: 'see',
  D: 'dee',
  E: 'ee',
  F: 'ef',
  G: 'jee',
  H: 'aitch',
  I: 'eye',
  J: 'jay',
  K: 'kay',
  L: 'el',
  M: 'em',
  N: 'en',
  O: 'oh',
  P: 'pee',
  Q: 'cue',
  R: 'are',
  S: 'ess',
  T: 'tee',
  U: 'you',
  V: 'vee',
  W: 'double you',
  X: 'ex',
  Y: 'why',
  Z: 'zed',
};

/** The answer tiles of the question on screen: not the replay button, nor the Home and level buttons below in the stack. */
function optionTiles() {
  return screen.queryAllByRole('button').filter((node) => {
    const label = String(node.props['accessibilityLabel'] ?? '');
    return label !== 'Hear again' && label !== 'Parent' && !label.includes(',');
  });
}

function tileGlyph(node: ReturnType<typeof optionTiles>[number]) {
  return within(node)
    .getAllByText(/.+/u)[0]!
    .children.map((raw) => raw.props['text'])
    .join('');
}

/** From Home, through the Numbers levels, into level 1. */
async function startLevel1(user: User) {
  await startLevel(user, 1);
}

async function startLevel(user: User, level: number, area = 'Numbers') {
  await user.press(
    screen.getByRole('button', { name: new RegExp(`^${area}, `) }),
  );
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

/** Plays a whole round, missing the given numbers on the first try and putting them right on the second. */
async function playRoundMissing(
  user: User,
  speaker: RecordingSpeaker,
  missed: readonly number[],
) {
  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const answer = solve(speaker);
    if (missed.includes(answer)) await user.press(wrongTiles(answer)[0]!);
    await user.press(tile(answer));
  }
  await screen.findByRole('image', { name: /of 3 stars$/ });
}

/** Plays a whole round right first time and returns the numbers asked for. */
async function playRoundAsked(user: User, speaker: RecordingSpeaker) {
  const asked: number[] = [];
  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    asked.push(solve(speaker));
    await user.press(tile(asked.at(-1)!));
  }
  await screen.findByRole('image', { name: /of 3 stars$/ });
  return asked;
}

/** From the Numbers levels, after the back button left Results, into level 1 again. */
async function replayLevel1(user: User) {
  await user.press(await screen.findByRole('button', { name: /^Level 1, \d/ }));
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
