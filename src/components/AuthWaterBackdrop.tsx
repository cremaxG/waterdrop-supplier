import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

interface AuthWaterBackdropProps {
  screenColor: string;
  glowTop: string;
  glowBottom: string;
  frostTint: string;
  mistTint: string;
  dropletFill: string;
  dropletEdge: string;
  dropletHighlight: string;
}

type Percent = `${number}%`;

type DropletConfig = {
  top: Percent;
  left?: Percent;
  right?: Percent;
  width: number;
  height: number;
  opacity: number;
  tilt: string;
  tail?: number;
};

type FogPatchConfig = {
  top?: Percent;
  bottom?: Percent;
  left?: Percent;
  right?: Percent;
  width: Percent;
  height: Percent;
  opacity: number;
};

const DROPLETS: DropletConfig[] = [
  { top: '6%', left: '7%', width: 48, height: 66, opacity: 0.88, tilt: '-11deg', tail: 16 },
  { top: '9%', right: '10%', width: 34, height: 48, opacity: 0.8, tilt: '12deg', tail: 10 },
  { top: '14%', left: '24%', width: 18, height: 26, opacity: 0.74, tilt: '-15deg', tail: 0 },
  { top: '18%', right: '18%', width: 26, height: 38, opacity: 0.76, tilt: '10deg', tail: 8 },
  { top: '26%', left: '8%', width: 30, height: 44, opacity: 0.72, tilt: '-9deg', tail: 12 },
  { top: '31%', right: '7%', width: 52, height: 70, opacity: 0.84, tilt: '13deg', tail: 20 },
  { top: '38%', left: '21%', width: 22, height: 32, opacity: 0.68, tilt: '-16deg', tail: 0 },
  { top: '45%', right: '27%', width: 20, height: 28, opacity: 0.7, tilt: '8deg', tail: 6 },
  { top: '54%', left: '6%', width: 44, height: 60, opacity: 0.7, tilt: '-14deg', tail: 16 },
  { top: '59%', right: '12%', width: 28, height: 40, opacity: 0.74, tilt: '9deg', tail: 8 },
  { top: '68%', left: '18%', width: 26, height: 36, opacity: 0.66, tilt: '-11deg', tail: 0 },
  { top: '76%', right: '6%', width: 56, height: 76, opacity: 0.8, tilt: '7deg', tail: 18 },
  { top: '82%', left: '10%', width: 36, height: 50, opacity: 0.68, tilt: '-10deg', tail: 10 },
];

const FOG_PATCHES: FogPatchConfig[] = [
  { top: '11%', left: '14%', width: '28%', height: '16%', opacity: 0.18 },
  { top: '34%', right: '10%', width: '22%', height: '12%', opacity: 0.14 },
  { top: '60%', left: '8%', width: '30%', height: '14%', opacity: 0.16 },
  { bottom: '8%', right: '12%', width: '26%', height: '16%', opacity: 0.12 },
];

