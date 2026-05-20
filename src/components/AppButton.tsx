import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useAppPalette } from '../hooks/useAppPalette';
import { useTranslation } from '../providers/AppProviders';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface AppButtonProps extends PressableProps {
  i18nKey?: string;
  title?: string;
  variant?: AppButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AppButton({
  i18nKey,
  title,
  children,
  variant = 'secondary',
  style,
  textStyle,
  disabled,
  ...rest
}: AppButtonProps) {
  const palette = useAppPalette();
  const { t } = useTranslation();
  const childLabel =
    typeof children === 'string' || typeof children === 'number'
      ? children
      : '';
  const label = i18nKey ? t(i18nKey) : title ?? childLabel;
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const isGhost = variant === 'ghost';
  const backgroundColor = isPrimary
    ? palette.accent
    : isDanger
      ? '#DC2626'
      : isGhost
        ? 'transparent'
        : palette.surface;
  const borderColor = isPrimary
    ? palette.accent
    : isDanger
      ? '#DC2626'
      : isGhost
        ? 'transparent'
        : palette.border;
  const labelColor = isPrimary || isDanger ? '#FFFFFF' : palette.text;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
          shadowColor: isPrimary || isDanger ? palette.shadow : 'transparent',
          shadowOpacity: pressed ? 0.12 : isPrimary || isDanger ? 0.18 : 0,
          shadowRadius: 16,
          shadowOffset: {
            width: 0,
            height: 10,
          },
          elevation: isPrimary || isDanger ? 5 : 0,
        },
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <Text
        style={[
          styles.text,
          { color: disabled ? palette.muted : labelColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
