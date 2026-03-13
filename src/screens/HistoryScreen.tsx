import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { getHistory } from '../storage/historyStorage';
import { formatDate } from '../utils/formatDate';
import { HistoryItem } from '../types/history';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

export const HistoryScreen: React.FC = () => {
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      getHistory().then(setHistory);
    }, []),
  );

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.card}>
      <Text style={styles.question}>{item.question}</Text>
      <Text style={styles.answer}>"{item.answer}"</Text>
      <Text style={styles.date}>{formatDate(item.timestamp, language)}</Text>
    </View>
  );

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>{t('history')}</Text>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔮</Text>
          <Text style={styles.emptyText}>{t('empty_history')}</Text>
          <Text style={styles.emptySubtext}>{t('empty_history_subtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  question: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  answer: {
    ...typography.subtitle,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  date: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyText: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
