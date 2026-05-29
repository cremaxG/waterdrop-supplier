import React, { useMemo, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
} from 'react-native';
import { useAppPalette } from '../hooks/useAppPalette';
import { useTranslation } from '../providers/AppProviders';
import { AppIcon } from './AppIcon';

export interface AppInputProps extends TextInputProps {
  hasError?: boolean;
  placeholderKey?: string;
  style?: StyleProp<TextStyle>;
}

export function AppInput({
  hasError = false,
  placeholderKey,
  style,
  secureTextEntry,
  ...rest
}: AppInputProps) {
  const palette = useAppPalette();
  const { t } = useTranslation();
  const [isFocused, setFocused] = useState(false);
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const placeholder = placeholderKey ? t(placeholderKey) : rest.placeholder;
  const borderColor = hasError
    ? '#DC2626'
    : isFocused
      ? palette.accent
      : palette.border;
  const inputDynamicStyle = {
    borderColor,
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
  } satisfies TextStyle;
  const shouldShowPasswordToggle = Boolean(secureTextEntry);
  const resolvedSecureTextEntry = shouldShowPasswordToggle && !isPasswordVisible;
  const inputStyle = useMemo(
    () => [styles.input, inputDynamicStyle, shouldShowPasswordToggle ? styles.inputWithIcon : null, style],
    [inputDynamicStyle, shouldShowPasswordToggle, style],
  );

  return (
    <View style={styles.wrapper}>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        style={inputStyle}
        selectionColor={palette.accent}
        secureTextEntry={resolvedSecureTextEntry}
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
      {shouldShowPasswordToggle ? (
        <Pressable
          onPress={() => setPasswordVisible(current => !current)}
          style={styles.iconButton}
        >
          <AppIcon
            name={isPasswordVisible ? 'eyeOff' : 'eye'}
            size={18}
            color={palette.accentStrong}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 18,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputWithIcon: {
    paddingRight: 52,
  },
  iconButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
