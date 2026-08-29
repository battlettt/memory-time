import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { VoicePlayer } from '../../components/VoicePlayer';
import { useFamily } from '../../state/FamilyContext';
import { useMemories, updateMemory, deleteMemory } from '../../lib/useMemories';
import { useFamilyMembers } from '../../lib/useFamilyMembers';
import { unretireUpdate, retireUpdate } from '../../lib/srt';
import { formatOccurred, parseLooseDate } from '../../lib/dates';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { MemoriesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'MemoryDetail'>;

export function MemoryDetailScreen({ route, navigation }: Props) {
  const { memoryId } = route.params;
  const { current } = useFamily();
  const { memories } = useMemories(current?.family.id ?? null);
  const { nameFor } = useFamilyMembers(current?.family.id ?? null);

  const memory = memories.find((m) => m.id === memoryId) ?? null;

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');
  const [dateText, setDateText] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Two-step rather than a modal: Alert is unreliable on web, and a delete
  // that cannot be confirmed is worse than one that takes an extra tap.
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    if (hydrated || !memory) return;
    setQuestion(memory.question);
    setAnswer(memory.answer);
    setNote(memory.note ?? '');
    setDateText(formatOccurred(memory.occurred_on, memory.occurred_precision) ?? '');
    setHydrated(true);
  }, [memory, hydrated]);

  if (!memory) {
    return (
      <Screen>
        <Text style={typography.body}>Loading…</Text>
      </Screen>
    );
  }

  const isPaused = !!memory.paused_until && new Date(memory.paused_until) > new Date();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const parsed = dateText.trim() ? parseLooseDate(dateText) : null;
      if (dateText.trim() && !parsed) {
        setError('Try a year like 1962, a month like “March 1962”, or “the 70s”.');
        setSaving(false);
        return;
      }
      await updateMemory(memory.id, {
        question: question.trim(),
        answer: answer.trim(),
        note: note.trim() || null,
        occurred_on: parsed?.occurred_on ?? null,
        occurred_precision: parsed?.occurred_precision ?? null,
      });
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Could not save this memory');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setSaving(true);
    try {
      await deleteMemory(memory);
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Could not delete this memory');
      setSaving(false);
    }
  };

  return (
    <Screen>
      {memory.photo_url && (
        <Image source={{ uri: memory.photo_url }} style={styles.photo} resizeMode="cover" />
      )}

      {memory.retired_at && (
        <Card style={[styles.statusCard, styles.restingCard]}>
          <Ionicons name="moon-outline" size={iconSize.md} color={colors.accentStrong} />
          <View style={styles.statusText}>
            <Text style={typography.bodyStrong}>Resting</Text>
            <Text style={typography.caption}>
              This one stopped being asked after several difficult sessions. It still appears in
              the album.
            </Text>
          </View>
        </Card>
      )}

      {isPaused && !memory.retired_at && (
        <Card style={[styles.statusCard, styles.restingCard]}>
          <Ionicons name="leaf-outline" size={iconSize.md} color={colors.accentStrong} />
          <View style={styles.statusText}>
            <Text style={typography.bodyStrong}>Set aside for now</Text>
            <Text style={typography.caption}>Marked “not today” during a session.</Text>
          </View>
        </Card>
      )}

      <TextField label="Question" value={question} onChangeText={setQuestion} />
      <TextField
        label="Answer"
        value={answer}
        onChangeText={setAnswer}
        hint="Write it the way you'd say it out loud."
      />
      <TextField
        label="When was this?"
        value={dateText}
        onChangeText={setDateText}
        placeholder="1962, March 1962, or the 70s"
        hint="However precisely you remember it — a year on its own is fine."
      />
      <TextField label="A note from you" value={note} onChangeText={setNote} />

      {memory.voice_url && (
        <VoicePlayer uri={memory.voice_url} attribution={nameFor(memory.added_by)} />
      )}

      <Card style={styles.toggleCard}>
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={typography.bodyStrong}>Always ask this one</Text>
            <Text style={typography.caption}>
              Anchors — a husband, a daughter, their own name — keep coming round however often
              they're missed.
            </Text>
          </View>
          <Switch
            value={memory.is_anchor}
            onValueChange={(value) => updateMemory(memory.id, { is_anchor: value }).catch(() => {})}
            trackColor={{ true: colors.primary, false: colors.borderStrong }}
          />
        </View>
      </Card>

      {error && (
        <View style={styles.error}>
          <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <PrimaryButton label="Save changes" onPress={handleSave} loading={saving} />

      {memory.retired_at ? (
        <PrimaryButton
          label="Start asking this again"
          icon="refresh-outline"
          variant="secondary"
          onPress={() => updateMemory(memory.id, unretireUpdate()).catch(() => {})}
        />
      ) : (
        <PrimaryButton
          label="Rest this one"
          icon="moon-outline"
          variant="secondary"
          onPress={() => updateMemory(memory.id, retireUpdate()).catch(() => {})}
        />
      )}

      <PrimaryButton
        label={confirmingDelete ? 'Tap again to delete for good' : 'Delete this memory'}
        icon="trash-outline"
        variant="ghost"
        onPress={handleDelete}
      />
      {confirmingDelete && (
        <Text style={[typography.caption, styles.centered]}>
          The photo and voice note go too. This can't be undone.
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', height: 240, borderRadius: radius.lg },
  statusCard: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, alignItems: 'flex-start' },
  restingCard: { backgroundColor: colors.accentSoft, borderColor: colors.accentSoft },
  statusText: { flex: 1, gap: 2 },
  toggleCard: { padding: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  toggleText: { flex: 1, gap: 2 },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.destructiveSoft,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  errorText: { ...typography.subtext, color: colors.destructive, flex: 1 },
  centered: { textAlign: 'center' },
});
