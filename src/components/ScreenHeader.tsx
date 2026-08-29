import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../lib/theme';

interface Props {
  title: string;
  subtitle?: string;
}

/**
 * Every screen previously hand-rolled its own title block, which is how two
 * different tabs ended up both rendering the heading "Memories". One component
 * makes the hierarchy consistent and the naming easier to keep honest.
 */
export function ScreenHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={typography.display}>{title}</Text>
      {subtitle && <Text style={typography.subtext}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
});
