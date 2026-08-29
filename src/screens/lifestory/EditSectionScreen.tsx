import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/Screen';
import { PrimaryButton } from '../../components/PrimaryButton';
import { PhotoPicker } from '../../components/PhotoPicker';
import { TextField } from '../../components/TextField';
import { useFamily } from '../../state/FamilyContext';
import { useLifeStory, upsertLifeStorySection } from '../../lib/useLifeStory';
import { uploadPhoto } from '../../lib/media';
import { TOPIC_LABELS, type LifeStorySectionKey } from '../../lib/types';
import { colors, iconSize, radius, shadows, spacing, typography } from '../../lib/theme';
import type { LifeStoryStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<LifeStoryStackParamList, 'EditSection'>;

// A blank textarea is intimidating. Each chapter gets a concrete prompt so the
// contributor knows what "career" is actually asking for.
const CHAPTER_PROMPT: Record<LifeStorySectionKey, string> = {
  early_life: 'Where did they grow up, and what was the house like?',
  career: 'What did they do for work, and what were they proud of?',
  family: 'Who are the people closest to them, and how did they meet?',
  personality: 'What are they like — funny, stubborn, generous, quiet?',
  favorites: 'Favourite music, food, places, things they always came back to.',
  stories: 'The story this family tells over and over again.',
};

export function EditSectionScreen({ route, navigation }: Props) {
  const { current } = useFamily();
  const sectionKey = route.params.sectionKey as LifeStorySectionKey;
  const { sections, loading } = useLifeStory(current?.family.id ?? null);
  const existing = sections.find((s) => s.section_key === sectionKey);

  const [content, setContent] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The chapter arrives asynchronously, so seeding these with useState's
  // initial value captured an empty list and left written chapters looking
  // blank — and saving from that state would have wiped the real text.
  useEffect(() => {
    if (hydrated || loading) return;
    setContent(existing?.content ?? '');
    setPhotoUri(existing?.photo_url ?? null);
    // An unwritten chapter opens straight into editing; a written one opens
    // as something to read, which is what this section is actually for.
    setEditing(!existing?.content?.trim());
    setHydrated(true);
  }, [loading, existing, hydrated]);

  const handleSave = async () => {
    if (!current) return;
    setSaving(true);
    setError(null);
    try {
      const isNewLocalPhoto = photoUri && photoUri !== existing?.photo_url;
      const photoUrl = isNewLocalPhoto ? await uploadPhoto(current.family.id, photoUri!) : photoUri;

      await upsertLifeStorySection({
        id: existing?.id,
        familyId: current.family.id,
        memberId: current.member.id,
        sectionKey,
        title: TOPIC_LABELS[sectionKey],
        content: content.trim(),
        photoUrl,
      });
      navigation.goBack();
    } catch (e: any) {
      setError(e.message ?? 'Could not save');
    }
    setSaving(false);
  };

  const heading = (
    <View style={styles.heading}>
      <Text style={typography.title}>{TOPIC_LABELS[sectionKey]}</Text>
      <Text style={typography.subtext}>{CHAPTER_PROMPT[sectionKey]}</Text>
    </View>
  );

  if (!hydrated) {
    return (
      <Screen>
        {heading}
        <Text style={typography.subtext}>Loading…</Text>
      </Screen>
    );
  }

  // Reading view: plain text wraps to whatever length the chapter is, so
  // nothing hides behind an inner scrollbar the way it did in the input.
  if (!editing) {
    return (
      <Screen>
        {heading}
        {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />}
        <Text style={typography.bodyLarge}>{content}</Text>
        <View style={styles.editAction}>
          <PrimaryButton
            label="Edit this chapter"
            icon="create-outline"
            variant="secondary"
            onPress={() => setEditing(true)}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {heading}
      <PhotoPicker uri={photoUri} onChange={setPhotoUri} />
      <TextField
        multiline
        numberOfLines={6}
        placeholder="Tell the story here…"
        value={content}
        onChangeText={setContent}
      />

      {error && (
        <View style={styles.error}>
          <Ionicons name="alert-circle-outline" size={iconSize.md} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <PrimaryButton label="Save" onPress={handleSave} loading={saving} />
      {!!existing?.content?.trim() && (
        <PrimaryButton
          label="Cancel"
          variant="ghost"
          onPress={() => {
            setContent(existing?.content ?? '');
            setPhotoUri(existing?.photo_url ?? null);
            setEditing(false);
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  photo: { width: '100%', height: 240, borderRadius: radius.lg, ...shadows.md },
  editAction: { marginTop: spacing.sm },
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
