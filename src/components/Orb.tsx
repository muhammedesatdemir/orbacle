import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Pressable, View, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';

interface OrbProps {
  disabled: boolean;
  onPress: () => void;
  orbAnimatedStyle: any;
  glowAnimatedStyle: any;
  burstAnimatedStyle: any;
  auraAnimatedStyle: any;
}

const ORB_SIZE = 270;

const orbImage = require('../../assets/orb.webp');

// Organic drifting mist — asymmetric scaling for natural fog look
function Mist({
  w,
  h,
  ox,
  oy,
  dur,
  clr,
  opRange,
}: {
  w: number;
  h: number;
  ox: number;
  oy: number;
  dur: number;
  clr: string;
  opRange: [number, number];
}) {
  const d = useSharedValue(0);

  useEffect(() => {
    d.value = withRepeat(
      withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(d.value, [0, 1], [-ox, ox]) },
      { translateY: interpolate(d.value, [0, 1], [-oy, oy]) },
      { scaleX: interpolate(d.value, [0, 0.5, 1], [0.85, 1.15, 0.85]) },
      { scaleY: interpolate(d.value, [0, 0.5, 1], [1.1, 0.88, 1.1]) },
    ],
    opacity: interpolate(d.value, [0, 0.5, 1], [opRange[0], opRange[1], opRange[0]]),
  }));

  const r = Math.min(w, h) / 2;

  return (
    <Animated.View
      style={[
        { position: 'absolute', width: w, height: h, borderRadius: r, backgroundColor: clr },
        style,
      ]}
    />
  );
}

// Tiny sparkle dot
function Sparkle({ x, y, size, delay, dur, color }: {
  x: number; y: number; size: number; delay: number; dur: number; color: string;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: dur * 0.35, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: dur * 0.65, easing: Easing.in(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: p.value * 0.7,
    transform: [{ scale: interpolate(p.value, [0, 1], [0.3, 1]) }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

function useSparkles() {
  return useMemo(() => [
    { x: 0.15, y: 0.2, s: 2, d: 1200, dl: 0, c: '#e0d0ff' },
    { x: 0.82, y: 0.25, s: 2.5, d: 1500, dl: 400, c: '#ffffff' },
    { x: 0.25, y: 0.75, s: 2, d: 1100, dl: 800, c: '#c4b5fd' },
    { x: 0.78, y: 0.7, s: 1.5, d: 1400, dl: 200, c: '#ddd6fe' },
    { x: 0.5, y: 0.12, s: 2, d: 1300, dl: 600, c: '#e8e0ff' },
    { x: 0.1, y: 0.5, s: 1.5, d: 1000, dl: 1000, c: '#ffffff' },
    { x: 0.88, y: 0.48, s: 2, d: 1600, dl: 300, c: '#c4b5fd' },
  ].map((sp) => (
    <Sparkle
      key={`${sp.x}-${sp.y}`}
      x={ORB_SIZE * 1.5 * sp.x}
      y={ORB_SIZE * 1.5 * sp.y}
      size={sp.s}
      dur={sp.d}
      delay={sp.dl}
      color={sp.c}
    />
  )), []);
}

export const Orb: React.FC<OrbProps> = ({
  disabled,
  onPress,
  orbAnimatedStyle,
  glowAnimatedStyle,
  burstAnimatedStyle,
  auraAnimatedStyle,
}) => {
  const sparkles = useSparkles();

  return (
    <View style={styles.container}>
      {/* Sparkle particles — scattered around the orb */}
      <View style={styles.sparkleLayer}>{sparkles}</View>

      {/* Drifting mist — organic fog behind and around the orb */}
      <View style={styles.mistLayer}>
        <Mist w={200} h={140} ox={18} oy={10} dur={9000} clr="rgba(139, 92, 246, 0.08)" opRange={[0.04, 0.1]} />
        <Mist w={160} h={180} ox={-14} oy={16} dur={11000} clr="rgba(109, 40, 217, 0.07)" opRange={[0.03, 0.09]} />
        <Mist w={130} h={100} ox={20} oy={-12} dur={7500} clr="rgba(232, 121, 249, 0.06)" opRange={[0.03, 0.08]} />
        <Mist w={170} h={120} ox={-10} oy={-14} dur={10000} clr="rgba(167, 139, 250, 0.06)" opRange={[0.03, 0.08]} />
      </View>

      {/* Outer aura — very soft ambient halo */}
      <Animated.View style={[styles.auraOuter, auraAnimatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(139, 92, 246, 0.18)',
            'rgba(139, 92, 246, 0.08)',
            'rgba(139, 92, 246, 0.02)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.gradFill}
        />
      </Animated.View>

      {/* Inner aura — slightly tighter, warmer tint */}
      <Animated.View style={[styles.auraInner, auraAnimatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(167, 139, 250, 0.15)',
            'rgba(139, 92, 246, 0.06)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.45 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.gradFill}
        />
      </Animated.View>

      {/* Glow intensifier — activates on tap */}
      <Animated.View style={[styles.glowLayer, glowAnimatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(192, 132, 252, 0.28)',
            'rgba(139, 92, 246, 0.1)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.gradFill}
        />
      </Animated.View>

      {/* Burst on tap */}
      <Animated.View style={[styles.burst, burstAnimatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(196, 132, 252, 0.4)',
            'rgba(139, 92, 246, 0.15)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.gradFill}
        />
      </Animated.View>

      {/* Crystal ball image */}
      <Pressable onPress={onPress} disabled={disabled}>
        <Animated.View style={[styles.imageWrapper, orbAnimatedStyle]}>
          <Image source={orbImage} style={styles.orbImage} resizeMode="contain" />
        </Animated.View>
      </Pressable>

      {/* Floor fog — wide elliptical glow beneath the stand */}
      <Animated.View style={[styles.floorFog, auraAnimatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(139, 92, 246, 0.2)',
            'rgba(192, 132, 252, 0.08)',
            'rgba(139, 92, 246, 0.03)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.floorFogGrad}
        />
      </Animated.View>
    </View>
  );
};

const CONTAINER = ORB_SIZE * 1.5;

const styles = StyleSheet.create({
  container: {
    width: CONTAINER,
    height: CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  mistLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradFill: {
    width: '100%',
    height: '100%',
    borderRadius: ORB_SIZE,
  },
  auraOuter: {
    position: 'absolute',
    width: ORB_SIZE * 1.35,
    height: ORB_SIZE * 1.35,
    borderRadius: ORB_SIZE,
    overflow: 'hidden',
  },
  auraInner: {
    position: 'absolute',
    width: ORB_SIZE * 1.1,
    height: ORB_SIZE * 1.1,
    borderRadius: ORB_SIZE,
    overflow: 'hidden',
  },
  glowLayer: {
    position: 'absolute',
    width: ORB_SIZE * 1.05,
    height: ORB_SIZE * 1.05,
    borderRadius: ORB_SIZE,
    overflow: 'hidden',
  },
  burst: {
    position: 'absolute',
    width: ORB_SIZE * 0.85,
    height: ORB_SIZE * 0.85,
    borderRadius: ORB_SIZE,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbImage: {
    width: ORB_SIZE,
    height: ORB_SIZE,
  },
  floorFog: {
    position: 'absolute',
    bottom: ORB_SIZE * 0.02,
    width: ORB_SIZE * 0.85,
    height: ORB_SIZE * 0.18,
    borderRadius: ORB_SIZE,
    overflow: 'hidden',
  },
  floorFogGrad: {
    width: '100%',
    height: '100%',
  },
});
