import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView } from 'react-native';
import { PrimaryButton } from './PrimaryButton';
import { useI18n } from '../i18n';
import { TierKey } from '../entitlements/types';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface ReadingResultSheetProps {
  visible: boolean;
  // Null while nothing has been opened; drives the title and panel height.
  tier: TierKey | null;
  text: string;
  onClose: () => void;
  onShare: () => void;
}

// Presents a Kâhin Yorumu / Derin Kehanet reading in a bottom sheet over a
// dimmed backdrop, so the orb and main scene stay passive behind it and the
// long text never collides with the whisper card or the home actions. Same
// Modal pattern as PaywallScreen; long bodies scroll within the panel.
export const ReadingResultSheet: React.FC<ReadingResultSheetProps> = ({
  visible,
  tier,
  text,
  onClose,
  onShare,
}) => {
  const { t, isRTL } = useI18n();

  const label = tier === 'deep' ? t('deep_label') : t('kahin_label');
  // Deep readings are long → taller panel; Kâhin is short → more compact.
  const panelStyle = tier === 'deep' ? styles.panelTall : styles.panelCompact;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.card, panelStyle]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={[styles.label, isRTL && styles.rtlText]}>{label}</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            <Text style={[styles.body, isRTL && styles.rtlText]}>{text}</Text>
          </ScrollView>

          <View style={styles.actions}>
            <PrimaryButton
              title={t('share')}
              onPress={onShare}
              variant="ghost"
              style={styles.actionButton}
              accessibilityLabel={t('share')}
            />
            <PrimaryButton
              title={t('sheet_close')}
              onPress={onClose}
              variant="filled"
              style={styles.actionButton}
              accessibilityLabel={t('sheet_close')}
            />
          </View>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  // Compact for short Kâhin readings; tall for long Deep readings. maxHeight
  // keeps the panel on screen so the body scrolls rather than overflowing.
  panelCompact: {
    maxHeight: '60%',
  },
  panelTall: {
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  body: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
