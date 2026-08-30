import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { useFamily } from '../../state/FamilyContext';
import { useLifeStory } from '../../lib/useLifeStory';
import { LIFE_STORY_SECTION_KEYS, type LifeStorySectionKey } from '../../lib/types';
import { useT } from '../../lib/i18n';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { LifeStoryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LifeStoryStackParamList, 'LifeStoryHome'>;

const SECTION_ICON: Record<LifeStorySectionKey, keyof typeof Ionicons.glyphMap> = {
  early_life: 'home-outline',
  career: 'briefcase-outline',
  family: 'people-outline',
  personality: 'happy-outline',
  favorites: 'heart-outline',
  stories: 'chatbubble-ellipses-outline',
};

export function LifeStoryHomeScreen({ navigation }: Props) {
  const { current } = useFamily();
  const { sections } = useLifeStory(current?.family.id ?? null);
  const t = useT();

  const name = current?.family.care_recipient_name ?? 'them';
  const filled = LIFE_STORY_SECTION_KEYS.filter((key) =>
    sections.some((s) => s.section_key === key && s.content.trim().length > 0)
  ).length;

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={typography.label}>{t('story.eyebrow')}</Text>
        <Text style={typography.display}>{t('story.title', { name })}</Text>
        <Text style={typography.subtext}>
{t('story.subtitle')}
        </Text>
      </View>

      <Card style={styles.progressCard}>
        <View style={styles.progressRow}>
          <Text style={typography.bodyStrong}>
{t('story.progress', { done: filled, total: LIFE_STORY_SECTION_KEYS.length })}
          </Text>
          {filled === LIFE_STORY_SECTION_KEYS.length && (
            <Ionicons name="checkmark-circle" size={iconSize.md} color={colors.success} />
          )}
        </View>
        <ProgressBar
          value={filled / LIFE_STORY_SECTION_KEYS.length}
          label={t('story.progress', { done: filled, total: LIFE_STORY_SECTION_KEYS.length })}
        />
      </Card>

      {LIFE_STORY_SECTION_KEYS.map((key) => {
        const section = sections.find((s) => s.section_key === key);
        const written = !!section?.content.trim();
        return (
          <Pressable key={key} onPress={() => navigation.navigate('EditSection', { sectionKey: key })}>
            {({ pressed }) => (
              <Card style={[styles.card, pressed && styles.cardPressed]}>
                {section?.photo_url ? (
                  <Image source={{ uri: section.photo_url }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumbPlaceholder, written && styles.thumbWritten]}>
                    <Ionicons
                      name={SECTION_ICON[key]}
                      size={iconSize.lg}
                      color={written ? colors.primary : colors.subtext}
                    />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={typography.heading}>{t(`chapter.${key}` as never)}</Text>
                  <Text
                    style={[typography.subtext, !written && styles.placeholder]}
                    numberOfLines={2}
                  >
                    {section?.content || t('story.notWritten')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={iconSize.md} color={colors.subtext} />
              </Card>
            )}
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  progressCard: { padding: spacing.md, gap: spacing.sm },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    paddingRight: spacing.md,
  },
  cardPressed: { opacity: 0.85 },
  thumb: { width: 78, height: 84 },
  thumbPlaceholder: {
    width: 78,
    height: 84,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbWritten: { backgroundColor: colors.primarySoft },
  cardBody: { flex: 1, padding: spacing.md, gap: 2 },
  placeholder: { fontStyle: 'italic' },
});
