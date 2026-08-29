import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius, shadows } from '../lib/theme';

interface Props extends ViewProps {
  /** `raised` is for hero surfaces; `flat` for dense lists where stacked shadows get noisy. */
  elevation?: 'flat' | 'raised';
}

export function Card({ style, elevation = 'flat', ...props }: Props) {
  return (
    <View
      style={[styles.card, elevation === 'raised' ? shadows.md : shadows.sm, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
