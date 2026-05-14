import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface AnswerCardProps {
  label: string;
  answer: string;
  // When provided, a star toggle is shown in the card corner.
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  favoriteA11yLabel?: string;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  label,
  answer,
  isFavorite,
  onToggleFavorite,
  favoriteA11yLabel,
}) => {
  return (
    <Animated.View
      entering={FadeIn.duration(600).delay(100)}
      style={styles.container}
    >
      <View style={styles.card}>
        {onToggleFavorite && (
          <Pressable
            onPress={onToggleFavorite}
            hitSlop={spacing.md}
            style={styles.starButton}
            accessibilityRole="button"
            accessibilityLabel={favoriteA11yLabel}
            accessibilityState={{ selected: !!isFavorite }}
          >
            <Text style={styles.star}>{isFavorite ? '★' : '☆'}</Text>
          </Pressable>
        )}
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.answer}>"{answer}"</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  starButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  star: {
    fontSize: 22,
    color: colors.primaryLight,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  answer: {
    ...typography.answer,
    color: colors.text,
    textAlign: 'center',
  },
});
