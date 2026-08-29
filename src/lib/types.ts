export type MemberRole = 'elder' | 'contributor' | 'viewer';

export type MemoryCategory = 'relationship' | 'identity' | 'event';

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
  photo_url: string | null;
  voice_url: string | null;
  added_by: string;
  note: string | null;
  srt_level: number;
  srt_last_reviewed: string | null;
  srt_next_review: string | null;
  created_at: string;
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
  photo_url: string | null;
  added_by: string;
  updated_at: string;
}

export interface Invite {
  id: string;
  family_id: string;
  code: string;
  created_by: string;
  expires_at: string | null;
  created_at: string;
}

export const TOPIC_LABELS: Record<LifeStorySectionKey, string> = {
  early_life: 'Childhood',
  career: 'Career',
  family: 'Family',
  personality: 'Personality',
  favorites: 'Favorite things',
  stories: 'Notable stories',
};