export function AuthWaterBackdrop({
  screenColor,
  glowTop,
  glowBottom,
  frostTint,
  mistTint,
  dropletFill,
  dropletEdge,
  dropletHighlight,
}: AuthWaterBackdropProps) {
  const { height, width } = useWindowDimensions();
  const drift = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const driftAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 3600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    driftAnimation.start();
    shimmerAnimation.start();

    return () => {
      driftAnimation.stop();
      shimmerAnimation.stop();
    };
  }, [drift, shimmer]);

  const topOrbStyle = useMemo(
    () => ({
      width: width * 0.78,
      height: width * 0.78,
      top: -width * 0.22,
      right: -width * 0.18,
    }),
    [width],
  );

  const bottomOrbStyle = useMemo(
    () => ({
      width: width * 0.92,
      height: width * 0.92,
      bottom: -width * 0.34,
      left: -width * 0.28,
    }),
    [width],
  );

  const mistHeight = Math.max(260, height * 0.46);
  const topMistTranslateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 10],
  });
  const bottomMistTranslateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -8],
  });
  const sheenOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.42],
  });

  return (
    <View pointerEvents="none" style={styles.backdrop}>
      <View style={[styles.fill, { backgroundColor: screenColor }]} />

      <Animated.View
        style={[
          styles.glowOrb,
          topOrbStyle,
          {
            backgroundColor: glowTop,
            transform: [{ translateY: topMistTranslateY }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.glowOrb,
          bottomOrbStyle,
          {
            backgroundColor: glowBottom,
            transform: [{ translateY: bottomMistTranslateY }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.mistBeam,
          styles.mistBeamLeft,
          {
            height: mistHeight,
            backgroundColor: mistTint,
            opacity: sheenOpacity,
            transform: [{ rotate: '18deg' }, { translateY: topMistTranslateY }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.mistBeam,
          styles.mistBeamRight,
          {
            height: mistHeight * 0.92,
            backgroundColor: mistTint,
            opacity: sheenOpacity,
            transform: [{ rotate: '-14deg' }, { translateY: bottomMistTranslateY }],
          },
        ]}
      />

      <View style={[styles.fill, styles.frostOverlay, { backgroundColor: frostTint }]} />

      <View style={styles.glassPane}>
        <View style={[styles.glassPaneBorder, { borderColor: dropletEdge }]} />
      </View>

      {FOG_PATCHES.map((patch, index) => (
        <Animated.View
          key={`fog-${index}`}
          style={[
            styles.fogPatch,
            patch,
            {
              backgroundColor: dropletHighlight,
              opacity: patch.opacity,
              transform: [
                {
                  translateY: index % 2 === 0 ? topMistTranslateY : bottomMistTranslateY,
                },
              ],
            },
          ]}
        />
      ))}

      <Animated.View
        style={[
          styles.glassSheen,
          {
            backgroundColor: dropletHighlight,
            opacity: sheenOpacity,
          },
        ]}
      />

      <View style={styles.dropletsLayer}>
        {DROPLETS.map((droplet, index) => {
          const travel = ((index % 4) + 1) * 2.5;
          const translateY = drift.interpolate({
            inputRange: [0, 1],
            outputRange: [-travel, travel],
          });

          return (
            <Animated.View
              key={`${droplet.top}-${droplet.left ?? droplet.right}-${index}`}
              style={[
                styles.droplet,
                {
                  top: droplet.top,
                  left: droplet.left,
                  right: droplet.right,
                  width: droplet.width,
                  height: droplet.height,
                  opacity: droplet.opacity,
                  backgroundColor: dropletFill,
                  borderColor: dropletEdge,
                  transform: [{ rotate: droplet.tilt }, { translateY }],
                },
              ]}
            >
              {droplet.tail ? (
                <View
                  style={[
                    styles.dropletTail,
                    {
                      height: droplet.tail,
                      backgroundColor: dropletHighlight,
                    },
                  ]}
                />
              ) : null}
              <View
                style={[
                  styles.dropletCore,
                  { backgroundColor: dropletHighlight },
                ]}
              />
              <View
                style={[
                  styles.dropletHighlight,
                  { backgroundColor: dropletHighlight },
                ]}
              />
              <View
                style={[
                  styles.dropletShadow,
                  { backgroundColor: dropletEdge },
                ]}
              />
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  frostOverlay: {
    opacity: 0.32,
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  mistBeam: {
    position: 'absolute',
    width: 96,
    borderRadius: 999,
  },
  mistBeamLeft: {
    top: '12%',
    left: -18,
  },
  mistBeamRight: {
    top: '28%',
    right: -22,
  },
  glassPane: {
    position: 'absolute',
    top: '2.5%',
    right: '2%',
    bottom: '2.5%',
    left: '2%',
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.015)',
  },
  glassPaneBorder: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 36,
    opacity: 0.3,
  },
  fogPatch: {
    position: 'absolute',
    borderRadius: 999,
  },
  glassSheen: {
    position: 'absolute',
    top: '5%',
    left: '12%',
    width: '18%',
    height: '84%',
    borderRadius: 999,
    transform: [{ rotate: '7deg' }],
  },
  dropletsLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  droplet: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.4,
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  dropletTail: {
    position: 'absolute',
    top: '78%',
    left: '42%',
    width: '16%',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
    opacity: 0.38,
  },
  dropletCore: {
    position: 'absolute',
    top: '18%',
    left: '24%',
    width: '44%',
    height: '44%',
    borderRadius: 999,
    opacity: 0.32,
  },
  dropletHighlight: {
    position: 'absolute',
    top: 5,
    left: 6,
    width: '28%',
    height: '42%',
    borderRadius: 999,
    opacity: 1,
  },
  dropletShadow: {
    position: 'absolute',
    right: 3,
    bottom: 4,
    width: '48%',
    height: '40%',
    borderRadius: 999,
    opacity: 0.34,
  },
});
