import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { summariseWeek, type PracticeSessionRow, type ReviewEvent, type WeeklyReport } from './insights';
import type { Memory } from './types';

/** A month of history is plenty for a weekly report and keeps the query small. */
const LOOKBACK_DAYS = 30;

export function useWeeklyReport(familyId: string | null, memories: Memory[]) {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setReport(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();

    (async () => {
      const [{ data: events }, { data: sessions }] = await Promise.all([
        supabase
          .from('review_events')
          .select('id, memory_id, correct, cue_level, outcome, local_hour, created_at')
          .eq('family_id', familyId)
          .gte('created_at', since),
        supabase
          .from('practice_sessions')
          .select('id, started_at, ended_at, answered, correct')
          .eq('family_id', familyId)
          .gte('started_at', since),
      ]);

      if (cancelled) return;
      setReport(
        summariseWeek(
          memories,
          (events ?? []) as ReviewEvent[],
          (sessions ?? []) as PracticeSessionRow[]
        )
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [familyId, memories]);

  return { report, loading };
}
