import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView } from 'react-native';
import { PrimaryButton } from '../components/PrimaryButton';
import { useI18n } from '../i18n';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface PaywallScreenProps {
  visible: boolean;
  onClose: () => void;
  // Mock-only: in Phase 2 this flips the local premium flag. Phase 6 swaps it
  // for the real RevenueCat purchase flow without changing this component's API.
  onMockUpgrade: () => void;
  onRestore: () => void;
}

// Placeholder paywall presented as a modal (no new navigation dependency, same
// Modal pattern as ConfirmModal). No "AI" wording anywhere; the only disclosure
// is the neutral "generated automatically / for entertainment" notice.
export const PaywallScreen: React.FC<PaywallScreenProps> = ({
  visible,
  onClose,
  onMockUpgrade,
  onRestore,
}) => {
  const { t, isRTL } = useI18n();

  const benefits = [t('paywall_benefit_1'), t('paywall_benefit_2'), t('paywall_benefit_3')];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={[styles.title, isRTL && styles.rtlText]}>{t('paywall_title')}</Text>
            <Text style={[styles.subtitle, isRTL && styles.rtlText]}>{t('paywall_subtitle')}</Text>

            <View style={styles.benefits}>
              {benefits.map((b) => (
                <View key={b} style={[styles.benefitRow, isRTL && styles.benefitRowRtl]}>
                  <Text style={styles.benefitDot}>✦</Text>
                  <Text style={[styles.benefitText, isRTL && styles.rtlText]}>{b}</Text>
                </View>
              ))}
            </View>

            <PrimaryButton
              title={t('paywall_cta')}
              onPress={onMockUpgrade}
              variant="filled"
              style={styles.cta}
              accessibilityLabel={t('paywall_cta')}
            />

            <Pressable onPress={onRestore} style={styles.linkButton} accessibilityRole="button">
              <Text style={styles.link}>{t('paywall_restore')}</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.linkButton} accessibilityRole="button">
              <Text style={styles.linkMuted}>{t('paywall_close')}</Text>
            </Pressable>

            <Text style={[styles.notice, isRTL && styles.rtlText]}>{t('paywall_notice')}</Text>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    maxHeight: '85%',
  },
  scroll: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  benefits: {
    width: '100%',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  benefitRowRtl: {
    flexDirection: 'row-reverse',
  },
  benefitDot: {
    color: colors.primaryLight,
    fontSize: 16,
  },
  benefitText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  cta: {
    width: '100%',
    marginBottom: spacing.md,
  },
  linkButton: {
    paddingVertical: spacing.sm,
  },
  link: {
    ...typography.body,
    color: colors.primaryLight,
    textAlign: 'center',
  },
  linkMuted: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  notice: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
