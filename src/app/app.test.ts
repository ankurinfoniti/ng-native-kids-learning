import { HardwareBack, type HardwareBackSource } from '@ng-native/device';
import { render, screen, userEvent, waitFor, within } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { App } from './app.ts';
import { provideApp } from './app.config.ts';
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

/** Android's back button, pressed by the test. The latest listener is asked first, as on a device. */
class FakeBackButton implements HardwareBackSource {
  private listeners: (() => boolean)[] = [];

  subscribe(listener: () => boolean): () => void {
    this.listeners.push(listener);
    return () => (this.listeners = this.listeners.filter((l) => l !== listener));
  }

  press(): void {
    [...this.listeners].reverse().some((listener) => listener());
  }
}

async function renderApp() {
  const speaker = new RecordingSpeaker();
  const backButton = new FakeBackButton();
  await render(App, {
    providers: [
      provideApp(),
      { provide: Speaker, useValue: speaker },
      { provide: Random, useValue: new SequenceRandom([0.42, 0.07, 0.91, 0.66, 0.23, 0.58]) },
      { provide: ADVANCE_DELAY_MS, useValue: 0 },
      { provide: HardwareBack.SOURCE, useValue: backButton },
    ],
  });
  return { speaker, backButton, user: userEvent.setup() };
}

const INSTRUCTION =
  /^(Tap the number (10|[1-9])|How many \w+\?|What comes (after|before) (10|[1-9])\?)$/;

test('the home screen opens a Numbers round that speaks its first question', async () => {
  const { speaker, user } = await renderApp();

  expect(screen.getByText('Bal Vatika Prep')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: 'Numbers' }));

  await screen.findByText('1 / 10');
  expect(speaker.lastSpoken?.language).toBe('en');
  expect(speaker.lastSpoken?.text).toMatch(INSTRUCTION);
  expect(answerTiles()).toHaveLength(3);
});

test('ten first-try answers end on Results with 3 stars and the spoken score', async () => {
  const { speaker, user } = await renderApp();
  await user.press(screen.getByRole('button', { name: 'Numbers' }));

  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const labels = answerTiles().map((node) => node.props['accessibilityLabel']);
    expect(new Set(labels).size).toBe(3);
    await user.press(tile(solve(speaker)));
  }

  expect(await screen.findByRole('image', { name: '3 of 3 stars' })).toBeTruthy();
  expect(speaker.lastSpoken).toEqual({ text: 'You got 10 out of 10!', language: 'en' });
});

test('a wrong first tap greys that tile and says "Try again!"; a right second tap scores nothing', async () => {
  const { speaker, user } = await renderApp();
  await user.press(screen.getByRole('button', { name: 'Numbers' }));
  await screen.findByText('1 / 10');
  const answer = solve(speaker);
  const wrong = wrongTiles(answer)[0]!;

  await user.press(wrong);

  expect(speaker.lastSpoken).toEqual({ text: 'Try again!', language: 'en' });
  expect(
    screen.getByRole('button', { name: String(wrong.props['accessibilityLabel']), disabled: true }),
  ).toBeTruthy();
  expect(screen.getByText('1 / 10')).toBeTruthy();

  await user.press(tile(answer));
  await screen.findByText('2 / 10');
  await finishCorrectly(user, speaker, 2);

  expect(await screen.findByRole('image', { name: '3 of 3 stars' })).toBeTruthy();
  expect(speaker.lastSpoken?.text).toBe('You got 9 out of 10!');
});

test('a second wrong tap speaks the right answer, then moves on', async () => {
  const { speaker, user } = await renderApp();
  await user.press(screen.getByRole('button', { name: 'Numbers' }));
  await screen.findByText('1 / 10');
  const answer = solve(speaker);
  const [first, second] = wrongTiles(answer);

  await user.press(first!);
  await user.press(second!);

  expect(speaker.spoken).toContainEqual({ text: `The answer is ${answer}.`, language: 'en' });
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
  await playRound(user, speaker, score);

  expect(await screen.findByRole('image', { name: `${stars} of 3 stars` })).toBeTruthy();
  expect(speaker.lastSpoken?.text).toBe(`You got ${score} out of 10!`);
  expect(screen.queryByText("Let's practise again!")).toBeNull();
});

