import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Share,
  Keyboard,
  Platform,
  TextInput,
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
import { DailyBanner } from '../components/DailyBanner';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOrbAnimation } from '../hooks/useOrbAnimation';
import { useI18n } from '../i18n';
import { getRandomAnswer } from '../utils/getRandomAnswer';
import { addHistoryItem } from '../storage/historyStorage';
import { toggleFavorite } from '../storage/favoritesRepository';
import { getDailyAnswer } from '../storage/dailyRepository';
import { getHapticsEnabled } from '../storage/settingsStorage';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export const HomeScreen: React.FC = () => {
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  // Tracks the current answer's history entry so it can be favorited.
  const [answerId, setAnswerId] = useState<string | null>(null);
  const [answerQuestion, setAnswerQuestion] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [emptyHint, setEmptyHint] = useState(false);

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
    resetAnimation();

    const hapticsOn = await getHapticsEnabled();
    if (hapticsOn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    triggerReveal(async () => {
      const newAnswer = getRandomAnswer(language);
      const id = Date.now().toString();
      setAnswer(newAnswer);
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

  const handleNewQuestion = useCallback(() => {
    setAnswer(null);
    setAnswerId(null);
    setAnswerQuestion('');
    setIsFavorited(false);
    setQuestion('');
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

          <Animated.View style={[styles.bottomSection, bottomSectionStyle]}>
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
              <>
                <AnswerCard
                  label={t('orbacle_says')}
                  answer={answer}
                  isFavorite={isFavorited}
                  onToggleFavorite={handleToggleFavorite}
                  favoriteA11yLabel={isFavorited ? t('unfavorite') : t('favorite')}
                />
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
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  warningText: {
    color: colors.primaryLight,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
