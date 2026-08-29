import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../lib/theme';

interface Props {
  children: React.ReactNode;
  /**
   * `false` for screens that own their own scrolling (a FlatList). Those get a
   * flex-constrained, unpadded frame: without a bounded height the list grows
   * to its full content size and can never scroll, and the padding here would
   * double up with the list's own.
   */
  scroll?: boolean;
  style?: ViewStyle;
}

export function Screen({ children, scroll = true, style }: Props) {
  return (
    // Top inset only — the tab bar below owns the bottom inset, and claiming it
    // here too double-counted the home-indicator gap.
    <SafeAreaView style={styles.safe} edges={['top']}>
      {scroll ? (
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.container, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
});
