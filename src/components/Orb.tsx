import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View, Image } from 'react-native';
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

const ORB_SIZE = 270;

const orbImage = require('../../assets/orb.webp');

// Very soft drifting mist blob
function MistBlob({
  size,
  offsetX,
  offsetY,
  dur,
  color,
}: {
  size: number;
  offsetX: number;
  offsetY: number;
  dur: number;
  color: string;
}) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: dur, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-offsetX, offsetX]) },
      { translateY: interpolate(drift.value, [0, 1], [-offsetY, offsetY]) },
      { scale: interpolate(drift.value, [0, 0.5, 1], [0.9, 1.12, 0.9]) },
    ],
    opacity: interpolate(drift.value, [0, 0.5, 1], [0.06, 0.12, 0.06]),
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
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
      {/* Drifting mist — very subtle atmospheric fog */}
      <View style={styles.mistLayer}>
        <MistBlob size={180} offsetX={20} offsetY={12} dur={8000} color="rgba(139, 92, 246, 0.10)" />
        <MistBlob size={150} offsetX={-14} offsetY={18} dur={10000} color="rgba(109, 40, 217, 0.08)" />
        <MistBlob size={120} offsetX={16} offsetY={-10} dur={7000} color="rgba(232, 121, 249, 0.07)" />
      </View>

      {/* Ambient aura — soft radial glow, no hard edge */}
      <Animated.View style={[styles.aura, auraAnimatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(139, 92, 246, 0.25)',
            'rgba(139, 92, 246, 0.12)',
            'rgba(139, 92, 246, 0.04)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.auraGrad}
        />
      </Animated.View>

      {/* Glow intensifier — driven by glowAnimatedStyle on tap */}
      <Animated.View style={[styles.glowLayer, glowAnimatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(167, 139, 250, 0.3)',
            'rgba(139, 92, 246, 0.1)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.auraGrad}
        />
      </Animated.View>

      {/* Burst effect on tap */}
      <Animated.View style={[styles.burst, burstAnimatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(196, 132, 252, 0.4)',
            'rgba(139, 92, 246, 0.15)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 0.5, y: 0 }}
          style={styles.auraGrad}
        />
      </Animated.View>

      {/* Crystal ball image */}
      <Pressable onPress={onPress} disabled={disabled}>
        <Animated.View style={[styles.imageWrapper, orbAnimatedStyle]}>
          <Image source={orbImage} style={styles.orbImage} resizeMode="contain" />
        </Animated.View>
      </Pressable>

      {/* Floor glow — elliptical light beneath the stand */}
      <Animated.View style={[styles.floorGlow, auraAnimatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(139, 92, 246, 0.15)',
            'rgba(192, 132, 252, 0.06)',
            'transparent',
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.floorGlowGrad}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: ORB_SIZE * 1.5,
    height: ORB_SIZE * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mistLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aura: {
    position: 'absolute',
    width: ORB_SIZE * 1.3,
    height: ORB_SIZE * 1.3,
    borderRadius: ORB_SIZE,
    overflow: 'hidden',
  },
  glowLayer: {
    position: 'absolute',
    width: ORB_SIZE * 1.1,
    height: ORB_SIZE * 1.1,
    borderRadius: ORB_SIZE,
    overflow: 'hidden',
  },
  auraGrad: {
    width: '100%',
    height: '100%',
    borderRadius: ORB_SIZE,
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
  floorGlow: {
    position: 'absolute',
    bottom: ORB_SIZE * 0.05,
    width: ORB_SIZE * 0.7,
    height: ORB_SIZE * 0.12,
    borderRadius: ORB_SIZE,
    overflow: 'hidden',
  },
  floorGlowGrad: {
    width: '100%',
    height: '100%',
  },
});
