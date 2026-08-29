/**
 * One line of guidance before a session.
 *
 * Families are handed a diagnosis and almost no instruction on how to talk to
 * someone afterwards, and the instincts most people arrive with — correct the
 * error, insist on the facts, quiz harder when it goes badly — make things
 * worse for everyone. Going along with what the person believes, rather than
 * reorienting them to a reality they find distressing, is the mainstream
 * approach in dementia care now, and hardly anyone tells the family that.
 *
 * Deliberately one line at a time. A wall of advice before a session is a
 * lecture; a sentence is something you might actually take in.
 */

export interface CoachingTip {
  id: string;
  text: string;
}

export const COACHING_TIPS: CoachingTip[] = [
  {
    id: 'dont-correct',
    text: 'If a name comes out wrong, go along with it. Correcting costs more than the mistake.',
  },
  {
    id: 'no-tests',
    text: "Try not to say \"do you remember\" — it can land as a test. \"Tell me about this one\" opens the same door.",
  },
  {
    id: 'their-pace',
    text: 'Leave a long gap after the question. Silence usually means thinking, not failing.',
  },
  {
    id: 'stop-early',
    text: 'Stopping early on a bad day is good practice, not giving up.',
  },
  {
    id: 'feelings-last',
    text: 'The facts fade before the feelings do. A warm few minutes counts even if nothing is recalled.',
  },
  {
    id: 'photos-help',
    text: 'A photograph or a familiar voice does more work than repeating the question.',
  },
  {
    id: 'not-a-quiz',
    text: 'You are not testing them. You are spending time with them and this is the excuse.',
  },
  {
    id: 'infections',
    text: 'A sudden bad run can be an infection rather than a decline. Worth mentioning to a doctor.',
  },
  {
    id: 'best-hours',
    text: 'Most people have better hours in the day. Practise in one of theirs, not one of yours.',
  },
  {
    id: 'grief',
    text: "If a memory brings up grief, use \"Not today\". It rests the memory rather than drilling it.",
  },
];

/** Stable for a given day, so the tip does not shuffle on every render. */
export function tipForToday(now: Date = new Date()): CoachingTip {
  const dayNumber = Math.floor(now.getTime() / 86400000);
  return COACHING_TIPS[dayNumber % COACHING_TIPS.length];
}
