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
import { LANGUAGES } from '../../lib/languages';
import { useT } from '../../lib/i18n';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { MemoriesStackParamList } from '../../navigation/types';
import type { MemoryCategory } from '../../lib/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'AddMemory'>;

export function AddMemoryScreen({ route, navigation }: Props) {
  const { current } = useFamily();
  const t = useT();
  const [question, setQuestion] = useState(route.params?.prefillQuestion ?? '');
  const [answer, setAnswer] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<MemoryCategory>('relationship');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [voiceUri, setVoiceUri] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = current?.family.care_recipient_name ?? 'them';

  // The labels use the care recipient's actual name — "About Rosa herself"
  // reads far more naturally than a generic placeholder.
  const categories: { key: MemoryCategory; label: string }[] = [
    { key: 'relationship', label: t('addMemory.kind.relationship') },
    { key: 'identity', label: t('addMemory.kind.identity', { name }) },
    { key: 'event', label: t('addMemory.kind.event') },
  ];

  const handleSave = async () => {
    if (!current || !question.trim() || !answer.trim()) {
      setError(t('addMemory.needBoth'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Uploads return the storage path; the signed URL is minted at read time
      // so it can never go stale sitting in the database.
      const photoPath = photoUri ? await uploadPhoto(current.family.id, photoUri) : null;
      const voicePath = voiceUri ? await uploadVoiceNote(current.family.id, voiceUri) : null;
      await addMemory({
        familyId: current.family.id,
        memberId: current.member.id,
        category,
        question: question.trim(),
        answer: answer.trim(),
        note: note.trim() || null,
        photoPath,
        voicePath,
        voiceTranscript: transcript,
        language,
      });
      navigation.navigate('MemoriesHome');
    } catch (e: any) {
      setError(e.message ?? t('addMemory.saveFailed'));
    }
    setSaving(false);
  };

  return (
    <Screen>
      <Text style={typography.title}>{t('addMemory.title')}</Text>

      <View style={styles.section}>
        <Text style={typography.label}>{t('addMemory.kind')}</Text>
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
        <Text style={typography.label}>{t('addMemory.qa')}</Text>
        <TextField
          label={t('addMemory.question')}
          placeholder={t('addMemory.questionPlaceholder')}
          value={question}
          onChangeText={setQuestion}
        />
        <TextField
          label={t('addMemory.answer')}
          placeholder={t('addMemory.answerPlaceholder')}
          hint={t('addMemory.answerHint')}
          value={answer}
          onChangeText={setAnswer}
        />
      </View>

      <View style={styles.section}>
        <Text style={typography.label}>{t('addMemory.language')}</Text>
        <Text style={typography.caption}>
{t('addMemory.languageHint')}
        </Text>
        <View style={styles.categoryRow}>
          {LANGUAGES.map((l) => (
            <Chip
              key={l.code}
              label={l.label}
              selected={language === l.code}
              onPress={() => setLanguage(language === l.code ? null : l.code)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={typography.label}>{t('addMemory.media')}</Text>
        <PhotoPicker uri={photoUri} onChange={setPhotoUri} />
        <VoiceRecorder
          uri={voiceUri}
          onChange={setVoiceUri}
          lang={language ?? undefined}
          onTranscript={(text) => {
            setTranscript(text);
            setAnswer((prev) => prev.trim() || text);
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={typography.label}>{t('addMemory.note')}</Text>
        <TextField
          placeholder={t('addMemory.notePlaceholder')}
          hint={t('addMemory.noteHint')}
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
      <PrimaryButton label={t('addMemory.save')} onPress={handleSave} loading={saving} />
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
