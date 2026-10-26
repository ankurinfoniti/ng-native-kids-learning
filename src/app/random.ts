import { Injectable } from '@angular/core';

/** A number in [0, 1). Every shuffle and pick goes through it, so a test can fix the sequence. */
@Injectable({ providedIn: 'root', useFactory: () => ({ next: () => Math.random() }) })
export abstract class Random {
  abstract next(): number;
}

export function pick<T>(random: Random, items: readonly T[]): T {
  return items[Math.floor(random.next() * items.length)]!;
}

export function shuffle<T>(random: Random, items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random.next() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}
