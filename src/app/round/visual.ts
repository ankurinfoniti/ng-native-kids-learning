import { Component, input } from '@angular/core';
import { Text, View } from '@ng-native/components';
import type { Visual } from '../content/question.ts';

/** An item as drawn on its answer tile. */
@Component({
  selector: 'app-visual',
  imports: [Text, View],
  template: `
    @let v = visual();
    @if (v.kind === 'swatch') {
      <view
        testID="swatch"
        class="swatch"
        [style]="{ backgroundColor: v.colour }"
      ></view>
    } @else if (v.kind === 'shape') {
      @if (v.shape === 'star') {
        <text testID="shape" class="star">★</text>
      } @else {
        <view testID="shape" [class]="v.shape"></view>
      }
    } @else if (v.kind === 'scene') {
      <view testID="scene" class="scene" [class.beside]="v.place === 'out'">
        @switch (v.place) {
          @case ('under') {
            <text class="part">{{ v.thing }}</text>
            <text class="part">{{ v.subject }}</text>
          }
          @case ('in') {
            <text class="part sunk">{{ v.subject }}</text>
            <text class="part">{{ v.thing }}</text>
          }
          @default {
            <text class="part">{{ v.subject }}</text>
            <text class="part">{{ v.thing }}</text>
          }
        }
      </view>
    } @else if (v.kind === 'glyph') {
      <text class="glyph" [class]="v.size ?? ''">{{ v.glyph }}</text>
    }
  `,
  styles: `
    .glyph {
      font-size: 56px;
      font-weight: 700;
      color: #333333;
    }
    .big {
      font-size: 84px;
    }
    .small {
      font-size: 32px;
    }
    .tall {
      transform: scaleY(1.6);
    }
    .short {
      transform: scaleY(0.6);
    }
    .swatch {
      width: 88px;
      height: 88px;
      border-radius: 20px;
      border-width: 2px;
      border-color: #999999;
    }
    /* One colour for every shape, so a colour never gives the shape away. */
    .circle {
      width: 88px;
      height: 88px;
      border-radius: 44px;
      background-color: #7b3fe4;
    }
    .square {
      width: 84px;
      height: 84px;
      background-color: #7b3fe4;
    }
    .rectangle {
      width: 120px;
      height: 64px;
      background-color: #7b3fe4;
    }
    /* A zero-size box whose bottom border, between two clear side borders, is the triangle. */
    .triangle {
      width: 0px;
      height: 0px;
      border-left-width: 50px;
      border-right-width: 50px;
      border-bottom-width: 88px;
      border-left-color: transparent;
      border-right-color: transparent;
      border-bottom-color: #7b3fe4;
    }
    .star {
      font-size: 104px;
      line-height: 112px;
      color: #7b3fe4;
    }
    .scene {
      align-items: center;
    }
    .beside {
      flex-direction: row;
      align-items: flex-end;
      gap: 8px;
    }
    .part {
      font-size: 40px;
      line-height: 48px;
    }
    /* Drawn before the thing, which hides its lower half: it sits inside. */
    .sunk {
      margin-bottom: -26px;
    }
  `,
})
export class VisualView {
  readonly visual = input.required<Visual>();
}
