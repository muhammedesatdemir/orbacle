import React, { useState, forwardRef } from 'react';
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

// Forwards a ref to the underlying TextInput so the parent can call blur()
// directly — Keyboard.dismiss() alone leaves the input focused, and React
// Native re-opens the keyboard on the next layout pass.
export const QuestionInput = forwardRef<TextInput, QuestionInputProps>(
  ({ value, onChangeText, placeholder, editable = true }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.container}>
        <TextInput
          ref={ref}
          style={[styles.input, focused && styles.inputFocused]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primaryLight}
          cursorColor={colors.primaryLight}
          editable={editable}
          returnKeyType="done"
          maxLength={200}
          multiline={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    );
  },
);

QuestionInput.displayName = 'QuestionInput';

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
  inputFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: colors.primaryLight,
  },
});
