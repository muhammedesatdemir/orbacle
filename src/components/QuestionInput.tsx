import React from 'react';
import { StyleSheet, TextInput, View, Platform } from 'react-native';
import { colors } from '../constants/colors';
import { spacing, borderRadius } from '../constants/spacing';
import { typography } from '../constants/typography';

interface QuestionInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editable?: boolean;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  value,
  onChangeText,
  placeholder,
  editable = true,
}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primaryLight}
        editable={editable}
        returnKeyType="done"
        maxLength={200}
        multiline={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
  },
  input: {
    ...typography.body,
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'android' ? spacing.sm + 4 : spacing.md,
    textAlign: 'center',
  },
});
