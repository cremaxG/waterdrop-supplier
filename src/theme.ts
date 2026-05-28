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
    background: '#F0FBFF',
    text: '#0B1F33',
    card: '#FFFFFF',
    border: '#D7E9F5',
    statusBarStyle: 'dark-content',
  },
  dark: {
    background: '#071827',
    text: '#F3FBFF',
    card: '#102235',
    border: '#1F3A4D',
    statusBarStyle: 'light-content',
  },
};

export const defaultThemeName: ThemeName = 'light';
export const defaultThemePreference: ThemePreference = 'system';

export function themeNameFromScheme(scheme: ColorSchemeName): ThemeName {
  return scheme === 'dark' ? 'dark' : 'light';
}
