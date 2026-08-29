import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { EmptyState } from '../../components/EmptyState';
import { VoicePlayer } from '../../components/VoicePlayer';
import { useFamily } from '../../state/FamilyContext';
import { useMemories } from '../../lib/useMemories';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
import { colors, iconSize, radius, shadows, spacing, typography } from '../../lib/theme';
import type { Memory } from '../../lib/types';

// Passive browsing — no quiz, no right or wrong. This is where the mood
// benefit of reminiscence lives, so the photograph gets the whole width and
// the words stay out of its way.
export function OnThisDayScreen() {
  const { current } = useFamily();
  const { memories } = useMemories(current?.family.id ?? null);
  const { nameFor } = useFamilyMembers(current?.family.id ?? null);

  const withPhotos = memories.filter((m) => m.photo_url);
  const name = current?.family.care_recipient_name ?? 'them';

  const renderItem = ({ item }: { item: Memory }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.photo_url! }} style={styles.photo} resizeMode="cover" />
      <View style={styles.caption}>
        <Text style={typography.serifLarge}>{item.answer}</Text>
        {item.note && <Text style={[typography.body, styles.note]}>“{item.note}”</Text>}
        {item.voice_url && (
          <VoicePlayer uri={item.voice_url} attribution={nameFor(item.added_by)} />
        )}
        <View style={styles.attribution}>
          <Ionicons name="heart" size={iconSize.sm} color={colors.accent} />
          <Text style={typography.subtext}>Shared by {nameFor(item.added_by)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <ScreenHeader title="Album" subtitle="Just for looking through — no questions here." />
      </View>
      <FlatList
        data={withPhotos}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="image-outline"
            title="No photos yet"
            body={`Photos added to memories show up here, full width, for quiet browsing with ${name}.`}
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
});
