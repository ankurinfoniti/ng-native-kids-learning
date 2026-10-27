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
import { ROUND_LENGTH, starsFor } from '../content/question.ts';
import { Speaker } from '../speaker.ts';

@Component({
  selector: 'app-results',
  imports: [SafeAreaView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen">
      <view
        class="stars"
        role="image"
        [accessibilityLabel]="stars() + ' of 3 stars'"
      >
        @for (slot of [1, 2, 3]; track slot) {
          <text class="star" [class.empty]="slot > stars()">⭐</text>
        }
      </view>
      <text class="score">{{ score() }} / {{ total }}</text>
      @if (stars() === 0) {
        <text class="encourage">Let's practise again!</text>
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
    .stars {
      flex-direction: row;
      gap: 12px;
    }
    .star {
      font-size: 72px;
    }
    .empty {
      opacity: 0.2;
    }
    .score {
      font-size: 48px;
      font-weight: 800;
      color: #3a2c5a;
    }
    .encourage {
      font-size: 28px;
      font-weight: 700;
      color: #8a5a00;
      text-align: center;
    }
  `,
})
export class Results {
  readonly score = input.required<number, unknown>({
    transform: numberAttribute,
  });

  private readonly speaker = inject(Speaker);
  protected readonly total = ROUND_LENGTH;
  protected readonly stars = computed(() => starsFor(this.score()));

  constructor() {
    effect(() => {
      const score = this.score();
      const line = `You got ${score} out of ${ROUND_LENGTH}!`;
      untracked(() =>
        this.speaker.speak(
          this.stars() === 0 ? `${line} Let's practise again!` : line,
          'en',
        ),
      );
    });
    inject(DestroyRef).onDestroy(() => this.speaker.stop());
  }
}
