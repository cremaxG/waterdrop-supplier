import React, {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import {
  availableLanguages,
  LanguageCode,
  translate,
} from '../i18n';
import {
  ThemeName,
  ThemePreference,
  themeNameFromScheme,
  themes,
} from '../theme';
import {
  getStoredLanguage,
  getStoredThemePreference,
  setStoredLanguage,
  setStoredThemePreference,
} from '../storage/preferences';

interface ThemeContextValue {
  themeName: ThemeName;
  themePreference: ThemePreference;
  theme: (typeof themes)[ThemeName];
  setThemePreference: (value: ThemePreference) => void;
  toggleTheme: () => void;
}

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (value: LanguageCode) => void;
  t: (key: string) => string;
  availableLanguages: Record<LanguageCode, string>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function AppProviders({ children }: { children: React.ReactNode }) {
  const colorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    getStoredThemePreference(),
  );
  const [language, setLanguageState] = useState<LanguageCode>(() =>
    getStoredLanguage(),
  );

  const themeName =
    themePreference === 'system'
      ? themeNameFromScheme(colorScheme)
      : themePreference;

  const theme = useMemo(() => themes[themeName], [themeName]);

  const setThemePreference = (value: ThemePreference) => {
    setThemePreferenceState(value);
    setStoredThemePreference(value);
  };

  const setLanguage = (value: LanguageCode) => {
    setLanguageState(value);
    setStoredLanguage(value);
  };

  const themeContextValue = useMemo(
    () => ({
      themeName,
      themePreference,
      theme,
      setThemePreference,
      toggleTheme: () =>
        setThemePreference(
          themeName === 'dark' ? 'light' : 'dark',
        ),
    }),
    [themeName, themePreference, theme],
  );

  const languageContextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: string) => translate(language, key),
      availableLanguages,
    }),
    [language],
  );

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <LanguageContext.Provider value={languageContextValue}>
        {children}
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within AppProviders');
  }
  return context;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within AppProviders');
  }
  return context;
}