test('fewer than 5 first-try answers earn no stars and an invitation to practise again', async () => {
  const { speaker, user } = await renderApp();
  await playRound(user, speaker, 4);

  expect(await screen.findByRole('image', { name: '0 of 3 stars' })).toBeTruthy();
  expect(screen.getByText("Let's practise again!")).toBeTruthy();
  expect(speaker.lastSpoken?.text).toBe("You got 4 out of 10! Let's practise again!");
});

type User = ReturnType<typeof userEvent.setup>;

test('the speaker button says the question again', async () => {
  const { speaker, user } = await renderApp();
  await user.press(screen.getByRole('button', { name: 'Numbers' }));
  await screen.findByText('1 / 10');
  const question = speaker.lastSpoken!;

  await user.press(screen.getByRole('button', { name: 'Hear again' }));

  expect(speaker.spoken).toEqual([question, question]);
});

test('the back button leaves a round for Home and stops the voice', async () => {
  const { speaker, backButton, user } = await renderApp();
  await user.press(screen.getByRole('button', { name: 'Numbers' }));
  await screen.findByText('1 / 10');

  backButton.press();

  await waitFor(() => expect(screen.queryByText('1 / 10')).toBeNull());
  expect(screen.getByRole('button', { name: 'Numbers' })).toBeTruthy();
  expect(speaker.log.at(-1)).toBe('stop');
});

test('the back button leaves Results for Home', async () => {
  const { speaker, backButton, user } = await renderApp();
  await playRound(user, speaker, 10);
  await screen.findByRole('image', { name: '3 of 3 stars' });

  backButton.press();

  await waitFor(() => expect(screen.queryByRole('image', { name: /of 3 stars$/ })).toBeNull());
  expect(screen.queryByText(/ \/ 10$/)).toBeNull();
  expect(screen.getByRole('button', { name: 'Numbers' })).toBeTruthy();
  expect(speaker.log.at(-1)).toBe('stop');
});

/** Plays a whole round: the first misses are put right on the second try, the rest are right first time. */
async function playRound(user: User, speaker: RecordingSpeaker, firstTryCorrect: number) {
  await user.press(screen.getByRole('button', { name: 'Numbers' }));
  for (let n = 1; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    const answer = solve(speaker);
    if (n <= 10 - firstTryCorrect) await user.press(wrongTiles(answer)[0]!);
    await user.press(tile(answer));
  }
}

async function finishCorrectly(user: User, speaker: RecordingSpeaker, from: number) {
  for (let n = from; n <= 10; n++) {
    await screen.findByText(`${n} / 10`);
    await user.press(tile(solve(speaker)));
  }
  await screen.findByRole('image', { name: /of 3 stars$/ });
}

function wrongTiles(answer: number) {
  return answerTiles().filter((node) => node.props['accessibilityLabel'] !== String(answer));
}

function answerTiles() {
  return screen
    .queryAllByRole('button')
    .filter((node) => /^\d+$/.test(String(node.props['accessibilityLabel'] ?? '')));
}

function tile(answer: number) {
  return screen.getByRole('button', { name: String(answer) });
}

/** Works the answer out from the spoken instruction, the way a child who understood it would. */
function solve(speaker: RecordingSpeaker): number {
  const text = speaker.spoken.findLast((u) => INSTRUCTION.test(u.text))!.text;
  const n = Number(/\d+/.exec(text)?.[0]);
  if (text.startsWith('Tap the number')) return n;
  if (text.startsWith('What comes after')) return n + 1;
  if (text.startsWith('What comes before')) return n - 1;
  return within(screen.getByTestId('prompt')).getAllByText(/.+/u).length;
}
