import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { useAuth } from '../../state/AuthContext';
import { useFamily } from '../../state/FamilyContext';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
import { createInviteCode } from '../../lib/invites';
import { colors, fonts, iconSize, radius, spacing, typography } from '../../lib/theme';

export function SettingsScreen() {
  const { signOut } = useAuth();
  const { current, memberships, setCurrentFamilyId } = useFamily();
  const { members } = useFamilyMembers(current?.family.id ?? null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!current) return;
    setGenerating(true);
    setError(null);
    try {
      const code = await createInviteCode(current.family.id, current.member.id);
      setInviteCode(code);
    } catch (e: any) {
      setError(e.message ?? 'Could not create an invite code');
    }
    setGenerating(false);
  };

  const initial = current?.member.display_name?.trim()?.[0]?.toUpperCase() ?? '?';

  return (
    <Screen>
      <ScreenHeader title="Settings" />

      {current && (
        <Card style={[styles.card, styles.profileCard]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={typography.heading}>{current.family.name}</Text>
            <Text style={typography.subtext}>
              You're {current.member.display_name} · {members.length}{' '}
              {members.length === 1 ? 'person' : 'people'} in this group
            </Text>
          </View>
        </Card>
      )}

      {memberships.length > 1 && (
        <Card style={styles.card}>
          <Text style={typography.label}>SWITCH GROUP</Text>
          {memberships.map((m) => (
            <PrimaryButton
              key={m.family.id}
              label={m.family.name}
              variant={m.family.id === current?.family.id ? 'primary' : 'secondary'}
              onPress={() => setCurrentFamilyId(m.family.id)}
            />
          ))}
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={typography.label}>INVITE FAMILY</Text>
        <Text style={typography.subtext}>
          The more people adding memories, the richer the reel. Anyone with a code can add photos
          and stories from their own phone.
        </Text>
        <PrimaryButton
          label="Create invite code"
          icon="person-add-outline"
          onPress={handleInvite}
          loading={generating}
        />
        {inviteCode && (
          <>
            <View style={styles.codeBox}>
              <Text style={styles.code} selectable>
                {inviteCode}
              </Text>
            </View>
            <Text style={typography.caption}>Share this code. It expires in 14 days.</Text>
          </>
        )}
        {error && (
          <View style={styles.error}>
            <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </Card>

      <PrimaryButton label="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.onPrimary },
  profileText: { flex: 1, gap: 2 },
  codeBox: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  code: { fontFamily: fonts.displayBold, fontSize: 34, letterSpacing: 6, color: colors.primary },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.destructiveSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { ...typography.subtext, color: colors.destructive, flex: 1 },
});
