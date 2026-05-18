import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Switch, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { LanguagePickerSheet } from '../components/LanguagePickerSheet';
import { PrimaryButton } from '../components/PrimaryButton';
import { ConfirmModal } from '../components/ConfirmModal';
import { Language } from '../types/language';
import { getHapticsEnabled, saveHapticsEnabled } from '../storage/settingsStorage';
import { clearHistory } from '../storage/historyStorage';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

export const SettingsScreen: React.FC = () => {
  const { t, language, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const [hapticsOn, setHapticsOn] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);

  useEffect(() => {
    getHapticsEnabled().then(setHapticsOn);
  }, []);

  const toggleHaptics = (val: boolean) => {
    setHapticsOn(val);
    saveHapticsEnabled(val);
  };

  const handleClearConfirm = () => {
    setShowClearModal(false);
    clearHistory();
  };

  const handleLangSelect = (lang: Language) => {
    setLanguage(lang);
    setShowLangPicker(false);
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom },
      ]}
    >
      <Text style={styles.title}>{t('settings')}</Text>

      {/* Scrollable so About is always reachable even on short devices or in
          languages where labels run longer (de-DE, pt-BR). */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Language — compact row that opens a modal picker. */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <LanguageSwitcher
            current={language}
            label={t('language')}
            onPress={() => setShowLangPicker(true)}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('preferences')}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t('haptics')}</Text>
            <Switch
              value={hapticsOn}
              onValueChange={toggleHaptics}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              thumbColor={colors.text}
              accessibilityLabel={t('haptics')}
              accessibilityRole="switch"
            />
          </View>
          <View style={styles.spacer} />
          <PrimaryButton
            title={t('clear_history')}
            onPress={() => setShowClearModal(true)}
            variant="ghost"
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about')}</Text>
          <Text style={styles.aboutText}>{t('about_text')}</Text>
          <Text style={styles.creditPrimary}>{t('about_credits_primary')}</Text>
          <Text style={styles.entertainmentNotice}>{t('entertainment_notice')}</Text>
          <Text style={styles.version}>{t('version')} 1.1</Text>
        </View>
      </ScrollView>

      <LanguagePickerSheet
        visible={showLangPicker}
        current={language}
        title={t('language')}
        onSelect={handleLangSelect}
        onClose={() => setShowLangPicker(false)}
      />

      <ConfirmModal
        visible={showClearModal}
        title={t('clear_history')}
        description={t('clear_history_confirm')}
        cancelLabel={t('cancel')}
        confirmLabel={t('confirm')}
        onCancel={() => setShowClearModal(false)}
        onConfirm={handleClearConfirm}
      />
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
    marginBottom: spacing.xl,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  spacer: {
    height: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  aboutText: {
    ...typography.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.92)',
    lineHeight: 24,
  },
  creditPrimary: {
    ...typography.body,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.78)',
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: spacing.xl,
  },
  entertainmentNotice: {
    ...typography.caption,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    lineHeight: 16,
    marginTop: spacing.lg,
  },
  version: {
    ...typography.caption,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    marginTop: spacing.md,
  },
});
