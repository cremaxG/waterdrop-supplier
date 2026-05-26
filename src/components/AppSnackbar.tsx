import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useAppPalette } from '../hooks/useAppPalette';
import { AppText } from './AppText';

type AppSnackbarTone = 'success' | 'error' | 'info';

export interface AppSnackbarProps {
  visible: boolean;
  message: string;
  tone?: AppSnackbarTone;
  duration?: number;
  onHide?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function AppSnackbar({
  visible,
  message,
  tone = 'info',
  duration = 2600,
  onHide,
  style,
}: AppSnackbarProps) {
  const palette = useAppPalette();
  const [isMounted, setIsMounted] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (visible && message.trim()) {
      setIsMounted(true);
      opacity.setValue(0);
      translateY.setValue(24);

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0 && onHide) {
        timeoutId = setTimeout(() => {
          onHide();
        }, duration);
      }
    } else if (isMounted) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 24,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setIsMounted(false);
        }
      });
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [duration, isMounted, message, onHide, opacity, translateY, visible]);

  if (!isMounted || !message.trim()) {
    return null;
  }

  const backgroundColor =
    tone === 'success'
      ? palette.success
      : tone === 'error'
        ? palette.error
        : palette.accentStrong;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable
        onPress={onHide}
        style={[
          styles.card,
          {
            backgroundColor,
            shadowColor: palette.shadow,
          },
          style,
        ]}
      >
        <View style={styles.dot} />
        <AppText style={styles.message}>{message}</AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    zIndex: 50,
  },
  card: {
    borderRadius: 18,
    minHeight: 56,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
});
