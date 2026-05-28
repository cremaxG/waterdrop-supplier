import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { useAppPalette } from '../hooks/useAppPalette';

type AppWaterLoaderTone = 'accent' | 'light' | 'muted';

export interface AppWaterLoaderProps {
  size?: number;
  tone?: AppWaterLoaderTone;
  style?: StyleProp<ViewStyle>;
}

export function AppWaterLoader({
  size = 22,
  tone = 'accent',
  style,
}: AppWaterLoaderProps) {
  const palette = useAppPalette();
  const fillProgress = useRef(new Animated.Value(0)).current;
  const waveShift = useRef(new Animated.Value(0)).current;
  const bubbleProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fillLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fillProgress, {
          toValue: 1,
          duration: 880,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(fillProgress, {
          toValue: 0,
          duration: 880,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );

    const waveLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(waveShift, {
          toValue: 1,
          duration: 980,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(waveShift, {
          toValue: 0,
          duration: 980,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const bubbleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bubbleProgress, {
          toValue: 1,
          duration: 1280,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bubbleProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(180),
      ]),
    );

    fillLoop.start();
    waveLoop.start();
    bubbleLoop.start();

    return () => {
      fillLoop.stop();
      waveLoop.stop();
      bubbleLoop.stop();
    };
  }, [bubbleProgress, fillProgress, waveShift]);

  const reservoirWidth = size;
  const reservoirHeight = size * 0.88;
  const borderRadius = size * 0.34;

  const toneColors = {
    accent: {
      border: palette.accentSoftBorder,
      water: palette.accent,
      waterSoft: palette.accentStrong,
      bubble: palette.accentStrong,
      sheen: 'rgba(255,255,255,0.22)',
      shell: palette.isDark ? 'rgba(15, 28, 45, 0.68)' : 'rgba(255,255,255,0.78)',
    },
    light: {
      border: 'rgba(255,255,255,0.48)',
      water: '#FFFFFF',
      waterSoft: 'rgba(255,255,255,0.72)',
      bubble: '#FFFFFF',
      sheen: 'rgba(255,255,255,0.32)',
      shell: 'rgba(255,255,255,0.14)',
    },
    muted: {
      border: palette.border,
      water: palette.accentStrong,
      waterSoft: palette.accent,
      bubble: palette.accentStrong,
      sheen: 'rgba(255,255,255,0.2)',
      shell: palette.surfaceSoft,
    },
  }[tone];

  const waterHeight = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [reservoirHeight * 0.34, reservoirHeight * 0.72],
  });

  const wavePrimaryShift = waveShift.interpolate({
    inputRange: [0, 1],
    outputRange: [-size * 0.12, size * 0.12],
  });

  const waveSecondaryShift = waveShift.interpolate({
    inputRange: [0, 1],
    outputRange: [size * 0.1, -size * 0.1],
  });

  const bubbleTranslateY = bubbleProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [size * 0.18, -size * 0.1],
  });

  const bubbleOpacity = bubbleProgress.interpolate({
    inputRange: [0, 0.12, 0.75, 1],
    outputRange: [0, 0.85, 0.58, 0],
  });

  const dropletTranslateY = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -size * 0.04],
  });

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: reservoirWidth,
          height: size,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.droplet,
          {
            width: size * 0.26,
            height: size * 0.26,
            borderRadius: size * 0.13,
            backgroundColor: toneColors.bubble,
            transform: [{ translateY: dropletTranslateY }, { rotate: '45deg' }],
          },
        ]}
      />

      <View
        style={[
          styles.reservoir,
          {
            width: reservoirWidth,
            height: reservoirHeight,
            borderRadius,
            borderColor: toneColors.border,
            backgroundColor: toneColors.shell,
            top: size * 0.12,
          },
        ]}
      >
        <View style={styles.sheenWrap}>
          <View
            style={[
              styles.sheen,
              {
                backgroundColor: toneColors.sheen,
              },
            ]}
          />
        </View>

        <Animated.View
          style={[
            styles.waterFill,
            {
              height: waterHeight,
              backgroundColor: toneColors.water,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.wave,
              {
                backgroundColor: toneColors.waterSoft,
                transform: [{ translateX: wavePrimaryShift }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.wave,
              styles.waveSecondary,
              {
                backgroundColor: toneColors.sheen,
                transform: [{ translateX: waveSecondaryShift }],
              },
            ]}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.bubble,
            {
              width: size * 0.13,
              height: size * 0.13,
              borderRadius: size * 0.065,
              backgroundColor: toneColors.bubble,
              opacity: bubbleOpacity,
              transform: [{ translateY: bubbleTranslateY }],
              left: size * 0.24,
              bottom: size * 0.12,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  droplet: {
    position: 'absolute',
    top: 0,
    zIndex: 2,
  },
  reservoir: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 1,
  },
  sheenWrap: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '44%',
    overflow: 'hidden',
  },
  sheen: {
    position: 'absolute',
    top: '12%',
    bottom: '18%',
    left: '22%',
    width: '36%',
    borderRadius: 999,
  },
  waterFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  wave: {
    position: 'absolute',
    top: -9,
    left: -6,
    right: -6,
    height: 18,
    borderRadius: 999,
  },
  waveSecondary: {
    top: -5,
    opacity: 0.78,
  },
  bubble: {
    position: 'absolute',
  },
});
