import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
} from 'react-native';
import { useAppPalette } from '../hooks/useAppPalette';
import { useTranslation } from '../providers/AppProviders';

export interface AppInputProps extends TextInputProps {
  placeholderKey?: string;
  style?: StyleProp<TextStyle>;
}

export function AppInput({ placeholderKey, style, ...rest }: AppInputProps) {
  const palette = useAppPalette();
  const { t } = useTranslation();
  const [isFocused, setFocused] = useState(false);
  const placeholder = placeholderKey ? t(placeholderKey) : rest.placeholder;

  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={palette.muted}
      style={[
        styles.input,
        {
          borderColor: isFocused ? palette.accent : palette.border,
          backgroundColor: palette.surface,
          color: palette.text,
          shadowColor: isFocused ? palette.shadow : 'transparent',
          shadowOpacity: isFocused ? 0.12 : 0,
          shadowRadius: 12,
          shadowOffset: {
            width: 0,
            height: 8,
          },
          elevation: isFocused ? 3 : 0,
        },
        style,
      ]}
      selectionColor={palette.accent}
      onFocus={event => {
        setFocused(true);
        rest.onFocus?.(event);
      }}
      onBlur={event => {
        setFocused(false);
        rest.onBlur?.(event);
      }}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
});
