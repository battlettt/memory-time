import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { VoicePlayer } from '../../components/VoicePlayer';
import { ElderAnswerRecorder } from '../../components/ElderAnswerRecorder';
import { useFamily } from '../../state/FamilyContext';
import { useMemories, recordSrtResult, updateMemory } from '../../lib/useMemories';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
import { useFamilySettings } from '../../lib/useFamilySettings';
import { startSession, logReview, endSession } from '../../lib/sessions';
import {
  AdaptivePacer,
  SessionQueue,
  applyLongTermResult,
  pauseAfterDistress,
  reviewOnlyPool,
} from '../../lib/srt';
import { formatOccurred } from '../../lib/dates';
import { colors, iconSize, radius, shadows, spacing, typography } from '../../lib/theme';
import type { PracticeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'Session'>;

type Phase = 'question' | 'revealed' | 'done';

/**
 * A graduated cue, rather than jumping straight to the answer.
 *
 * Clinical SRT ladders the help it gives — no cue, then a narrowing one, then
 * the answer — because being nudged into recalling something yourself is both
 * better practice and far less deflating than being told.
 */
function hintFor(answer: string): string {
  const firstWord = answer.trim().split(/\s+/)[0] ?? '';
  const letter = firstWord.charAt(0).toUpperCase();
  return letter ? `It starts with “${letter}”` : 'Take your time';
}

export function SessionScreen({ route, navigation }: Props) {
  const { current } = useFamily();
  const { memories } = useMemories(current?.family.id ?? null);
  const { nameFor } = useFamilyMembers(current?.family.id ?? null);
  const { settings } = useFamilySettings(current?.family.id ?? null);
  const { memoryIds } = route.params;

  const queueRef = useRef(new SessionQueue(memoryIds));
  const pacerRef = useRef(new AdaptivePacer());
  const sessionIdRef = useRef<string | null>(null);
  const correctCountRef = useRef(0);
  const reviewOnlyIds = useMemo(
    () => new Set(reviewOnlyPool(memories).map((m) => m.id)),
    [memories]
  );

  const [phase, setPhase] = useState<Phase>('question');
  const [cueLevel, setCueLevel] = useState(0);
  const [currentId, setCurrentId] = useState<string | null>(queueRef.current.current());
  const [pacingNotice, setPacingNotice] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);

  const familyId = current?.family.id ?? null;
  const memberId = current?.member.id ?? null;

  useEffect(() => {
    if (!familyId) return;
    let cancelled = false;
    startSession(familyId, memberId).then((id) => {
      if (!cancelled) sessionIdRef.current = id;
    });
    return () => {
      cancelled = true;
    };
  }, [familyId, memberId]);

  const currentMemory = memories.find((m) => m.id === currentId) ?? null;
  const remaining = queueRef.current.remaining();
  const progress = answeredCount + remaining === 0 ? 0 : answeredCount / (answeredCount + remaining);

  const finish = (endedEarly: boolean) => {
    endSession(sessionIdRef.current, {
      answered: answeredCount,
      correct: correctCountRef.current,
      endedEarly,
    }).catch(() => {});
    setPhase('done');
  };

  const advance = () => {
    if (queueRef.current.isComplete) {
      finish(false);
      return;
    }
    setCurrentId(queueRef.current.current());
    setCueLevel(0);
    setPhase('question');
  };

  /**
   * A memory can vanish part-way through a session — a relative deletes it
   * from their own phone, or it retires between the list being built and the
   * question coming up. Skip past it instead of stranding the screen on
   * "Loading…" forever, which is what used to happen.
   */
  useEffect(() => {
    if (phase === 'done' || !currentId || currentMemory || memories.length === 0) return;
    // Resolved without being scored: nobody answered it, so it is not a miss.
    queueRef.current.recordAnswer(true);
    advance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, currentMemory, memories.length, phase]);

  /**
   * "Not today" — reminiscence surfaces grief as readily as joy. A question
   * about a spouse who has died can land badly, and the right response is to
   * set it aside for a while, not to mark it wrong and drill it harder.
   */
  const handleNotToday = async () => {
    if (!currentMemory || !familyId) return;
    const memory = currentMemory;

    logReview({
      familyId,
      memoryId: memory.id,
      sessionId: sessionIdRef.current,
      correct: false,
      cueLevel,
      outcome: 'distressing',
    }).catch(() => {});

    updateMemory(memory.id, pauseAfterDistress()).catch(() => {});

    // Deliberately not counted as an answer and not fed to the pacer: this was
    // not a failure of recall, and it should not drag the session's mood down.
    queueRef.current.recordAnswer(true);
    setPacingNotice('Set aside for now — it won’t come up again for a few weeks.');
    advance();
  };

  const handleAnswer = async (correct: boolean) => {
    if (!currentId) return;
    const memory = currentMemory;
    pacerRef.current.record(correct);
    const result = queueRef.current.recordAnswer(correct);
    setAnsweredCount((c) => c + 1);
    if (correct) correctCountRef.current += 1;

    if (memory && familyId) {
      logReview({
        familyId,
        memoryId: memory.id,
        sessionId: sessionIdRef.current,
        correct,
        cueLevel,
      }).catch(() => {});
    }

    if (result.resolved && memory) {
      const update = applyLongTermResult(
        memory,
        correct,
        new Date(),
        settings?.retire_after_misses
      );
      recordSrtResult(memory.id, update).catch(() => {});
    }

    if (pacerRef.current.shouldEndSession()) {
      setPacingNotice('We stopped early today — a short session is still a good one.');
      finish(true);
      return;
    }

    if (pacerRef.current.shouldSwitchToReviewOnly()) {
      queueRef.current.filterRemaining((id) => reviewOnlyIds.has(id));
      setPacingNotice('Switched to more familiar memories for the rest of this session.');
    }

    advance();
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

  const occurred = formatOccurred(currentMemory.occurred_on, currentMemory.occurred_precision);

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
        {occurred && <Text style={typography.subtext}>{occurred}</Text>}

        {phase === 'question' && (
          <View style={styles.buttonRow}>
            {cueLevel === 0 ? (
              <PrimaryButton
                label="Give a hint"
                icon="bulb-outline"
                variant="secondary"
                onPress={() => setCueLevel(1)}
              />
            ) : (
              <View style={styles.hint}>
                <Ionicons name="bulb-outline" size={iconSize.sm} color={colors.accentStrong} />
                <Text style={styles.hintText}>{hintFor(currentMemory.answer)}</Text>
              </View>
            )}
            <PrimaryButton label="Reveal answer" onPress={() => setPhase('revealed')} />
          </View>
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
              {current && (
                <ElderAnswerRecorder
                  familyId={current.family.id}
                  memoryId={currentMemory.id}
                  personName={current.family.care_recipient_name}
                />
              )}
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
              <PrimaryButton
                label="Not today"
                icon="leaf-outline"
                variant="ghost"
                onPress={handleNotToday}
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
  answer: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  note: { fontStyle: 'italic', color: colors.onSurfaceMuted },
  attribution: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  buttonRow: { gap: spacing.sm },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  hintText: { ...typography.bodyStrong, color: colors.onSurfaceMuted, flex: 1 },
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
