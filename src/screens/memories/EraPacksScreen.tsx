import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Card } from '../../components/Card';
import { useFamily } from '../../state/FamilyContext';
import { ERA_PACKS } from '../../lib/eraPacks';
import { colors, iconSize, minTapTarget, radius, spacing, typography } from '../../lib/theme';
import type { MemoriesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'EraPacks'>;

export function EraPacksScreen({ navigation }: Props) {
  const { current } = useFamily();
  const [openId, setOpenId] = useState<string | null>(ERA_PACKS[1]?.id ?? null);

  const name = current?.family.care_recipient_name ?? 'them';

  return (
    <Screen>
      <ScreenHeader
        title="By decade"
        subtitle={`Questions about the years ${name} was young — useful when the photographs run out.`}
      />

      <Card style={styles.why}>
        <Ionicons name="information-circle-outline" size={iconSize.md} color={colors.primary} />
        <Text style={[typography.subtext, styles.whyText]}>
          Memory for one's own life peaks around ages ten to thirty, so the decade someone grew up
          in is far richer ground than last year.
        </Text>
      </Card>

      {ERA_PACKS.map((pack) => {
        const open = openId === pack.id;
        return (
          <Card key={pack.id} style={styles.pack}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpenId(open ? null : pack.id)}
              style={styles.packHead}
            >
              <View style={styles.packText}>
                <Text style={typography.heading}>{pack.decade}</Text>
                <Text style={typography.subtext}>{pack.blurb}</Text>
              </View>
              <Ionicons
                name={open ? 'chevron-up' : 'chevron-down'}
                size={iconSize.md}
                color={colors.subtext}
              />
            </Pressable>

            {open && (
              <View style={styles.prompts}>
                {pack.prompts.map((prompt) => (
                  <Pressable
                    key={prompt.question}
                    accessibilityRole="button"
                    accessibilityLabel={`Use question: ${prompt.question}`}
                    onPress={() =>
                      navigation.navigate('AddMemory', { prefillQuestion: prompt.question })
                    }
                    style={({ pressed }) => [styles.prompt, pressed && styles.promptPressed]}
                  >
                    <View style={styles.themeChip}>
                      <Text style={styles.themeText}>{prompt.theme}</Text>
                    </View>
                    <Text style={[typography.body, styles.promptText]}>{prompt.question}</Text>
                    <Ionicons name="add-circle-outline" size={iconSize.md} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            )}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  why: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, alignItems: 'flex-start' },
  whyText: { flex: 1 },
  pack: { overflow: 'hidden' },
  packHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    minHeight: minTapTarget,
  },
  packText: { flex: 1, gap: 2 },
  prompts: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: minTapTarget,
  },
  promptPressed: { opacity: 0.7 },
  promptText: { flex: 1 },
  themeChip: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    minWidth: 62,
    alignItems: 'center',
  },
  themeText: { ...typography.caption, color: colors.onSurfaceMuted },
});
