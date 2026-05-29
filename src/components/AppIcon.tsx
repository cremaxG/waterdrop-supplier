import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { useTheme } from '../providers/AppProviders';

const iconMap: Record<string, string> = {
  water: '💧',
  user: '👤',
  settings: '⚙️',
  info: 'ℹ️',
  image: '🖼️',
  edit: '✎',
  dashboard: '📊',
  vehicles: '🚚',
  products: '🫗',
  profile: '👤',
  language: '🌐',
  theme: '☼',
  package: '📦',
  location: '⌂',
  close: '✕',
  chevron: '›',
  phone: '☎',
  star: '★',
  money: '₹',
  shield: '⬢',
  clock: '◷',
  support: '✆',
  document: '▤',
  bell: '🔔',
  wallet: '◉',
  building: '▦',
  mail: '✉',
  email: '✉',
  logout: '⇥',
  back: '‹',
  map: '⌖',
  heart: '♥',
  more: '⋯',
  view: '◫',
  history: '⟲',
  trash: '🗑',
  track: '◎',
  offline: '◌',
  online: '●',
  route: '⌁',
  eye: '◉',
  eyeOff: '⊘',
  save: '✓',
  add: '+',
  retry: '↻',
  check: '✓',
};

export interface AppIconProps {
  name: keyof typeof iconMap | string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function AppIcon({ name, size = 28, color, style }: AppIconProps) {
  const { theme } = useTheme();
  const icon = iconMap[name] ?? '❔';

  return (
    <Text
      style={[
        styles.icon,
        { fontSize: size, color: color ?? theme.text },
        style,
      ]}
    >
      {icon}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});
