import { Component, inject } from '@angular/core';
import { Pressable, SafeAreaView, Text, View } from '@ng-native/components';
import { NativeRouterLink } from '@ng-native/router';
import { AREAS } from '../content/areas.ts';
import { Progress } from '../progress/progress.ts';

@Component({
  selector: 'app-home',
  imports: [NativeRouterLink, Pressable, SafeAreaView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen">
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
      </view>
      <pressable
        accessibilityRole="button"
        accessibilityLabel="Parent"
        class="parent"
        nativeRouterLink="/parent"
      >
        <text class="parent-text">Parent</text>
      </pressable>
    </safe-area-view>
  `,
  styles: `
    .screen {
      flex: 1;
      background-color: #fff8e7;
      padding: 16px;
      gap: 24px;
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
  protected readonly progress = inject(Progress);
}
