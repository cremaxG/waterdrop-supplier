import { createMMKV } from 'react-native-mmkv';

const TEMP_TOKEN_KEY = 'session.tempToken';

const storage = createMMKV({
  id: 'water-supplier-session',
});

export function getTempToken(): string | null {
  return storage.getString(TEMP_TOKEN_KEY) ?? null;
}

export function setTempToken(token: string) {
  storage.set(TEMP_TOKEN_KEY, token);
}

export function clearTempToken() {
  storage.remove(TEMP_TOKEN_KEY);
}
