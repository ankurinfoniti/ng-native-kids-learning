import { Injectable, computed, inject, signal } from '@angular/core';
import { areaById } from '../content/areas.ts';
import {
  PROGRESS_VERSION,
  ProgressStore,
  type ProgressDoc,
} from './progress-store.ts';

/** First tries kept per item for the weak-spot rule. */
const RECENT = 5;

const EMPTY: ProgressDoc = {
  version: PROGRESS_VERSION,
  bestStars: {},
  unlocked: {},
};

/** The child's stars, open levels and weak spots, loaded on start and saved as they change. */
@Injectable({ providedIn: 'root' })
export class Progress {
  private readonly store = inject(ProgressStore);
  private readonly doc = signal(EMPTY);
  private loading: Promise<void> | undefined;

  load(): Promise<void> {
    this.loading ??= this.store.load().then(
      (saved) => {
        if (isCurrent(saved)) this.doc.set(saved);
      },
      // Unreadable saved progress starts fresh rather than blocking every save after it.
      () => undefined,
    );
    return this.loading;
  }

  bestStars(area: string, level: number): number {
    return this.doc().bestStars[area]?.[level] ?? 0;
  }

  /** The best stars of any level in the area. */
  areaStars(area: string): number {
    return Math.max(0, ...Object.values(this.doc().bestStars[area] ?? {}));
  }

  isUnlocked(area: string, level: number): boolean {
    return level === 1 || (this.doc().unlocked[area]?.includes(level) ?? false);
  }

  /** Items to practise, in the order they were first asked. */
  readonly weakItems = computed(() =>
    Object.entries(this.doc().items ?? {})
      .filter(([, item]) => item.weak)
      .map(([id, item]) => ({ id, name: item.name, area: item.area })),
  );

  /** A first try at an item: 2 misses in its last 5 make it weak, 3 right in a row make it not. */
  async recordAnswer(
    area: string,
    item: { readonly id: string; readonly name: string },
    right: boolean,
  ): Promise<void> {
    await this.change((doc) => {
      const items = doc.items ?? {};
      const before = items[item.id];
      const recent = [...(before?.recent ?? []), right].slice(-RECENT);
      const streak = right ? (before?.streak ?? 0) + 1 : 0;
      const weak = right
        ? (before?.weak ?? false) && streak < 3
        : recent.filter((r) => !r).length >= 2;
      return {
        ...doc,
        items: {
          ...items,
          [item.id]: { area, name: item.name, recent, streak, weak },
        },
      };
    });
  }

  async record(area: string, level: number, stars: number): Promise<void> {
    await this.change((doc) => {
      const best = doc.bestStars[area] ?? {};
      const unlocked = doc.unlocked[area] ?? [];
      const next = level + 1;
      const opensNext =
        stars === 3 &&
        next <= (areaById(area)?.levelCount ?? 0) &&
        !unlocked.includes(next);
      return {
        ...doc,
        bestStars: {
          ...doc.bestStars,
          [area]: { ...best, [level]: Math.max(best[level] ?? 0, stars) },
        },
        unlocked: opensNext
          ? { ...doc.unlocked, [area]: [...unlocked, next] }
          : doc.unlocked,
      };
    });
  }

  /** Back to a fresh start, as if nothing had ever been saved. */
  async reset(): Promise<void> {
    await this.load();
    this.doc.set(EMPTY);
    await this.store.clear();
  }

  private async change(update: (doc: ProgressDoc) => ProgressDoc) {
    // A change made before the saved progress arrived must not overwrite it.
    await this.load();
    this.doc.update(update);
    await this.store.save(this.doc());
  }
}

function isCurrent(saved: unknown): saved is ProgressDoc {
  const doc = saved as Partial<Record<keyof ProgressDoc, unknown>> | null;
  return (
    typeof doc === 'object' &&
    doc !== null &&
    doc.version === PROGRESS_VERSION &&
    typeof doc.bestStars === 'object' &&
    doc.bestStars !== null &&
    typeof doc.unlocked === 'object' &&
    doc.unlocked !== null
  );
}
