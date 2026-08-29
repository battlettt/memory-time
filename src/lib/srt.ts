import type { Memory } from './types';

/**
 * Spaced Retrieval Training engine.
 *
 * Two timescales are modeled, matching how SRT is actually practiced clinically:
 *  - Within a session: a missed item is re-asked again soon (short delay), not
 *    immediately, so recall is tested rather than short-term repetition.
 *  - Across sessions: each correct recall grows the days-until-next-review.
 *
 * Two deliberate departures from a textbook scheduler, both because the person
 * on the other side of this is unwell and the family is watching:
 *
 *  1. A miss steps the interval *down* rather than resetting it to zero. A
 *     urinary tract infection — very common in elders and a notorious cause of
 *     acute confusion — or simply a bad afternoon would otherwise wipe weeks
 *     of genuine progress in a single session.
 *
 *  2. Memories retire. In a progressive condition some memories will be
 *     permanently lost, and a scheduler with no exit will keep asking one
 *     every thirty days forever. Nobody should watch their mother fail to
 *     recognise her own face, monthly, indefinitely. Retired memories stay in
 *     the album — seen, never tested — and anchors never retire at all.
 */

export const LONG_TERM_SCHEDULE_DAYS = [0, 1, 2, 4, 7, 14, 30];
export const MAX_SRT_LEVEL = LONG_TERM_SCHEDULE_DAYS.length - 1;

/** Levels lost on a miss. Softer than a reset, still a real step back. */
export const LEVEL_DROP_ON_MISS = 2;

/** Consecutive missed *sessions* before a non-anchor memory retires. */
export const DEFAULT_RETIRE_AFTER_MISSES = 4;

/** How long "not today" rests a memory that caused distress. */
export const PAUSE_DAYS_AFTER_DISTRESS = 21;

export interface LongTermUpdate {
  srt_level: number;
  srt_last_reviewed: string;
  srt_next_review: string;
  consecutive_misses: number;
  retired_at?: string;
}

type SchedulableMemory = Pick<Memory, 'srt_level'> &
  Partial<Pick<Memory, 'consecutive_misses' | 'is_anchor'>>;

export function applyLongTermResult(
  memory: SchedulableMemory,
  correct: boolean,
  now: Date = new Date(),
  retireAfterMisses: number = DEFAULT_RETIRE_AFTER_MISSES
): LongTermUpdate {
  const priorMisses = memory.consecutive_misses ?? 0;
  const misses = correct ? 0 : priorMisses + 1;

  const nextLevel = correct
    ? Math.min(memory.srt_level + 1, MAX_SRT_LEVEL)
    : Math.max(0, memory.srt_level - LEVEL_DROP_ON_MISS);

  const days = LONG_TERM_SCHEDULE_DAYS[nextLevel];
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + days);

  // An anchor — a spouse, a child, their own name — is never retired, however
  // often it is missed. Losing it is exactly when the family most wants the
  // photograph to keep coming round.
  const shouldRetire = !correct && !memory.is_anchor && misses >= retireAfterMisses;

  return {
    srt_level: nextLevel,
    srt_last_reviewed: now.toISOString(),
    srt_next_review: nextReview.toISOString(),
    consecutive_misses: misses,
    ...(shouldRetire ? { retired_at: now.toISOString() } : {}),
  };
}

type DueCheckable = Pick<Memory, 'srt_next_review'> &
  Partial<Pick<Memory, 'retired_at' | 'paused_until'>>;

export function isDue(memory: DueCheckable, now: Date = new Date()): boolean {
  if (memory.retired_at) return false;
  if (memory.paused_until && new Date(memory.paused_until).getTime() > now.getTime()) return false;
  if (!memory.srt_next_review) return true;
  return new Date(memory.srt_next_review).getTime() <= now.getTime();
}

export function dueMemories(memories: Memory[], now: Date = new Date()): Memory[] {
  return memories.filter((m) => isDue(m, now));
}

/**
 * "Not today" — reminiscence surfaces grief as readily as joy, and a question
 * about a dead spouse or a sold house can land badly. Rest it rather than
 * drilling it, and let the caregiver see it was set aside.
 */
export function pauseAfterDistress(
  now: Date = new Date(),
  days: number = PAUSE_DAYS_AFTER_DISTRESS
): { paused_until: string } {
  const until = new Date(now);
  until.setDate(until.getDate() + days);
  return { paused_until: until.toISOString() };
}

