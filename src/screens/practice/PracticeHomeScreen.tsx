import React, { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useFamily } from '../../state/FamilyContext';
import { useElderMode } from '../../state/ElderModeContext';
import { useMemories } from '../../lib/useMemories';
import { useFamilySettings } from '../../lib/useFamilySettings';
import { dueMemories, sessionSelection } from '../../lib/srt';
import { getOrCreateTodaysPrompt, type DailyPrompt } from '../../lib/dailyPrompt';
import { tipForToday } from '../../lib/coaching';
import { useI18n } from '../../lib/i18n';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { PracticeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'PracticeHome'>;

export function PracticeHomeScreen({ navigation }: Props) {
  const { current } = useFamily();
  const { memories, loading } = useMemories(current?.family.id ?? null);
  const { settings } = useFamilySettings();
  const { enter: enterElderMode } = useElderMode();
  const tip = useMemo(() => tipForToday(), []);
  const { t, tCount } = useI18n();
  const due = useMemo(() => dueMemories(memories), [memories]);

  // A capped session is one somebody will actually finish. Thirty due
  // memories reads as a chore and gets skipped; eight is a few minutes.
  const limit = settings?.session_size_limit ?? 8;
  const selected = useMemo(() => sessionSelection(memories, limit), [memories, limit]);

  const [dailyPrompt, setDailyPrompt] = useState<DailyPrompt | null>(null);
  const familyId = current?.family.id ?? null;
  const memberId = current?.member.id ?? null;

  useEffect(() => {
    if (!familyId || !memberId) return;
    let cancelled = false;
    getOrCreateTodaysPrompt(familyId, memberId)
      .then((p) => !cancelled && setDailyPrompt(p))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [familyId, memberId]);

  // A face at the top of the screen does more to invite a session than a
  // number does — this is a ritual with a person, not a task queue.
  const heroPhoto = useMemo(() => memories.find((m) => m.photo_url)?.photo_url ?? null, [memories]);

  const goToTab = (tab: keyof MainTabParamList) =>
    navigation.getParent<BottomTabNavigationProp<MainTabParamList>>()?.navigate(tab);

  const name = current?.family.care_recipient_name ?? 'them';

  // Nothing here asks anything once they have died. No streaks, no due
  // counts, no daily question — the app becomes somewhere to look, not a
  // thing with expectations.
  if (settings?.memorial_mode) {
    return (
      <Screen>
        <View style={styles.heading}>
          <Text style={typography.label}>{t('memorial.eyebrow')}</Text>
          <Text style={typography.display}>{name}</Text>
        </View>
        <Card elevation="raised" style={styles.restCard}>
          <Text style={typography.serifLarge}>{t('memorial.title')}</Text>
          <Text style={[typography.body, styles.restBody]}>
{t('memorial.body')}
          </Text>
        </Card>
        <PrimaryButton
          label={t('today.album')}
          icon="images-outline"
          onPress={() => goToTab('OnThisDayTab')}
        />
        <PrimaryButton
          label={t('memorial.readStory', { name })}
          icon="book-outline"
          variant="secondary"
          onPress={() => goToTab('LifeStoryTab')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={typography.label}>{t('today.eyebrow')}</Text>
        <Text style={typography.display}>{t('today.title', { name })}</Text>
      </View>

      {!loading && memories.length === 0 && (
        <EmptyState
          icon="images-outline"
          title={t('today.empty.title')}
          body={t('today.empty.body', { name })}
          actionLabel={t('today.empty.action')}
          onAction={() => goToTab('MemoriesTab')}
        />
      )}

      {!loading && memories.length > 0 && due.length > 0 && (
        <Card elevation="raised" style={styles.hero}>
          {heroPhoto && <Image source={{ uri: heroPhoto }} style={styles.heroPhoto} resizeMode="cover" />}
          <View style={styles.heroBody}>
            <View style={styles.countRow}>
              <Text style={styles.count}>{selected.length}</Text>
              <Text style={[typography.heading, styles.countLabel]}>
{tCount('today.ready', selected.length)}
              </Text>
            </View>
            <Text style={typography.subtext}>
              {due.length > selected.length
? t('today.moreWaiting', { count: due.length - selected.length })
                : memories.length - due.length > 0
                  ? t('today.moreDue', { count: memories.length - due.length })
                  : t('today.anyPace')}
            </Text>
            <View style={styles.heroAction}>
              <PrimaryButton
                label={t('today.start')}
                icon="play"
                onPress={() =>
                  navigation.navigate('Session', { memoryIds: selected.map((m) => m.id) })
                }
              />
            </View>
          </View>
        </Card>
      )}

      {!loading && memories.length > 0 && due.length === 0 && (
        <Card elevation="raised" style={styles.restCard}>
          <View style={styles.restIcon}>
            <Ionicons name="checkmark" size={iconSize.lg} color={colors.onSuccess} />
          </View>
          <Text style={typography.serifLarge}>{t('today.caughtUp.title')}</Text>
          <Text style={[typography.body, styles.restBody]}>
{t('today.caughtUp.body')}
          </Text>
        </Card>
      )}

      {/* One line, not a lecture. Families get a diagnosis and almost no
          instruction on how to talk to someone afterwards. */}
      {!loading && memories.length > 0 && (
        <View style={styles.tip}>
          <Ionicons name="bulb-outline" size={iconSize.sm} color={colors.accentStrong} />
          <Text style={styles.tipText}>{tip.text}</Text>
        </View>
      )}

      {/* Contributing, not practising. This is the half of the app that keeps
          the reel from running dry, so it sits on the first screen. */}
      {dailyPrompt && !dailyPrompt.answered_memory_id && (
        <Card style={styles.promptCard}>
          <View style={styles.promptHead}>
            <Ionicons name="chatbubble-ellipses-outline" size={iconSize.md} color={colors.accentStrong} />
            <Text style={typography.label}>{t('today.prompt.eyebrow')}</Text>
          </View>
          <Text style={typography.serifLarge}>{dailyPrompt.question}</Text>
          <PrimaryButton
            label={t('today.prompt.answer')}
            icon="mic"
            variant="secondary"
            onPress={() => navigation.navigate('DailyPrompt')}
          />
        </Card>
      )}

      {!loading && memories.length > 0 && (
        <PrimaryButton
          label={t('today.album')}
          icon="images-outline"
          variant="secondary"
          onPress={() => goToTab('OnThisDayTab')}
        />
      )}

      {/* Most of the hours in a day have no caregiver in the room. This is the
          one screen that works without one. */}
      {!loading && memories.some((m) => m.photo_url) && (
        <PrimaryButton
          label={t('today.handOver', { name })}
          icon="hand-left-outline"
          variant="ghost"
          onPress={enterElderMode}
        />
      )}

      <PrimaryButton
        label={t('today.grandchild')}
        icon="happy-outline"
        variant="ghost"
        onPress={() => navigation.navigate('Grandchild')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs, marginBottom: spacing.xs },
  hero: { overflow: 'hidden' },
  heroPhoto: { width: '100%', height: 190 },
  heroBody: { padding: spacing.lg, gap: spacing.xs },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  count: {
    fontFamily: typography.display.fontFamily,
    fontSize: 46,
    lineHeight: 52,
    color: colors.primary,
  },
  countLabel: { flex: 1 },
  heroAction: { marginTop: spacing.md },
  restCard: { padding: spacing.lg, gap: spacing.sm, alignItems: 'flex-start' },
  restIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  restBody: { color: colors.subtext },
  promptCard: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentSoft,
  },
  promptHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tip: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingHorizontal: spacing.xs },
  tipText: { ...typography.subtext, flex: 1, fontStyle: 'italic' },
});
