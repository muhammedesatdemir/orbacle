import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, Share, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Orb } from '../components/Orb';
import { QuestionInput } from '../components/QuestionInput';
import { AnswerCard } from '../components/AnswerCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { useOrbAnimation } from '../hooks/useOrbAnimation';
import { useI18n } from '../i18n';
import { getRandomAnswer } from '../utils/getRandomAnswer';
import { addHistoryItem } from '../storage/historyStorage';
import { getHapticsEnabled } from '../storage/settingsStorage';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { typography } from '../constants/typography';

export const HomeScreen: React.FC = () => {
  const { t, language } = useI18n();
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [emptyHint, setEmptyHint] = useState(false);

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

    Keyboard.dismiss();
    setIsAnimating(true);
    setAnswer(null);
    resetAnimation();

    const hapticsOn = await getHapticsEnabled();
    if (hapticsOn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    triggerReveal(async () => {
      const newAnswer = getRandomAnswer(language);
      setAnswer(newAnswer);
      setIsAnimating(false);

      if (hapticsOn) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      await addHistoryItem({
        id: Date.now().toString(),
        question: trimmed,
        answer: newAnswer,
        timestamp: Date.now(),
        language,
      });
    });
  }, [question, isAnimating, language, triggerReveal, resetAnimation]);

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
    setQuestion('');
    resetAnimation();
  }, [resetAnimation]);

  const hasQuestion = question.trim().length > 0;

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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <Text style={styles.title} maxFontSizeMultiplier={1.3}>
          {t('app_name')}
        </Text>
        <Text style={styles.slogan} maxFontSizeMultiplier={1.3}>
          {t('slogan')}
        </Text>

        <View style={styles.orbSection}>
          <Orb
            disabled={answer ? true : isAnimating}
            onPress={answer ? () => {} : handleOrbPress}
            orbAnimatedStyle={orbAnimatedStyle}
            glowAnimatedStyle={glowAnimatedStyle}
            burstAnimatedStyle={burstAnimatedStyle}
            auraAnimatedStyle={auraAnimatedStyle}
            accessibilityLabel={t('ask_orb_a11y')}
          />
        </View>

        <View style={styles.bottomSection}>
          {!answer ? (
            <>
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
                value={question}
                onChangeText={setQuestion}
                placeholder={t('ask_placeholder')}
                editable={!isAnimating}
              />
            </>
          ) : (
            <>
              <AnswerCard label={t('orbacle_says')} answer={answer} />
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
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
