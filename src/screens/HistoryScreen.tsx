import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useI18n } from '../i18n';
import { getHistory } from '../storage/historyStorage';
import { getFavorites, toggleFavorite } from '../storage/favoritesRepository';
import { formatDate } from '../utils/formatDate';
import { HistoryItem } from '../types/history';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

type Filter = 'all' | 'favorites';

export const HistoryScreen: React.FC = () => {
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    const [items, favorites] = await Promise.all([getHistory(), getFavorites()]);
    setHistory(items);
    setFavoriteIds(new Set(favorites.map((f) => f.id)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleToggleFavorite = useCallback(async (item: HistoryItem) => {
    const favorited = await toggleFavorite({
      id: item.id,
      question: item.question,
      answer: item.answer,
      timestamp: item.timestamp,
      language: item.language,
    });
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (favorited) next.add(item.id);
      else next.delete(item.id);
      return next;
    });
  }, []);

  const visibleItems =
    filter === 'favorites'
      ? history.filter((item) => favoriteIds.has(item.id))
      : history;

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const favorited = favoriteIds.has(item.id);
    return (
      <View style={styles.card}>
        <Pressable
          onPress={() => handleToggleFavorite(item)}
          hitSlop={spacing.sm}
          style={styles.starButton}
          accessibilityRole="button"
          accessibilityLabel={favorited ? t('unfavorite') : t('favorite')}
          accessibilityState={{ selected: favorited }}
        >
          <Text style={styles.star}>{favorited ? '★' : '☆'}</Text>
        </Pressable>
        <Text style={styles.question}>{item.question}</Text>
        <Text style={styles.answer}>"{item.answer}"</Text>
        <Text style={styles.date}>{formatDate(item.timestamp, language)}</Text>
      </View>
    );
  };

  const emptyText =
    filter === 'favorites' ? t('empty_favorites') : t('empty_history');
  const emptySubtext =
    filter === 'favorites'
      ? t('empty_favorites_subtitle')
      : t('empty_history_subtitle');

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom },
      ]}
    >
      <Text style={styles.title}>{t('history')}</Text>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter('all')}
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'all' }}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'all' && styles.filterTextActive,
            ]}
          >
            {t('filter_all')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('favorites')}
          style={[
            styles.filterChip,
            filter === 'favorites' && styles.filterChipActive,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: filter === 'favorites' }}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'favorites' && styles.filterTextActive,
            ]}
          >
            {t('filter_favorites')}
          </Text>
        </Pressable>
      </View>

      {visibleItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔮</Text>
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Text style={styles.emptySubtext}>{emptySubtext}</Text>
        </View>
      ) : (
        <FlatList
          data={visibleItems}
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
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.text,
    fontWeight: '600',
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
  starButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
  },
  star: {
    fontSize: 20,
    color: colors.primaryLight,
  },
  question: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    paddingRight: spacing.xl,
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
