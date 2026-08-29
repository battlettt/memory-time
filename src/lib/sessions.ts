import { supabase } from './supabase';

/**
 * Session and per-question history.
 *
 * Two things depend on this being recorded: the weekly caregiver report, and
 * the observation that many people with dementia are markedly sharper earlier
 * in the day — which is only discoverable if the hour is stored alongside the
 * result. Everything here is best-effort; a logging failure must never
 * interrupt a session in progress.
 */

export type ReviewOutcome = 'answered' | 'skipped' | 'distressing';

export async function startSession(
  familyId: string,
  memberId: string | null
): Promise<string | null> {
  const { data, error } = await supabase
    .from('practice_sessions')
    .insert({ family_id: familyId, member_id: memberId })
    .select('id')
    .maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

export async function logReview(input: {
  familyId: string;
  memoryId: string;
  sessionId: string | null;
  correct: boolean;
  /** 0 = unaided recall, rising with each hint given. */
  cueLevel?: number;
  outcome?: ReviewOutcome;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  await supabase.from('review_events').insert({
    family_id: input.familyId,
    memory_id: input.memoryId,
    session_id: input.sessionId,
    correct: input.correct,
    cue_level: input.cueLevel ?? 0,
    outcome: input.outcome ?? 'answered',
    local_hour: now.getHours(),
  });
}

export async function endSession(
  sessionId: string | null,
  summary: { answered: number; correct: number; endedEarly: boolean }
): Promise<void> {
  if (!sessionId) return;
  await supabase
    .from('practice_sessions')
    .update({
      ended_at: new Date().toISOString(),
      answered: summary.answered,
      correct: summary.correct,
      ended_early: summary.endedEarly,
    })
    .eq('id', sessionId);
}
