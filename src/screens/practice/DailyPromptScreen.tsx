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
import { useT } from '../../lib/i18n';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { PracticeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<PracticeStackParamList, 'DailyPrompt'>;

export function DailyPromptScreen({ navigation }: Props) {
  const { current } = useFamily();
  const t = useT();
  const [prompt, setPrompt] = useState<DailyPrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [answer, setAnswer] = useState('');
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
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
      setError(t('daily.needSomething'));
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
        answer: answer.trim() || t('daily.spokenAnswer'),
        voicePath,
        voiceTranscript: transcript,
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
      setError(e.message ?? t('daily.saveFailed'));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Text style={typography.body}>{t('common.loading')}</Text>
      </Screen>
    );
  }

  if (!prompt) {
    return (
      <Screen>
        <Text style={typography.body}>{t('daily.none')}</Text>
      </Screen>
    );
  }

  const alreadyAnswered = !!prompt.answered_memory_id;

  return (
    <Screen>
      <Text style={typography.label}>{t('daily.eyebrow')}</Text>
      <Card style={styles.questionCard}>
        <Text style={typography.serifLarge}>{prompt.question}</Text>
      </Card>

      {alreadyAnswered ? (
        <Card style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={iconSize.lg} color={colors.success} />
          <Text style={[typography.body, styles.doneText]}>
{t('daily.alreadyAnswered')}
          </Text>
        </Card>
      ) : (
        <>
          <Text style={typography.subtext}>
{t('daily.body', { name })}
          </Text>

          <VoiceRecorder
            uri={voiceUri}
            onChange={setVoiceUri}
            // Only fill an empty box — never overwrite something they typed.
            onTranscript={(text) => {
              setTranscript(text);
              setAnswer((prev) => prev.trim() || text);
            }}
          />

          <TextField
            label={t('daily.write')}
            placeholder={t('daily.writePlaceholder')}
            value={answer}
            onChangeText={setAnswer}
            multiline
            hint={t('daily.writeHint')}
          />

          {error && (
            <View style={styles.error}>
              <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <PrimaryButton label={t('daily.add')} icon="checkmark" onPress={handleSave} loading={saving} />
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
