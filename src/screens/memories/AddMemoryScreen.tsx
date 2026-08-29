import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PhotoPicker } from '../../components/PhotoPicker';
import { VoiceRecorder } from '../../components/VoiceRecorder';
import { TextField } from '../../components/TextField';
import { Chip } from '../../components/Chip';
import { useFamily } from '../../state/FamilyContext';
import { addMemory } from '../../lib/useMemories';
import { uploadPhoto, uploadVoiceNote } from '../../lib/media';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { MemoriesStackParamList } from '../../navigation/types';
import type { MemoryCategory } from '../../lib/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'AddMemory'>;

export function AddMemoryScreen({ route, navigation }: Props) {
  const { current } = useFamily();
  const [question, setQuestion] = useState(route.params?.prefillQuestion ?? '');
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('relationship');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = current?.family.care_recipient_name ?? 'them';

  // The labels use the care recipient's actual name — "About Rosa herself"
  // reads far more naturally than a generic placeholder.
  const categories: { key: MemoryCategory; label: string }[] = [
    { key: 'relationship', label: 'Who someone is to them' },
    { key: 'identity', label: `About ${name}` },
    { key: 'event', label: 'A moment or event' },
  ];

  const handleSave = async () => {
    if (!current || !question.trim() || !answer.trim()) {
      setError('A question and an answer are both needed to practise with.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const photoUrl = photoUri ? await uploadPhoto(current.family.id, photoUri) : null;
      const voiceUrl = voiceUri ? await uploadVoiceNote(current.family.id, voiceUri) : null;
      await addMemory({
        familyId: current.family.id,
        memberId: current.member.id,
        category,
        question: question.trim(),
        answer: answer.trim(),
        note: note.trim() || null,
        photoUrl,
        voiceUrl,
      });
      navigation.navigate('MemoriesHome');
    } catch (e: any) {
      setError(e.message ?? 'Could not save this memory');
    }
    setSaving(false);
  };

  return (
    <Screen>
      <Text style={typography.title}>Add a memory</Text>

      <View style={styles.section}>
        <Text style={typography.label}>WHAT KIND OF MEMORY</Text>
        <View style={styles.categoryRow}>
          {categories.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              selected={category === c.key}
              onPress={() => setCategory(c.key)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={typography.label}>THE QUESTION AND ANSWER</Text>
        <TextField
          label="Question"
          placeholder="Who is this in the photo?"
          value={question}
          onChangeText={setQuestion}
        />
        <TextField
          label="Answer"
          placeholder="That's Sarah, your granddaughter"
          hint="Write it the way you'd say it out loud."
          value={answer}
          onChangeText={setAnswer}
        />
      </View>

      <View style={styles.section}>
        <Text style={typography.label}>PHOTO AND VOICE</Text>
        <PhotoPicker uri={photoUri} onChange={setPhotoUri} />
        <VoiceRecorder uri={voiceUri} onChange={setVoiceUri} />
      </View>

      <View style={styles.section}>
        <Text style={typography.label}>A NOTE FROM YOU</Text>
        <TextField
          placeholder="I love this one!"
          hint="Optional — shown alongside the answer during practice."
          value={note}
          onChangeText={setNote}
        />
      </View>

      {error && (
        <View style={styles.error}>
          <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <PrimaryButton label="Save memory" onPress={handleSave} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
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
