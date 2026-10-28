import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProgressStore, type ProgressDoc } from './progress-store.ts';

const KEY = 'bal-vatika-prep/progress';

export class AsyncStorageProgressStore implements ProgressStore {
  async load(): Promise<unknown> {
    const json = await AsyncStorage.getItem(KEY);
    return json === null ? null : JSON.parse(json);
  }

  async save(doc: ProgressDoc): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(doc));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
