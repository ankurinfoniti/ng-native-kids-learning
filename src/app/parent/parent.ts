import { Component, computed, inject, signal } from '@angular/core';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@ng-native/components';
import { AREAS, areaById } from '../content/areas.ts';
import { ORAL } from '../content/oral.ts';
import { Progress } from '../progress/progress.ts';
import { mockScores } from '../results/mock-results.ts';

@Component({
  selector: 'app-parent',
  imports: [Pressable, SafeAreaView, ScrollView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen">
      <scroll-view
        class="scroll"
        [contentContainerStyle]="{ gap: 24, padding: 16 }"
      >
        <text class="title">Parent</text>

        <text class="heading">Best stars</text>
        @for (area of areas(); track area.id) {
          <view class="area">
            <text class="area-name">{{ area.emoji }} {{ area.name }}</text>
            @for (level of area.levels; track level.number) {
              <view
                class="level"
                role="image"
                [accessibilityLabel]="
                  area.name +
                  ' level ' +
                  level.number +
                  ', ' +
                  level.stars +
                  ' of 3 stars'
                "
              >
                <text class="level-name">Level {{ level.number }}</text>
                <view class="stars">
                  @for (slot of [1, 2, 3]; track slot) {
                    <text class="star" [class.empty]="slot > level.stars"
                      >⭐</text
                    >
                  }
                </view>
              </view>
            }
          </view>
        }

        <text class="heading">Weak spots</text>
        @for (item of weakItems(); track item.id) {
          <text class="weak">{{ item.name }} · {{ item.areaName }}</text>
        } @empty {
          <text class="note">No weak spots yet</text>
        }

        <text class="heading">Mock Tests</text>
        @for (test of mockTests(); track test.takenAt) {
          <view class="mock">
            <text class="mock-total"
              >{{ test.date }}: {{ test.total }} / {{ test.of }}</text
            >
            <text class="note">{{ test.breakdown }}</text>
          </view>
        } @empty {
          <text class="note">No Mock Tests yet</text>
        }

        @if (confirming()) {
          <view class="confirm">
            <text class="confirm-text"
              >Clear all stars, weak spots and Mock Tests?</text
            >
            <view class="confirm-buttons">
              <pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel"
                class="button"
                (press)="confirming.set(false)"
              >
                <text class="button-text">Cancel</text>
              </pressable>
              <pressable
                accessibilityRole="button"
                accessibilityLabel="Yes, reset"
                class="button danger"
                (press)="reset()"
              >
                <text class="button-text">Yes, reset</text>
              </pressable>
            </view>
          </view>
        } @else {
          <pressable
            accessibilityRole="button"
            accessibilityLabel="Reset progress"
            class="button danger"
            (press)="confirming.set(true)"
          >
            <text class="button-text">Reset progress</text>
          </pressable>
        }
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
    }
    .heading {
      font-size: 24px;
      font-weight: 800;
      color: #3a2c5a;
    }
    .area {
      gap: 4px;
    }
    .area-name {
      font-size: 20px;
      font-weight: 700;
      color: #3a2c5a;
    }
    .level {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 4px 12px;
    }
    .level-name {
      font-size: 18px;
      color: #3a2c5a;
    }
    .stars {
      flex-direction: row;
      gap: 4px;
    }
    .star {
      font-size: 20px;
    }
    .empty {
      opacity: 0.2;
    }
    .note {
      font-size: 18px;
      color: #6b5e80;
    }
    .weak {
      font-size: 20px;
      color: #3a2c5a;
    }
    .mock {
      gap: 2px;
    }
    .mock-total {
      font-size: 20px;
      font-weight: 700;
      color: #3a2c5a;
    }
    .confirm {
      gap: 12px;
    }
    .confirm-text {
      font-size: 20px;
      font-weight: 700;
      color: #3a2c5a;
    }
    .confirm-buttons {
      flex-direction: row;
      gap: 12px;
    }
    .button {
      flex-grow: 1;
      align-items: center;
      padding: 14px 20px;
      border-radius: 16px;
      background-color: #e6e0f0;
    }
    .danger {
      background-color: #ffb3b3;
    }
    .button-text {
      font-size: 18px;
      font-weight: 700;
      color: #3a2c5a;
    }
  `,
})
export class Parent {
  private readonly progress = inject(Progress);

  protected readonly areas = computed(() =>
    AREAS.map((area) => ({
      ...area,
      levels: Array.from({ length: area.levelCount }, (_, i) => ({
        number: i + 1,
        stars: this.progress.bestStars(area.id, i + 1),
      })),
    })),
  );
  protected readonly weakItems = computed(() =>
    this.progress.weakItems().map((item) => ({
      ...item,
      areaName:
        item.area === ORAL.id
          ? ORAL.name
          : (areaById(item.area)?.name ?? item.area),
    })),
  );
  protected readonly mockTests = computed(() =>
    [...this.progress.mockTests()].reverse().map((test) => {
      const scores = mockScores(test);
      return {
        takenAt: test.takenAt,
        date: formatDate(new Date(test.takenAt)),
        total: scores.total,
        of: scores.of,
        breakdown: scores.areas
          .map((area) => `${area.name} ${area.right}/${area.of}`)
          .join(' · '),
      };
    }),
  );
  protected readonly confirming = signal(false);

  protected reset(): void {
    this.confirming.set(false);
    void this.progress.reset();
  }
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
