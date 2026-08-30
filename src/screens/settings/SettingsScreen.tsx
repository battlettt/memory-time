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
import { useMemories } from '../../lib/useMemories';
import { useLifeStory } from '../../lib/useLifeStory';
import { exportBook } from '../../lib/bookExport';
import { notificationsAvailable, syncDailyReminder } from '../../lib/notifications';
import { LOCALES, useI18n } from '../../lib/i18n';
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
  const { t, tCount, override, setLocale } = useI18n();
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

  const { settings, update } = useFamilySettings();

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

  const { memories } = useMemories(current?.family.id ?? null);
  const { sections } = useLifeStory(current?.family.id ?? null);
  const { nameFor } = useFamilyMembers(current?.family.id ?? null);
  const [exporting, setExporting] = useState(false);
  const [confirmMemorial, setConfirmMemorial] = useState(false);

  const handleExport = async () => {
    if (!current) return;
    setExporting(true);
    setError(null);
    try {
      await exportBook({
        familyName: current.family.name,
        careRecipientName: current.family.care_recipient_name,
        sections,
        memories,
        nameFor,
      });
    } catch (e: any) {
      setError(e.message ?? 'Could not build the book');
    }
    setExporting(false);
  };

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
      <ScreenHeader title={t('settings.title')} />

      {current && (
        <Card style={[styles.card, styles.profileCard]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={typography.heading}>{current.family.name}</Text>
            <Text style={typography.subtext}>
{t('settings.you', { name: current.member.display_name, count: tCount('settings.people', members.length) })}
            </Text>
          </View>
        </Card>
      )}

      {memberships.length > 1 && (
        <Card style={styles.card}>
          <Text style={typography.label}>{t('settings.switchGroup')}</Text>
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
        <Text style={typography.label}>{t('settings.invite')}</Text>
        <Text style={typography.subtext}>
{t('settings.inviteBody')}
        </Text>
        <PrimaryButton
          label={t('settings.inviteCreate')}
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
            <Text style={typography.caption}>{t('settings.inviteExpiry')}</Text>
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
        <Text style={typography.label}>{t('settings.forYou')}</Text>
        <Text style={typography.subtext}>
{t('settings.forYouBody')}
        </Text>
        <PrimaryButton
          label={t('settings.report')}
          icon="stats-chart-outline"
          variant="secondary"
          onPress={() => navigation.navigate('WeeklyReport')}
        />
        <PrimaryButton
          label={t('settings.handoff')}
          icon="document-text-outline"
          variant="secondary"
          onPress={() => navigation.navigate('HandoffSheet')}
        />
        <PrimaryButton
          label={exporting ? t('settings.bookBuilding') : t('settings.book')}
          icon="book-outline"
          variant="secondary"
          loading={exporting}
          onPress={handleExport}
        />
        <Text style={typography.caption}>
{t('settings.bookBody')}
        </Text>
      </Card>

      <Card style={styles.card}>
        <Text style={typography.label}>{t('settings.preferences')}</Text>

        <View style={styles.prefRow}>
          <View style={styles.prefText}>
            <Text style={typography.bodyStrong}>{t('settings.largeText')}</Text>
            <Text style={typography.caption}>
{t('settings.largeTextBody', { name: current?.family.care_recipient_name ?? 'they' })}
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
            <Text style={typography.bodyStrong}>{t('settings.dailyQuestion')}</Text>
            <Text style={typography.caption}>
{notificationsAvailable()
                ? t('settings.dailyQuestionBody', { hour: settings?.daily_prompt_hour ?? 18 })
                : t('settings.dailyQuestionWeb')}
            </Text>
          </View>
          <Switch
            value={settings?.daily_prompt_enabled ?? true}
            onValueChange={(v) => update({ daily_prompt_enabled: v }).catch(() => {})}
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
          />
        </View>

        {/* The app's own language, distinct from the language a memory is
            recorded in — a caregiver may read Spanish while the memories are
            in Punjabi, and both need to work. */}
        <View style={styles.prefText}>
          <Text style={typography.bodyStrong}>{t('settings.appLanguage')}</Text>
          <Text style={typography.caption}>{t('settings.appLanguageBody')}</Text>
          <View style={styles.chipRow}>
            <Chip
              label={t('settings.followDevice')}
              selected={override === null}
              onPress={() => setLocale(null)}
            />
            {LOCALES.map((l) => (
              <Chip
                key={l.code}
                label={l.label}
                selected={override === l.code}
                onPress={() => setLocale(l.code)}
              />
            ))}
          </View>
        </View>

        <View style={styles.prefText}>
          <Text style={typography.bodyStrong}>{t('settings.sessionLength')}</Text>
          <Text style={typography.caption}>
{t('settings.sessionLengthBody')}
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
        <Text style={typography.label}>{t('settings.shareLink')}</Text>
        <Text style={typography.subtext}>
{t('settings.shareLinkBody')}
        </Text>
        <PrimaryButton
          label={t('settings.createLink')}
          icon="link-outline"
          variant="secondary"
          onPress={handleCreateLink}
          loading={makingLink}
        />

        {links.map((link) => (
          <View key={link.id} style={styles.link}>
            <View style={styles.linkText}>
              <Text style={typography.bodyStrong} numberOfLines={1}>
    {copied === link.token ? t('settings.copied') : contributionUrl(link.token)}
              </Text>
              <Text style={typography.caption}>
{t('settings.linkSent', {
                  count: link.submission_count,
                  date: link.expires_at ? new Date(link.expires_at).toLocaleDateString() : '—',
                })}
              </Text>
            </View>
            <View style={styles.linkActions}>
              <PrimaryButton
label={Platform.OS === 'web' ? t('settings.copy') : t('settings.share')}
                variant="secondary"
                onPress={() => handleShare(link.token)}
              />
              <PrimaryButton
                label={t('settings.turnOff')}
                variant="ghost"
                onPress={() => revokeContributionLink(link.id).then(refreshLinks).catch(() => {})}
              />
            </View>
          </View>
        ))}
      </Card>

      {/* Every family using this eventually reaches this point, and most apps
          simply carry on prompting. */}
      <Card style={styles.card}>
        <Text style={typography.label}>
{settings?.memorial_mode ? t('settings.memorialOn') : t('settings.memorialOff')}
        </Text>
        {settings?.memorial_mode ? (
          <Text style={typography.subtext}>
{t('settings.memorialOnBody')}
          </Text>
        ) : (
          <Text style={typography.subtext}>
{t('settings.memorialOffBody')}
          </Text>
        )}
        <PrimaryButton
          label={
            settings?.memorial_mode
? t('settings.memorialDisable')
              : confirmMemorial
                ? t('settings.memorialConfirm')
                : t('settings.memorialEnable')
          }
          variant="ghost"
          onPress={() => {
            if (settings?.memorial_mode) {
              update({ memorial_mode: false, memorial_since: null }).catch(() => {});
              return;
            }
            if (!confirmMemorial) {
              setConfirmMemorial(true);
              return;
            }
            update({ memorial_mode: true, memorial_since: new Date().toISOString() }).catch(
              () => {}
            );
            setConfirmMemorial(false);
          }}
        />
      </Card>

      <PrimaryButton label={t('settings.signOut')} variant="ghost" onPress={signOut} />
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
