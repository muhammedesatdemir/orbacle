import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
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
      {/* Outer aura */}
      <Animated.View style={[styles.aura, auraAnimatedStyle]} />

      {/* Burst effect */}
      <Animated.View style={[styles.burst, burstAnimatedStyle]} />

      {/* Glow ring */}
      <Animated.View style={[styles.glow, glowAnimatedStyle]} />

      {/* Main orb */}
      <Pressable onPress={onPress} disabled={disabled}>
        <Animated.View style={[styles.orbWrapper, orbAnimatedStyle]}>
          <LinearGradient
            colors={[
              colors.neonPurple,
              colors.primary,
              colors.primaryDark,
              '#3b0764',
            ]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.orb}
          >
            {/* Inner highlight */}
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.05)', 'transparent']}
              start={{ x: 0.3, y: 0 }}
              end={{ x: 0.7, y: 0.6 }}
              style={styles.highlight}
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
    borderRadius: ORB_SIZE / 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
    elevation: 20,
  },
  orb: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    overflow: 'hidden',
  },
  highlight: {
    width: ORB_SIZE * 0.7,
    height: ORB_SIZE * 0.5,
    borderRadius: ORB_SIZE,
    position: 'absolute',
    top: ORB_SIZE * 0.08,
    left: ORB_SIZE * 0.15,
  },
  glow: {
    position: 'absolute',
    width: ORB_SIZE * 1.3,
    height: ORB_SIZE * 1.3,
    borderRadius: ORB_SIZE,
    backgroundColor: colors.orbGlow,
    opacity: 0.3,
  },
  aura: {
    position: 'absolute',
    width: ORB_SIZE * 1.6,
    height: ORB_SIZE * 1.6,
    borderRadius: ORB_SIZE,
    backgroundColor: colors.orbAura,
  },
  burst: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: colors.orbBurst,
  },
});
