import {
  applyLongTermResult,
  isDue,
  SessionQueue,
  AdaptivePacer,
  reviewOnlyPool,
  pauseAfterDistress,
  sessionSelection,
  retiredMemories,
  unretireUpdate,
  DEFAULT_RETIRE_AFTER_MISSES,
} from './srt';
import type { Memory } from './types';

describe('applyLongTermResult', () => {
  it('grows the interval on a correct answer', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const result = applyLongTermResult({ srt_level: 0 }, true, now);
    expect(result.srt_level).toBe(1);
    expect(new Date(result.srt_next_review).getTime()).toBeGreaterThan(now.getTime());
  });

  it('steps down on a miss instead of wiping progress', () => {
    // A bad afternoon or an infection should not cost weeks of real gains.
    const now = new Date('2026-01-01T00:00:00Z');
    const result = applyLongTermResult({ srt_level: 4 }, false, now);
    expect(result.srt_level).toBe(2);
  });

  it('does not step below level 0', () => {
    const result = applyLongTermResult({ srt_level: 1 }, false, new Date());
    expect(result.srt_level).toBe(0);
  });

  it('caps at the max level', () => {
    const result = applyLongTermResult({ srt_level: 6 }, true, new Date());
    expect(result.srt_level).toBe(6);
  });

  it('counts consecutive misses and clears them on a success', () => {
    expect(applyLongTermResult({ srt_level: 3, consecutive_misses: 2 }, false).consecutive_misses)
      .toBe(3);
    expect(applyLongTermResult({ srt_level: 3, consecutive_misses: 2 }, true).consecutive_misses)
      .toBe(0);
  });

  it('retires a memory that has been missed too many times running', () => {
    const result = applyLongTermResult(
      { srt_level: 1, consecutive_misses: DEFAULT_RETIRE_AFTER_MISSES - 1 },
      false
    );
    expect(result.retired_at).toBeDefined();
  });

  it('never retires an anchor, however often it is missed', () => {
    // Losing a spouse's name is exactly when the photo should keep coming back.
    const result = applyLongTermResult(
      { srt_level: 0, consecutive_misses: 99, is_anchor: true },
      false
    );
    expect(result.retired_at).toBeUndefined();
  });

  it('does not retire on a correct answer', () => {
    const result = applyLongTermResult(
      { srt_level: 1, consecutive_misses: DEFAULT_RETIRE_AFTER_MISSES + 5 },
      true
    );
    expect(result.retired_at).toBeUndefined();
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

  it('never asks a retired memory again', () => {
    expect(isDue({ srt_next_review: null, retired_at: '2026-01-01T00:00:00Z' })).toBe(false);
  });

  it('respects a pause, then resumes once it lapses', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(isDue({ srt_next_review: null, paused_until: future })).toBe(false);
    expect(isDue({ srt_next_review: null, paused_until: past })).toBe(true);
  });
});

describe('pauseAfterDistress', () => {
  it('rests the memory well into the future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const { paused_until } = pauseAfterDistress(now);
    expect(new Date(paused_until).getTime()).toBeGreaterThan(now.getTime());
    expect(isDue({ srt_next_review: null, paused_until }, now)).toBe(false);
  });
});

describe('retirement is reversible', () => {
  it('un-retiring clears the miss streak so it is not immediately re-retired', () => {
    const update = unretireUpdate();
    expect(update.retired_at).toBeNull();
    expect(update.consecutive_misses).toBe(0);
  });

  it('lists retired memories for the caregiver to review', () => {
    const memories = [
      { id: 'a', retired_at: null },
      { id: 'b', retired_at: '2026-01-01T00:00:00Z' },
    ] as Memory[];
    expect(retiredMemories(memories).map((m) => m.id)).toEqual(['b']);
  });
});

describe('sessionSelection', () => {
  const base = { srt_level: 0, retired_at: null, paused_until: null, is_anchor: false };

  it('caps the session so it stays a short, completable ritual', () => {
    const memories = Array.from({ length: 30 }, (_, i) => ({
      ...base,
      id: String(i),
      srt_next_review: null,
    })) as Memory[];
    expect(sessionSelection(memories, 8)).toHaveLength(8);
  });

  it('puts anchors first', () => {
    const memories = [
      { ...base, id: 'ordinary', srt_next_review: null },
      { ...base, id: 'anchor', is_anchor: true, srt_next_review: null },
    ] as Memory[];
    expect(sessionSelection(memories, 1)[0].id).toBe('anchor');
  });

  it('leaves out retired memories entirely', () => {
    const memories = [
      { ...base, id: 'live', srt_next_review: null },
      { ...base, id: 'retired', retired_at: '2026-01-01T00:00:00Z', srt_next_review: null },
    ] as Memory[];
    expect(sessionSelection(memories, 10).map((m) => m.id)).toEqual(['live']);
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
