import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { useAppPalette } from '../hooks/useAppPalette';

const DELIVERY_TRUCK = require('../../assets/splash/water-drop-delivery-truck.png');
const SPLASH_REPEAT_COUNT = 1;
const SPLASH_CYCLE_DURATION_MS = 2950;
const SPLASH_FINAL_PHASE_MS = 820;

interface WaterDropSplashProps {
  onFinish: () => void;
}

export function WaterDropSplash({ onFinish }: WaterDropSplashProps) {
  const palette = useAppPalette();
  const hasFinishedRef = useRef(false);
  const fillProgress = useRef(new Animated.Value(0)).current;
  const glassFloat = useRef(new Animated.Value(0)).current;
  const waveShift = useRef(new Animated.Value(0)).current;
  const dropletOne = useRef(new Animated.Value(0)).current;
  const dropletTwo = useRef(new Animated.Value(0)).current;
  const dropletThree = useRef(new Animated.Value(0)).current;
  const titleReveal = useRef(new Animated.Value(0)).current;
  const truckProgress = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const complete = () => {
      if (hasFinishedRef.current) {
        return;
      }

      hasFinishedRef.current = true;
      onFinish();
    };

    const createDropletLoop = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1280,
            easing: Easing.in(Easing.quad),
            useNativeDriver: false,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ]),
      );

    const dropletAnimations = [
      createDropletLoop(dropletOne, 0),
      createDropletLoop(dropletTwo, 260),
      createDropletLoop(dropletThree, 540),
    ];

    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glassFloat, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glassFloat, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );

    const waveAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(waveShift, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(waveShift, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );

    dropletAnimations.forEach(animation => animation.start());
    floatAnimation.start();
    waveAnimation.start();

    const splashCycle = Animated.sequence([
      Animated.parallel([
        Animated.timing(fillProgress, {
          toValue: 1,
          duration: 1750,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.sequence([
          Animated.delay(1020),
          Animated.spring(titleReveal, {
            toValue: 1,
            tension: 42,
            friction: 8,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.delay(1380),
          Animated.timing(truckProgress, {
            toValue: 1,
            duration: 860,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: false,
          }),
        ]),
      ]),
      Animated.delay(360),
      Animated.parallel([
        Animated.timing(fillProgress, {
          toValue: 0,
          duration: 240,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(titleReveal, {
          toValue: 0,
          duration: 220,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(truckProgress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
      Animated.delay(140),
    ]);

    const fullSequence = Animated.sequence([
      // Temporary: replay the splash 10 times for review. We'll switch this back to once later.
      Animated.loop(splashCycle, { iterations: SPLASH_REPEAT_COUNT }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 520,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false,
      }),
    ]);

    fullSequence.start(({ finished }) => {
      if (finished) {
        complete();
      }
    });

    const fallbackTimer = setTimeout(() => {
      complete();
    }, SPLASH_REPEAT_COUNT * SPLASH_CYCLE_DURATION_MS + SPLASH_FINAL_PHASE_MS);

    return () => {
      clearTimeout(fallbackTimer);
      fullSequence.stop();
      floatAnimation.stop();
      waveAnimation.stop();
      dropletAnimations.forEach(animation => animation.stop());
    };
  }, [
    dropletOne,
    dropletThree,
    dropletTwo,
    fillProgress,
    glassFloat,
    onFinish,
    overlayOpacity,
    titleReveal,
    truckProgress,
    waveShift,
  ]);

  const waterHeight = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 202],
  });

  const waterOpacity = fillProgress.interpolate({
    inputRange: [0, 0.12, 1],
    outputRange: [0.18, 0.58, 0.88],
  });

  const wavePrimaryShift = waveShift.interpolate({
    inputRange: [0, 1],
    outputRange: [-14, 10],
  });

  const waveSecondaryShift = waveShift.interpolate({
    inputRange: [0, 1],
    outputRange: [10, -12],
  });

  const glassTranslateY = glassFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const titleTranslateY = titleReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const titleOpacity = titleReveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const truckTranslateX = truckProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [screenWidth * 0.12, -screenWidth * 0.12],
  });

  const truckBounce = truckProgress.interpolate({
    inputRange: [0, 0.18, 0.34, 0.52, 0.7, 1],
    outputRange: [0, -2, 0, -1, 0, 0],
  });

  const pourOpacity = fillProgress.interpolate({
    inputRange: [0, 0.05, 0.88, 1],
    outputRange: [0, 0.92, 0.88, 0],
  });

  const pourScaleY = fillProgress.interpolate({
    inputRange: [0, 0.14, 1],
    outputRange: [0.18, 1, 1],
  });

  const pourTranslateY = fillProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-26, 2],
  });

  const pourShiftX = waveShift.interpolate({
    inputRange: [0, 1],
    outputRange: [-2.5, 2.5],
  });

  const pourCoreScaleX = waveShift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.86, 1.08, 0.92],
  });

  const pourGlowScaleX = waveShift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.88, 1.08, 0.94],
  });

  const neckSplashOpacity = fillProgress.interpolate({
    inputRange: [0, 0.08, 0.82, 1],
    outputRange: [0, 0.72, 0.58, 0],
  });

  const neckSplashScale = waveShift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.92, 1.06, 0.95],
  });

  const brandPlateAnimatedStyle = {
    backgroundColor: palette.isDark
      ? 'rgba(10, 25, 43, 0.5)'
      : 'rgba(255, 255, 255, 0.52)',
    borderColor: palette.isDark
      ? 'rgba(103, 232, 249, 0.34)'
      : 'rgba(2, 132, 199, 0.22)',
    opacity: titleOpacity,
    transform: [{ translateY: titleTranslateY }],
  };

  const brandSecondaryStyle = {
    color: palette.isDark ? 'rgba(224, 242, 254, 0.85)' : palette.accentStrong,
  };

  const renderDroplet = (
    value: Animated.Value,
    left: number,
    size: number,
    delayOffset: number,
  ) => {
    const translateY = value.interpolate({
      inputRange: [0, 0.14, 0.84, 1],
      outputRange: [-148 - delayOffset, -120 - delayOffset, 108, 146],
    });

    const opacity = value.interpolate({
      inputRange: [0, 0.08, 0.82, 1],
      outputRange: [0, 1, 1, 0],
    });

    const scaleY = value.interpolate({
      inputRange: [0, 0.22, 0.78, 1],
      outputRange: [0.72, 1.06, 0.92, 0.76],
    });

    return (
      <Animated.View
        style={[
          styles.dropletWrap,
          {
            left,
            width: size,
            height: size * 1.35,
            opacity,
            transform: [{ translateY }, { scaleY }],
          },
        ]}
      >
        <View
          style={[
            styles.dropletHead,
            styles.dropletHeadBrand,
            {
              backgroundColor: palette.accent,
              width: size,
              height: size,
              borderTopLeftRadius: size * 0.62,
              borderTopRightRadius: size * 0.62,
              borderBottomLeftRadius: size * 0.62,
              borderBottomRightRadius: size * 0.18,
            },
          ]}
        />
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          backgroundColor: palette.background,
          opacity: overlayOpacity,
        },
      ]}
    >
      <View pointerEvents="none" style={styles.backgroundDecor}>
        <View
          style={[
            styles.glowOrb,
            styles.glowOrbTop,
            { backgroundColor: palette.heroTop },
          ]}
        />
        <View
          style={[
            styles.glowOrb,
            styles.glowOrbBottom,
            { backgroundColor: palette.heroBottom },
          ]}
        />
        <View
          style={[
            styles.gridBeam,
            styles.gridBeamLeft,
            { backgroundColor: palette.accentSoft },
          ]}
        />
        <View
          style={[
            styles.gridBeam,
            styles.gridBeamRight,
            { backgroundColor: palette.heroBottom },
          ]}
        />
      </View>

      <View style={styles.centerWrap}>
        <Animated.View
          style={[
            styles.sceneWrap,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.canCluster,
              {
                transform: [{ translateY: glassTranslateY }],
              },
            ]}
          >
            <Animated.View
              style={[
                styles.pourStreamWrap,
                {
                  opacity: pourOpacity,
                  transform: [{ translateY: pourTranslateY }, { translateX: pourShiftX }],
                },
              ]}
            >
              <View style={styles.pourSourceGlow} />
              <Animated.View
                style={[
                  styles.pourStreamGlow,
                  {
                    transform: [{ scaleX: pourGlowScaleX }, { scaleY: pourScaleY }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.pourStreamHighlight,
                  {
                    transform: [{ scaleY: pourScaleY }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.pourStreamCore,
                  {
                    backgroundColor: palette.accent,
                    transform: [{ scaleX: pourCoreScaleX }, { scaleY: pourScaleY }],
                  },
                ]}
              />
            </Animated.View>

            {renderDroplet(dropletOne, 98, 18, 0)}
            {renderDroplet(dropletTwo, 132, 14, 16)}
            {renderDroplet(dropletThree, 162, 20, 6)}

            <View
              style={[
                styles.canTopCap,
                {
                  backgroundColor: palette.accentStrong,
                  shadowColor: palette.shadow,
                },
              ]}
            />

            <View
              style={[
                styles.canNeck,
                styles.canNeckGlass,
              ]}
            >
              <Animated.View
                style={[
                  styles.neckSplash,
                  {
                    opacity: neckSplashOpacity,
                    transform: [{ scale: neckSplashScale }],
                  },
                ]}
              />
            </View>

            <View
              style={[
                styles.canBody,
                styles.canBodyGlass,
                { shadowColor: palette.shadow },
              ]}
            >
              <View style={styles.bodyGrooveRow}>
                <View style={styles.bodyGroove} />
                <View style={styles.bodyGroove} />
                <View style={styles.bodyGroove} />
              </View>

              <View
                style={[
                  styles.bodyHighlight,
                  styles.bodyHighlightTint,
                ]}
              />
              <View
                style={[
                  styles.bodyHighlightThin,
                  styles.bodyHighlightThinTint,
                ]}
              />

              <View
                style={[
                  styles.sideHandle,
                  styles.sideHandleGlass,
                ]}
              />

              <View style={styles.waterClip}>
                <Animated.View
                  style={[
                    styles.waterFill,
                    {
                      height: waterHeight,
                      opacity: waterOpacity,
                      backgroundColor: palette.accent,
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.waterWavePrimary,
                      {
                        backgroundColor: palette.accentStrong,
                        transform: [{ translateX: wavePrimaryShift }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.waterWaveSecondary,
                      {
                        transform: [{ translateX: waveSecondaryShift }],
                      },
                    ]}
                  />
                </Animated.View>
              </View>

              <View style={styles.labelWrap}>
                <Animated.View
                  style={[
                    styles.brandPlate,
                    brandPlateAnimatedStyle,
                  ]}
                >
                  <View style={styles.wordmark}>
                    <Animated.Text style={[styles.wordmarkPrimary, { color: palette.text }]}>
                      Water
                    </Animated.Text>
                    <Animated.Text
                      style={[
                        styles.wordmarkPrimary,
                        styles.wordmarkAccent,
                        { color: palette.accentStrong },
                      ]}
                    >
                      Drop
                    </Animated.Text>
                  </View>

                  <Animated.Text
                    style={[
                      styles.brandSecondary,
                      brandSecondaryStyle,
                    ]}
                  >
                    SUPPLY
                  </Animated.Text>
                </Animated.View>
              </View>

              <View style={styles.bubbleWrap}>
                <View style={[styles.bubble, styles.bubbleOne]} />
                <View style={[styles.bubble, styles.bubbleTwo]} />
                <View style={[styles.bubble, styles.bubbleThree]} />
              </View>
            </View>
          </Animated.View>

          <Animated.Text
            style={[
              styles.splashTagline,
              {
                color: palette.muted,
                opacity: titleOpacity,
                transform: [{ translateY: titleTranslateY }],
              },
            ]}
          >
            Premium delivery network for every refill run
          </Animated.Text>

          <Animated.View
            style={[
              styles.truckLane,
              {
                transform: [{ translateX: truckTranslateX }, { translateY: truckBounce }],
                opacity: truckProgress,
              },
            ]}
          >
            <Animated.Image
              source={DELIVERY_TRUCK}
              resizeMode="contain"
              style={styles.truckImage}
            />
          </Animated.View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const POUR_STREAM_HEIGHT = Math.min(Math.max(screenHeight * 0.62, 420), 560);
const POUR_STREAM_TOP_OFFSET = -Math.min(Math.max(screenHeight * 0.42, 250), 340);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
  },
  backgroundDecor: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  glowOrbTop: {
    width: screenWidth * 0.78,
    height: screenWidth * 0.78,
    top: -screenWidth * 0.2,
    right: -screenWidth * 0.2,
  },
  glowOrbBottom: {
    width: screenWidth * 0.86,
    height: screenWidth * 0.86,
    bottom: -screenWidth * 0.32,
    left: -screenWidth * 0.24,
  },
  gridBeam: {
    position: 'absolute',
    width: 90,
    height: screenHeight * 0.72,
    borderRadius: 80,
    opacity: 0.34,
  },
  gridBeamLeft: {
    top: screenHeight * 0.16,
    left: -20,
    transform: [{ rotate: '18deg' }],
  },
  gridBeamRight: {
    top: screenHeight * 0.04,
    right: -18,
    transform: [{ rotate: '-18deg' }],
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  sceneWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  canCluster: {
    width: 260,
    height: 346,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 18,
  },
  pourStreamWrap: {
    position: 'absolute',
    top: POUR_STREAM_TOP_OFFSET,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 42,
    height: POUR_STREAM_HEIGHT,
    zIndex: 5,
  },
  pourSourceGlow: {
    position: 'absolute',
    top: 0,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: 'rgba(191, 219, 254, 0.34)',
  },
  pourStreamGlow: {
    position: 'absolute',
    top: 12,
    bottom: -96,
    width: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(125, 211, 252, 0.28)',
  },
  pourStreamHighlight: {
    position: 'absolute',
    top: 22,
    bottom: -84,
    width: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  pourStreamCore: {
    position: 'absolute',
    top: 14,
    bottom: -104,
    width: 14,
    borderRadius: 999,
    shadowColor: '#7DD3FC',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 0,
    },
  },
  dropletWrap: {
    position: 'absolute',
    top: 56,
    zIndex: 6,
  },
  dropletHead: {
    transform: [{ rotate: '45deg' }],
  },
  dropletHeadBrand: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.92)',
  },
  canTopCap: {
    width: 76,
    height: 20,
    borderRadius: 12,
    marginBottom: -2,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 3,
  },
  canNeck: {
    width: 92,
    height: 44,
    borderWidth: 2.5,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  canNeckGlass: {
    borderColor: 'rgba(255,255,255,0.58)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  neckSplash: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 6,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(224, 242, 254, 0.75)',
  },
  canBody: {
    width: 228,
    height: 258,
    marginTop: -1,
    borderWidth: 2.8,
    borderTopLeftRadius: 64,
    borderTopRightRadius: 64,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    elevation: 9,
  },
  canBodyGlass: {
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  bodyGrooveRow: {
    position: 'absolute',
    top: 54,
    left: 22,
    right: 22,
    flexDirection: 'column',
    gap: 38,
    opacity: 0.26,
  },
  bodyGroove: {
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  bodyHighlight: {
    position: 'absolute',
    top: 34,
    left: 24,
    width: 28,
    height: 164,
    borderRadius: 18,
  },
  bodyHighlightTint: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  bodyHighlightThin: {
    position: 'absolute',
    top: 52,
    left: 60,
    width: 10,
    height: 96,
    borderRadius: 10,
  },
  bodyHighlightThinTint: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  sideHandle: {
    position: 'absolute',
    top: 84,
    right: 10,
    width: 52,
    height: 110,
    borderWidth: 10,
    borderLeftWidth: 0,
    borderRadius: 36,
    opacity: 0.84,
  },
  sideHandleGlass: {
    borderColor: 'rgba(255,255,255,0.48)',
  },
  waterClip: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    height: 226,
    borderTopLeftRadius: 52,
    borderTopRightRadius: 52,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  waterFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  waterWavePrimary: {
    position: 'absolute',
    top: -12,
    left: -20,
    width: 150,
    height: 28,
    borderRadius: 22,
  },
  waterWaveSecondary: {
    position: 'absolute',
    top: -8,
    right: -18,
    width: 160,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
  },
  labelWrap: {
    position: 'absolute',
    top: 104,
    left: 34,
    right: 34,
    alignItems: 'center',
    zIndex: 7,
  },
  brandPlate: {
    minWidth: 142,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },
  bubbleWrap: {
    position: 'absolute',
    left: 28,
    right: 56,
    bottom: 32,
    top: 112,
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.26)',
  },
  bubbleOne: {
    width: 10,
    height: 10,
    left: 22,
    bottom: 36,
  },
  bubbleTwo: {
    width: 14,
    height: 14,
    right: 38,
    bottom: 92,
  },
  bubbleThree: {
    width: 8,
    height: 8,
    left: 70,
    bottom: 138,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkAccent: {
    marginLeft: 6,
  },
  wordmarkPrimary: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  brandSecondary: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.6,
  },
  splashTagline: {
    marginTop: -4,
    marginBottom: 10,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    maxWidth: 280,
  },
  truckLane: {
    marginTop: 18,
    width: 262,
    height: 126,
    alignSelf: 'center',
  },
  truckImage: {
    width: '100%',
    height: '100%',
  },
});
