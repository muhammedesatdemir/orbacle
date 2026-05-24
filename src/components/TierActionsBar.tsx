import React from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useI18n } from '../i18n';
import { useEntitlements } from '../entitlements/useEntitlements';
import { TierKey } from '../entitlements/types';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface TierActionsBarProps {
  // Which tier (if any) is currently loading its reading.
  loading: TierKey | null;
  onKahin: () => void;
  onDeep: () => void;
  // Whether the Deep tier's reading has already been shown for this question
  // (so we don't re-offer it).
  deepShown: boolean;
}

// Compact action area under the Orb's Whisper: counters as small inline badges
// and the two tier actions side by side (~44px tall). Readings themselves open
// in ReadingResultSheet, so this bar stays short on small screens. No "AI" wording.
export const TierActionsBar: React.FC<TierActionsBarProps> = ({ loading, onKahin, onDeep, deepShown }) => {
  const { t, isRTL } = useI18n();
  const { allowances, isPremium } = useEntitlements();

  const kahin = allowances.kahin;
  const deep = allowances.deep;

  const deepCounter = isPremium
    ? t('tier_counter', { label: t('deep_label'), used: deep.used, limit: deep.limit })
    : deep.canUse
      ? t('deep_trial_ready')
      : t('deep_locked');

  return (
    <View style={styles.container}>
      <View style={[styles.counters, isRTL && styles.rowRtl]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {t('tier_counter', { label: t('kahin_label'), used: kahin.used, limit: kahin.limit })}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{deepCounter}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primaryLight} />
          <Text style={styles.loadingText}>{t('oracle_loading')}</Text>
        </View>
      ) : (
        <View style={[styles.buttons, isRTL && styles.rowRtl]}>
          <Pressable
            onPress={onKahin}
            style={({ pressed }) => [styles.compactButton, { opacity: pressed ? 0.85 : 1 }]}
            accessibilityRole="button"
            accessibilityLabel={t('get_kahin')}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compactFill}
            >
              <Text style={styles.compactFillText} numberOfLines={1}>
                {t('get_kahin')}
              </Text>
            </LinearGradient>
          </Pressable>

          {!deepShown && (
            <Pressable
              onPress={onDeep}
              style={({ pressed }) => [styles.compactButton, styles.compactGhost, { opacity: pressed ? 0.7 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={t('open_deep')}
            >
              <Text style={styles.compactGhostText} numberOfLines={1}>
                {t('open_deep')}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
  },
  rowRtl: {
    flexDirection: 'row-reverse',
  },
  counters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.glassBg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.full,
    minHeight: 28,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  compactButton: {
    flex: 1,
    height: 44,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  compactFill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  compactFillText: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  compactGhost: {
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  compactGhostText: {
    ...typography.caption,
    color: colors.primaryLight,
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 44,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
