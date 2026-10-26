import { Component, inject } from '@angular/core';
import { SafeAreaProvider } from '@ng-native/components';
import { StatusBar } from '@ng-native/device';
import { NativeStackOutlet } from '@ng-native/router';

@Component({
  imports: [NativeStackOutlet, SafeAreaProvider],
  selector: 'app-root',
  template: `
    <safe-area-provider>
      <native-stack-outlet />
    </safe-area-provider>
  `,
  styles: `
    :host {
      flex: 1;
    }
  `,
})
export class App {
  constructor() {
    // The app is light mode only, so the status bar icons are always dark.
    inject(StatusBar).set({ style: 'dark' });
  }
}
