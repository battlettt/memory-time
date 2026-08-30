import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VoicePlayer } from '../../components/VoicePlayer';
import { EmptyState } from '../../components/EmptyState';
import { useFamily } from '../../state/FamilyContext';
import { useElderMode } from '../../state/ElderModeContext';
import { useMemories } from '../../lib/useMemories';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
import { useScaledTypography } from '../../lib/useScaledTypography';
import { yearsAgo } from '../../lib/dates';
import { useI18n } from '../../lib/i18n';
import { colors, iconSize, maxContentWidth, radius, shadows, spacing } from '../../lib/theme';

const EXIT_HOLD_MS = 1500;

/**
 * The screen you hand over.
 *
 * Everything here is deliberately unlike the rest of the app: no questions,
 * no scoring, no way to be wrong, and only two controls, both enormous. The
 * benefit of reminiscence does not depend on recall being correct, so nothing
 * on this screen tests anyone.
 *
 * Leaving requires holding the small button for a second and a half. A plain
 * tap would be found by accident within a minute.
 */
export function ElderModeScreen() {
  const { current } = useFamily();
  const { exit } = useElderMode();
  const { memories } = useMemories(current?.family.id ?? null);
  const { nameFor } = useFamilyMembers(current?.family.id ?? null);
  // A generous bump on top of whatever the family already chose.
  const type = useScaledTypography(1.15);
  const { t, tCount } = useI18n();

  const [index, setIndex] = useState(0);

  const reel = useMemo(() => memories.filter((m) => m.photo_url), [memories]);
  const memory = reel[index] ?? null;

  const go = (delta: number) => {
    if (reel.length === 0) return;
    setIndex((i) => (i + delta + reel.length) % reel.length);
  };

  if (!memory) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="images-outline"
            title={t('elder.empty.title')}
            body={t('elder.empty.body')}
          />
          <Pressable onPress={exit} style={styles.exitPlain} accessibilityRole="button">
            <Text style={type.body}>{t('elder.back')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const years = yearsAgo(memory.occurred_on, memory.occurred_precision);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.frame}>
        <View style={styles.card}>
          <Image source={{ uri: memory.photo_url! }} style={styles.photo} resizeMode="cover" />
          <View style={styles.caption}>
            {years !== null && (
              <Text style={[type.subtext, styles.anniversary]}>
                {tCount('album.yearsAgo', years)}
              </Text>
            )}
            <Text style={type.serifLarge}>{memory.answer}</Text>
            {memory.note && <Text style={[type.body, styles.note]}>“{memory.note}”</Text>}
            {memory.voice_url && (
              <VoicePlayer uri={memory.voice_url} attribution={nameFor(memory.added_by)} />
            )}
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('elder.previous')}
            onPress={() => go(-1)}
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          >
            <Ionicons name="chevron-back" size={44} color={colors.primary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('elder.nextLabel')}
            onPress={() => go(1)}
            style={({ pressed }) => [styles.navButton, styles.navPrimary, pressed && styles.pressed]}
          >
            <Text style={[type.button, styles.nextLabel]}>{t('elder.next')}</Text>
            <Ionicons name="chevron-forward" size={44} color={colors.onPrimary} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('elder.holdLabel')}
          onLongPress={exit}
          delayLongPress={EXIT_HOLD_MS}
          style={styles.exit}
        >
          <Ionicons name="lock-closed-outline" size={iconSize.sm} color={colors.subtext} />
          <Text style={styles.exitText}>{t('elder.hold')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  frame: { flex: 1, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', padding: spacing.lg, gap: spacing.lg },
  emptyWrap: { flex: 1, justifyContent: 'center', padding: spacing.lg, gap: spacing.lg },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  photo: { width: '100%', flex: 1, minHeight: 220 },
  caption: { padding: spacing.lg, gap: spacing.sm },
  anniversary: { color: colors.accentStrong },
  note: { fontStyle: 'italic', color: colors.onSurfaceMuted },
  controls: { flexDirection: 'row', gap: spacing.md },
  navButton: {
    minHeight: 92,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  navPrimary: { flex: 1, backgroundColor: colors.primary, borderColor: colors.primary },
  nextLabel: { color: colors.onPrimary, fontSize: 26 },
  pressed: { opacity: 0.9 },
  exit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  exitText: { color: colors.subtext, fontSize: 14 },
  // The empty state has nothing to protect, so leaving is a plain tap there.
  exitPlain: { alignSelf: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
});
