import type { EnvironmentProviders } from '@angular/core';
import { withComponentInputBinding } from '@angular/router';
import { provideNativeRouter } from '@ng-native/router';
import { routes } from './app.routes.ts';

/** What the app and its tests share; platform adapters are provided beside it. */
export function provideApp(): EnvironmentProviders {
  return provideNativeRouter(routes, withComponentInputBinding());
}
