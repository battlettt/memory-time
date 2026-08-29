import type { DatePrecision, Memory } from './types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * A memory's date is stored as a real date plus how much of it is actually
 * known. Families remember "1962" or "sometime in the seventies" far more
 * often than a calendar day, and printing "1 January 1962" for a remembered
 * year invents a precision nobody has.
 */
export function formatOccurred(
  occurredOn: string | null,
  precision: DatePrecision | null
): string | null {
  if (!occurredOn) return null;
  const date = new Date(`${occurredOn}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  switch (precision) {
    case 'decade':
      return `the ${String(year).slice(-2)}s`;
    case 'year':
      return String(year);
    case 'month':
      return `${MONTHS[date.getMonth()]} ${year}`;
    case 'day':
    default:
      return `${date.getDate()} ${MONTHS[date.getMonth()]} ${year}`;
  }
}

/** "42 years ago today" — only honest when the day itself is known. */
export function yearsAgoLabel(
  occurredOn: string | null,
  precision: DatePrecision | null,
  now: Date = new Date()
): string | null {
  if (!occurredOn || precision !== 'day') return null;
  const date = new Date(`${occurredOn}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  const years = now.getFullYear() - date.getFullYear();
  if (years <= 0) return null;
  return `${years} ${years === 1 ? 'year' : 'years'} ago today`;
}

/**
 * Memories whose anniversary falls today.
 *
 * The Album tab has been called "On this day" since the first commit while
 * doing no date matching at all — it simply listed every photo. This is the
 * part that was missing.
 */
export function anniversariesToday(memories: Memory[], now: Date = new Date()): Memory[] {
  return memories.filter((m) => {
    if (!m.occurred_on || m.occurred_precision !== 'day') return false;
    const date = new Date(`${m.occurred_on}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    return (
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate() &&
      date.getFullYear() < now.getFullYear()
    );
  });
}

/**
 * Parse what a person actually types into a date box: "1962", "March 1962",
 * "the 70s", "12/03/1962". Returns null rather than guessing wildly.
 */
export function parseLooseDate(
  input: string
): { occurred_on: string; occurred_precision: DatePrecision } | null {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  const decade = text.match(/^(?:the\s+)?(\d{2}|\d{4})s$/);
  if (decade) {
    const raw = Number(decade[1]);
    const year = raw < 100 ? (raw >= 30 ? 1900 + raw : 2000 + raw) : raw;
    return { occurred_on: `${year}-01-01`, occurred_precision: 'decade' };
  }

  const yearOnly = text.match(/^(\d{4})$/);
  if (yearOnly) {
    return { occurred_on: `${yearOnly[1]}-01-01`, occurred_precision: 'year' };
  }

  const monthYear = text.match(/^([a-z]+)\s+(\d{4})$/);
  if (monthYear) {
    const index = MONTHS.findIndex((m) => m.toLowerCase().startsWith(monthYear[1].slice(0, 3)));
    if (index >= 0) {
      const month = String(index + 1).padStart(2, '0');
      return { occurred_on: `${monthYear[2]}-${month}-01`, occurred_precision: 'month' };
    }
  }

  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime()) && /\d{4}/.test(input)) {
    const iso = parsed.toISOString().slice(0, 10);
    return { occurred_on: iso, occurred_precision: 'day' };
  }

  return null;
}
