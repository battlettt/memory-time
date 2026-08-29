/**
 * Era packs — reminiscence prompts by decade.
 *
 * Two problems these solve. The first is the empty app on day one: a family
 * who has not yet uploaded a single photograph can still have a good half
 * hour with these. The second is the wall families hit around week three,
 * when the photographs run out and nobody can think what else to ask.
 *
 * Autobiographical memory peaks for events from roughly ages ten to thirty —
 * the "reminiscence bump" — so the decade someone was young in is far richer
 * ground than last year.
 *
 * Everything here is a question, deliberately. No song files, no magazine
 * scans, no newsreel clips: that material is almost all still in copyright,
 * and a question about a song works just as well as the song for starting a
 * conversation — without needing a licence.
 */

export interface EraPrompt {
  theme: string;
  question: string;
}

export interface EraPack {
  id: string;
  decade: string;
  /** Roughly who this pack suits, by birth year. */
  bornBetween: [number, number];
  blurb: string;
  prompts: EraPrompt[];
}

export const ERA_PACKS: EraPack[] = [
  {
    id: 'thirties-forties',
    decade: 'The 1930s and 40s',
    bornBetween: [1920, 1935],
    blurb: 'Childhood in hard years — rationing, evacuation, making do.',
    prompts: [
      { theme: 'Home', question: 'What was the kitchen like in the house you grew up in?' },
      { theme: 'Home', question: 'Who else lived in the house when you were small?' },
      { theme: 'School', question: 'What was your teacher called, and were you frightened of them?' },
      { theme: 'Food', question: 'What did your mother make that you still think about?' },
      { theme: 'Making do', question: 'What did your family do without, and did it bother you?' },
      { theme: 'Play', question: 'What did you and the other children play out in the street?' },
      { theme: 'Sunday', question: 'What happened on a Sunday in your house?' },
      { theme: 'Work', question: 'What did your father do, and did you ever see him doing it?' },
    ],
  },
  {
    id: 'fifties',
    decade: 'The 1950s',
    bornBetween: [1930, 1945],
    blurb: 'First jobs, first dances, the first television in the street.',
    prompts: [
      { theme: 'Dancing', question: 'Where did you go dancing, and who did you go with?' },
      { theme: 'Music', question: 'What was playing when you were seventeen?' },
      { theme: 'First job', question: 'What was your very first job, and what did they pay you?' },
      { theme: 'Money', question: 'What did you spend your first wages on?' },
      { theme: 'Television', question: 'Do you remember the first television you ever watched?' },
      { theme: 'Courting', question: 'Where did you go on a first date back then?' },
      { theme: 'Clothes', question: 'What did you wear when you wanted to look your best?' },
      { theme: 'Getting about', question: 'How did you get around before there was a car?' },
    ],
  },
  {
    id: 'sixties',
    decade: 'The 1960s',
    bornBetween: [1940, 1955],
    blurb: 'Marriage, first homes, small children, everything changing at once.',
    prompts: [
      { theme: 'Wedding', question: 'What do you remember about the day you got married?' },
      { theme: 'First home', question: 'What was the first place you lived in on your own?' },
      { theme: 'Babies', question: 'What were you like as a young parent?' },
      { theme: 'Music', question: 'What did you have on while you were doing the housework?' },
      { theme: 'Holidays', question: 'Where did the family go on holiday, and how did you get there?' },
      { theme: 'Neighbours', question: 'Who lived next door, and did you get on?' },
      { theme: 'Cars', question: 'What was the first car you owned?' },
      { theme: 'News', question: 'What news do you remember everyone talking about?' },
    ],
  },
  {
    id: 'seventies',
    decade: 'The 1970s',
    bornBetween: [1950, 1965],
    blurb: 'Growing children, settled work, the house full of noise.',
    prompts: [
      { theme: 'Work', question: 'What were you doing for work, and did you like the people?' },
      { theme: 'Home', question: 'What was the front room like — the wallpaper, the chairs?' },
      { theme: 'Children', question: 'What were the children like at that age?' },
      { theme: 'Food', question: 'What did you cook when people came round?' },
      { theme: 'Holidays', question: 'What was the best holiday you took in those years?' },
      { theme: 'Evenings', question: 'What did you do on a Friday night?' },
      { theme: 'Pets', question: 'Did you have a dog or a cat, and what was it called?' },
      { theme: 'Garden', question: 'What did you grow, and were you any good at it?' },
    ],
  },
  {
    id: 'eighties',
    decade: 'The 1980s',
    bornBetween: [1960, 1975],
    blurb: 'Children leaving, more room, more time.',
    prompts: [
      { theme: 'Family', question: 'What was it like when the children started leaving home?' },
      { theme: 'Work', question: 'What were you proudest of at work?' },
      { theme: 'Friends', question: 'Who were you closest to in those years?' },
      { theme: 'Travel', question: 'Where did you go once you had a bit more freedom?' },
      { theme: 'Home', question: 'What did you change about the house?' },
      { theme: 'Weekends', question: 'What did a good weekend look like?' },
      { theme: 'Grandchildren', question: 'What do you remember about becoming a grandparent?' },
      { theme: 'Music', question: 'What did you put on when you wanted cheering up?' },
    ],
  },
];

/** Suggest the pack covering the years someone was young, given a birth year. */
export function suggestedPack(birthYear: number | null): EraPack | null {
  if (!birthYear) return null;
  return (
    ERA_PACKS.find((p) => birthYear >= p.bornBetween[0] && birthYear <= p.bornBetween[1]) ?? null
  );
}
