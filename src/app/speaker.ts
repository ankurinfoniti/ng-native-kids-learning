export type Language = 'en' | 'hi';

/** Reads text aloud. Provided by the app's entry point, and by a recording fake in tests. */
export abstract class Speaker {
  abstract speak(text: string, language: Language): void;
  abstract stop(): void;
}
