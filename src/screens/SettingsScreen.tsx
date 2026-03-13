import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { PrimaryButton } from '../components/PrimaryButton';
import { ConfirmModal } from '../components/ConfirmModal';
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

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.title}>{t('settings')}</Text>

      <View style={styles.content}>
        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <LanguageSwitcher
            current={language}
            onSelect={setLanguage}
            labels={{ en: t('english'), tr: t('turkish') }}
          />
        </View>

        {/* Haptics */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>{t('haptics')}</Text>
            <Switch
              value={hapticsOn}
              onValueChange={toggleHaptics}
              trackColor={{ false: colors.surfaceLight, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>
        </View>

        {/* Clear History */}
        <View style={styles.section}>
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
          <Text style={styles.version}>{t('version')} 1.0.0</Text>
        </View>
      </View>

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
  content: {
    paddingHorizontal: spacing.lg,
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
  label: {
    ...typography.body,
    color: colors.text,
  },
  aboutText: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  version: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
