import {
  Component,
  DestroyRef,
  InjectionToken,
  computed,
  effect,
  inject,
  input,
  numberAttribute,
  signal,
  untracked,
} from '@angular/core';
import { Pressable, SafeAreaView, Text, View } from '@ng-native/components';
import { NativeNavigation } from '@ng-native/router';
import { buildRound } from '../content/rounds.ts';
import { Random } from '../random.ts';
import { Speaker } from '../speaker.ts';

/** How long feedback stays on screen before the next question. */
export const ADVANCE_DELAY_MS = new InjectionToken<number>('ADVANCE_DELAY_MS', {
  factory: () => 1800,
});

@Component({
  selector: 'app-round',
  imports: [Pressable, SafeAreaView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen">
      @let q = question();
      <view class="top">
        <text class="progress">{{ index() + 1 }} / {{ questions().length }}</text>
        <pressable
          accessibilityRole="button"
          accessibilityLabel="Hear again"
          class="replay"
          (press)="speakQuestion()"
        >
          <text class="replay-glyph">🔊</text>
        </pressable>
      </view>

      <view class="prompt" testID="prompt">
        @for (glyph of q.prompt ?? []; track $index) {
          <text class="prompt-glyph">{{ glyph }}</text>
        }
      </view>

      <view class="options">
        @for (option of q.options; track option.id) {
          <pressable
            accessibilityRole="button"
            [accessibilityLabel]="option.name"
            class="tile"
            [class.answer]="resolvedId() === option.id"
            [class.wrong]="wrongIds().includes(option.id)"
            [disabled]="wrongIds().includes(option.id)"
            (press)="choose(option.id)"
          >
            <text class="tile-glyph">{{ option.glyph }}</text>
          </pressable>
        }
      </view>
    </safe-area-view>
  `,
  styles: `
    .screen {
      flex: 1;
      background-color: #fff4e0;
      padding: 16px;
    }
    .top {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    .progress {
      font-size: 20px;
      color: #8a5a00;
      font-weight: 600;
    }
    .replay {
      width: 64px;
      height: 64px;
      border-radius: 32px;
      align-items: center;
      justify-content: center;
      background-color: #ffd28a;
    }
    .replay-glyph {
      font-size: 32px;
    }
    .prompt {
      flex: 1;
      flex-direction: row;
      flex-wrap: wrap;
      align-content: center;
      justify-content: center;
      gap: 8px;
    }
    .prompt-glyph {
      font-size: 48px;
      color: #333333;
      font-weight: 700;
    }
    .options {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 12px;
      padding-bottom: 16px;
    }
    .tile {
      flex-grow: 1;
      flex-basis: 28%;
      min-height: 120px;
      border-radius: 24px;
      align-items: center;
      justify-content: center;
      background-color: #ffffff;
      border-width: 4px;
      border-color: #ffb347;
    }
    .tile-glyph {
      font-size: 56px;
      font-weight: 700;
      color: #333333;
    }
    .answer {
      background-color: #7ed957;
      border-color: #3f9d1f;
    }
    .wrong {
      background-color: #dddddd;
      border-color: #bbbbbb;
      opacity: 0.5;
    }
  `,
})
export class Round {
  readonly area = input.required<string>();
  readonly level = input.required<number, unknown>({ transform: numberAttribute });

  private readonly speaker = inject(Speaker);
  private readonly random = inject(Random);
  private readonly nav = inject(NativeNavigation);
  private readonly advanceDelay = inject(ADVANCE_DELAY_MS);

  protected readonly questions = computed(() => buildRound(this.area(), this.level(), this.random));
  protected readonly index = signal(0);
  protected readonly question = computed(() => this.questions()[this.index()]!);
  /** The tile shown as the answer once the question is settled. */
  protected readonly resolvedId = signal<string | null>(null);
  protected readonly wrongIds = signal<readonly string[]>([]);
  private score = 0;
  private finished = false;
  private advanceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      this.question();
      untracked(() => this.speakQuestion());
    });
    inject(DestroyRef).onDestroy(() => {
      clearTimeout(this.advanceTimer);
      // Finishing hands over to Results, which is already speaking.
      if (!this.finished) this.speaker.stop();
    });
  }

  protected speakQuestion(): void {
    const q = this.question();
    this.speaker.speak(q.instruction, q.language);
  }

  protected choose(optionId: string): void {
    if (this.resolvedId() || this.wrongIds().includes(optionId)) return;
    const q = this.question();
    const firstTry = this.wrongIds().length === 0;
    if (optionId === q.answerId) {
      if (firstTry) this.score++;
      this.resolvedId.set(optionId);
      this.advance();
    } else if (firstTry) {
      this.wrongIds.set([optionId]);
      this.speaker.speak('Try again!', q.language);
    } else {
      this.wrongIds.update((ids) => [...ids, optionId]);
      this.resolvedId.set(q.answerId);
      this.speaker.speak(q.answerLine, q.language);
      this.advance();
    }
  }

  private advance(): void {
    this.advanceTimer = setTimeout(() => {
      if (this.index() + 1 < this.questions().length) {
        this.resolvedId.set(null);
        this.wrongIds.set([]);
        this.index.update((i) => i + 1);
        return;
      }
      this.finished = true;
      this.speaker.stop();
      void this.nav.replace(['/results', this.score]);
    }, this.advanceDelay);
  }
}
