import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Pressable, View, Image, useWindowDimensions } from 'react-native';
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

interface OrbProps {
  disabled: boolean;
  onPress: () => void;
  orbAnimatedStyle: any;
  glowAnimatedStyle: any;
  burstAnimatedStyle: any;
  auraAnimatedStyle: any;
  accessibilityLabel?: string;
}

const ORB_MAX = 300;
const ORB_WIDTH_RATIO = 0.7;

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
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
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
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    />
  );
}

function useSparkles(orbSize: number) {
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
      x={orbSize * 1.5 * sp.x}
      y={orbSize * 1.5 * sp.y}
      size={sp.s}
      dur={sp.d}
      delay={sp.dl}
      color={sp.c}
    />
  )), [orbSize]);
}

export const Orb: React.FC<OrbProps> = ({
  disabled,
  onPress,
  orbAnimatedStyle,
  glowAnimatedStyle,
  burstAnimatedStyle,
  auraAnimatedStyle,
  accessibilityLabel,
}) => {
  const { width } = useWindowDimensions();
  const orbSize = Math.min(ORB_MAX, Math.round(width * ORB_WIDTH_RATIO));
  const container = orbSize * 1.5;

  const sparkles = useSparkles(orbSize);

  return (
    <View style={[styles.container, { width: container, height: container }]}>
      {/* Sparkle particles — scattered around the orb */}
      <View style={StyleSheet.absoluteFillObject}>{sparkles}</View>

      {/* Drifting mist — organic fog behind and around the orb */}
      <View style={styles.mistLayer}>
        <Mist w={200} h={140} ox={18} oy={10} dur={9000} clr="rgba(139, 92, 246, 0.08)" opRange={[0.04, 0.1]} />
        <Mist w={160} h={180} ox={-14} oy={16} dur={11000} clr="rgba(109, 40, 217, 0.07)" opRange={[0.03, 0.09]} />
        <Mist w={130} h={100} ox={20} oy={-12} dur={7500} clr="rgba(232, 121, 249, 0.06)" opRange={[0.03, 0.08]} />
        <Mist w={170} h={120} ox={-10} oy={-14} dur={10000} clr="rgba(167, 139, 250, 0.06)" opRange={[0.03, 0.08]} />
      </View>

      {/* Outer aura */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: orbSize * 1.35,
            height: orbSize * 1.35,
            borderRadius: orbSize,
            overflow: 'hidden',
          },
          auraAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(139, 92, 246, 0.18)',
            'rgba(139, 92, 246, 0.08)',
            'rgba(139, 92, 246, 0.02)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={[styles.gradFill, { borderRadius: orbSize }]}
        />
      </Animated.View>

      {/* Inner aura */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: orbSize * 1.1,
            height: orbSize * 1.1,
            borderRadius: orbSize,
            overflow: 'hidden',
          },
          auraAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(167, 139, 250, 0.15)',
            'rgba(139, 92, 246, 0.06)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.45 }}
          end={{ x: 0.5, y: 0 }}
          style={[styles.gradFill, { borderRadius: orbSize }]}
        />
      </Animated.View>

      {/* Glow intensifier */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: orbSize * 1.05,
            height: orbSize * 1.05,
            borderRadius: orbSize,
            overflow: 'hidden',
          },
          glowAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(192, 132, 252, 0.28)',
            'rgba(139, 92, 246, 0.1)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={[styles.gradFill, { borderRadius: orbSize }]}
        />
      </Animated.View>

      {/* Burst on tap */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: orbSize * 0.85,
            height: orbSize * 0.85,
            borderRadius: orbSize,
            overflow: 'hidden',
          },
          burstAnimatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(196, 132, 252, 0.4)',
            'rgba(139, 92, 246, 0.15)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={[styles.gradFill, { borderRadius: orbSize }]}
        />
      </Animated.View>

      {/* Crystal ball image */}
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? 'Ask the orb'}
        accessibilityState={{ disabled }}
      >
        <Animated.View
          style={[
            { width: orbSize, height: orbSize, alignItems: 'center', justifyContent: 'center' },
            orbAnimatedStyle,
          ]}
        >
          <Image
            source={orbImage}
            style={{ width: orbSize, height: orbSize }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      </Pressable>

      {/* Floor fog */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: orbSize * 0.02,
            width: orbSize * 0.85,
            height: orbSize * 0.18,
            borderRadius: orbSize,
            overflow: 'hidden',
          },
          auraAnimatedStyle,
        ]}
      >
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

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mistLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradFill: {
    width: '100%',
    height: '100%',
  },
  floorFogGrad: {
    width: '100%',
    height: '100%',
  },
});
