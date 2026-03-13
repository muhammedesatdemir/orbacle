import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
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

const ORB_SIZE = 200;
const R = ORB_SIZE / 2;

// Internal mist blob that drifts slowly
function MistLayer({
  size,
  color,
  offsetX,
  offsetY,
  duration,
  delay,
}: {
  size: number;
  color: readonly [string, string, ...string[]];
  offsetX: number;
  offsetY: number;
  duration: number;
  delay: number;
}) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const tx = interpolate(drift.value, [0, 1], [-offsetX, offsetX]);
    const ty = interpolate(drift.value, [0, 1], [-offsetY, offsetY]);
    const opacity = interpolate(drift.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return {
      transform: [{ translateX: tx }, { translateY: ty }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={color}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 0.8, y: 0.8 }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    </Animated.View>
  );
}

// Slowly rotating ring/haze
function RotatingHaze({ duration, size, opacity }: { duration: number; size: number; opacity: number }) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={[
          'transparent',
          `rgba(139, 92, 246, ${opacity})`,
          'transparent',
          `rgba(96, 165, 250, ${opacity * 0.5})`,
          'transparent',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    </Animated.View>
  );
}

export const Orb: React.FC<OrbProps> = ({
  disabled,
  onPress,
  orbAnimatedStyle,
  glowAnimatedStyle,
  burstAnimatedStyle,
  auraAnimatedStyle,
}) => {
  return (
    <View style={styles.container}>
      {/* Outer aura — soft atmospheric ring */}
      <Animated.View style={[styles.aura, auraAnimatedStyle]} />

      {/* Secondary glow ring */}
      <Animated.View style={[styles.glowOuter, glowAnimatedStyle]} />

      {/* Burst effect */}
      <Animated.View style={[styles.burst, burstAnimatedStyle]} />

      {/* Inner glow ring */}
      <Animated.View style={[styles.glowInner, glowAnimatedStyle]} />

      {/* Main orb */}
      <Pressable onPress={onPress} disabled={disabled}>
        <Animated.View style={[styles.orbWrapper, orbAnimatedStyle]}>
          {/* Base sphere gradient — deep dark core */}
          <LinearGradient
            colors={['#2d1b69', '#1a0a3e', '#0d0520', '#060210']}
            start={{ x: 0.3, y: 0 }}
            end={{ x: 0.7, y: 1 }}
            style={styles.orb}
          >
            {/* Mist layers — drifting fog inside the orb */}
            <View style={styles.mistContainer}>
              <MistLayer
                size={ORB_SIZE * 0.7}
                color={['transparent', 'rgba(139, 92, 246, 0.4)', 'rgba(88, 28, 135, 0.2)', 'transparent']}
                offsetX={15}
                offsetY={10}
                duration={6000}
                delay={0}
              />
              <MistLayer
                size={ORB_SIZE * 0.55}
                color={['transparent', 'rgba(96, 165, 250, 0.25)', 'rgba(139, 92, 246, 0.3)', 'transparent']}
                offsetX={-12}
                offsetY={18}
                duration={8000}
                delay={500}
              />
              <MistLayer
                size={ORB_SIZE * 0.45}
                color={['transparent', 'rgba(192, 132, 252, 0.35)', 'transparent']}
                offsetX={20}
                offsetY={-8}
                duration={5000}
                delay={1000}
              />
              <MistLayer
                size={ORB_SIZE * 0.6}
                color={['transparent', 'rgba(167, 139, 250, 0.2)', 'rgba(6, 182, 212, 0.15)', 'transparent']}
                offsetX={-8}
                offsetY={-15}
                duration={7000}
                delay={200}
              />
              {/* Smaller wisps for detail */}
              <MistLayer
                size={ORB_SIZE * 0.3}
                color={['transparent', 'rgba(232, 121, 249, 0.3)', 'transparent']}
                offsetX={25}
                offsetY={5}
                duration={4500}
                delay={800}
              />
            </View>

            {/* Rotating haze — adds slow swirling movement */}
            <View style={styles.hazeContainer}>
              <RotatingHaze duration={20000} size={ORB_SIZE * 0.9} opacity={0.2} />
              <RotatingHaze duration={30000} size={ORB_SIZE * 0.7} opacity={0.15} />
            </View>

            {/* Inner luminous core — center glow */}
            <LinearGradient
              colors={[
                'rgba(167, 139, 250, 0.35)',
                'rgba(139, 92, 246, 0.15)',
                'transparent',
              ]}
              start={{ x: 0.5, y: 0.3 }}
              end={{ x: 0.5, y: 0.9 }}
              style={styles.innerCore}
            />

            {/* Specular highlight — glassy reflection at top */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.35)',
                'rgba(255, 255, 255, 0.12)',
                'rgba(255, 255, 255, 0.02)',
                'transparent',
              ]}
              start={{ x: 0.4, y: 0 }}
              end={{ x: 0.6, y: 0.5 }}
              style={styles.specularMain}
            />

            {/* Secondary smaller highlight */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.2)',
                'rgba(255, 255, 255, 0.05)',
                'transparent',
              ]}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.5, y: 0.35 }}
              style={styles.specularSmall}
            />

            {/* Rim light — subtle edge glow at bottom */}
            <LinearGradient
              colors={[
                'transparent',
                'transparent',
                'rgba(139, 92, 246, 0.15)',
                'rgba(96, 165, 250, 0.1)',
              ]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.rimLight}
            />

            {/* Glass surface overlay — adds "glass ball" feel */}
            <LinearGradient
              colors={[
                'rgba(255, 255, 255, 0.06)',
                'transparent',
                'transparent',
                'rgba(255, 255, 255, 0.03)',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.glassSurface}
            />
          </LinearGradient>
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE * 1.8,
    height: ORB_SIZE * 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbWrapper: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: R,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
    elevation: 25,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: R,
    overflow: 'hidden',
  },
  mistContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hazeContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCore: {
    position: 'absolute',
    width: ORB_SIZE * 0.6,
    height: ORB_SIZE * 0.6,
    borderRadius: ORB_SIZE * 0.3,
    left: ORB_SIZE * 0.2,
    top: ORB_SIZE * 0.2,
  },
  specularMain: {
    position: 'absolute',
    width: ORB_SIZE * 0.55,
    height: ORB_SIZE * 0.35,
    borderRadius: ORB_SIZE,
    top: ORB_SIZE * 0.06,
    left: ORB_SIZE * 0.18,
  },
  specularSmall: {
    position: 'absolute',
    width: ORB_SIZE * 0.25,
    height: ORB_SIZE * 0.15,
    borderRadius: ORB_SIZE,
    top: ORB_SIZE * 0.1,
    left: ORB_SIZE * 0.25,
  },
  rimLight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: R,
  },
  glassSurface: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: R,
  },
  glowOuter: {
    position: 'absolute',
    width: ORB_SIZE * 1.4,
    height: ORB_SIZE * 1.4,
    borderRadius: ORB_SIZE,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  glowInner: {
    position: 'absolute',
    width: ORB_SIZE * 1.15,
    height: ORB_SIZE * 1.15,
    borderRadius: ORB_SIZE,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
  },
  aura: {
    position: 'absolute',
    width: ORB_SIZE * 1.7,
    height: ORB_SIZE * 1.7,
    borderRadius: ORB_SIZE,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  burst: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: R,
    backgroundColor: colors.orbBurst,
  },
});
