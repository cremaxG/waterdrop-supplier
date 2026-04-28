import {ColorSchemeName} from 'react-native';

export type ThemeName = 'light' | 'dark';
export type ThemePreference = 'system' | ThemeName;

export interface Theme {
  background: string;
  text: string;
  card: string;
  border: string;
  statusBarStyle: 'dark-content' | 'light-content';
}

export const themes: Record<ThemeName, Theme> = {
  light: {
    background: '#F6F9FC',
    text: '#1F2937',
    card: '#FFFFFF',
    border: '#D1D5DB',
    statusBarStyle: 'dark-content',
  },
  dark: {
    background: '#0F172A',
    text: '#F8FAFC',
    card: '#1E293B',
    border: '#334155',
    statusBarStyle: 'light-content',
  },
};

export const defaultThemeName: ThemeName = 'light';
export const defaultThemePreference: ThemePreference = 'system';

export function themeNameFromScheme(scheme: ColorSchemeName): ThemeName {
  return scheme === 'dark' ? 'dark' : 'light';
}
