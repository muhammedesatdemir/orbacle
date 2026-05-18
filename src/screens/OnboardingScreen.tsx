import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { PrimaryButton } from '../components/PrimaryButton';
import { supportedLanguages } from '../types/language';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface OnboardingScreenProps {
  onDone: () => void;
}

const PAGE_ICONS = ['🌐', '✍️', '🔮', '📜'];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const { t, language, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  // Page 0 = language picker; pages 1..3 = the original three onboarding screens.
  // Titles/bodies for the three content pages are looked up live, so when the
  // user picks a language on page 0 they instantly see the rest in that language.
  const totalPages = 4;
  const isLast = page === totalPages - 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== page) setPage(next);
  };

  const handleNext = () => {
    if (isLast) {
      onDone();
      return;
    }
    scrollRef.current?.scrollTo({ x: width * (page + 1), animated: true });
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={styles.container}
    >
      <View style={[styles.skipRow, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={onDone}
          hitSlop={spacing.md}
          accessibilityRole="button"
          accessibilityLabel={t('onboarding_skip')}
        >
          <Text style={styles.skipText}>{t('onboarding_skip')}</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      >
        {/* Page 0 — language picker. Same icon/title/body rhythm as the
            content pages below, so the layout doesn't jump between pages. */}
        <View key="lang" style={[styles.page, { width }]}>
          <Text style={styles.icon} accessibilityElementsHidden>
            {PAGE_ICONS[0]}
          </Text>
          <Text style={styles.title}>{t('language')}</Text>
          <View style={styles.langGrid}>
            {supportedLanguages.map((lang) => {
              const active = lang.code === language;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => setLanguage(lang.code)}
                  style={[styles.langChip, active && styles.langChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={lang.nativeName}
                >
                  <Text
                    style={[
                      styles.langChipText,
                      active && styles.langChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {lang.nativeName}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Pages 1..3 — original onboarding content. */}
        {[1, 2, 3].map((n) => (
          <View key={`p${n}`} style={[styles.page, { width }]}>
            <Text style={styles.icon} accessibilityElementsHidden>
              {PAGE_ICONS[n]}
            </Text>
            <Text style={styles.title}>{t(`onboarding_${n}_title`)}</Text>
            <Text style={styles.body}>{t(`onboarding_${n}_body`)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {Array.from({ length: totalPages }).map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <PrimaryButton
          title={isLast ? t('onboarding_start') : t('onboarding_next')}
          onPress={handleNext}
          variant="filled"
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipRow: {
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-end',
  },
  skipText: {
    ...typography.body,
    color: colors.textMuted,
    fontWeight: '500',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  icon: {
    fontSize: 72,
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  // Language grid: wraps to as many rows as needed, centred. Chips size to
  // their label, so wide native names ("Bahasa Indonesia", "Português (Brasil)")
  // don't get squeezed and short ones don't waste space.
  langGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  langChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.card,
    margin: spacing.xs,
  },
  langChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  langChipText: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  langChipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surfaceLight,
  },
  dotActive: {
    backgroundColor: colors.primaryLight,
    width: 20,
  },
  footer: {
    paddingHorizontal: spacing.xl,
  },
});
