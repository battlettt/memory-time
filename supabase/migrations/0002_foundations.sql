-- Memory Time: foundations migration
--
-- Everything here is additive or a constraint relaxation. No column is
-- dropped and no row is deleted, so this is safe to run against live data
-- and safe to run twice.
--
-- Groups, in order:
--   1. Storage paths          — photos currently expire after one year (#13)
--   2. Real dates             — a memory has no "when it happened" (#16)
--   3. Compassionate SRT      — retirement, softer decay, "not today" (#11/#12/#15)
--   4. Provenance & language  — where a memory came from, what language (#3/#21/#27)
--   5. Foreign-key fix        — NOT NULL + ON DELETE SET NULL is unsatisfiable (#18)
--   6. Roles                  — the family creator is a caregiver, not the elder (#17)
--   7. Deletion               — nothing in the app can currently be removed (#14)
--   8. New tables             — settings, session history, recordings, links, prompts
--   9. Indexes
--
-- Wrapped in a transaction deliberately: there is no local Postgres to dry-run
-- against, so if any statement fails the whole thing rolls back rather than
-- leaving the schema half-migrated.

begin;

-- ---------------------------------------------------------------------------
-- 1. Storage paths (#13)
--
-- media.ts stores the *signed URL* into photo_url/voice_url, with a 365-day
-- TTL. On day 366 every photo in the family archive goes blank with no way
-- back. Store the object path instead and sign on read; the URL columns are
-- kept so nothing breaks mid-deploy.
-- ---------------------------------------------------------------------------

alter table memories add column if not exists photo_path text;
alter table memories add column if not exists voice_path text;
alter table life_story_sections add column if not exists photo_path text;

-- Recover the path from the signed URLs already stored.
-- Format: .../storage/v1/object/sign/<bucket>/<family_id>/<file>?token=...
update memories
set photo_path = substring(photo_url from '/object/sign/memory-photos/([^?]+)')
where photo_url is not null
  and photo_path is null
  and photo_url like '%/object/sign/memory-photos/%';

update memories
set voice_path = substring(voice_url from '/object/sign/memory-voice-notes/([^?]+)')
where voice_url is not null
  and voice_path is null
  and voice_url like '%/object/sign/memory-voice-notes/%';

update life_story_sections
set photo_path = substring(photo_url from '/object/sign/memory-photos/([^?]+)')
where photo_url is not null
  and photo_path is null
  and photo_url like '%/object/sign/memory-photos/%';

-- ---------------------------------------------------------------------------
-- 2. Real dates (#16)
--
-- created_at is when somebody typed the memory in, which is not when it
-- happened. Precision is stored separately because families remember "1962"
-- or "sometime in the seventies", not a calendar day.
-- ---------------------------------------------------------------------------

alter table memories add column if not exists occurred_on date;
alter table memories add column if not exists occurred_precision text;

do $$
begin
  alter table memories add constraint memories_occurred_precision_check
    check (occurred_precision is null
           or occurred_precision in ('day', 'month', 'year', 'decade'));
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Compassionate SRT (#11, #12, #15)
--
-- The scheduler currently tops out at a 30-day interval with no exit. In a
-- progressive condition some memories will be permanently lost, and the app
-- would keep asking them forever — a daughter watching her mother fail to
-- recognise her own face, monthly, indefinitely.
--
--   consecutive_misses : misses across sessions (not within-session retries)
--   retired_at         : moved to the album; still seen, no longer asked
--   is_anchor          : never auto-retires (a spouse, a child, their own name)
--   paused_until       : "not today" — this one upset them; rest it a while
-- ---------------------------------------------------------------------------

alter table memories add column if not exists consecutive_misses int not null default 0;
alter table memories add column if not exists retired_at timestamptz;
alter table memories add column if not exists is_anchor boolean not null default false;
alter table memories add column if not exists paused_until timestamptz;
alter table memories add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 4. Provenance and language (#3, #21, #27)
--
-- source lets a memory arriving from a public contribution link be reviewed
-- before it enters rotation. language matters because people with dementia
-- frequently revert to a first language; a cue in Punjabi or Cantonese may
-- land when the English one no longer does.
-- ---------------------------------------------------------------------------

alter table memories add column if not exists source text not null default 'app';
alter table memories add column if not exists language text;
alter table memories add column if not exists voice_transcript text;
alter table memories add column if not exists needs_review boolean not null default false;

do $$
begin
  alter table memories add constraint memories_source_check
    check (source in ('app', 'link', 'email', 'import', 'daily_prompt'));
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Foreign-key fix (#18)
--
-- `added_by uuid not null ... on delete set null` can never fire: deleting a
-- member raises a NOT NULL violation instead of nulling the column. Relax the
-- NOT NULL so the intended behaviour actually works.
-- ---------------------------------------------------------------------------

alter table memories alter column added_by drop not null;
alter table life_story_sections alter column added_by drop not null;
alter table invites alter column created_by drop not null;

-- ---------------------------------------------------------------------------
-- 6. Roles (#17)
--
-- createFamily() assigns role 'elder' to whoever sets the family up — but that
-- is the caregiver, not the person with memory loss. The column is read
-- nowhere in the app today, so relabelling is safe.
-- ---------------------------------------------------------------------------

alter table members drop constraint if exists members_role_check;
alter table members add constraint members_role_check
  check (role in ('elder', 'caregiver', 'contributor', 'viewer'));

update members set role = 'caregiver' where role = 'elder';

-- ---------------------------------------------------------------------------
-- 7. Deletion (#14)
--
-- There is no DELETE policy anywhere, so a typo is permanent, a photo of an
-- estranged relative is permanent, and a memory that turns out to be
-- distressing is permanent. That last one is a dignity requirement, not a
-- convenience.
-- ---------------------------------------------------------------------------

drop policy if exists "members can delete family memories" on memories;
create policy "members can delete family memories" on memories
  for delete using (is_member_of(family_id));

drop policy if exists "members can delete life story sections" on life_story_sections;
create policy "members can delete life story sections" on life_story_sections
  for delete using (is_member_of(family_id));

drop policy if exists "members can delete their family's invites" on invites;
create policy "members can delete their family's invites" on invites
  for delete using (is_member_of(family_id));

drop policy if exists "members can update their family" on families;
create policy "members can update their family" on families
  for update using (is_member_of(id));

drop policy if exists "members can delete their family's photos" on storage.objects;
create policy "members can delete their family's photos" on storage.objects
  for delete using (
    bucket_id = 'memory-photos' and is_member_of((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "members can delete their family's voice notes" on storage.objects;
create policy "members can delete their family's voice notes" on storage.objects
  for delete using (
    bucket_id = 'memory-voice-notes' and is_member_of((storage.foldername(name))[1]::uuid)
  );

-- ---------------------------------------------------------------------------
-- 8. New tables
-- ---------------------------------------------------------------------------

-- Per-family preferences: the daily prompt (#1), session length (#11),
-- large text (#10), and memorial mode (#25).
create table if not exists family_settings (
  family_id uuid primary key references families (id) on delete cascade,
  daily_prompt_enabled boolean not null default true,
  daily_prompt_hour int not null default 18 check (daily_prompt_hour between 0 and 23),
  session_size_limit int not null default 8 check (session_size_limit between 1 and 50),
  large_text boolean not null default false,
  retire_after_misses int not null default 4 check (retire_after_misses between 2 and 12),
  -- When someone dies the app must not keep sending "time to practise"
  -- notifications. Memorial mode stops every prompt and reframes the app
  -- as an archive.
  memorial_mode boolean not null default false,
  memorial_since timestamptz,
  updated_at timestamptz not null default now()
);

insert into family_settings (family_id)
select id from families
on conflict (family_id) do nothing;

-- Session history, for the weekly caregiver report (#7) and for the
-- "she does better before noon" observation (#12).
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  member_id uuid references members (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  answered int not null default 0,
  correct int not null default 0,
  ended_early boolean not null default false
);

-- One row per question asked. cue_level records how much help was needed,
-- which is what makes graduated cueing (#22) measurable rather than binary.
create table if not exists review_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  memory_id uuid not null references memories (id) on delete cascade,
  session_id uuid references practice_sessions (id) on delete set null,
  correct boolean not null,
  cue_level int not null default 0 check (cue_level between 0 and 3),
  outcome text not null default 'answered'
    check (outcome in ('answered', 'skipped', 'distressing')),
  local_hour int check (local_hour between 0 and 23),
  created_at timestamptz not null default now()
);

-- The elder's own answers, in their own voice (#9). Families overwhelmingly
-- regret not having recordings; this captures them as a side effect of use.
create table if not exists elder_recordings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  memory_id uuid references memories (id) on delete set null,
  audio_path text not null,
  transcript text,
  duration_seconds numeric,
  recorded_at timestamptz not null default now()
);

-- Public contribution links (#3): a relative who will never install an app
-- can still add a photo and a sentence from a URL.
create table if not exists contribution_links (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  token text not null unique,
  label text,
  created_by uuid references members (id) on delete set null,
  expires_at timestamptz,
  revoked_at timestamptz,
  submission_count int not null default 0,
  created_at timestamptz not null default now()
);

-- One question a day, answered by voice (#1).
create table if not exists daily_prompts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  member_id uuid references members (id) on delete set null,
  question text not null,
  source text not null default 'ai',
  answered_memory_id uuid references memories (id) on delete set null,
  shown_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (family_id, member_id, shown_on)
);

alter table family_settings enable row level security;
alter table practice_sessions enable row level security;
alter table review_events enable row level security;
alter table elder_recordings enable row level security;
alter table contribution_links enable row level security;
alter table daily_prompts enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'family_settings', 'practice_sessions', 'review_events',
    'elder_recordings', 'contribution_links', 'daily_prompts'
  ]
  loop
    -- family_settings keys on family_id as its primary key; the rest carry a
    -- family_id column. Same predicate either way.
    execute format('drop policy if exists "members read %1$s" on %1$I', t);
    execute format(
      'create policy "members read %1$s" on %1$I for select using (is_member_of(family_id))', t
    );
    execute format('drop policy if exists "members write %1$s" on %1$I', t);
    execute format(
      'create policy "members write %1$s" on %1$I for insert with check (is_member_of(family_id))', t
    );
    execute format('drop policy if exists "members update %1$s" on %1$I', t);
    execute format(
      'create policy "members update %1$s" on %1$I for update using (is_member_of(family_id))', t
    );
    execute format('drop policy if exists "members delete %1$s" on %1$I', t);
    execute format(
      'create policy "members delete %1$s" on %1$I for delete using (is_member_of(family_id))', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 9. Indexes
-- ---------------------------------------------------------------------------

create index if not exists memories_family_due_idx
  on memories (family_id, srt_next_review)
  where retired_at is null;

create index if not exists memories_family_occurred_idx
  on memories (family_id, occurred_on)
  where occurred_on is not null;

create index if not exists review_events_family_created_idx
  on review_events (family_id, created_at desc);

create index if not exists review_events_memory_idx
  on review_events (memory_id, created_at desc);

create index if not exists practice_sessions_family_idx
  on practice_sessions (family_id, started_at desc);

create index if not exists elder_recordings_family_idx
  on elder_recordings (family_id, recorded_at desc);

create index if not exists contribution_links_token_idx
  on contribution_links (token) where revoked_at is null;

commit;
