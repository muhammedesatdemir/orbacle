import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'filled' | 'ghost';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  style,
  variant = 'ghost',
}) => {
  if (variant === 'filled') {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, style]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.filledButton}
        >
          <Text style={styles.filledText}>{title}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.ghostButton, { opacity: pressed ? 0.7 : 1 }, style]}
    >
      <Text style={styles.ghostText}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  ghostButton: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBg,
  },
  ghostText: {
    ...typography.body,
    color: colors.primaryLight,
    textAlign: 'center',
    fontWeight: '500',
  },
  filledButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  filledText: {
    ...typography.body,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
});
