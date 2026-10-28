import {
  Component,
  DestroyRef,
  InjectionToken,
  booleanAttribute,
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
import { NOW } from '../clock.ts';
import { starsFor } from '../content/question.ts';
import { buildMockTest, buildRound } from '../content/rounds.ts';
import { Progress } from '../progress/progress.ts';
import { Random, pick } from '../random.ts';
import { Speaker, type Language } from '../speaker.ts';
import { VisualView } from './visual.ts';

/** How long feedback stays on screen before the next question. */
export const ADVANCE_DELAY_MS = new InjectionToken<number>('ADVANCE_DELAY_MS', {
  factory: () => 1800,
});

const FEEDBACK: Record<
  Language,
  { readonly praise: readonly string[]; readonly tryAgain: string }
> = {
  en: {
    praise: ['Well done!', 'Super!', 'Great job!', 'You got it!'],
    tryAgain: 'Try again!',
  },
  hi: {
    praise: ['शाबाश!', 'बहुत अच्छे!', 'बढ़िया!', 'वाह!'],
    tryAgain: 'फिर से कोशिश करो!',
  },
};

@Component({
  selector: 'app-round',
  imports: [Pressable, SafeAreaView, Text, View, VisualView],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen" [testID]="'question-' + current().area">
      @let q = question();
      <view class="top">
        <text class="progress"
          >{{ index() + 1 }} / {{ questions().length }}</text
        >
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
            [class.two-up]="q.options.length === 4"
            [class.answer]="resolvedId() === option.id"
            [class.celebrate]="celebratedId() === option.id"
            [class.wrong]="wrongIds().includes(option.id)"
            [disabled]="wrongIds().includes(option.id)"
            (press)="choose(option.id)"
          >
            <app-visual [visual]="option.visual" />
            @if (celebratedId() === option.id) {
              <text testID="praise-star" class="praise-star">⭐</text>
            }
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
    .two-up {
      flex-basis: 40%;
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
    .celebrate {
      z-index: 1;
      animation: bounce 600ms ease-out;
    }
    .praise-star {
      position: absolute;
      top: -8px;
      font-size: 48px;
      animation: fly-up 900ms ease-out forwards;
    }
    @keyframes bounce {
      0% {
        transform: scale(1);
      }
      30% {
        transform: scale(1.15);
      }
      60% {
        transform: scale(0.95);
      }
      100% {
        transform: scale(1);
      }
    }
    @keyframes fly-up {
      0% {
        opacity: 1;
        transform: translateY(0px) scale(0.6);
      }
      100% {
        opacity: 0;
        transform: translateY(-160px) scale(1.4);
      }
    }
  `,
})
export class Round {
  readonly area = input('');
  readonly level = input(0, { transform: numberAttribute });
  /** Set by the Mock Test route: questions from every area. */
  readonly mock = input(false, { transform: booleanAttribute });

  private readonly speaker = inject(Speaker);
  private readonly random = inject(Random);
  private readonly nav = inject(NativeNavigation);
  private readonly progress = inject(Progress);
  private readonly advanceDelay = inject(ADVANCE_DELAY_MS);
  private readonly now = inject(NOW);

  protected readonly questions = computed(() => {
    if (this.mock()) return buildMockTest(this.random);
    const area = this.area();
    // Read once: answers in this round must not rebuild it.
    const weak = untracked(this.progress.weakItems)
      .filter((item) => item.area === area)
      .map((item) => item.id);
    return buildRound(area, this.level(), this.random, new Set(weak)).map(
      (question) => ({ area, question }),
    );
  });
  protected readonly index = signal(0);
  protected readonly current = computed(() => this.questions()[this.index()]!);
  protected readonly question = computed(() => this.current().question);
  /** The tile shown as the answer once the question is settled. */
  protected readonly resolvedId = signal<string | null>(null);
  protected readonly wrongIds = signal<readonly string[]>([]);
  /** The tile the child tapped right, which bounces and sends up a star. */
  protected readonly celebratedId = signal<string | null>(null);
  private readonly firstTries: { area: string; right: boolean }[] = [];
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
    const { area, question: q } = this.current();
    const feedback = FEEDBACK[q.language];
    const firstTry = this.wrongIds().length === 0;
    if (firstTry) {
      const answer = q.options.find((option) => option.id === q.answerId)!;
      const right = optionId === q.answerId;
      this.firstTries.push({ area, right });
      void this.progress.recordAnswer(area, answer, right);
    }
    if (optionId === q.answerId) {
      this.resolvedId.set(optionId);
      this.celebratedId.set(optionId);
      this.speaker.speak(pick(this.random, feedback.praise), q.language);
      this.advance();
    } else if (firstTry && !this.mock()) {
      this.wrongIds.set([optionId]);
      this.speaker.speak(feedback.tryAgain, q.language);
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
        this.celebratedId.set(null);
        this.wrongIds.set([]);
        this.index.update((i) => i + 1);
        return;
      }
      this.finished = true;
      this.speaker.stop();
      if (this.mock()) this.finishMock();
      else this.finishRound();
    }, this.advanceDelay);
  }

  private finishRound(): void {
    const score = this.firstTries.filter((t) => t.right).length;
    void this.progress.record(this.area(), this.level(), starsFor(score));
    void this.nav.replace(['/results', score]);
  }

  private finishMock(): void {
    const areas: Record<string, { right: number; of: number }> = {};
    for (const { area, right } of this.firstTries) {
      const score = (areas[area] ??= { right: 0, of: 0 });
      score.of++;
      if (right) score.right++;
    }
    const takenAt = this.now().getTime();
    void this.progress.recordMock({
      takenAt,
      total: this.firstTries.filter((t) => t.right).length,
      areas,
    });
    void this.nav.replace(['/mock-results', takenAt]);
  }
}
