import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { useFamily } from '../../state/FamilyContext';
import { useT } from '../../lib/i18n';
import { generateTopicPrompts } from '../../lib/aiPrompts';
import { LIFE_STORY_SECTION_KEYS, TOPIC_LABELS } from '../../lib/types';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { MemoriesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'TopicPrompts'>;

export function TopicPromptsScreen({ navigation }: Props) {
  const { current } = useFamily();
  const t = useT();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = current?.family.care_recipient_name ?? 'them';

  const handlePickTopic = async (topic: string) => {
    if (!current) return;
    setSelectedTopic(topic);
    setPrompts([]);
    setError(null);
    setLoading(true);
    try {
      const results = await generateTopicPrompts(current.family.id, topic);
      setPrompts(results);
    } catch {
      setError(t('topics.failed'));
    }
    setLoading(false);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.sparkle}>
          <Ionicons name="sparkles" size={iconSize.md} color={colors.onAccent} />
        </View>
        <View style={styles.headerText}>
          <Text style={typography.title}>{t('topics.heading')}</Text>
          <Text style={typography.subtext}>
            Pick a topic and we'll suggest specific questions about {name} — the kind that are
            easier to answer than "tell me about their life".
          </Text>
        </View>
      </View>

      <View style={styles.chipRow}>
        {LIFE_STORY_SECTION_KEYS.map((key) => (
          <Chip
            key={key}
            label={TOPIC_LABELS[key]}
            selected={selectedTopic === TOPIC_LABELS[key]}
            onPress={() => handlePickTopic(TOPIC_LABELS[key])}
          />
        ))}
      </View>

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={typography.subtext}>{t('topics.thinking')}</Text>
        </View>
      )}
      {error && (
        <View style={styles.error}>
          <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {prompts.length > 0 && <Text style={typography.label}>TAP ONE TO ANSWER IT</Text>}

      {prompts.map((prompt, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          onPress={() => navigation.navigate('AddMemory', { prefillQuestion: prompt })}
        >
          {({ pressed }) => (
            <Card style={[styles.promptCard, pressed && styles.pressed]}>
              <Text style={[typography.body, styles.promptText]}>{prompt}</Text>
              <Ionicons name="arrow-forward" size={iconSize.md} color={colors.primary} />
            </Card>
          )}
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  sparkle: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: { opacity: 0.85 },
  promptText: { flex: 1 },
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
