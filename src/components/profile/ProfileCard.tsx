import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { AppText } from '../AppText';
import { useAppPalette } from '../../hooks/useAppPalette';

interface ProfileCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ProfileCard({
  title,
  subtitle,
  children,
  style,
}: ProfileCardProps) {
  const palette = useAppPalette();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          shadowColor: palette.shadow,
        },
        style,
      ]}
    >
      {title ? (
        <AppText style={[styles.title, { color: palette.text }]}>
          {title}
        </AppText>
      ) : null}
      {subtitle ? (
        <AppText style={[styles.subtitle, { color: palette.muted }]}>
          {subtitle}
        </AppText>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
});
