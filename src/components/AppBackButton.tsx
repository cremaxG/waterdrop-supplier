import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useAppPalette } from '../hooks/useAppPalette';
import { AppIcon } from './AppIcon';
import { AppText } from './AppText';

interface AppBackButtonProps {
  onPress: () => void;
  label?: string;
  showLabel?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppBackButton({
  onPress,
  label,
  showLabel,
  style,
}: AppBackButtonProps) {
  const palette = useAppPalette();

  return (
    <Pressable
      hitSlop={12}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.82 : 1 },
        style,
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          {
            backgroundColor: palette.surface,
            borderColor: palette.border,
            shadowColor: palette.shadow,
          },
        ]}
      >
        <AppIcon name="back" size={18} color={palette.accentStrong} />
      </View>
      {label && showLabel ? (
        <AppText style={[styles.label, { color: palette.accentStrong }]}>
          {label}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
