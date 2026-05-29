import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  View,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { useAppPalette } from '../hooks/useAppPalette';
import { useTranslation } from '../providers/AppProviders';
import { AppIcon } from './AppIcon';
import { AppWaterLoader } from './AppWaterLoader';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface AppButtonProps extends PressableProps {
  i18nKey?: string;
  title?: string;
  variant?: AppButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIconName?: string;
  rightIconName?: string;
  iconSize?: number;
}

export function AppButton({
  i18nKey,
  title,
  children,
  variant = 'secondary',
  loading = false,
  style,
  textStyle,
  disabled,
  leftIconName,
  rightIconName,
  iconSize = 16,
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
  const isDisabled = disabled || loading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderColor,
          opacity: isDisabled ? 0.5 : pressed ? 0.9 : 1,
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
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <AppWaterLoader
          size={20}
          tone={isPrimary || isDanger ? 'light' : 'accent'}
        />
      ) : (
        <View style={styles.content}>
          {leftIconName ? (
            <AppIcon
              name={leftIconName}
              size={iconSize}
              color={disabled ? palette.muted : labelColor}
              style={styles.leftIcon}
            />
          ) : null}
          <Text
            style={[
              styles.text,
              { color: disabled ? palette.muted : labelColor },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {rightIconName ? (
            <AppIcon
              name={rightIconName}
              size={iconSize}
              color={disabled ? palette.muted : labelColor}
              style={styles.rightIcon}
            />
          ) : null}
        </View>
      )}
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
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});
