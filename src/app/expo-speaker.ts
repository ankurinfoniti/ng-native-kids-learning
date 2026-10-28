import * as Speech from 'expo-speech';
import { Speaker, type Language } from './speaker.ts';

// Android needs a bare code ('hi-IN' is ill-formed there); a voice not installed falls back to the default.
const VOICES: Record<Language, string> = { en: 'en', hi: 'hi' };

export class ExpoSpeaker implements Speaker {
  speak(text: string, language: Language): void {
    // A new line replaces whatever is still being read, so instructions never talk over each other.
    void Speech.stop();
    Speech.speak(text, { language: VOICES[language], rate: 0.9 });
  }

  stop(): void {
    void Speech.stop();
  }
}
