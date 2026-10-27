import { Injectable, inject, signal } from '@angular/core';
import { areaById } from '../content/areas.ts';
import {
  PROGRESS_VERSION,
  ProgressStore,
  type ProgressDoc,
} from './progress-store.ts';

const EMPTY: ProgressDoc = { version: PROGRESS_VERSION, bestStars: {}, unlocked: {} };

/** The child's stars and open levels, loaded on start and saved after each round. */
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

  async record(area: string, level: number, stars: number): Promise<void> {
    // A round finished before the saved progress arrived must not overwrite it.
    await this.load();
    this.doc.update((doc) => {
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
