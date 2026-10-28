import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Pressable, SafeAreaView, Text, View } from '@ng-native/components';
import { ORAL, ORAL_PROMPTS } from '../content/oral.ts';
import { Progress } from '../progress/progress.ts';
import { Speaker } from '../speaker.ts';

/** Parent mode: the app asks, the child answers aloud, the parent marks ✓ or ✗. */
@Component({
  selector: 'app-oral',
  imports: [Pressable, SafeAreaView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen">
      @if (prompt(); as p) {
        <view class="top">
          <text class="progress">{{ index() + 1 }} / {{ prompts.length }}</text>
          <pressable
            accessibilityRole="button"
            accessibilityLabel="Hear again"
            class="replay"
            (press)="speakPrompt()"
          >
            <text class="replay-glyph">🔊</text>
          </pressable>
        </view>

        <view class="prompt">
          <text class="section">{{ p.section }}</text>
          @if (p.scene) {
            <view class="scene" testID="scene">
              @for (glyph of p.scene; track $index) {
                <text class="scene-glyph">{{ glyph }}</text>
              }
            </view>
          }
          <text class="text">{{ p.text }}</text>
        </view>

        <view class="marks">
          <pressable
            accessibilityRole="button"
            accessibilityLabel="Wrong"
            class="mark wrong"
            (press)="mark(false)"
          >
            <text class="mark-glyph">✗</text>
          </pressable>
          <pressable
            accessibilityRole="button"
            accessibilityLabel="Right"
            class="mark right"
            (press)="mark(true)"
          >
            <text class="mark-glyph">✓</text>
          </pressable>
        </view>
      } @else {
        <view class="summary">
          <text class="emoji">{{ oral.emoji }}</text>
          <text class="score">✓ {{ rightCount() }} / {{ prompts.length }}</text>
        </view>
      }
    </safe-area-view>
  `,
  styles: `
    .screen {
      flex: 1;
      background-color: #e6f7f5;
      padding: 16px;
    }
    .top {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    .progress {
      font-size: 20px;
      color: #1f6f66;
      font-weight: 600;
    }
    .replay {
      width: 64px;
      height: 64px;
      border-radius: 32px;
      align-items: center;
      justify-content: center;
      background-color: #7fd8cf;
    }
    .replay-glyph {
      font-size: 32px;
    }
    .prompt {
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: 24px;
    }
    .section {
      font-size: 20px;
      font-weight: 700;
      color: #1f6f66;
    }
    .scene {
      flex-direction: row;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
    }
    .scene-glyph {
      font-size: 56px;
    }
    .text {
      font-size: 32px;
      font-weight: 800;
      color: #3a2c5a;
      text-align: center;
    }
    .marks {
      flex-direction: row;
      gap: 16px;
      padding-bottom: 16px;
    }
    .mark {
      flex-grow: 1;
      flex-basis: 40%;
      min-height: 120px;
      border-radius: 24px;
      align-items: center;
      justify-content: center;
    }
    .right {
      background-color: #7ed957;
    }
    .wrong {
      background-color: #ffb3b3;
    }
    .mark-glyph {
      font-size: 56px;
      font-weight: 800;
      color: #3a2c5a;
    }
    .summary {
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: 24px;
    }
    .emoji {
      font-size: 72px;
    }
    .score {
      font-size: 48px;
      font-weight: 800;
      color: #3a2c5a;
    }
  `,
})
export class Oral {
  private readonly speaker = inject(Speaker);
  private readonly progress = inject(Progress);

  protected readonly oral = ORAL;
  protected readonly prompts = ORAL_PROMPTS;
  protected readonly index = signal(0);
  protected readonly prompt = computed(() => this.prompts[this.index()]);
  protected readonly rightCount = signal(0);

  constructor() {
    effect(() => {
      const prompt = this.prompt();
      untracked(() => (prompt ? this.speakPrompt() : this.speaker.stop()));
    });
    inject(DestroyRef).onDestroy(() => this.speaker.stop());
  }

  protected speakPrompt(): void {
    const prompt = this.prompt();
    if (prompt) this.speaker.speak(prompt.spoken, 'en');
  }

  protected mark(right: boolean): void {
    const prompt = this.prompt();
    if (!prompt) return;
    void this.progress.recordAnswer(ORAL.id, prompt, right);
    if (right) this.rightCount.update((n) => n + 1);
    this.index.update((i) => i + 1);
  }
}
