import { InjectionToken } from '@angular/core';

/** The current time, which a test fixes. */
export const NOW = new InjectionToken<() => Date>('NOW', {
  factory: () => () => new Date(),
});
