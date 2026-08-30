import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { Card } from '../../components/Card';
import { useFamily } from '../../state/FamilyContext';
import { useT } from '../../lib/i18n';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';

export function FamilySetupScreen() {
  const { createFamily, joinFamilyWithCode } = useFamily();
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose');
  const [displayName, setDisplayName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [careRecipientName, setCareRecipientName] = useState('');
  const t = useT();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!displayName || !familyName || !careRecipientName) {
      setError('Every field is needed to set the group up.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createFamily(familyName.trim(), careRecipientName.trim(), displayName.trim());
    } catch (e: any) {
      setError(e.message);
    }
    setBusy(false);
  };

  const handleJoin = async () => {
    if (!displayName || !code) {
      setError(t('auth.needNameAndCode'));
      return;
    }
    setBusy(true);
    setError(null);
    const { error: joinError } = await joinFamilyWithCode(code.trim(), displayName.trim());
    setBusy(false);
    if (joinError) setError(joinError);
  };

  if (mode === 'choose') {
    return (
      <Screen>
        <View style={styles.heading}>
          <Text style={typography.display}>Welcome</Text>
          <Text style={[typography.bodyLarge, styles.lede]}>
            Are you starting a new memory reel, or joining one a family member already began?
          </Text>
        </View>

        <Pressable onPress={() => setMode('create')}>
          {({ pressed }) => (
            <Card elevation="raised" style={[styles.optionCard, pressed && styles.pressed]}>
              <View style={styles.optionIcon}>
                <Ionicons name="add" size={iconSize.lg} color={colors.onPrimary} />
              </View>
              <View style={styles.optionText}>
                <Text style={typography.heading}>{t('auth.startGroup')}</Text>
                <Text style={typography.subtext}>
{t('auth.startGroupBody')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={iconSize.md} color={colors.subtext} />
            </Card>
          )}
        </Pressable>

        <Pressable onPress={() => setMode('join')}>
          {({ pressed }) => (
            <Card style={[styles.optionCard, pressed && styles.pressed]}>
              <View style={[styles.optionIcon, styles.optionIconSecondary]}>
                <Ionicons name="people" size={iconSize.lg} color={colors.primary} />
              </View>
              <View style={styles.optionText}>
                <Text style={typography.heading}>{t('auth.joinTitle')}</Text>
                <Text style={typography.subtext}>
{t('auth.joinBody')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={iconSize.md} color={colors.subtext} />
            </Card>
          )}
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={typography.display}>
        {mode === 'create' ? 'Start a group' : 'Join a group'}
      </Text>

      <TextField
        label={t('auth.yourName')}
        hint={t('auth.yourNameHint')}
        value={displayName}
        onChangeText={setDisplayName}
      />

      {mode === 'create' ? (
        <>
          <TextField
            label={t('auth.groupName')}
            placeholder={t('auth.groupNamePlaceholder')}
            value={familyName}
            onChangeText={setFamilyName}
          />
          <TextField
            label={t('auth.reelFor')}
            placeholder={t('auth.reelForPlaceholder')}
            hint={t('auth.reelForHint')}
            value={careRecipientName}
            onChangeText={setCareRecipientName}
            error={error ?? undefined}
          />
          <PrimaryButton label={t('auth.createGroup')} onPress={handleCreate} loading={busy} />
        </>
      ) : (
        <>
          <TextField
            label={t('auth.inviteCode')}
            placeholder="ABC123"
            autoCapitalize="characters"
            value={code}
            onChangeText={setCode}
            error={error ?? undefined}
          />
          <PrimaryButton label={t('auth.joinGroup')} onPress={handleJoin} loading={busy} />
        </>
      )}

<PrimaryButton label={t('auth.back')} variant="ghost" onPress={() => setMode('choose')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs, marginBottom: spacing.xs },
  lede: { color: colors.subtext },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: { opacity: 0.85 },
  optionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSecondary: { backgroundColor: colors.primarySoft },
  optionText: { flex: 1, gap: 2 },
});
