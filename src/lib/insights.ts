import type { Memory } from './types';

/**
 * What to tell the caregiver.
 *
 * The framing here is a deliberate product decision. The obvious metric is
 * recall accuracy, and it is the wrong one to lead with: it turns a
 * degenerative illness into a test the family is failing, week after week,
 * and it will trend downwards no matter how well anyone does. So the headline
 * is time spent together, which is both the real benefit and a number that
 * responds honestly to effort.
 *
 * Accuracy still appears, but as "holding" and "slipping" lists — actionable,
 * specific, and about individual memories rather than a score for a person.
 */

export interface ReviewEvent {
  id: string;
  memory_id: string;
  correct: boolean;
  cue_level: number;
  outcome: 'answered' | 'skipped' | 'distressing';
  local_hour: number | null;
  created_at: string;
}

export interface PracticeSessionRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  answered: number;
  correct: number;
}

export type TimeBucket = 'morning' | 'afternoon' | 'evening';

export function bucketForHour(hour: number): TimeBucket {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export interface TimeOfDayFinding {
  bucket: TimeBucket;
  accuracy: number;
  sample: number;
  comparedWith: TimeBucket;
  comparedAccuracy: number;
}

/**
 * "She does better before noon" is one of the genuinely useful things this
 * data can surface — but only when it is real. Requires a decent sample in
 * both buckets and a gap big enough not to be noise, and says nothing at all
 * otherwise. A confident claim from six answers would be worse than silence.
 */
export function bestTimeOfDay(
  events: ReviewEvent[],
  minSample = 8,
  minGap = 0.15
): TimeOfDayFinding | null {
  const buckets = new Map<TimeBucket, { total: number; correct: number }>();

  for (const event of events) {
    if (event.local_hour === null || event.outcome !== 'answered') continue;
    const bucket = bucketForHour(event.local_hour);
    const entry = buckets.get(bucket) ?? { total: 0, correct: 0 };
    entry.total += 1;
    if (event.correct) entry.correct += 1;
    buckets.set(bucket, entry);
  }

  const ranked = [...buckets.entries()]
    .filter(([, v]) => v.total >= minSample)
    .map(([bucket, v]) => ({ bucket, accuracy: v.correct / v.total, sample: v.total }))
    .sort((a, b) => b.accuracy - a.accuracy);

  if (ranked.length < 2) return null;
  const [best, next] = ranked;
  if (best.accuracy - next.accuracy < minGap) return null;

  return {
    bucket: best.bucket,
    accuracy: best.accuracy,
    sample: best.sample,
    comparedWith: next.bucket,
    comparedAccuracy: next.accuracy,
  };
}

export interface WeeklyReport {
  sessionCount: number;
  minutesTogether: number;
  memoriesPractised: number;
  holding: Memory[];
  slipping: Memory[];
  resting: Memory[];
  added: Memory[];
  timeOfDay: TimeOfDayFinding | null;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Sessions with no end time are ignored rather than guessed at. */
function minutesFrom(sessions: PracticeSessionRow[]): number {
  return Math.round(
    sessions.reduce((total, s) => {
      if (!s.ended_at) return total;
      const ms = new Date(s.ended_at).getTime() - new Date(s.started_at).getTime();
      // A "session" running over an hour is a device left open, not time together.
      if (ms <= 0 || ms > 60 * 60 * 1000) return total;
      return total + ms;
    }, 0) / 60000
  );
}

export function summariseWeek(
  memories: Memory[],
  events: ReviewEvent[],
  sessions: PracticeSessionRow[],
  now: Date = new Date()
): WeeklyReport {
  const since = new Date(now.getTime() - WEEK_MS);

  const recentSessions = sessions.filter((s) => new Date(s.started_at) >= since);
  const recentEvents = events.filter((e) => new Date(e.created_at) >= since);

  const practisedIds = new Set(recentEvents.map((e) => e.memory_id));

  return {
    sessionCount: recentSessions.length,
    minutesTogether: minutesFrom(recentSessions),
    memoriesPractised: practisedIds.size,
    // Well-established: several successful recalls at a long interval.
    holding: memories.filter((m) => !m.retired_at && m.srt_level >= 4),
    // Missed more than once running, but still being asked.
    slipping: memories.filter((m) => !m.retired_at && m.consecutive_misses >= 2),
    resting: memories.filter((m) => !!m.retired_at),
    added: memories.filter((m) => new Date(m.created_at) >= since),
    timeOfDay: bestTimeOfDay(recentEvents),
  };
}

