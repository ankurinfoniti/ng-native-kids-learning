import { render, screen, userEvent } from '@ng-native/testing';
import { expect, test } from 'vitest';
import { App } from './app.ts';
import { provideApp } from './app.config.ts';
import { NOW } from './clock.ts';
import { ProgressStore, type ProgressDoc } from './progress/progress-store.ts';
import { Random } from './random.ts';
import { ADVANCE_DELAY_MS } from './round/round.ts';
import { Speaker } from './speaker.ts';

class Store implements ProgressStore {
  async load(): Promise<unknown> {
    return null;
  }
  async save(_doc: ProgressDoc): Promise<void> {}
  async clear(): Promise<void> {}
}

test('the default Random draws a number when made by its own constructor', () => {
  // Hot reload points the injectable's factory at the class's, so `new Random()` is what the
  // app is given: an abstract class or a useFactory provider would arrive without next().
  const random = new Random();
  const drawn = random.next();
  expect(drawn).toBeGreaterThanOrEqual(0);
  expect(drawn).toBeLessThan(1);
});

test('a round builds from the app own Random, with no test double', async () => {
  await render(App, {
    providers: [
      provideApp(),
      { provide: Speaker, useValue: { speak: () => {}, stop: () => {} } },
      { provide: ProgressStore, useValue: new Store() },
      { provide: ADVANCE_DELAY_MS, useValue: 0 },
      { provide: NOW, useValue: () => new Date() },
    ],
  });
  const user = userEvent.setup();
  await user.press(screen.getByText('Hindi'));
  await user.press(screen.getByRole('button', { name: /^Level 1, / }));
  expect(screen.getByTestId('prompt')).toBeTruthy();
});
