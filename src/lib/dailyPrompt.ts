import { supabase } from './supabase';
import { ERA_PACKS } from './eraPacks';

/**
 * One question a day, for one family member.
 *
 * The point is to move contributing off the "remember to open the app" path,
 * which nobody sustains, and onto the "answer the thing in front of you" path,
 * which people do without thinking about it.
 *
 * Questions come from the era packs rather than the model: they need no
 * network, cost nothing, never fail, and are already written in the right
 * voice. A prompt that sometimes doesn't arrive is worse than a plain one.
 */

export interface DailyPrompt {
  id: string;
  family_id: string;
  member_id: string | null;
  question: string;
  source: string;
  answered_memory_id: string | null;
  shown_on: string;
}

const GENERAL_PROMPTS = [
  'What is something they always said?',
  'What did their handwriting look like?',
  'What were they wearing in your clearest memory of them?',
  'What did their house smell like?',
  'What made them laugh until they cried?',
  'What were they stubborn about?',
  'What did they teach you to do?',
  'What did they always keep in their pocket or handbag?',
  'What song would they sing without noticing?',
  'What did they do when they were worried?',
];

function allCandidateQuestions(): string[] {
  return [...GENERAL_PROMPTS, ...ERA_PACKS.flatMap((pack) => pack.prompts.map((p) => p.question))];
}

function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

/**
 * Today's prompt for this member, creating one if today has none.
 *
 * The unique index on (family_id, member_id, shown_on) means two devices
 * racing on the same morning cannot produce two different questions — the
 * loser re-reads the winner's row.
 */
export async function getOrCreateTodaysPrompt(
  familyId: string,
  memberId: string,
  now: Date = new Date()
): Promise<DailyPrompt | null> {
  const shownOn = todayIso(now);

  const { data: existing } = await supabase
    .from('daily_prompts')
    .select('*')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('shown_on', shownOn)
    .maybeSingle();

  if (existing) return existing as DailyPrompt;

  // Don't ask the same thing twice while there is anything unasked left.
  const { data: used } = await supabase
    .from('daily_prompts')
    .select('question')
    .eq('family_id', familyId);

  const seen = new Set((used ?? []).map((r: { question: string }) => r.question));
  const candidates = allCandidateQuestions();
  const unseen = candidates.filter((q) => !seen.has(q));
  const pool = unseen.length > 0 ? unseen : candidates;

  // Stable for a given family and day, so a reload does not reshuffle it.
  const seed = [...`${familyId}${shownOn}`].reduce((a, c) => a + c.charCodeAt(0), 0);
  const question = pool[seed % pool.length];

  const { data: created, error } = await supabase
    .from('daily_prompts')
    .insert({ family_id: familyId, member_id: memberId, question, source: 'era' })
    .select('*')
    .maybeSingle();

  if (error) {
    // Almost certainly the unique index firing because another device got
    // there first. Read theirs rather than inventing a second question.
    const { data: raced } = await supabase
      .from('daily_prompts')
      .select('*')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('shown_on', shownOn)
      .maybeSingle();
    return (raced as DailyPrompt) ?? null;
  }

  return (created as DailyPrompt) ?? null;
}

export async function markPromptAnswered(promptId: string, memoryId: string): Promise<void> {
  await supabase
    .from('daily_prompts')
    .update({ answered_memory_id: memoryId })
    .eq('id', promptId);
}
