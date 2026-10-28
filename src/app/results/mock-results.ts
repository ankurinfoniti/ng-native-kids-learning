import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  untracked,
} from '@angular/core';
import { SafeAreaView, Text, View } from '@ng-native/components';
import { AREAS } from '../content/areas.ts';
import type { MockResult } from '../progress/progress-store.ts';
import { Progress } from '../progress/progress.ts';
import { Speaker } from '../speaker.ts';

/** A Mock Test's total and its areas' scores, in Home order. */
export function mockScores(result: MockResult) {
  const areas = AREAS.flatMap((area) => {
    const score = result.areas[area.id];
    return score ? [{ ...area, ...score }] : [];
  });
  return {
    total: result.total,
    of: Object.values(result.areas).reduce((sum, score) => sum + score.of, 0),
    areas,
  };
}

@Component({
  selector: 'app-mock-results',
  imports: [SafeAreaView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen">
      @if (scores(); as s) {
        <text class="emoji">📝</text>
        <text class="score">{{ s.total }} / {{ s.of }}</text>
        <view class="areas">
          @for (area of s.areas; track area.id) {
            <view class="area" [style]="{ backgroundColor: area.colour }">
              <text class="area-emoji">{{ area.emoji }}</text>
              <text class="area-score"
                >{{ area.name }}: {{ area.right }} / {{ area.of }}</text
              >
            </view>
          }
        </view>
      }
    </safe-area-view>
  `,
  styles: `
    .screen {
      flex: 1;
      background-color: #fff8e7;
      align-items: center;
      justify-content: center;
      gap: 24px;
      padding: 16px;
    }
    .emoji {
      font-size: 72px;
    }
    .score {
      font-size: 48px;
      font-weight: 800;
      color: #3a2c5a;
    }
    .areas {
      align-self: stretch;
      gap: 8px;
    }
    .area {
      flex-direction: row;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      border-radius: 16px;
    }
    .area-emoji {
      font-size: 28px;
    }
    .area-score {
      font-size: 22px;
      font-weight: 700;
      color: #3a2c5a;
    }
  `,
})
export class MockResults {
  readonly takenAt = input.required<number, unknown>({
    transform: numberAttribute,
  });

  private readonly progress = inject(Progress);
  private readonly speaker = inject(Speaker);

  protected readonly scores = computed(() => {
    const result = this.progress
      .mockTests()
      .find((test) => test.takenAt === this.takenAt());
    return result && mockScores(result);
  });
  // A string, so later saves that leave the result unchanged do not speak it again.
  private readonly line = computed(() => {
    const scores = this.scores();
    return scores && `You got ${scores.total} out of ${scores.of}!`;
  });

  constructor() {
    effect(() => {
      const line = this.line();
      if (line) untracked(() => this.speaker.speak(line, 'en'));
    });
    inject(DestroyRef).onDestroy(() => this.speaker.stop());
  }
}
