import React from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import { useAppPalette } from '../hooks/useAppPalette';
import { AppText } from './AppText';

type AppFieldMessageTone = 'error' | 'info';

export interface AppFieldMessageProps {
  message?: string | null;
  tone?: AppFieldMessageTone;
  style?: StyleProp<TextStyle>;
}

export function AppFieldMessage({
  message,
  tone = 'error',
  style,
}: AppFieldMessageProps) {
  const palette = useAppPalette();

  if (!message?.trim()) {
    return null;
  }

  return (
    <AppText
      style={[
        styles.message,
        { color: tone === 'error' ? palette.error : palette.muted },
        style,
      ]}
    >
      {message}
    </AppText>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
});
