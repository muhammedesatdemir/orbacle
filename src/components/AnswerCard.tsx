import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface AnswerCardProps {
  label: string;
  answer: string;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ label, answer }) => {
  return (
    <Animated.View
      entering={FadeIn.duration(600).delay(100)}
      style={styles.container}
    >
      <View style={styles.card}>
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
