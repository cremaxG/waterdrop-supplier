import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({
  id: 'water-supplier-storage',
});

export function getStorage() {
  return storage;
}
