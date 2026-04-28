import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { useTheme, useTranslation } from '../providers/AppProviders';

export interface AppInputProps extends TextInputProps {
  placeholderKey?: string;
  style?: StyleProp<TextStyle>;
}

export function AppInput({ placeholderKey, style, ...rest }: AppInputProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const placeholder = placeholderKey ? t(placeholderKey) : rest.placeholder;

  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={theme.border}
      style={[
        styles.input,
        {
          borderColor: theme.border,
          backgroundColor: theme.card,
          color: theme.text,
        },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
