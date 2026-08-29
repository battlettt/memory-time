import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from './PrimaryButton';
import { colors, iconSize, radius, spacing, typography } from '../lib/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * A blank reel is the most common state for a family that just signed up, so
 * it gets a real explanation and a way forward rather than a gray sentence.
 */
export function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Ionicons name={icon} size={iconSize.xl} color={colors.primary} />
      </View>
      <Text style={[typography.serifLarge, styles.centered]}>{title}</Text>
      <Text style={[typography.body, styles.centered, styles.body]}>{body}</Text>
      {actionLabel && onAction && (
        <View style={styles.action}>
          <PrimaryButton label={actionLabel} onPress={onAction} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  badge: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  centered: { textAlign: 'center' },
  body: { color: colors.subtext, maxWidth: 340 },
  action: { alignSelf: 'center', width: '100%', marginTop: spacing.md, maxWidth: 340 },
});
