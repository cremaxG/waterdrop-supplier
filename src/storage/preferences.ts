import { createMMKV } from 'react-native-mmkv';
import { defaultLanguage, LanguageCode } from '../i18n';
import { defaultThemePreference, ThemePreference } from '../theme';

const THEME_PREFERENCE_KEY = 'preferences.theme';
const LANGUAGE_PREFERENCE_KEY = 'preferences.language';

const storage = createMMKV({
  id: 'water-supplier-preferences',
});

function isThemePreference(value: string | undefined): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function isLanguageCode(value: string | undefined): value is LanguageCode {
  return value === 'en' || value === 'hi';
}

export function getStoredThemePreference(): ThemePreference {
  const value = storage.getString(THEME_PREFERENCE_KEY);
  return isThemePreference(value) ? value : defaultThemePreference;
}

export function setStoredThemePreference(value: ThemePreference) {
  storage.set(THEME_PREFERENCE_KEY, value);
}

export function getStoredLanguage(): LanguageCode {
  const value = storage.getString(LANGUAGE_PREFERENCE_KEY);
  return isLanguageCode(value) ? value : defaultLanguage;
}

export function setStoredLanguage(value: LanguageCode) {
  storage.set(LANGUAGE_PREFERENCE_KEY, value);
}
