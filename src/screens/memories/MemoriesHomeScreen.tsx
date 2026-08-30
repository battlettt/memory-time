import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { TextField } from '../../components/TextField';
import { useFamily } from '../../state/FamilyContext';
import { useMemories } from '../../lib/useMemories';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
import { formatOccurred } from '../../lib/dates';
import { languageLabel } from '../../lib/languages';
import { useT } from '../../lib/i18n';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { MemoriesStackParamList } from '../../navigation/types';
import type { Memory, MemoryCategory } from '../../lib/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'MemoriesHome'>;

const CATEGORY_ICON: Record<MemoryCategory, keyof typeof Ionicons.glyphMap> = {
  relationship: 'people-outline',
  identity: 'person-outline',
  event: 'calendar-outline',
};

export function MemoriesHomeScreen({ navigation }: Props) {
  const { current } = useFamily();
  const familyId = current?.family.id ?? null;
  const { memories } = useMemories(familyId);
  const { nameFor } = useFamilyMembers(familyId);
  const [query, setQuery] = useState('');
  const t = useT();

  const name = current?.family.care_recipient_name ?? 'them';

  // Client-side because the whole reel is already loaded; a family archive is
  // hundreds of rows, not millions, and this keeps search working offline.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return memories;
    return memories.filter((m) =>
      [m.question, m.answer, m.note ?? ''].some((field) => field.toLowerCase().includes(q))
    );
  }, [memories, query]);

  const renderItem = ({ item }: { item: Memory }) => {
    const resting = !!item.retired_at;
    const paused = !resting && !!item.paused_until && new Date(item.paused_until) > new Date();
    const occurred = formatOccurred(item.occurred_on, item.occurred_precision);

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('memories.open', { question: item.question })}
        onPress={() => navigation.navigate('MemoryDetail', { memoryId: item.id })}
      >
        {({ pressed }) => (
          <Card style={[styles.card, pressed && styles.cardPressed]}>
            {item.photo_url ? (
              <Image source={{ uri: item.photo_url }} style={styles.thumb} />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Ionicons
                  name={CATEGORY_ICON[item.category]}
                  size={iconSize.md}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={typography.bodyStrong}>{item.question}</Text>
              <Text style={typography.subtext} numberOfLines={1}>
                {item.answer}
              </Text>
              <View style={styles.attribution}>
                {item.is_anchor && (
                  <Ionicons name="star" size={14} color={colors.accent} />
                )}
                <Ionicons name="heart" size={14} color={colors.accent} />
                <Text style={typography.caption}>{nameFor(item.added_by)}</Text>
                {occurred && <Text style={typography.caption}>· {occurred}</Text>}
                {item.language && (
                  <Text style={typography.caption}>· {languageLabel(item.language)}</Text>
                )}
                {item.voice_url && (
                  <>
                    <Ionicons name="mic" size={14} color={colors.accent} style={styles.micIcon} />
                    <Text style={typography.caption}>{t('memories.voiceNote')}</Text>
                  </>
                )}
              </View>
              {(resting || paused) && (
                <View style={styles.badge}>
                  <Ionicons
                    name={resting ? 'moon-outline' : 'leaf-outline'}
                    size={12}
                    color={colors.accentStrong}
                  />
                  <Text style={styles.badgeText}>
{resting ? t('memories.resting') : t('memories.setAside')}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        )}
      </Pressable>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <ScreenHeader
          title={t('memories.title')}
          subtitle={t('memories.subtitle', { name })}
        />
        <View style={styles.actions}>
          {/* Batch import leads: typing memories one at a time is the reason
              families stop contributing after the first week. */}
          <PrimaryButton
            label={t('memories.import')}
            icon="images"
            onPress={() => navigation.navigate('ImportPhotos')}
          />
          <PrimaryButton
            label={t('memories.topicIdeas')}
            icon="sparkles"
            variant="secondary"
            onPress={() => navigation.navigate('TopicPrompts')}
          />
          <PrimaryButton
            label={t('memories.byDecade')}
            icon="time-outline"
            variant="secondary"
            onPress={() => navigation.navigate('EraPacks')}
          />
          <PrimaryButton
            label={t('memories.addByHand')}
            icon="add"
            variant="ghost"
            onPress={() => navigation.navigate('AddMemory', undefined)}
          />
        </View>
        {memories.length > 6 && (
          <TextField
            placeholder={t('memories.search')}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim() ? (
            <EmptyState
              icon="search-outline"
              title={t('memories.noMatch.title')}
              body={t('memories.noMatch.body', { query: query.trim() })}
            />
          ) : (
            <EmptyState
              icon="albums-outline"
              title={t('memories.empty.title')}
              // Era questions need no photos and no setup, so they are the one
              // thing that works on the very first day.
              body={t('memories.empty.body')}
              actionLabel={t('memories.empty.action')}
              onAction={() => navigation.navigate('EraPacks')}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  actions: { gap: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: { flexDirection: 'row', overflow: 'hidden', alignItems: 'stretch' },
  cardPressed: { opacity: 0.85 },
  thumb: { width: 92, height: 100 },
  thumbPlaceholder: {
    width: 92,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, padding: spacing.md, gap: 3 },
  attribution: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, flexWrap: 'wrap' },
  micIcon: { marginLeft: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginTop: 4,
  },
  badgeText: { ...typography.caption, color: colors.onSurfaceMuted },
});
