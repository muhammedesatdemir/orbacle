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
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

interface OnboardingScreenProps {
  onDone: () => void;
}

const PAGE_ICONS = ['✍️', '🔮', '📜'];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onDone }) => {
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);

  const pages = [
    { icon: PAGE_ICONS[0], title: t('onboarding_1_title'), body: t('onboarding_1_body') },
    { icon: PAGE_ICONS[1], title: t('onboarding_2_title'), body: t('onboarding_2_body') },
    { icon: PAGE_ICONS[2], title: t('onboarding_3_title'), body: t('onboarding_3_body') },
  ];

  const isLast = page === pages.length - 1;

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
        {pages.map((p) => (
          <View key={p.title} style={[styles.page, { width }]}>
            <Text style={styles.icon} accessibilityElementsHidden>
              {p.icon}
            </Text>
            <Text style={styles.title}>{p.title}</Text>
            <Text style={styles.body}>{p.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {pages.map((p, i) => (
          <View key={p.title} style={[styles.dot, i === page && styles.dotActive]} />
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
