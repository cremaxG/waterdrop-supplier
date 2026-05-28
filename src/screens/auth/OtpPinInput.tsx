import React, { useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { AppText } from '../../components';
import { styles } from './AuthScreen.styles';

interface OtpPinInputProps {
  value: string;
  onChangeText: (value: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function OtpPinInput({
  value,
  onChangeText,
  error,
  disabled,
}: OtpPinInputProps) {
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setFocused] = useState(false);
  const paddedValue = value.padEnd(6, ' ');
  const digits = paddedValue.split('');

  return (
    <Pressable
      onPress={() => {
        if (!disabled) {
          inputRef.current?.focus();
        }
      }}
      style={styles.otpPinContainer}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={nextValue => {
          const sanitized = String(nextValue).replace(/\D/g, '').slice(0, 6);
          onChangeText(sanitized);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        editable={!disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.otpHiddenInput}
      />
      <View style={styles.otpPinRow}>
        {digits.map((digit, index) => (
          <View
            key={index}
            style={[
              styles.otpPinCell,
              isFocused && styles.otpPinCellFocused,
              error && styles.otpPinCellError,
            ]}
          >
            <AppText style={styles.otpPinText}>
              {digit !== ' ' ? digit : ''}
            </AppText>
          </View>
        ))}
      </View>
    </Pressable>
  );
}
