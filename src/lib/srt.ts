import type { Memory } from './types';

/**
 * Spaced Retrieval Training engine.
 *
 * Two timescales are modeled, matching how SRT is actually practiced clinically:
 *  - Within a session: a missed item is re-asked again soon (short delay), not
 *    immediately, so recall is tested rather than short-term repetition.
 *  - Across sessions: each correct recall grows the days-until-next-review;
 *    any miss resets it to the shortest interval.
 */

export const LONG_TERM_SCHEDULE_DAYS = [0, 1, 2, 4, 7, 14, 30];
export const MAX_SRT_LEVEL = LONG_TERM_SCHEDULE_DAYS.length - 1;

export interface LongTermUpdate {
  srt_level: number;
  srt_last_reviewed: string;
  srt_next_review: string;
}

export function applyLongTermResult(
  memory: Pick<Memory, 'srt_level'>,
  correct: boolean,
  now: Date = new Date()
): LongTermUpdate {
  const nextLevel = correct ? Math.min(memory.srt_level + 1, MAX_SRT_LEVEL) : 0;
  const days = LONG_TERM_SCHEDULE_DAYS[nextLevel];
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + days);

  return {
    srt_level: nextLevel,
    srt_last_reviewed: now.toISOString(),
    srt_next_review: nextReview.toISOString(),
  };
}

export function isDue(
  memory: Pick<Memory, 'srt_next_review'>,
  now: Date = new Date()
): boolean {
  if (!memory.srt_next_review) return true;
  return new Date(memory.srt_next_review).getTime() <= now.getTime();
}

export function dueMemories(memories: Memory[], now: Date = new Date()): Memory[] {
  return memories.filter((m) => isDue(m, now));
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
  return memories.filter((m) => m.srt_level >= 2);
}
