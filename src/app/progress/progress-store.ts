export const PROGRESS_VERSION = 1;

/** Everything saved on the phone, as one JSON document. */
export interface ProgressDoc {
  readonly version: typeof PROGRESS_VERSION;
  /** Best stars earned, by area then level. */
  readonly bestStars: Readonly<
    Record<string, Readonly<Record<number, number>>>
  >;
  /** Levels opened beyond level 1, which is always open, by area. */
  readonly unlocked: Readonly<Record<string, readonly number[]>>;
}

/** Loads and saves the progress document. Provided by the app's entry point, and by an in-memory fake in tests. */
export abstract class ProgressStore {
  /** The saved document as stored, or null when nothing has been saved yet. */
  abstract load(): Promise<unknown>;
  abstract save(doc: ProgressDoc): Promise<void>;
}
