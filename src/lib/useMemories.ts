import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from './supabase';
import {
  PHOTO_BUCKET,
  VOICE_BUCKET,
  removeObject,
  signedUrlsFor,
} from './media';
import type { DatePrecision, Memory, MemoryCategory, MemorySource } from './types';

/**
 * Attach freshly signed URLs to rows that carry a storage path.
 *
 * Rows predating the path migration (and the seeded sample photos, which point
 * at an external host) keep whatever `photo_url` they already have, so nothing
 * regresses while both shapes coexist.
 */
export async function withSignedMedia(rows: Memory[]): Promise<Memory[]> {
  const photoPaths = rows.map((r) => r.photo_path).filter((p): p is string => !!p);
  const voicePaths = rows.map((r) => r.voice_path).filter((p): p is string => !!p);

  const none: Record<string, string> = {};
  const [photos, voices] = await Promise.all([
    photoPaths.length ? signedUrlsFor(PHOTO_BUCKET, photoPaths) : Promise.resolve(none),
    voicePaths.length ? signedUrlsFor(VOICE_BUCKET, voicePaths) : Promise.resolve(none),
  ]);

  return rows.map((row) => ({
    ...row,
    photo_url: row.photo_path ? (photos[row.photo_path] ?? null) : row.photo_url,
    voice_url: row.voice_path ? (voices[row.voice_path] ?? null) : row.voice_url,
  }));
}

export function useMemories(familyId: string | null) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const instanceId = useId();

  const refresh = useCallback(async () => {
    if (!familyId) {
      setMemories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('memories')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false });
    setMemories(await withSignedMedia(data ?? []));
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    refresh();
    if (!familyId) return;

    const channel = supabase
      .channel(`memories:${familyId}:${instanceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories', filter: `family_id=eq.${familyId}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, refresh]);

  return { memories, loading, refresh };
}

export interface NewMemoryInput {
  familyId: string;
  memberId: string;
  category: MemoryCategory;
  question: string;
  answer: string;
  photoPath?: string | null;
  voicePath?: string | null;
  note?: string | null;
  occurredOn?: string | null;
  occurredPrecision?: DatePrecision | null;
  source?: MemorySource;
  language?: string | null;
  voiceTranscript?: string | null;
  isAnchor?: boolean;
  needsReview?: boolean;
}

export async function addMemory(input: NewMemoryInput) {
  const { error } = await supabase.from('memories').insert({
    family_id: input.familyId,
    category: input.category,
    question: input.question,
    answer: input.answer,
    photo_path: input.photoPath ?? null,
    voice_path: input.voicePath ?? null,
    added_by: input.memberId,
    note: input.note ?? null,
    occurred_on: input.occurredOn ?? null,
    occurred_precision: input.occurredPrecision ?? null,
    source: input.source ?? 'app',
    language: input.language ?? null,
    voice_transcript: input.voiceTranscript ?? null,
    is_anchor: input.isAnchor ?? false,
    needs_review: input.needsReview ?? false,
  });
  if (error) throw new Error(error.message);
}

export async function updateMemory(memoryId: string, update: Partial<Memory>) {
  const { error } = await supabase
    .from('memories')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', memoryId);
  if (error) throw new Error(error.message);
}

/**
 * Remove a memory and its media.
 *
 * There was no delete path at all before this: a typo was permanent, and so
 * was a memory that turned out to be distressing. The row goes first — if the
 * storage cleanup fails the worst outcome is an orphaned file, whereas the
 * reverse would leave a memory in the app pointing at nothing.
 */
export async function deleteMemory(memory: Memory) {
  const { error } = await supabase.from('memories').delete().eq('id', memory.id);
  if (error) throw new Error(error.message);

  await Promise.all([
    memory.photo_path ? removeObject(PHOTO_BUCKET, memory.photo_path).catch(() => {}) : null,
    memory.voice_path ? removeObject(VOICE_BUCKET, memory.voice_path).catch(() => {}) : null,
  ]);
}

export async function recordSrtResult(memoryId: string, update: Partial<Memory>) {
  const { error } = await supabase
    .from('memories')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', memoryId);
  if (error) throw new Error(error.message);
}
