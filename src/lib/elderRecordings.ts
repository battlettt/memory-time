import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { VOICE_BUCKET, signedUrlsFor, uploadElderRecording } from './media';

/**
 * The person's own answers, in their own voice.
 *
 * Families overwhelmingly regret not having recordings of a parent simply
 * talking — not a speech, just the ordinary voice saying ordinary things.
 * Sessions already have them speaking about their own life several times a
 * week, so this captures an archive as a side effect of using the app for
 * something else entirely.
 */

export interface ElderRecording {
  id: string;
  family_id: string;
  memory_id: string | null;
  audio_path: string;
  transcript: string | null;
  duration_seconds: number | null;
  recorded_at: string;
  /** Resolved at read time, like all other media. */
  audio_url?: string | null;
}

export async function saveElderRecording(input: {
  familyId: string;
  memoryId: string;
  localUri: string;
  transcript?: string | null;
}): Promise<void> {
  const audioPath = await uploadElderRecording(input.familyId, input.localUri);
  const { error } = await supabase.from('elder_recordings').insert({
    family_id: input.familyId,
    memory_id: input.memoryId,
    audio_path: audioPath,
    transcript: input.transcript ?? null,
  });
  if (error) throw new Error(error.message);
}

export function useElderRecordings(familyId: string | null, memoryId: string | null) {
  const [recordings, setRecordings] = useState<ElderRecording[]>([]);

  const refresh = useCallback(async () => {
    if (!familyId || !memoryId) {
      setRecordings([]);
      return;
    }
    const { data } = await supabase
      .from('elder_recordings')
      .select('*')
      .eq('family_id', familyId)
      .eq('memory_id', memoryId)
      .order('recorded_at', { ascending: false });

    const rows = (data ?? []) as ElderRecording[];
    if (rows.length === 0) {
      setRecordings([]);
      return;
    }

    const urls = await signedUrlsFor(
      VOICE_BUCKET,
      rows.map((r) => r.audio_path)
    );
    setRecordings(rows.map((r) => ({ ...r, audio_url: urls[r.audio_path] ?? null })));
  }, [familyId, memoryId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { recordings, refresh };
}
