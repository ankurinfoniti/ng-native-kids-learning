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
  /** How each item went on its first tries, by item id; absent from documents saved before this was tracked. */
  readonly items?: Readonly<Record<string, ItemRecord>>;
  /** Mock Tests taken, oldest first; absent from documents saved before Mock Tests existed. */
  readonly mockTests?: readonly MockResult[];
}

export interface MockResult {
  /** When it ended, in milliseconds since 1970. */
  readonly takenAt: number;
  readonly total: number;
  /** Right answers out of questions asked, by area. */
  readonly areas: Readonly<Record<string, AreaScore>>;
}

export interface AreaScore {
  readonly right: number;
  readonly of: number;
}

export interface ItemRecord {
  /** The area it was last asked in, and its spoken name, for the Parent screen. */
  readonly area: string;
  readonly name: string;
  /** The last 5 first tries, oldest first: true when right. */
  readonly recent: readonly boolean[];
  /** First tries right in a row, up to the latest. */
  readonly streak: number;
  readonly weak: boolean;
}

/** Loads and saves the progress document. Provided by the app's entry point, and by an in-memory fake in tests. */
export abstract class ProgressStore {
  /** The saved document as stored, or null when nothing has been saved yet. */
  abstract load(): Promise<unknown>;
  abstract save(doc: ProgressDoc): Promise<void>;
  abstract clear(): Promise<void>;
}
