import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../providers/AppProviders';
import { AppText } from './AppText';

export interface AppCheckboxProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppCheckbox({
  checked,
  onChange,
  label,
  style,
}: AppCheckboxProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => onChange(!checked)}
      style={[styles.container, style]}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: theme.border,
            backgroundColor: checked ? theme.border : 'transparent',
          },
        ]}
      >
        {checked && <AppText style={styles.checkmark}>✓</AppText>}
      </View>
      {label && <AppText style={styles.label}>{label}</AppText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
});
