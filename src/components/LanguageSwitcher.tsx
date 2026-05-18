import React, { useMemo } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Language, supportedLanguages } from '../types/language';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface LanguageSwitcherProps {
  current: Language;
  label: string;
  onPress: () => void;
}

// Compact one-row card: leading label ("Dil"), trailing native name of the
// current language, and a chevron. Tapping opens the picker — the actual
// 10-language list lives in LanguagePickerSheet so it doesn't dominate the
// Settings screen.
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  current,
  label,
  onPress,
}) => {
  const nativeName = useMemo(
    () =>
      supportedLanguages.find((l) => l.code === current)?.nativeName ?? current,
    [current],
  );

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${nativeName}`}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.trailing}>
        <Text style={styles.value} numberOfLines={1}>
          {nativeName}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.body,
    color: colors.text,
    marginRight: spacing.md,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  value: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'right',
  },
  chevron: {
    ...typography.body,
    fontSize: 22,
    lineHeight: 22,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});
