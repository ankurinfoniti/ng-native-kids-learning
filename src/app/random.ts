import { Injectable } from '@angular/core';

/** A number in [0, 1). Every shuffle and pick goes through it, so a test can fix the sequence. */
@Injectable({
  providedIn: 'root',
  useFactory: () => ({ next: () => Math.random() }),
})
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

/** Every item, each place drawn from those left by weight, so heavier items tend to come first. Equal weights shuffle. */
export function weightedShuffle<T>(
  random: Random,
  items: readonly T[],
  weight: (item: T) => number,
): T[] {
  const rest = items.map((item) => ({ item, weight: weight(item) }));
  if (rest.every((entry) => entry.weight === rest[0]!.weight)) {
    return shuffle(random, items);
  }
  const result: T[] = [];
  while (rest.length > 0) {
    let r = random.next() * rest.reduce((sum, entry) => sum + entry.weight, 0);
    const i = rest.findIndex((entry) => (r -= entry.weight) < 0);
    // Rounding can leave r just short of the total.
    result.push(rest.splice(i === -1 ? rest.length - 1 : i, 1)[0]!.item);
  }
  return result;
}
