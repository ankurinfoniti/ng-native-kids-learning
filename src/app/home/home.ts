import { Component } from '@angular/core';
import { Pressable, SafeAreaView, Text, View } from '@ng-native/components';
import { NativeRouterLink } from '@ng-native/router';

const AREAS = [{ id: 'numbers', name: 'Numbers', emoji: '🔢', colour: '#ffb347' }] as const;

@Component({
  selector: 'app-home',
  imports: [NativeRouterLink, Pressable, SafeAreaView, Text, View],
  host: { style: 'flex: 1' },
  template: `
    <safe-area-view class="screen">
      <text class="title">Bal Vatika Prep</text>
      <view class="tiles">
        @for (area of areas; track area.id) {
          <pressable
            accessibilityRole="button"
            [accessibilityLabel]="area.name"
            class="tile"
            [style]="{ backgroundColor: area.colour }"
            [nativeRouterLink]="['/round', area.id, 1]"
          >
            <text class="tile-emoji">{{ area.emoji }}</text>
            <text class="tile-name">{{ area.name }}</text>
          </pressable>
        }
      </view>
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
  `,
})
export class Home {
  protected readonly areas = AREAS;
}
