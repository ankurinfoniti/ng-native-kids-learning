import { Component, computed, inject, input } from '@angular/core';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@ng-native/components';
import { NativeNavigation } from '@ng-native/router';
import { areaById } from '../content/areas.ts';
import { hasLevel } from '../content/rounds.ts';
import { Progress } from '../progress/progress.ts';

@Component({
  selector: 'app-area',
  imports: [Pressable, SafeAreaView, ScrollView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen">
      <scroll-view
        class="scroll"
        [contentContainerStyle]="{ gap: 24, padding: 16 }"
        [showsVerticalScrollIndicator]="true"
      >
        <text class="title">{{ details()?.emoji }} {{ details()?.name }}</text>
        <view class="levels">
          @for (level of levels(); track level.number) {
            <pressable
              accessibilityRole="button"
              [accessibilityLabel]="level.label"
              class="level"
              [class.locked]="!level.unlocked"
              [disabled]="!level.playable"
              (press)="start(level.number)"
            >
              <text class="level-name">Level {{ level.number }}</text>
              @if (level.unlocked) {
                <view class="stars">
                  @for (slot of [1, 2, 3]; track slot) {
                    <text class="star" [class.empty]="slot > level.stars"
                      >⭐</text
                    >
                  }
                </view>
              } @else {
                <text class="lock">🔒</text>
              }
            </pressable>
          }
        </view>
      </scroll-view>
    </safe-area-view>
  `,
  styles: `
    .screen {
      flex: 1;
      background-color: #fff8e7;
    }
    .scroll {
      flex: 1;
    }
    .title {
      font-size: 32px;
      font-weight: 800;
      color: #3a2c5a;
      text-align: center;
      margin-top: 16px;
    }
    .levels {
      gap: 16px;
    }
    .level {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      min-height: 96px;
      padding: 0 24px;
      border-radius: 28px;
      background-color: #ffb347;
    }
    .locked {
      background-color: #dddddd;
    }
    .level-name {
      font-size: 28px;
      font-weight: 700;
      color: #3a2c5a;
    }
    .stars {
      flex-direction: row;
      gap: 4px;
    }
    .star {
      font-size: 32px;
    }
    .empty {
      opacity: 0.2;
    }
    .lock {
      font-size: 40px;
    }
  `,
})
export class Area {
  readonly area = input.required<string>();

  private readonly progress = inject(Progress);
  private readonly nav = inject(NativeNavigation);

  protected readonly details = computed(() => areaById(this.area()));
  protected readonly levels = computed(() => {
    const area = this.area();
    const count = this.details()?.levelCount ?? 0;
    return Array.from({ length: count }, (_, i) => {
      const number = i + 1;
      const unlocked = this.progress.isUnlocked(area, number);
      const stars = this.progress.bestStars(area, number);
      return {
        number,
        unlocked,
        stars,
        // An open level whose questions are not written yet cannot start either.
        playable: unlocked && hasLevel(area, number),
        label: unlocked
          ? `Level ${number}, ${stars} of 3 stars`
          : `Level ${number}, locked`,
      };
    });
  });

  protected start(level: number): void {
    void this.nav.push(['/round', this.area(), level]);
  }
}
