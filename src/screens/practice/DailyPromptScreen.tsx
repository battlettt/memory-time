import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { useFamily } from '../../state/FamilyContext';
import { addMemory } from '../../lib/useMemories';
import { uploadVoiceNote } from '../../lib/media';
import { getOrCreateTodaysPrompt, markPromptAnswered, type DailyPrompt } from '../../lib/dailyPrompt';
import { supabase } from '../../lib/supabase';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { PracticeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'DailyPrompt'>;

export function DailyPromptScreen({ navigation }: Props) {
  const { current } = useFamily();
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = current?.family.care_recipient_name ?? 'them';

  useEffect(() => {
    if (!current) return;
    let cancelled = false;
    getOrCreateTodaysPrompt(current.family.id, current.member.id)
      .then((p) => {
        if (!cancelled) {
          setPrompt(p);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [current]);

  const handleSave = async () => {
    if (!current || !prompt) return;
    if (!answer.trim() && !voiceUri) {
      setError('Record something or write a line — either is plenty.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const voicePath = voiceUri ? await uploadVoiceNote(current.family.id, voiceUri) : null;

      await addMemory({
        familyId: current.family.id,
        memberId: current.member.id,
        category: 'identity',
        question: prompt.question,
        // A voice-only answer is a perfectly good memory; the text is only a
        // label for the list until somebody types more.
        answer: answer.trim() || 'Answered out loud — press play to hear it.',
        voicePath,
        source: 'daily_prompt',
        needsReview: !answer.trim(),
      });

      // Find the row we just wrote so the prompt can point at it.
      const { data: saved } = await supabase
        .from('memories')
        .select('id')
        .eq('family_id', current.family.id)
        .eq('question', prompt.question)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (saved?.id) await markPromptAnswered(prompt.id, saved.id);

      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Could not save that');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Text style={typography.body}>Loading…</Text>
      </Screen>
    );
  }

  if (!prompt) {
    return (
      <Screen>
        <Text style={typography.body}>No question today. Try again tomorrow.</Text>
      </Screen>
    );
  }

  const alreadyAnswered = !!prompt.answered_memory_id;

  return (
    <Screen>
      <Text style={typography.label}>TODAY'S QUESTION</Text>
      <Card style={styles.questionCard}>
        <Text style={typography.serifLarge}>{prompt.question}</Text>
      </Card>

      {alreadyAnswered ? (
        <Card style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={iconSize.lg} color={colors.success} />
          <Text style={[typography.body, styles.doneText]}>
            You've already answered this one today. Another question comes tomorrow.
          </Text>
        </Card>
      ) : (
        <>
          <Text style={typography.subtext}>
            Twenty seconds out loud is worth more than a paragraph typed — {name} will hear your
            actual voice when this comes up in a session.
          </Text>

          <VoiceRecorder uri={voiceUri} onChange={setVoiceUri} />

          <TextField
            label="Or write it down"
            placeholder="She worked at the mill from fifteen…"
            value={answer}
            onChangeText={setAnswer}
            multiline
            hint="Optional if you've recorded something."
          />

          {error && (
            <View style={styles.error}>
              <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <PrimaryButton label="Add to the reel" icon="checkmark" onPress={handleSave} loading={saving} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  questionCard: {
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderColor: colors.primarySoft,
  },
  doneCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg, alignItems: 'center' },
  doneText: { flex: 1 },
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
