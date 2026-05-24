import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Share,
  Keyboard,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedKeyboard,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Orb } from '../components/Orb';
import { QuestionInput } from '../components/QuestionInput';
import { AnswerCard } from '../components/AnswerCard';
import { TierActionsBar } from '../components/TierActionsBar';
import { ReadingResultSheet } from '../components/ReadingResultSheet';
import { DailyBanner } from '../components/DailyBanner';
import { PrimaryButton } from '../components/PrimaryButton';
import { PaywallScreen } from './PaywallScreen';
import { useOrbAnimation } from '../hooks/useOrbAnimation';
import { useI18n } from '../i18n';
import { useEntitlements } from '../entitlements/useEntitlements';
import { TierKey } from '../entitlements/types';
import { getWhisper } from '../reading/whisperEngine';
import { ReadingRequest } from '../reading/types';
import { requestReading } from '../services/oracleService';
import type { AnswerCategory } from '../data/whispers/categories';
import { addHistoryItem } from '../storage/historyStorage';
import { toggleFavorite } from '../storage/favoritesRepository';
import { getDailyAnswer } from '../storage/dailyRepository';
import { getHapticsEnabled } from '../storage/settingsStorage';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export const HomeScreen: React.FC = () => {
  const { t, language } = useI18n();
  const { consume, setPremiumMock } = useEntitlements();
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  // The detected category of the current whisper. Runtime-only — not persisted
  // to history or favorites. Used as context for the Kâhin/Deep readings.
  const [category, setCategory] = useState<AnswerCategory | null>(null);
  // Tracks the current answer's history entry so it can be favorited.
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [answerQuestion, setAnswerQuestion] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [emptyHint, setEmptyHint] = useState(false);

  // --- Layer 2/3 (Kâhin Yorumu / Derin Kehanet) state — mock, no backend. ---
  // The reading to show in the result sheet. The sheet renders over the scene;
  // nothing is added inline to the home layout.
  const [oracle, setOracle] = useState<{ tier: TierKey; text: string } | null>(null);
  // Result sheet visibility (kept separate from `oracle` so the slide-out
  // animation can play before the content is cleared).
  const [sheetVisible, setSheetVisible] = useState(false);
  // Which tier is loading its (mock) reading right now.
  const [oracleLoading, setOracleLoading] = useState<TierKey | null>(null);
  // True after a fetch failed, so we show the atmospheric fallback hint.
  const [oracleError, setOracleError] = useState(false);
  // Whether the Deep tier has been shown for the current question.
  const [deepShown, setDeepShown] = useState(false);
  // Placeholder paywall visibility.
  const [paywallVisible, setPaywallVisible] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // Blurs the input instead of only calling Keyboard.dismiss(). On Android a
  // dismissed-but-still-focused TextInput gets the keyboard re-shown on the
  // next layout pass, which fights the orb animation and causes the jump.
  const dismissKeyboard = useCallback(() => {
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  // Deterministic per-day answer; stable across re-opens, changes at midnight.
  const dailyAnswer = useMemo(() => getDailyAnswer(language), [language]);

  // Single source of truth for the keyboard transition: 0 = closed, 1 = open.
  // Orb scale/lift, the daily banner, and bottom spacing all derive from this
  // one value so they move together on the same curve — no per-frame layout jump.
  const orbCompact = useSharedValue(0);

  // Live keyboard height. Under Android edge-to-edge the window never actually
  // resizes (adjustResize is a no-op), so we lift the input ourselves with a
  // transform — no layout change, so the orb above it never jumps.
  const keyboard = useAnimatedKeyboard();

  const {
    orbAnimatedStyle,
    glowAnimatedStyle,
    burstAnimatedStyle,
    auraAnimatedStyle,
    triggerReveal,
    resetAnimation,
  } = useOrbAnimation();

  useEffect(() => {
    if (!emptyHint) return;
    const timer = setTimeout(() => setEmptyHint(false), 1800);
    return () => clearTimeout(timer);
  }, [emptyHint]);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    // Identical duration + easing both ways so open and close feel symmetric.
    const timing = { duration: 240, easing: Easing.out(Easing.cubic) };
    const showSub = Keyboard.addListener(showEvt, () => {
      orbCompact.value = withTiming(1, timing);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      orbCompact.value = withTiming(0, timing);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [orbCompact]);

  // Orb shrink + lift. translateY (a transform) instead of marginVertical (a
  // layout prop) so the parent is never re-measured mid-animation. The lift is
  // large enough to clear the input once it rises with the keyboard.
  const ORB_LIFT = spacing.xxl + spacing.xxxl;
  const orbSectionStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - orbCompact.value * 0.28 },
      { translateY: -orbCompact.value * ORB_LIFT },
    ],
  }));

  // Daily banner: stays mounted, fades + collapses height on the same curve.
  const dailyBannerStyle = useAnimatedStyle(() => ({
    opacity: 1 - orbCompact.value,
    maxHeight: interpolate(orbCompact.value, [0, 1], [120, 0]),
    marginBottom: interpolate(orbCompact.value, [0, 1], [0, -spacing.md]),
    overflow: 'hidden',
  }));

  // Lifts the input/answer block by exactly the keyboard height. A transform,
  // not a layout change, so it tracks the keyboard frame-for-frame without
  // re-measuring the orb section above it. insets.bottom is subtracted because
  // the container already pads for it.
  const bottomSectionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -Math.max(0, keyboard.height.value - insets.bottom) },
    ],
  }));

  const handleOrbPress = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed) {
      setEmptyHint(true);
      const hapticsOn = await getHapticsEnabled();
      if (hapticsOn) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      return;
    }
    if (isAnimating) return;

    dismissKeyboard();
    setIsAnimating(true);
    setAnswer(null);
    // Reset any oracle reading from the previous question so the new whisper
    // starts clean (Kâhin/Deep are re-offered for the new question).
    setOracle(null);
    setSheetVisible(false);
    setOracleError(false);
    setDeepShown(false);
    resetAnimation();

    const hapticsOn = await getHapticsEnabled();
    if (hapticsOn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    triggerReveal(async () => {
      const { text: newAnswer, category } = getWhisper(trimmed, language);
      const id = Date.now().toString();
      setAnswer(newAnswer);
      setCategory(category);
      setAnswerId(id);
      setAnswerQuestion(trimmed);
      setIsFavorited(false);
      setIsAnimating(false);

      if (hapticsOn) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      await addHistoryItem({
        id,
        question: trimmed,
        answer: newAnswer,
        timestamp: Date.now(),
        language,
      });
    });
  }, [question, isAnimating, language, triggerReveal, resetAnimation, dismissKeyboard]);

  const handleToggleFavorite = useCallback(async () => {
    if (!answer || !answerId) return;
    const hapticsOn = await getHapticsEnabled();
    if (hapticsOn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    const favorited = await toggleFavorite({
      id: answerId,
      question: answerQuestion,
      answer,
      timestamp: Date.now(),
      language,
    });
    setIsFavorited(favorited);
  }, [answer, answerId, answerQuestion, language]);

  const handleShare = useCallback(async () => {
    if (!answer) return;
    const shareText = `${t('share_prefix')}"${answer}"`;
    try {
      await Share.share({ message: shareText });
    } catch {
      // user cancelled or share unavailable
    }
  }, [answer, t]);

  // Builds the localized placeholder body for a (mock) oracle reading. No text
  // is generated on-device beyond selecting a localized i18n template — there is
  // no AI here. When the backend lands, this is replaced by the server response.
  const renderPlaceholder = useCallback(
    (req: ReadingRequest) =>
      req.tier === 'kahin' ? t('kahin_placeholder_body') : t('deep_placeholder_body'),
    [t],
  );

  // Requests a tier reading: checks the (mock) allowance, shows a loading state,
  // resolves the placeholder, and on failure falls back to the Orb's Whisper
  // with an atmospheric hint. When out of allowance, opens the placeholder paywall.
  const requestTier = useCallback(
    async (tier: TierKey) => {
      if (!answer || oracleLoading) return;
      const result = await consume(tier);
      if (!result.ok) {
        // Out of allowance for this tier → offer the placeholder paywall.
        setPaywallVisible(true);
        return;
      }

      setOracleError(false);
      setOracleLoading(tier);
      const hapticsOn = await getHapticsEnabled();
      try {
        const reading = await requestReading(
          {
            tier,
            question: answerQuestion,
            whisper: answer,
            category: category ?? 'general',
            language,
          },
          renderPlaceholder,
        );
        setOracle({ tier: reading.tier, text: reading.text });
        setSheetVisible(true);
        if (tier === 'deep') setDeepShown(true);
        if (hapticsOn) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
      } catch {
        // Reading failed — surface the atmospheric fallback; the whisper stays.
        setOracleError(true);
      } finally {
        setOracleLoading(null);
      }
    },
    [answer, oracleLoading, consume, answerQuestion, category, language, renderPlaceholder],
  );

  const handleMockUpgrade = useCallback(async () => {
    await setPremiumMock(true);
    setPaywallVisible(false);
  }, [setPremiumMock]);

  // Shares the currently open reading from inside the result sheet.
  const handleShareReading = useCallback(async () => {
    if (!oracle) return;
    const shareText = `${t('share_prefix')}${oracle.text}`;
    try {
      await Share.share({ message: shareText });
    } catch {
      // user cancelled or share unavailable
    }
  }, [oracle, t]);

  const handleNewQuestion = useCallback(() => {
    setAnswer(null);
    setCategory(null);
    setAnswerId(null);
    setAnswerQuestion('');
    setIsFavorited(false);
    setQuestion('');
    setOracle(null);
    setSheetVisible(false);
    setOracleError(false);
    setDeepShown(false);
    resetAnimation();
  }, [resetAnimation]);

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom },
      ]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      {/* Tapping empty space dismisses the keyboard. Using the responder
          system (not Pressable) so the release reliably fires for any touch
          the orb/input children don't claim — Pressable's onPress was being
          swallowed by the orb's large transparent container. */}
      <View
        style={styles.flex}
        onStartShouldSetResponder={() => true}
        onResponderRelease={dismissKeyboard}
        accessible={false}
      >
          <Text style={styles.title} maxFontSizeMultiplier={1.3}>
            {t('app_name')}
          </Text>
          <Text style={styles.slogan} maxFontSizeMultiplier={1.3}>
            {t('slogan')}
          </Text>

          <Animated.View style={[styles.orbSection, orbSectionStyle]}>
            <Orb
              disabled={answer ? true : isAnimating}
              onPress={answer ? () => {} : handleOrbPress}
              orbAnimatedStyle={orbAnimatedStyle}
              glowAnimatedStyle={glowAnimatedStyle}
              burstAnimatedStyle={burstAnimatedStyle}
              auraAnimatedStyle={auraAnimatedStyle}
              accessibilityLabel={t('ask_orb_a11y')}
            />
          </Animated.View>

          <Animated.View
            style={[styles.bottomSection, answer && styles.bottomSectionRevealed, bottomSectionStyle]}
          >
            {!answer ? (
              <>
                <Animated.View style={dailyBannerStyle}>
                  <DailyBanner label={t('daily_answer')} answer={dailyAnswer} />
                </Animated.View>
                {emptyHint ? (
                  <Animated.Text
                    entering={FadeIn.duration(150)}
                    exiting={FadeOut.duration(300)}
                    style={[styles.helperText, styles.warningText]}
                    maxFontSizeMultiplier={1.4}
                  >
                    {t('enter_question')}
                  </Animated.Text>
                ) : (
                  <Text style={styles.helperText} maxFontSizeMultiplier={1.4}>
                    {isAnimating ? '...' : t('ask_prompt')}
                  </Text>
                )}
                <QuestionInput
                  ref={inputRef}
                  value={question}
                  onChangeText={setQuestion}
                  placeholder={t('ask_placeholder')}
                  editable={!isAnimating}
                />
              </>
            ) : (
              // Revealed state stays compact: the whisper card, a compact tier
              // action bar, and the home actions. Kâhin/Deep readings open in
              // ReadingResultSheet (an overlay), never inline — so this block
              // never collides with the orb on small screens.
              <>
                <AnswerCard
                  label={t('orbacle_says')}
                  answer={answer}
                  isFavorite={isFavorited}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteA11yLabel={isFavorited ? t('unfavorite') : t('favorite')}
                />

                <TierActionsBar
                  loading={oracleLoading}
                  onKahin={() => requestTier('kahin')}
                  onDeep={() => requestTier('deep')}
                  deepShown={deepShown}
                />

                {oracleError && (
                  <Text style={[styles.helperText, styles.fallbackText]} maxFontSizeMultiplier={1.4}>
                    {t('oracle_fallback_hint')}
                  </Text>
                )}

                <View style={styles.actions}>
                  <PrimaryButton
                    title={t('share')}
                    onPress={handleShare}
                    accessibilityLabel={t('share')}
                  />
                  <PrimaryButton
                    title={t('ask_another')}
                    onPress={handleNewQuestion}
                    variant="ghost"
                    accessibilityLabel={t('ask_another')}
                  />
                </View>
              </>
            )}
          </Animated.View>
        </View>

        <PaywallScreen
          visible={paywallVisible}
          onClose={() => setPaywallVisible(false)}
          onMockUpgrade={handleMockUpgrade}
          onRestore={() => setPaywallVisible(false)}
        />

        <ReadingResultSheet
          visible={sheetVisible}
          tier={oracle?.tier ?? null}
          text={oracle?.text ?? ''}
          onClose={() => setSheetVisible(false)}
          onShare={handleShareReading}
        />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  title: {
    ...typography.hero,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  slogan: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  orbSection: {
    flex: 1,
    // minHeight:0 lets this flex child shrink past its content size when the
    // window resizes for the keyboard, instead of pushing the input off-screen.
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  // When an answer is revealed, let the section shrink within the screen so the
  // compact whisper + actions never push the orb off the top. Readings open in
  // an overlay sheet, so nothing tall is added inline.
  bottomSectionRevealed: {
    flexShrink: 1,
    minHeight: 0,
    width: '100%',
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  warningText: {
    color: colors.primaryLight,
  },
  fallbackText: {
    color: colors.textSecondary,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
