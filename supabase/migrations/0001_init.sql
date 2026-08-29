-- Memory Time: core schema
-- Run via `supabase db push` or paste into the Supabase SQL editor.

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  care_recipient_name text not null,
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('elder', 'contributor', 'viewer')),
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table memories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  category text not null check (category in ('relationship', 'identity', 'event')),
  question text not null,
  answer text not null,
  photo_url text,
  voice_url text,
  added_by uuid not null references members (id) on delete set null,
  note text,
  srt_level int not null default 0,
  srt_last_reviewed timestamptz,
  srt_next_review timestamptz,
  created_at timestamptz not null default now()
);

create table life_story_sections (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  section_key text not null check (
    section_key in ('early_life', 'career', 'family', 'personality', 'favorites', 'stories')
  ),
  title text not null,
  content text not null default '',
  photo_url text,
  added_by uuid not null references members (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families (id) on delete cascade,
  code text not null unique,
  created_by uuid not null references members (id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- Tracks AI topic-prompt generations per member, for simple daily rate limiting.
-- Written only by the generate-prompts Edge Function (service role), never the client.
create table ai_prompt_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  topic text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: a user may only touch data belonging to families they're a member of.

alter table families enable row level security;
alter table members enable row level security;
alter table memories enable row level security;
alter table life_story_sections enable row level security;
alter table invites enable row level security;
alter table ai_prompt_requests enable row level security;

create or replace function is_member_of(target_family_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from members
    where family_id = target_family_id and user_id = auth.uid()
  );
$$;

create policy "members can read their family" on families
  for select using (is_member_of(id));

create policy "authenticated users can create a family" on families
  for insert with check (auth.uid() is not null);

create policy "members can read their membership rows" on members
  for select using (is_member_of(family_id));

create policy "users can join a family as themselves" on members
  for insert with check (user_id = auth.uid());

create policy "members can read family memories" on memories
  for select using (is_member_of(family_id));

create policy "members can add memories" on memories
  for insert with check (is_member_of(family_id));

create policy "members can update family memories" on memories
  for update using (is_member_of(family_id));

create policy "members can read life story sections" on life_story_sections
  for select using (is_member_of(family_id));

create policy "members can write life story sections" on life_story_sections
  for insert with check (is_member_of(family_id));

create policy "members can update life story sections" on life_story_sections
  for update using (is_member_of(family_id));

create policy "members can read their family's invites" on invites
  for select using (is_member_of(family_id));

create policy "members can create invites" on invites
  for insert with check (is_member_of(family_id));

create policy "members can log their own ai prompt requests" on ai_prompt_requests
  for insert with check (
    exists (select 1 from members where id = member_id and user_id = auth.uid())
  );

create policy "members can read their own ai prompt requests" on ai_prompt_requests
  for select using (
    exists (select 1 from members where id = member_id and user_id = auth.uid())
  );

-- Storage: one bucket for photos, one for voice notes, both private and
-- readable only by members of the family the file belongs to (path convention:
-- `${family_id}/${filename}`).

insert into storage.buckets (id, name, public)
values ('memory-photos', 'memory-photos', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('memory-voice-notes', 'memory-voice-notes', false)
on conflict (id) do nothing;

create policy "members can read their family's photos" on storage.objects
  for select using (
    bucket_id = 'memory-photos' and is_member_of((storage.foldername(name))[1]::uuid)
  );

create policy "members can upload their family's photos" on storage.objects
  for insert with check (
    bucket_id = 'memory-photos' and is_member_of((storage.foldername(name))[1]::uuid)
  );

create policy "members can read their family's voice notes" on storage.objects
  for select using (
    bucket_id = 'memory-voice-notes' and is_member_of((storage.foldername(name))[1]::uuid)
  );

create policy "members can upload their family's voice notes" on storage.objects
  for insert with check (
    bucket_id = 'memory-voice-notes' and is_member_of((storage.foldername(name))[1]::uuid)
  );

-- Realtime: let clients subscribe to changes on shared family data.
alter publication supabase_realtime add table memories;
alter publication supabase_realtime add table life_story_sections;
