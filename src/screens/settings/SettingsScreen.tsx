import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Share, StyleSheet, Switch, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { useAuth } from '../../state/AuthContext';
import { useFamily } from '../../state/FamilyContext';
import { Chip } from '../../components/Chip';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
import { useFamilySettings } from '../../lib/useFamilySettings';
import { notificationsAvailable, syncDailyReminder } from '../../lib/notifications';
import { createInviteCode } from '../../lib/invites';
import {
  contributionUrl,
  createContributionLink,
  listContributionLinks,
  revokeContributionLink,
  type ContributionLink,
} from '../../lib/contributionLinks';
import { colors, fonts, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { SettingsStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<SettingsStackParamList, 'SettingsHome'>;

export function SettingsScreen({ navigation }: Props) {
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

  const { settings, update } = useFamilySettings(current?.family.id ?? null);

  // Keep the scheduled reminder in step with the preferences, including
  // cancelling it outright once memorial mode is on.
  useEffect(() => {
    if (!settings || !current) return;
    syncDailyReminder({
      enabled: settings.daily_prompt_enabled,
      hour: settings.daily_prompt_hour,
      careRecipientName: current.family.care_recipient_name,
      memorialMode: settings.memorial_mode,
    }).catch(() => {});
  }, [
    settings?.daily_prompt_enabled,
    settings?.daily_prompt_hour,
    settings?.memorial_mode,
    current?.family.care_recipient_name,
  ]);

  const [links, setLinks] = useState<ContributionLink[]>([]);
  const [makingLink, setMakingLink] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const familyId = current?.family.id ?? null;

  const refreshLinks = useCallback(async () => {
    if (!familyId) return;
    setLinks(await listContributionLinks(familyId));
  }, [familyId]);

  useEffect(() => {
    refreshLinks();
  }, [refreshLinks]);

  const handleCreateLink = async () => {
    if (!current) return;
    setMakingLink(true);
    setError(null);
    try {
      await createContributionLink(current.family.id, current.member.id);
      await refreshLinks();
    } catch (e: any) {
      setError(e.message ?? 'Could not create a link');
    }
    setMakingLink(false);
  };

  const handleShare = async (token: string) => {
    const url = contributionUrl(token);
    // Native gets the share sheet; on web that is unreliable, so copy instead.
    if (Platform.OS !== 'web') {
      try {
        await Share.share({ message: url });
        return;
      } catch {
        /* fall through to copying */
      }
    }
    await Clipboard.setStringAsync(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2500);
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

      <Card style={styles.card}>
        <Text style={typography.label}>FOR YOU</Text>
        <Text style={typography.subtext}>
          You're doing the work here. These two are yours.
        </Text>
        <PrimaryButton
          label="This week"
          icon="stats-chart-outline"
          variant="secondary"
          onPress={() => navigation.navigate('WeeklyReport')}
        />
        <PrimaryButton
          label="One page for a new carer"
          icon="document-text-outline"
          variant="secondary"
          onPress={() => navigation.navigate('HandoffSheet')}
        />
      </Card>

      <Card style={styles.card}>
        <Text style={typography.label}>PREFERENCES</Text>

        <View style={styles.prefRow}>
          <View style={styles.prefText}>
            <Text style={typography.bodyStrong}>Larger text</Text>
            <Text style={typography.caption}>
              Applies to sessions, the album and the hand-over screen — the ones{' '}
              {current?.family.care_recipient_name ?? 'they'} actually reads.
            </Text>
          </View>
          <Switch
            value={settings?.large_text ?? false}
            onValueChange={(v) => update({ large_text: v }).catch(() => {})}
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
          />
        </View>

        <View style={styles.prefRow}>
          <View style={styles.prefText}>
            <Text style={typography.bodyStrong}>A question each day</Text>
            <Text style={typography.caption}>
              {notificationsAvailable()
                ? `One question, at ${settings?.daily_prompt_hour ?? 18}:00, for you to answer out loud.`
                : 'One question a day on the Today screen. Reminders need the phone app.'}
            </Text>
          </View>
          <Switch
            value={settings?.daily_prompt_enabled ?? true}
            onValueChange={(v) => update({ daily_prompt_enabled: v }).catch(() => {})}
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
          />
        </View>

        <View style={styles.prefText}>
          <Text style={typography.bodyStrong}>Session length</Text>
          <Text style={typography.caption}>
            Short sessions get finished; long ones get skipped.
          </Text>
          <View style={styles.chipRow}>
            {[5, 8, 12, 20].map((n) => (
              <Chip
                key={n}
                label={`${n}`}
                selected={(settings?.session_size_limit ?? 8) === n}
                onPress={() => update({ session_size_limit: n }).catch(() => {})}
              />
            ))}
          </View>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={typography.label}>SHARE A LINK</Text>
        <Text style={typography.subtext}>
          For relatives who won't install an app. They open the link, write a memory, and send it —
          no account needed. Everything that arrives is held for you to look at first.
        </Text>
        <PrimaryButton
          label="Create a link"
          icon="link-outline"
          variant="secondary"
          onPress={handleCreateLink}
          loading={makingLink}
        />

        {links.map((link) => (
          <View key={link.id} style={styles.link}>
            <View style={styles.linkText}>
              <Text style={typography.bodyStrong} numberOfLines={1}>
                {copied === link.token ? 'Copied to your clipboard' : contributionUrl(link.token)}
              </Text>
              <Text style={typography.caption}>
                {link.submission_count} sent · expires{' '}
                {link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'never'}
              </Text>
            </View>
            <View style={styles.linkActions}>
              <PrimaryButton
                label={Platform.OS === 'web' ? 'Copy' : 'Share'}
                variant="secondary"
                onPress={() => handleShare(link.token)}
              />
              <PrimaryButton
                label="Turn off"
                variant="ghost"
                onPress={() => revokeContributionLink(link.id).then(refreshLinks).catch(() => {})}
              />
            </View>
          </View>
        ))}
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
  link: {
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  prefRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prefText: { flex: 1, gap: 2 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  linkText: { gap: 2 },
  linkActions: { flexDirection: 'row', gap: spacing.sm },
});
