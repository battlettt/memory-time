import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius, spacing, typography } from '../lib/theme';

interface Props extends TextInputProps {
  label?: string;
  /** Shown under the field — use it to explain, not to scold. */
  hint?: string;
  error?: string;
}

export function TextField({ label, hint, error, style, onFocus, onBlur, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      {label && <Text style={typography.subheading}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.subtext}
        style={[
          styles.input,
          typography.body,
          focused && styles.focused,
          !!error && styles.errored,
          inputProps.multiline && styles.multiline,
          style,
        ]}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...inputProps}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={typography.caption}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: {
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  focused: { borderColor: colors.primary, borderWidth: 2 },
  errored: { borderColor: colors.destructive, borderWidth: 2 },
  multiline: { minHeight: 260, textAlignVertical: 'top', paddingTop: spacing.md },
  errorText: { ...typography.caption, color: colors.destructive },
});
