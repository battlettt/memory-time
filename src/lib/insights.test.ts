import {
  bucketForHour,
  bestTimeOfDay,
  summariseWeek,
  type ReviewEvent,
  type PracticeSessionRow,
} from './insights';
import type { Memory } from './types';
import { en } from './translations/en';

const iso = (daysAgo: number) =>
  new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

function event(partial: Partial<ReviewEvent>): ReviewEvent {
  return {
    id: Math.random().toString(),
    memory_id: 'm1',
    correct: true,
    cue_level: 0,
    outcome: 'answered',
    local_hour: 9,
    created_at: iso(1),
    ...partial,
  };
}

describe('bucketForHour', () => {
  it('splits the day the way people talk about it', () => {
    expect(bucketForHour(9)).toBe('morning');
    expect(bucketForHour(14)).toBe('afternoon');
    expect(bucketForHour(20)).toBe('evening');
  });
});

describe('bestTimeOfDay', () => {
  const many = (n: number, partial: Partial<ReviewEvent>) =>
    Array.from({ length: n }, () => event(partial));

  it('finds a real morning advantage', () => {
    const events = [
      ...many(10, { local_hour: 9, correct: true }),
      ...many(10, { local_hour: 19, correct: false }),
    ];
    const finding = bestTimeOfDay(events);
    expect(finding?.bucket).toBe('morning');
    expect(finding?.comparedWith).toBe('evening');
  });

  it('stays silent on a small sample', () => {
    // Six answers is not evidence of anything, however lopsided.
    const events = [
      ...many(3, { local_hour: 9, correct: true }),
      ...many(3, { local_hour: 19, correct: false }),
    ];
    expect(bestTimeOfDay(events)).toBeNull();
  });

  it('stays silent when the difference is small', () => {
    const events = [
      ...many(10, { local_hour: 9, correct: true }),
      ...many(9, { local_hour: 19, correct: true }),
      ...many(1, { local_hour: 19, correct: false }),
    ];
    expect(bestTimeOfDay(events)).toBeNull();
  });

  it('ignores skipped and distressing answers', () => {
    const events = [
      ...many(10, { local_hour: 9, correct: false, outcome: 'distressing' }),
      ...many(10, { local_hour: 19, correct: true }),
    ];
    // The morning entries are all excluded, leaving one bucket and no finding.
    expect(bestTimeOfDay(events)).toBeNull();
  });
});

describe('summariseWeek', () => {
  const base = {
    retired_at: null,
    consecutive_misses: 0,
    srt_level: 0,
    created_at: iso(60),
  };

  const memories = [
    { ...base, id: 'holding', srt_level: 5 },
    { ...base, id: 'slipping', consecutive_misses: 3 },
    { ...base, id: 'resting', retired_at: iso(2) },
    { ...base, id: 'fresh', created_at: iso(1) },
  ] as Memory[];

  const sessions: PracticeSessionRow[] = [
    {
      id: 's1',
      started_at: new Date(Date.now() - 3 * 60000).toISOString(),
      ended_at: new Date().toISOString(),
      answered: 4,
      correct: 3,
    },
    // Older than a week — must not count.
    { id: 's2', started_at: iso(20), ended_at: iso(20), answered: 2, correct: 2 },
  ];

  it('sorts memories into holding, slipping and resting', () => {
    const r = summariseWeek(memories, [], sessions);
    expect(r.holding.map((m) => m.id)).toEqual(['holding']);
    expect(r.slipping.map((m) => m.id)).toEqual(['slipping']);
    expect(r.resting.map((m) => m.id)).toEqual(['resting']);
  });

  it('counts only this week', () => {
    const r = summariseWeek(memories, [], sessions);
    expect(r.sessionCount).toBe(1);
    expect(r.added.map((m) => m.id)).toEqual(['fresh']);
  });

  it('measures minutes together', () => {
    const r = summariseWeek(memories, [], sessions);
    expect(r.minutesTogether).toBe(3);
  });

  it('ignores a session left open for hours', () => {
    // A device left on the counter is not time spent together.
    const stale: PracticeSessionRow[] = [
      {
        id: 'x',
        started_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        answered: 1,
        correct: 1,
      },
    ];
    expect(summariseWeek(memories, [], stale).minutesTogether).toBe(0);
  });

  it('counts distinct memories practised, not answers given', () => {
    const events = [
      event({ memory_id: 'a' }),
      event({ memory_id: 'a' }),
      event({ memory_id: 'b' }),
    ];
    expect(summariseWeek(memories, events, sessions).memoriesPractised).toBe(2);
  });
});

describe('the report leads with time, not a score', () => {
  // The headline moved into the translation catalogue when the interface was
  // translated. The product decision it encoded still needs guarding: recall
  // accuracy turns a degenerative illness into a weekly exam the family is
  // failing, and it trends down however well anyone does.
  const headlineKeys = [
    'report.minutes_one',
    'report.minutes_other',
    'report.sessions_one',
    'report.sessions_other',
    'report.noSessions',
  ] as const;

  it('never puts a percentage or a score in the headline', () => {
    for (const key of headlineKeys) {
      expect(en[key]).not.toMatch(/%|accuracy|score|correct/i);
    }
  });

  it('measures time spent together', () => {
    expect(en['report.minutes_other']).toMatch(/minutes with \{name\}/);
  });

  it('does not manufacture an achievement from a quiet week', () => {
    expect(en['report.noSessions']).toMatch(/That’s allowed/);
  });
});
