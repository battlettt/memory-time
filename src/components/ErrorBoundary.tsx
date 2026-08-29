import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../lib/theme';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

// Without this, a runtime error anywhere in the tree unmounts back to a
// blank screen with no on-screen indication anything went wrong.
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <View style={styles.badge}>
            <Ionicons name="alert-circle-outline" size={36} color={colors.destructive} />
          </View>
          <Text style={typography.title}>Something went wrong</Text>
          <Text style={[typography.body, styles.message]}>{this.state.error.message}</Text>
          <View style={styles.action}>
            <PrimaryButton label="Try again" onPress={() => this.setState({ error: null })} />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    width: 76,
    height: 76,
    borderRadius: radius.pill,
    backgroundColor: colors.destructiveSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  message: { color: colors.subtext, textAlign: 'center', maxWidth: 340 },
  action: { alignSelf: 'stretch', marginTop: spacing.md, maxWidth: 340 },
});
