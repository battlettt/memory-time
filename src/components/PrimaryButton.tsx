import React from 'react';
import { Pressable, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, iconSize, minTapTarget, radius, shadows, spacing, typography } from '../lib/theme';

type Variant = 'primary' | 'secondary' | 'success' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
}

const FILL: Record<Variant, string> = {
  primary: colors.primary,
  success: colors.success,
  secondary: colors.surface,
  ghost: 'transparent',
};

const CONTENT: Record<Variant, string> = {
  primary: colors.onPrimary,
  success: colors.onSuccess,
  secondary: colors.primary,
  ghost: colors.primary,
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'primary',
  icon,
}: Props) {
  const isFilled = variant === 'primary' || variant === 'success';
  const contentColor = CONTENT[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: isFilled ? colors.primaryPressed : colors.surfaceMuted }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: FILL[variant] },
        isFilled && shadows.sm,
        variant === 'secondary' && styles.outlined,
        (disabled || loading) && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <View style={styles.row}>
          {icon && <Ionicons name={icon} size={iconSize.md} color={contentColor} />}
          <Text style={[typography.button, { color: contentColor }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTapTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  outlined: { borderWidth: 1.5, borderColor: colors.borderStrong },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },
});
