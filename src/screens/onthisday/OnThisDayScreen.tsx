import React, { useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';
import { VoicePlayer } from '../../components/VoicePlayer';
import { useFamily } from '../../state/FamilyContext';
import { useMemories } from '../../lib/useMemories';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
import { anniversariesToday, formatOccurred, yearsAgo } from '../../lib/dates';
import { useI18n } from '../../lib/i18n';
import { colors, iconSize, radius, shadows, spacing, typography } from '../../lib/theme';
import type { Memory } from '../../lib/types';

// Passive browsing — no quiz, no right or wrong. This is where the mood
// benefit of reminiscence lives, so the photograph gets the whole width and
// the words stay out of its way.
export function OnThisDayScreen() {
  const { current } = useFamily();
  const { memories } = useMemories(current?.family.id ?? null);
  const { nameFor } = useFamilyMembers(current?.family.id ?? null);
  const { t, tCount } = useI18n();

  const withPhotos = memories.filter((m) => m.photo_url);
  const name = current?.family.care_recipient_name ?? 'them';

  // The anniversary of something that actually happened is the strongest
  // reason to open this screen on any given day.
  const anniversaries = useMemo(() => anniversariesToday(withPhotos), [withPhotos]);

  // Anniversaries float to the top on the day they fall; the rest of the
  // album keeps its usual order underneath.
  const ordered = useMemo(() => {
    if (anniversaries.length === 0) return withPhotos;
    const ids = new Set(anniversaries.map((m) => m.id));
    return [...anniversaries, ...withPhotos.filter((m) => !ids.has(m.id))];
  }, [withPhotos, anniversaries]);

  const renderItem = ({ item }: { item: Memory }) => {
    const years = yearsAgo(item.occurred_on, item.occurred_precision);
    const occurred = formatOccurred(item.occurred_on, item.occurred_precision);

    return (
    <View style={styles.card}>
      <Image source={{ uri: item.photo_url! }} style={styles.photo} resizeMode="cover" />
      <View style={styles.caption}>
        {years !== null && (
          <View style={styles.anniversary}>
            <Ionicons name="sparkles" size={iconSize.sm} color={colors.accentStrong} />
            <Text style={styles.anniversaryText}>{tCount('album.yearsAgo', years)}</Text>
          </View>
        )}
        <Text style={typography.serifLarge}>{item.answer}</Text>
        {occurred && years === null && <Text style={typography.subtext}>{occurred}</Text>}
        {item.note && <Text style={[typography.body, styles.note]}>“{item.note}”</Text>}
        {item.voice_url && (
          <VoicePlayer uri={item.voice_url} attribution={nameFor(item.added_by)} />
        )}
        <View style={styles.attribution}>
          <Ionicons name="heart" size={iconSize.sm} color={colors.accent} />
          <Text style={typography.subtext}>{t('common.sharedBy', { name: nameFor(item.added_by) })}</Text>
        </View>
      </View>
    </View>
    );
  };

  const subtitle =
    anniversaries.length > 0
      ? tCount('album.anniversaries', anniversaries.length)
      : t('album.subtitle');

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <ScreenHeader title={t('album.title')} subtitle={subtitle} />
      </View>
      <FlatList
        data={ordered}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="image-outline"
            title={t('album.empty.title')}
            body={t('album.empty.body', { name })}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xl },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  photo: { width: '100%', height: 340 },
  caption: { padding: spacing.lg, gap: spacing.sm },
  note: { fontStyle: 'italic', color: colors.onSurfaceMuted },
  attribution: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  anniversary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  anniversaryText: { ...typography.caption, color: colors.onSurfaceMuted },
});
