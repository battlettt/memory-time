import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { useFamily } from '../../state/FamilyContext';
import { useMemories } from '../../lib/useMemories';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
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

  const name = current?.family.care_recipient_name ?? 'them';

  const renderItem = ({ item }: { item: Memory }) => (
    <Card style={styles.card}>
      {item.photo_url ? (
        <Image source={{ uri: item.photo_url }} style={styles.thumb} />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Ionicons name={CATEGORY_ICON[item.category]} size={iconSize.md} color={colors.primary} />
        </View>
      )}
      <View style={styles.cardBody}>
        <Text style={typography.bodyStrong}>{item.question}</Text>
        <Text style={typography.subtext} numberOfLines={1}>
          {item.answer}
        </Text>
        <View style={styles.attribution}>
          <Ionicons name="heart" size={14} color={colors.accent} />
          <Text style={typography.caption}>{nameFor(item.added_by)}</Text>
          {item.voice_url && (
            <>
              <Ionicons name="mic" size={14} color={colors.accent} style={styles.micIcon} />
              <Text style={typography.caption}>voice note</Text>
            </>
          )}
        </View>
      </View>
    </Card>
  );

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <ScreenHeader
          title="Memories"
          subtitle={`The questions and photos ${name} practises with.`}
        />
        <View style={styles.actions}>
          <PrimaryButton
            label="Get topic ideas"
            icon="sparkles"
            onPress={() => navigation.navigate('TopicPrompts')}
          />
          <PrimaryButton
            label="Add a memory"
            icon="add"
            variant="secondary"
            onPress={() => navigation.navigate('AddMemory', undefined)}
          />
        </View>
      </View>

      <FlatList
        data={memories}
        keyExtractor={(m) => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="albums-outline"
            title="Nothing in the reel yet"
            body="Not sure where to start? Topic ideas will suggest specific questions worth asking."
            actionLabel="Get topic ideas"
            onAction={() => navigation.navigate('TopicPrompts')}
          />
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
  thumb: { width: 92, height: 100 },
  thumbPlaceholder: {
    width: 92,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, padding: spacing.md, gap: 3 },
  attribution: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  micIcon: { marginLeft: spacing.sm },
});
