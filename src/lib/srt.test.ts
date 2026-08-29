import { applyLongTermResult, isDue, SessionQueue, AdaptivePacer, reviewOnlyPool } from './srt';
import type { Memory } from './types';

describe('applyLongTermResult', () => {
  it('grows the interval on a correct answer', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const result = applyLongTermResult({ srt_level: 0 }, true, now);
    expect(result.srt_level).toBe(1);
    expect(new Date(result.srt_next_review).getTime()).toBeGreaterThan(now.getTime());
  });

  it('resets to level 0 on a miss', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const result = applyLongTermResult({ srt_level: 4 }, false, now);
    expect(result.srt_level).toBe(0);
    expect(new Date(result.srt_next_review).getTime()).toBe(now.getTime());
  });

  it('caps at the max level', () => {
    const result = applyLongTermResult({ srt_level: 6 }, true, new Date());
    expect(result.srt_level).toBe(6);
  });
});

describe('isDue', () => {
  it('treats never-reviewed items as due', () => {
    expect(isDue({ srt_next_review: null })).toBe(true);
  });

  it('is false for a future review date', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(isDue({ srt_next_review: future })).toBe(false);
  });
});

describe('SessionQueue', () => {
  it('resolves an item immediately on a correct answer', () => {
    const q = new SessionQueue(['a', 'b']);
    expect(q.current()).toBe('a');
    const result = q.recordAnswer(true);
    expect(result).toEqual({ resolved: true, correct: true, masteredThisSession: true });
    expect(q.current()).toBe('b');
  });

  it('re-inserts a missed item later rather than dropping it', () => {
    const q = new SessionQueue(['a', 'b']);
    q.recordAnswer(false); // miss 'a'
    expect(q.current()).toBe('b');
    q.recordAnswer(true); // answer 'b'
    expect(q.current()).toBe('a'); // 'a' comes back
  });

  it('gives up after exhausting retries', () => {
    const q = new SessionQueue(['a']);
    let last = q.recordAnswer(false);
    while (!last.resolved) {
      last = q.recordAnswer(false);
    }
    expect(last.correct).toBe(false);
    expect(q.isComplete).toBe(true);
  });
});

describe('AdaptivePacer', () => {
  it('recommends review-only after repeated misses, then ending the session', () => {
    const pacer = new AdaptivePacer(2, 4);
    pacer.record(false);
    expect(pacer.shouldSwitchToReviewOnly()).toBe(false);
    pacer.record(false);
    expect(pacer.shouldSwitchToReviewOnly()).toBe(true);
    expect(pacer.shouldEndSession()).toBe(false);
    pacer.record(false);
    pacer.record(false);
    expect(pacer.shouldEndSession()).toBe(true);
  });

  it('resets the streak on a correct answer', () => {
    const pacer = new AdaptivePacer(2, 4);
    pacer.record(false);
    pacer.record(false);
    pacer.record(true);
    expect(pacer.shouldSwitchToReviewOnly()).toBe(false);
  });
});

describe('reviewOnlyPool', () => {
  it('keeps only items with some demonstrated mastery', () => {
    const memories = [
      { srt_level: 0 },
      { srt_level: 1 },
      { srt_level: 2 },
      { srt_level: 3 },
    ] as Memory[];
    expect(reviewOnlyPool(memories)).toHaveLength(2);
  });
});
