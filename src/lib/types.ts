// 'caregiver' is whoever sets the family up and runs sessions; 'elder' is the
// person being supported, who may have their own stripped-down device. These
// were conflated before — the family creator was labelled 'elder', which is
// exactly backwards.
export type MemberRole = 'elder' | 'caregiver' | 'contributor' | 'viewer';

export type MemoryCategory = 'relationship' | 'identity' | 'event';

/** Where a memory came from. Anything not 'app' may want review before use. */
export type MemorySource = 'app' | 'link' | 'email' | 'import' | 'daily_prompt';

/** Families remember "1962" or "the seventies", not a calendar day. */
export type DatePrecision = 'day' | 'month' | 'year' | 'decade';

export interface Family {
  id: string;
  name: string;
  care_recipient_name: string;
  created_at: string;
}

export interface Member {
  id: string;
  family_id: string;
  user_id: string;
  role: MemberRole;
  display_name: string;
  created_at: string;
}

export interface Memory {
  id: string;
  family_id: string;
  category: MemoryCategory;
  question: string;
  answer: string;
  /**
   * Storage object paths — the durable reference. `photo_url`/`voice_url` hold
   * a short-lived signed URL resolved at read time. Signed URLs used to be
   * written straight into the database with a 365-day TTL, which meant the
   * whole family archive went blank a year after upload.
   */
  photo_path: string | null;
  voice_path: string | null;
  photo_url: string | null;
  voice_url: string | null;
  added_by: string | null;
  note: string | null;
  srt_level: number;
  srt_last_reviewed: string | null;
  srt_next_review: string | null;
  /** Misses across sessions, not within-session retries. Drives retirement. */
  consecutive_misses: number;
  /** Set once a memory stops being asked. It stays in the album regardless. */
  retired_at: string | null;
  /** Anchors — a spouse, a child, their own name — never auto-retire. */
  is_anchor: boolean;
  /** "Not today": this one upset them. Rest it rather than drill it. */
  paused_until: string | null;
  occurred_on: string | null;
  occurred_precision: DatePrecision | null;
  source: MemorySource;
  /** People with dementia often revert to a first language. */
  language: string | null;
  voice_transcript: string | null;
  needs_review: boolean;
  created_at: string;
  updated_at: string;
}

export const LIFE_STORY_SECTION_KEYS = [
  'early_life',
  'career',
  'family',
  'personality',
  'favorites',
  'stories',
] as const;

export type LifeStorySectionKey = (typeof LIFE_STORY_SECTION_KEYS)[number];

export interface LifeStorySection {
  id: string;
  family_id: string;
  section_key: LifeStorySectionKey;
  title: string;
  content: string;
  photo_path: string | null;
  photo_url: string | null;
  added_by: string | null;
  updated_at: string;
}

export interface Invite {
  id: string;
  family_id: string;
  code: string;
  created_by: string | null;
  expires_at: string | null;
  created_at: string;
}

/** Per-family preferences. One row per family, seeded on creation. */
export interface FamilySettings {
  family_id: string;
  daily_prompt_enabled: boolean;
  daily_prompt_hour: number;
  /** Sessions are capped so they stay a short, completable ritual. */
  session_size_limit: number;
  large_text: boolean;
  retire_after_misses: number;
  /**
   * When someone dies the app must not keep sending "time to practise".
   * Memorial mode stops every prompt and reframes the app as an archive.
   */
  memorial_mode: boolean;
  memorial_since: string | null;
  updated_at: string;
}

export const TOPIC_LABELS: Record<LifeStorySectionKey, string> = {
  early_life: 'Childhood',
  career: 'Career',
  family: 'Family',
  personality: 'Personality',
  favorites: 'Favorite things',
  stories: 'Notable stories',
};
