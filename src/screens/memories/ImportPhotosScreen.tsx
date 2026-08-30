import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { EmptyState } from '../../components/EmptyState';
import { useFamily } from '../../state/FamilyContext';
import { addMemory } from '../../lib/useMemories';
import { uploadPhoto } from '../../lib/media';
import { formatOccurred } from '../../lib/dates';
import { useI18n } from '../../lib/i18n';
import {
  MAX_IMPORT_BATCH,
  capturePhotoForImport,
  draftMemoriesFromPhotos,
  pickPhotosForImport,
  type MemoryDraft,
  type PickedPhoto,
} from '../../lib/photoImport';
import { colors, iconSize, radius, spacing, typography } from '../../lib/theme';
import type { MemoriesStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<MemoriesStackParamList, 'ImportPhotos'>;

type Stage = 'pick' | 'drafting' | 'review' | 'saving';

export function ImportPhotosScreen({ navigation }: Props) {
  const { current } = useFamily();
  const { t, tCount } = useI18n();
  const [stage, setStage] = useState<Stage>('pick');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [drafts, setDrafts] = useState<MemoryDraft[]>([]);
  const [discarded, setDiscarded] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const name = current?.family.care_recipient_name ?? 'them';

  const run = async (picked: PickedPhoto[]) => {
    if (!current || picked.length === 0) return;
    setPhotos(picked);
    setDrafts([]);
    setDiscarded(new Set());
    setStage('drafting');
    setError(null);
    try {
      const result = await draftMemoriesFromPhotos(current.family.id, picked);
      if (result.length === 0) {
        setError(t('import.nothingBack'));
        setStage('pick');
        return;
      }
      setDrafts(result);
      setStage('review');
    } catch (e: any) {
      setError(e.message ?? t('import.readFailed'));
      setStage('pick');
    }
  };

  const edit = (index: number, patch: Partial<MemoryDraft>) =>
    setDrafts((prev) => prev.map((d) => (d.index === index ? { ...d, ...patch } : d)));

  const toggleDiscard = (index: number) =>
    setDiscarded((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const kept = drafts.filter((d) => !discarded.has(d.index));

  const handleSave = async () => {
    if (!current || kept.length === 0) return;
    setStage('saving');
    setError(null);
    setProgress(0);
    try {
      for (const draft of kept) {
        const photo = photos[draft.index];
        const photoPath = photo ? await uploadPhoto(current.family.id, photo.uri) : null;
        await addMemory({
          familyId: current.family.id,
          memberId: current.member.id,
          category: draft.category,
          question: draft.question.trim(),
          answer: draft.answer.trim(),
          photoPath,
          occurredOn: draft.occurredOn,
          occurredPrecision: draft.occurredPrecision,
          source: 'import',
          // Anything still holding a bracketed blank is flagged so it can be
          // found again rather than quietly entering rotation half-finished.
          needsReview: !draft.confident,
        });
        setProgress((p) => p + 1);
      }
      navigation.navigate('MemoriesHome');
    } catch (e: any) {
      setError(e.message ?? t('import.saveFailed'));
      setStage('review');
    }
  };

  if (stage === 'drafting' || stage === 'saving') {
    return (
      <Screen>
        <View style={styles.busy}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={typography.serifLarge}>
{stage === 'drafting' ? t('import.reading') : t('import.saving')}
          </Text>
          <Text style={[typography.subtext, styles.centered]}>
            {stage === 'drafting'
? t('import.readingBody')
              : t('import.savingProgress', { done: progress, total: kept.length })}
          </Text>
        </View>
      </Screen>
    );
  }

  if (stage === 'pick') {
    return (
      <Screen>
        <EmptyState
          icon="images-outline"
          title={t('import.empty.title')}
          body={t('import.empty.body', { max: MAX_IMPORT_BATCH, name })}
        />
        {error && (
          <View style={styles.error}>
            <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        <PrimaryButton
          label={t('import.choose')}
          icon="images"
          onPress={async () => run(await pickPhotosForImport())}
        />
        <PrimaryButton
          label={t('import.camera')}
          icon="camera"
          variant="secondary"
          onPress={async () => {
            const shot = await capturePhotoForImport();
            if (shot) run([shot]);
          }}
        />
        <Text style={[typography.caption, styles.centered]}>
{t('import.shoebox')}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Text style={typography.title}>{t('import.review.title')}</Text>
      <Text style={typography.subtext}>
{t('import.review.body')}
      </Text>

      {drafts.map((draft) => {
        const photo = photos[draft.index];
        const isDiscarded = discarded.has(draft.index);
        const occurred = formatOccurred(draft.occurredOn, draft.occurredPrecision);

        return (
          <Card key={draft.index} style={[styles.draft, isDiscarded && styles.draftDiscarded]}>
            <View style={styles.draftHead}>
              {photo && <Image source={{ uri: photo.uri }} style={styles.thumb} />}
              <View style={styles.draftMeta}>
                {occurred ? (
                  <View style={styles.dateChip}>
                    <Ionicons name="calendar-outline" size={12} color={colors.accentStrong} />
                    <Text style={styles.dateChipText}>{occurred}</Text>
                  </View>
                ) : (
                  <Text style={typography.caption}>{t('import.noDate')}</Text>
                )}
                {!draft.confident && (
                  <View style={styles.needsChip}>
                    <Ionicons name="create-outline" size={12} color={colors.accentStrong} />
                    <Text style={styles.dateChipText}>{t('import.needsName')}</Text>
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => toggleDiscard(draft.index)}
                  style={styles.skip}
                >
                  <Ionicons
                    name={isDiscarded ? 'add-circle-outline' : 'close-circle-outline'}
                    size={iconSize.sm}
                    color={colors.subtext}
                  />
                  <Text style={typography.caption}>{isDiscarded ? t('import.keep') : t('import.skip')}</Text>
                </Pressable>
              </View>
            </View>

            {!isDiscarded && (
              <>
                <TextField
                  label={t('addMemory.question')}
                  value={draft.question}
                  onChangeText={(question) => edit(draft.index, { question })}
                />
                <TextField
                  label={t('addMemory.answer')}
                  value={draft.answer}
                  onChangeText={(answer) => edit(draft.index, { answer })}
                />
              </>
            )}
          </Card>
        );
      })}

      {error && (
        <View style={styles.error}>
          <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <PrimaryButton
        label={
          kept.length === 0
? t('import.nothingSelected')
            : tCount('import.save', kept.length)
        }
        icon="checkmark"
        disabled={kept.length === 0}
        onPress={handleSave}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  busy: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  centered: { textAlign: 'center' },
  draft: { padding: spacing.md, gap: spacing.sm },
  draftDiscarded: { opacity: 0.55 },
  draftHead: { flexDirection: 'row', gap: spacing.md },
  thumb: { width: 92, height: 92, borderRadius: radius.md },
  draftMeta: { flex: 1, gap: spacing.xs, alignItems: 'flex-start' },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  needsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  dateChipText: { ...typography.caption, color: colors.onSurfaceMuted },
  skip: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto', paddingVertical: 4 },
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
