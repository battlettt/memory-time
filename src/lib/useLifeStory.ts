import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from './supabase';
import { PHOTO_BUCKET, signedUrlsFor } from './media';
import type { LifeStorySection, LifeStorySectionKey } from './types';

/** Same read-time signing as memories — see withSignedMedia in useMemories. */
async function withSignedSectionMedia(rows: LifeStorySection[]): Promise<LifeStorySection[]> {
  const paths = rows.map((r) => r.photo_path).filter((p): p is string => !!p);
  if (!paths.length) return rows;

  const photos = await signedUrlsFor(PHOTO_BUCKET, paths);
  return rows.map((row) => ({
    ...row,
    photo_url: row.photo_path ? (photos[row.photo_path] ?? null) : row.photo_url,
  }));
}

export function useLifeStory(familyId: string | null) {
  const [sections, setSections] = useState<LifeStorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const instanceId = useId();

  const refresh = useCallback(async () => {
    if (!familyId) {
      setSections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('life_story_sections')
      .select('*')
      .eq('family_id', familyId)
      .order('updated_at', { ascending: false });
    setSections(await withSignedSectionMedia(data ?? []));
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    refresh();
    if (!familyId) return;

    const channel = supabase
      .channel(`life_story:${familyId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'life_story_sections',
          filter: `family_id=eq.${familyId}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, refresh]);

  return { sections, loading, refresh };
}

export async function upsertLifeStorySection(input: {
  id?: string;
  familyId: string;
  memberId: string;
  sectionKey: LifeStorySectionKey;
  title: string;
  content: string;
  photoPath?: string | null;
}) {
  const { error } = await supabase.from('life_story_sections').upsert({
    id: input.id,
    family_id: input.familyId,
    section_key: input.sectionKey,
    title: input.title,
    content: input.content,
    photo_path: input.photoPath ?? null,
    added_by: input.memberId,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}