/** Retiring and un-retiring are both caregiver-reversible. */
export function retireUpdate(now: Date = new Date()): { retired_at: string } {
  return { retired_at: now.toISOString() };
}

export function unretireUpdate(): { retired_at: null; consecutive_misses: number } {
  return { retired_at: null, consecutive_misses: 0 };
}

export function retiredMemories(memories: Memory[]): Memory[] {
  return memories.filter((m) => !!m.retired_at);
}

/** How many other questions to wait before re-asking a missed item, per retry attempt. */
const WITHIN_SESSION_DELAYS = [2, 4, 6];
const MAX_RETRIES_PER_SESSION = WITHIN_SESSION_DELAYS.length;

interface QueueEntry {
  memoryId: string;
  retries: number;
}

export interface SessionAnswerResult {
  /** True once the item has been answered correctly, or exhausted its retries. */
  resolved: boolean;
  correct: boolean;
  masteredThisSession: boolean;
}

/**
 * Orders a session's due memories and re-inserts misses a few questions later
 * (expanding-interval retesting), rather than back-to-back drilling.
 */
export class SessionQueue {
  private queue: QueueEntry[];
  private position = 0;
  private resolvedIds = new Set<string>();

  constructor(memoryIds: string[]) {
    this.queue = memoryIds.map((memoryId) => ({ memoryId, retries: 0 }));
  }

  get isComplete(): boolean {
    return this.position >= this.queue.length;
  }

  current(): string | null {
    return this.isComplete ? null : this.queue[this.position].memoryId;
  }

  recordAnswer(correct: boolean): SessionAnswerResult {
    const entry = this.queue[this.position];
    this.position += 1;

    if (correct) {
      this.resolvedIds.add(entry.memoryId);
      return { resolved: true, correct: true, masteredThisSession: true };
    }

    if (entry.retries >= MAX_RETRIES_PER_SESSION) {
      return { resolved: true, correct: false, masteredThisSession: false };
    }

    const delay = WITHIN_SESSION_DELAYS[entry.retries];
    const reinsertAt = Math.min(this.position + delay, this.queue.length);
    this.queue.splice(reinsertAt, 0, { memoryId: entry.memoryId, retries: entry.retries + 1 });
    return { resolved: false, correct: false, masteredThisSession: false };
  }

  remaining(): number {
    return this.queue.length - this.position;
  }

  /** Drops not-yet-asked items that fail `keep`, e.g. narrowing to already-mastered items. */
  filterRemaining(keep: (memoryId: string) => boolean): void {
    const asked = this.queue.slice(0, this.position);
    const notYetAsked = this.queue.slice(this.position).filter((entry) => keep(entry.memoryId));
    this.queue = [...asked, ...notYetAsked];
  }
}

/**
 * This is an emotionally vulnerable use case: a run of misses should ease off,
 * not push harder. Tracks consecutive misses and recommends backing off.
 */
export class AdaptivePacer {
  private consecutiveMisses = 0;

  constructor(
    private readonly reviewOnlyThreshold = 2,
    private readonly endSessionThreshold = 4
  ) {}

  record(correct: boolean): void {
    this.consecutiveMisses = correct ? 0 : this.consecutiveMisses + 1;
  }

  shouldSwitchToReviewOnly(): boolean {
    return this.consecutiveMisses >= this.reviewOnlyThreshold;
  }

  shouldEndSession(): boolean {
    return this.consecutiveMisses >= this.endSessionThreshold;
  }
}

/** Review-only mode: only items the patient has already shown some mastery on. */
export function reviewOnlyPool(memories: Memory[]): Memory[] {
  return memories.filter((m) => m.srt_level >= 2 && !m.retired_at);
}

/**
 * Sessions are capped so they stay a short, completable ritual.
 *
 * An open-ended queue of thirty due memories creates dread and gets skipped;
 * a session that reliably takes a few minutes gets done. Anchors and the
 * closest-to-due items come first.
 */
export function sessionSelection(
  memories: Memory[],
  limit: number,
  now: Date = new Date()
): Memory[] {
  const due = dueMemories(memories, now);
  const score = (m: Memory) => {
    if (m.is_anchor) return -Infinity;
    return m.srt_next_review ? new Date(m.srt_next_review).getTime() : 0;
  };
  return [...due].sort((a, b) => score(a) - score(b)).slice(0, Math.max(1, limit));
}
