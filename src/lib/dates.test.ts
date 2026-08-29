import { formatOccurred, yearsAgoLabel, anniversariesToday, parseLooseDate } from './dates';
import type { Memory } from './types';

describe('formatOccurred', () => {
  it('does not invent a day for a remembered year', () => {
    expect(formatOccurred('1962-01-01', 'year')).toBe('1962');
  });

  it('formats a month', () => {
    expect(formatOccurred('1962-03-01', 'month')).toBe('March 1962');
  });

  it('formats a decade the way people say it', () => {
    expect(formatOccurred('1970-01-01', 'decade')).toBe('the 70s');
  });

  it('gives the full date when the day is genuinely known', () => {
    expect(formatOccurred('1962-03-12', 'day')).toBe('12 March 1962');
  });

  it('returns null when there is no date', () => {
    expect(formatOccurred(null, null)).toBeNull();
  });
});

describe('yearsAgoLabel', () => {
  it('reads naturally for a known day', () => {
    const now = new Date('2026-03-12T12:00:00');
    expect(yearsAgoLabel('1984-03-12', 'day', now)).toBe('42 years ago today');
  });

  it('stays silent when only the year is known', () => {
    const now = new Date('2026-03-12T12:00:00');
    expect(yearsAgoLabel('1984-01-01', 'year', now)).toBeNull();
  });
});

describe('anniversariesToday', () => {
  const base = { occurred_precision: 'day' } as const;

  it('finds a memory whose anniversary is today', () => {
    const now = new Date('2026-08-29T09:00:00');
    const memories = [
      { id: 'match', occurred_on: '1961-08-29', ...base },
      { id: 'other', occurred_on: '1961-08-28', ...base },
    ] as Memory[];
    expect(anniversariesToday(memories, now).map((m) => m.id)).toEqual(['match']);
  });

  it('ignores memories dated only to a year', () => {
    const now = new Date('2026-01-01T09:00:00');
    const memories = [
      { id: 'vague', occurred_on: '1961-01-01', occurred_precision: 'year' },
    ] as Memory[];
    expect(anniversariesToday(memories, now)).toHaveLength(0);
  });
});

describe('parseLooseDate', () => {
  it('accepts a bare year', () => {
    expect(parseLooseDate('1962')).toEqual({
      occurred_on: '1962-01-01',
      occurred_precision: 'year',
    });
  });

  it('accepts a decade written how people say it', () => {
    expect(parseLooseDate('the 70s')?.occurred_precision).toBe('decade');
    expect(parseLooseDate('1970s')?.occurred_on).toBe('1970-01-01');
  });

  it('accepts a month and year', () => {
    expect(parseLooseDate('March 1962')).toEqual({
      occurred_on: '1962-03-01',
      occurred_precision: 'month',
    });
  });

  it('returns null rather than guessing at nonsense', () => {
    expect(parseLooseDate('sometime back then')).toBeNull();
    expect(parseLooseDate('')).toBeNull();
  });
});
