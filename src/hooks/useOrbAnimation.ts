import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export function useOrbAnimation() {
  const idlePulse = useSharedValue(0);
  const glowIntensity = useSharedValue(0);
  const burstScale = useSharedValue(0);
  const orbScale = useSharedValue(1);
  const isRevealing = useSharedValue(0);

  useEffect(() => {
    idlePulse.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, []);

  const triggerReveal = (onComplete: () => void) => {
    glowIntensity.value = withSequence(
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
      withTiming(0.6, { duration: 200 }),
      withTiming(1, { duration: 300 }),
      withDelay(500, withTiming(0.3, { duration: 400 })),
    );

    orbScale.value = withSequence(
      withTiming(1.15, { duration: 300, easing: Easing.out(Easing.cubic) }),
      withTiming(1.05, { duration: 200 }),
      withTiming(1.1, { duration: 200 }),
      withDelay(500, withTiming(1, { duration: 300 })),
    );

    burstScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withDelay(200, withTiming(1.8, { duration: 600, easing: Easing.out(Easing.cubic) })),
      withTiming(0, { duration: 300 }),
    );

    isRevealing.value = withDelay(
      1400,
      withTiming(1, { duration: 10 }),
    );

    // Callback after animation completes
    setTimeout(onComplete, 1400);
  };

  const resetAnimation = () => {
    isRevealing.value = 0;
    glowIntensity.value = withTiming(0, { duration: 300 });
  };

  const orbAnimatedStyle = useAnimatedStyle(() => {
    const pulseScale = interpolate(idlePulse.value, [0, 1], [1, 1.03]);
    return {
      transform: [{ scale: orbScale.value * pulseScale }],
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => {
    const baseOpacity = interpolate(idlePulse.value, [0, 1], [0.3, 0.55]);
    const activeOpacity = interpolate(glowIntensity.value, [0, 1], [0, 0.5]);
    return {
      opacity: baseOpacity + activeOpacity,
      transform: [{ scale: interpolate(glowIntensity.value, [0, 1], [1, 1.3]) }],
    };
  });

  const burstAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(burstScale.value, [0, 0.5, 1.8], [0, 0.6, 0]),
    transform: [{ scale: burstScale.value }],
  }));

  const auraAnimatedStyle = useAnimatedStyle(() => {
    const baseScale = interpolate(idlePulse.value, [0, 1], [1.1, 1.25]);
    return {
      opacity: interpolate(idlePulse.value, [0, 1], [0.15, 0.3]),
      transform: [{ scale: baseScale }],
    };
  });

  return {
    orbAnimatedStyle,
    glowAnimatedStyle,
    burstAnimatedStyle,
    auraAnimatedStyle,
    triggerReveal,
    resetAnimation,
  };
}
