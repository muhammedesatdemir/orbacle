import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Share, Alert, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  const {
    orbAnimatedStyle,
    glowAnimatedStyle,
    burstAnimatedStyle,
    auraAnimatedStyle,
    triggerReveal,
    resetAnimation,
  } = useOrbAnimation();

  const handleOrbPress = useCallback(async () => {
    const trimmed = question.trim();
    if (!trimmed || isAnimating) return;

    Keyboard.dismiss();
    setIsAnimating(true);
    setAnswer(null);
    resetAnimation();

    const hapticsOn = await getHapticsEnabled();
    if (hapticsOn) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    triggerReveal(async () => {
      const newAnswer = getRandomAnswer(language);
      setAnswer(newAnswer);
      setIsAnimating(false);

      if (hapticsOn) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await addHistoryItem({
        id: Date.now().toString(),
        question: trimmed,
        answer: newAnswer,
        timestamp: Date.now(),
        language,
      });
    });
  }, [question, isAnimating, language]);

  const handleShare = useCallback(async () => {
    if (!answer) return;
    const shareText = `${t('share_prefix')}"${answer}"`;
    try {
      await Share.share({ message: shareText });
    } catch {
      // user cancelled
    }
  }, [answer, t]);

  const handleNewQuestion = useCallback(() => {
    setAnswer(null);
    setQuestion('');
    resetAnimation();
  }, []);

  const hasQuestion = question.trim().length > 0;

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        {/* Title */}
        <Text style={styles.title}>{t('app_name')}</Text>
        <Text style={styles.slogan}>{t('slogan')}</Text>

        {/* Orb — fills available space and centers within it */}
        <View style={styles.orbSection}>
          <Orb
            disabled={answer ? true : !hasQuestion || isAnimating}
            onPress={answer ? () => {} : handleOrbPress}
            orbAnimatedStyle={orbAnimatedStyle}
            glowAnimatedStyle={glowAnimatedStyle}
            burstAnimatedStyle={burstAnimatedStyle}
            auraAnimatedStyle={auraAnimatedStyle}
          />
        </View>

        {/* Bottom section — always at bottom, pushed up by keyboard */}
        <View style={styles.bottomSection}>
          {!answer ? (
            <>
              <Text style={styles.helperText}>
                {isAnimating ? '...' : t('ask_prompt')}
              </Text>
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
                <PrimaryButton title={t('share')} onPress={handleShare} />
                <PrimaryButton
                  title={t('ask_placeholder').split('...')[0] + '...'}
                  onPress={handleNewQuestion}
                  variant="ghost"
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
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
});
