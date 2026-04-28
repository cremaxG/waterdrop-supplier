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
import { useTheme, useTranslation } from '../providers/AppProviders';

export interface AppButtonProps extends PressableProps {
  i18nKey?: string;
  title?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AppButton({
  i18nKey,
  title,
  children,
  style,
  textStyle,
  disabled,
  ...rest
}: AppButtonProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const childLabel =
    typeof children === 'string' || typeof children === 'number'
      ? children
      : '';
  const label = i18nKey ? t(i18nKey) : title ?? childLabel;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      disabled={disabled}
      {...rest}
    >
      <Text
        style={[
          styles.text,
          { color: disabled ? theme.border : theme.text },
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
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
