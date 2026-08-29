import React, { useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { VoicePlayer } from '../../components/VoicePlayer';
import { useFamily } from '../../state/FamilyContext';
import { useMemories, recordSrtResult } from '../../lib/useMemories';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
import { AdaptivePacer, SessionQueue, applyLongTermResult, reviewOnlyPool } from '../../lib/srt';
import { colors, iconSize, radius, shadows, spacing, typography } from '../../lib/theme';
import type { PracticeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'Session'>;

type Phase = 'question' | 'revealed' | 'done';

export function SessionScreen({ route, navigation }: Props) {
  const { current } = useFamily();
  const { memories } = useMemories(current?.family.id ?? null);
  const { nameFor } = useFamilyMembers(current?.family.id ?? null);
  const { memoryIds } = route.params;

  const queueRef = useRef(new SessionQueue(memoryIds));
  const pacerRef = useRef(new AdaptivePacer());
  const reviewOnlyIds = useMemo(
    () => new Set(reviewOnlyPool(memories).map((m) => m.id)),
    [memories]
  );

  const [phase, setPhase] = useState<Phase>('question');
  const [currentId, setCurrentId] = useState<string | null>(queueRef.current.current());
  const [pacingNotice, setPacingNotice] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  const currentMemory = memories.find((m) => m.id === currentId) ?? null;
  const remaining = queueRef.current.remaining();
  const progress = answeredCount + remaining === 0 ? 0 : answeredCount / (answeredCount + remaining);

  const handleAnswer = async (correct: boolean) => {
    if (!currentId) return;
    const memory = currentMemory;
    pacerRef.current.record(correct);
    const result = queueRef.current.recordAnswer(correct);
    setAnsweredCount((c) => c + 1);

    if (result.resolved && memory) {
      const update = applyLongTermResult(memory, correct);
      recordSrtResult(memory.id, update).catch(() => {});
    }

    if (pacerRef.current.shouldEndSession()) {
      setPacingNotice("We stopped early today — a short session is still a good one.");
      setPhase('done');
      return;
    }

    if (pacerRef.current.shouldSwitchToReviewOnly()) {
      queueRef.current.filterRemaining((id) => reviewOnlyIds.has(id));
      setPacingNotice('Switched to more familiar memories for the rest of this session.');
    }

    if (queueRef.current.isComplete) {
      setPhase('done');
      return;
    }

    setCurrentId(queueRef.current.current());
    setPhase('question');
  };

  if (phase === 'done') {
    return (
      <Screen>
        <View style={styles.doneWrap}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark" size={42} color={colors.onSuccess} />
          </View>
          <Text style={typography.display}>Session complete</Text>
          <Text style={[typography.bodyLarge, styles.doneCount]}>
            {answeredCount} {answeredCount === 1 ? 'memory' : 'memories'} practised together.
          </Text>
          {pacingNotice && <Text style={[typography.subtext, styles.centered]}>{pacingNotice}</Text>}
        </View>
        <PrimaryButton label="Done" onPress={() => navigation.goBack()} />
      </Screen>
    );
  }

  if (!currentMemory) {
    return (
      <Screen>
        <Text style={typography.body}>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressBlock}>
          <ProgressBar value={progress} label={`${remaining} memories remaining in this session`} />
          <Text style={typography.caption}>
            {remaining} {remaining === 1 ? 'memory' : 'memories'} left
          </Text>
        </View>

        {pacingNotice && phase === 'question' && (
          <View style={styles.notice}>
            <Ionicons name="leaf-outline" size={iconSize.sm} color={colors.accentStrong} />
            <Text style={styles.noticeText}>{pacingNotice}</Text>
          </View>
        )}

        {currentMemory.photo_url && (
          <Image source={{ uri: currentMemory.photo_url }} style={styles.photo} resizeMode="cover" />
        )}

        <Text style={typography.title}>{currentMemory.question}</Text>

        {phase === 'question' && (
          <PrimaryButton label="Reveal answer" onPress={() => setPhase('revealed')} />
        )}

        {phase === 'revealed' && (
          <View style={styles.answerBlock}>
            <Card style={styles.answer}>
              <Text style={typography.bodyLarge}>{currentMemory.answer}</Text>
              {currentMemory.note && (
                <Text style={[typography.body, styles.note]}>“{currentMemory.note}”</Text>
              )}
              {currentMemory.voice_url && (
                <VoicePlayer
                  uri={currentMemory.voice_url}
                  attribution={nameFor(currentMemory.added_by)}
                />
              )}
              <View style={styles.attribution}>
                <Ionicons name="heart" size={iconSize.sm} color={colors.accent} />
                <Text style={typography.subtext}>Added by {nameFor(currentMemory.added_by)}</Text>
              </View>
            </Card>

            <View style={styles.buttonRow}>
              <PrimaryButton
                label="They remembered"
                icon="checkmark-circle-outline"
                variant="success"
                onPress={() => handleAnswer(true)}
              />
              <PrimaryButton
                label="Needed a hand"
                variant="secondary"
                onPress={() => handleAnswer(false)}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  progressBlock: { gap: spacing.xs },
  photo: { width: '100%', height: 300, borderRadius: radius.lg, ...shadows.md },
  answerBlock: { gap: spacing.md },
  answer: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  note: { fontStyle: 'italic', color: colors.onSurfaceMuted },
  attribution: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  buttonRow: { gap: spacing.sm },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  noticeText: { ...typography.subtext, color: colors.onSurfaceMuted, flex: 1 },
  doneWrap: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  doneIcon: {
    width: 84,
    height: 84,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  doneCount: { color: colors.subtext },
  centered: { textAlign: 'center' },
});
