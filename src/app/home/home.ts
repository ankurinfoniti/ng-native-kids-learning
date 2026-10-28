import { Component, inject } from '@angular/core';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@ng-native/components';
import { NativeRouterLink } from '@ng-native/router';
import { AREAS } from '../content/areas.ts';
import { ORAL } from '../content/oral.ts';
import { Progress } from '../progress/progress.ts';

@Component({
  selector: 'app-home',
  imports: [NativeRouterLink, Pressable, SafeAreaView, ScrollView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen">
      <scroll-view
        class="scroll"
        [contentContainerStyle]="{ gap: 24, padding: 16 }"
        [showsVerticalScrollIndicator]="true"
      >
        <text class="title">Bal Vatika Prep</text>
        <view class="tiles">
          @for (area of areas; track area.id) {
            @let stars = progress.areaStars(area.id);
            <pressable
              accessibilityRole="button"
              [accessibilityLabel]="area.name + ', ' + stars + ' of 3 stars'"
              class="tile"
              [style]="{ backgroundColor: area.colour }"
              [nativeRouterLink]="['/area', area.id]"
            >
              <text class="tile-emoji">{{ area.emoji }}</text>
              <text class="tile-name">{{ area.name }}</text>
              <view class="stars">
                @for (slot of [1, 2, 3]; track slot) {
                  <text class="star" [class.empty]="slot > stars">⭐</text>
                }
              </view>
            </pressable>
          }
          <pressable
            accessibilityRole="button"
            accessibilityLabel="Mock Test"
            class="tile"
            [style]="{ backgroundColor: '#ff8a80' }"
            nativeRouterLink="/mock"
          >
            <text class="tile-emoji">📝</text>
            <text class="tile-name">Mock Test</text>
          </pressable>
          <pressable
            accessibilityRole="button"
            [accessibilityLabel]="oral.name"
            class="tile"
            [style]="{ backgroundColor: oral.colour }"
            nativeRouterLink="/oral"
          >
            <text class="tile-emoji">{{ oral.emoji }}</text>
            <text class="tile-name">{{ oral.name }}</text>
          </pressable>
        </view>
        <pressable
          accessibilityRole="button"
          accessibilityLabel="Parent"
          class="parent"
          nativeRouterLink="/parent"
        >
          <text class="parent-text">Parent</text>
        </pressable>
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
    .tiles {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 16px;
    }
    .tile {
      flex-basis: 45%;
      flex-grow: 1;
      min-height: 140px;
      border-radius: 28px;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .tile-emoji {
      font-size: 56px;
    }
    .tile-name {
      font-size: 22px;
      font-weight: 700;
      color: #3a2c5a;
      padding: 0 12px;
      text-align: center;
    }
    .stars {
      flex-direction: row;
      gap: 4px;
    }
    .star {
      font-size: 24px;
    }
    .empty {
      opacity: 0.2;
    }
    .parent {
      align-self: flex-end;
      padding: 8px 16px;
      border-radius: 16px;
      background-color: #e6e0f0;
    }
    .parent-text {
      font-size: 16px;
      color: #3a2c5a;
    }
  `,
})
export class Home {
  protected readonly areas = AREAS;
  protected readonly oral = ORAL;
  protected readonly progress = inject(Progress);
}
