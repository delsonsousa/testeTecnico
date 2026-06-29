import AsyncStorage from '@react-native-async-storage/async-storage';
import { IKeyValueStore } from './IKeyValueStore';

export class AsyncStorageKeyValueStore implements IKeyValueStore {
  get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }
  set(key: string, value: string): Promise<void> {
    return AsyncStorage.setItem(key, value);
  }
}
