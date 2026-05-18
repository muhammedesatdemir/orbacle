import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Language, supportedLanguages } from '../types/language';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface LanguagePickerSheetProps {
  visible: boolean;
  current: Language;
  title: string;
  onSelect: (lang: Language) => void;
  onClose: () => void;
}

// Centred modal in the same visual language as ConfirmModal — same backdrop,
// same card surface/border, same border radius — so the picker feels like the
// rest of the app's overlays. The language list scrolls if the device is short.
export const LanguagePickerSheet: React.FC<LanguagePickerSheetProps> = ({
  visible,
  current,
  title,
  onSelect,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {supportedLanguages.map((lang, i) => {
              const active = lang.code === current;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => onSelect(lang.code)}
                  style={({ pressed }) => [
                    styles.row,
                    i > 0 && styles.rowDivider,
                    active && styles.rowActive,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={lang.nativeName}
                >
                  <Text
                    style={[styles.label, active && styles.labelActive]}
                    numberOfLines={1}
                  >
                    {lang.nativeName}
                  </Text>
                  {active ? <Text style={styles.check}>✓</Text> : null}
                </Pressable>
              );
            })}
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    // Cap height so even on tiny screens the list scrolls instead of pushing
    // the modal off-screen. 10 rows would otherwise want ~520pt.
    maxHeight: '75%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
    overflow: 'hidden',
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  rowActive: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  labelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  check: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
