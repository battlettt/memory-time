import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { Card } from '../../components/Card';
import { useAuth } from '../../state/AuthContext';
import { useT } from '../../lib/i18n';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';

export function SignInScreen() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const t = useT();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.includes('@')) {
      setError('That doesn’t look like an email address yet.');
      return;
    }
    setSending(true);
    setError(null);
    const { error: signInError } = await signInWithEmail(email.trim());
    setSending(false);
    if (signInError) {
      setError(signInError);
    } else {
      setSent(true);
    }
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Ionicons name="heart" size={30} color={colors.onPrimary} />
        </View>
        <Text style={typography.display}>Memory Time</Text>
        {/* No diagnosis in the pitch. The story and album half is worth having
            for any family with an ageing parent, and that is a far larger and
            far less painful door to come in through. The practice side is
            there for whoever grows into needing it. */}
        <Text style={[typography.bodyLarge, styles.tagline]}>
{t('auth.tagline')}
        </Text>
      </View>

      {sent ? (
        <Card elevation="raised" style={styles.confirmation}>
          <Ionicons name="mail-open-outline" size={iconSize.xl} color={colors.primary} />
          <Text style={typography.serifLarge}>{t('auth.checkEmail')}</Text>
          <Text style={typography.body}>
            We sent a sign-in link to {email}. Tap it and you'll land straight back here — no
            password to remember.
          </Text>
        </Card>
      ) : (
        <>
          <TextField
            label={t('auth.email')}
            placeholder="you@example.com"
            hint={t('auth.emailHint')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            error={error ?? undefined}
          />
          <PrimaryButton label={t('auth.sendLink')} onPress={handleSend} loading={sending} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.sm, marginBottom: spacing.md },
  mark: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tagline: { color: colors.subtext },
  confirmation: { padding: spacing.lg, gap: spacing.sm, alignItems: 'flex-start' },
});
