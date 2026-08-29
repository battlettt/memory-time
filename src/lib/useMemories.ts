import { useCallback, useEffect, useId, useState } from 'react';
import { supabase } from './supabase';
import type { Memory, MemoryCategory } from './types';

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
    setMemories(data ?? []);
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
  photoUrl?: string | null;
  voiceUrl?: string | null;
  note?: string | null;
}

export async function addMemory(input: NewMemoryInput) {
  const { error } = await supabase.from('memories').insert({
    family_id: input.familyId,
    category: input.category,
    question: input.question,
    answer: input.answer,
    photo_url: input.photoUrl ?? null,
    voice_url: input.voiceUrl ?? null,
    added_by: input.memberId,
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function recordSrtResult(memoryId: string, update: Partial<Memory>) {
  const { error } = await supabase.from('memories').update(update).eq('id', memoryId);
  if (error) throw new Error(error.message);
}
