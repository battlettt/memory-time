import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useFamily } from '../../state/FamilyContext';
import { useMemories } from '../../lib/useMemories';
import { useFamilySettings } from '../../lib/useFamilySettings';
import { dueMemories, sessionSelection } from '../../lib/srt';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { PracticeStackParamList, MainTabParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'PracticeHome'>;

export function PracticeHomeScreen({ navigation }: Props) {
  const { current } = useFamily();
  const { memories, loading } = useMemories(current?.family.id ?? null);
  const { settings } = useFamilySettings(current?.family.id ?? null);
  const due = useMemo(() => dueMemories(memories), [memories]);

  // A capped session is one somebody will actually finish. Thirty due
  // memories reads as a chore and gets skipped; eight is a few minutes.
  const limit = settings?.session_size_limit ?? 8;
  const selected = useMemo(() => sessionSelection(memories, limit), [memories, limit]);

  // A face at the top of the screen does more to invite a session than a
  // number does — this is a ritual with a person, not a task queue.
  const heroPhoto = useMemo(() => memories.find((m) => m.photo_url)?.photo_url ?? null, [memories]);

  const goToTab = (tab: keyof MainTabParamList) =>
    navigation.getParent<BottomTabNavigationProp<MainTabParamList>>()?.navigate(tab);

  const name = current?.family.care_recipient_name ?? 'them';

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={typography.label}>TODAY</Text>
        <Text style={typography.display}>Time with {name}</Text>
      </View>

      {!loading && memories.length === 0 && (
        <EmptyState
          icon="images-outline"
          title="The reel is empty"
          body={`Add a few photos and questions about ${name}, and practice sessions will build themselves from there.`}
          actionLabel="Add the first memory"
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
                {selected.length === 1 ? 'memory ready' : 'memories ready'}
              </Text>
            </View>
            <Text style={typography.subtext}>
              {due.length > selected.length
                ? `${due.length - selected.length} more are waiting — they’ll come round next time.`
                : memories.length - due.length > 0
                  ? `${memories.length - due.length} more will come back around as they're due.`
                  : 'Take them at whatever pace feels right.'}
            </Text>
            <View style={styles.heroAction}>
              <PrimaryButton
                label="Start a session"
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
          <Text style={typography.serifLarge}>All caught up</Text>
          <Text style={[typography.body, styles.restBody]}>
            Everything in the reel has been practised recently. Memories return on their own
            schedule — there's nothing you need to do today.
          </Text>
        </Card>
      )}

      {!loading && memories.length > 0 && (
        <PrimaryButton
          label="Look through the album"
          icon="images-outline"
          variant="secondary"
          onPress={() => goToTab('OnThisDayTab')}
        />
      )}
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
});
