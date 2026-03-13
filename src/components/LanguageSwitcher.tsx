import React from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Language } from '../types/language';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface LanguageSwitcherProps {
  current: Language;
  onSelect: (lang: Language) => void;
  labels: { en: string; tr: string };
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  current,
  onSelect,
  labels,
}) => {
  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.option, current === 'en' && styles.active]}
        onPress={() => onSelect('en')}
      >
        <Text style={[styles.text, current === 'en' && styles.activeText]}>
          {labels.en}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.option, current === 'tr' && styles.active]}
        onPress={() => onSelect('tr')}
      >
        <Text style={[styles.text, current === 'tr' && styles.activeText]}>
          {labels.tr}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  option: {
    flex: 1,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  active: {
    backgroundColor: colors.primary,
  },
  text: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeText: {
    color: colors.text,
  },
});
