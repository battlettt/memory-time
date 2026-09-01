# Memory Time

A shared spaced-retrieval memory app for families supporting a loved one with
memory loss — built with Expo (React Native) and Supabase.

## What's here

- **Practice** — spaced retrieval training (SRT) sessions. Misses are re-asked
  soon (not drilled back-to-back), long-term intervals grow on success and
  reset on a miss, and a run of misses eases the session off rather than
  pushing harder (see `src/lib/srt.ts`, unit tested in `src/lib/srt.test.ts`).
- **Memories** — add a memory (photo, voice note, question/answer) from any
  family member's phone. "Get topic ideas" calls an AI edge function that
  suggests specific sub-questions for a topic, using what's already known
  about the care recipient so the suggestions aren't generic.
- **Browse** — passive "on this day" photo browsing, no quiz pressure.
- **Life Story** — a living portrait of the care recipient (childhood,
  career, personality, favorites, stories) separate from the practice quiz —
  for family, staff, or anyone getting to know them.
- **Settings** — invite codes to bring more family members in, family group
  switching, sign out.

## One-time setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run `supabase/migrations/0001_init.sql`.
3. Enable email OTP (magic link) auth: Authentication → Providers → Email.
4. Copy your project URL and anon key into `.env` (see `.env.example`).

### 2. AI topic prompts (Edge Function)

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli) and an
Anthropic API key.

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy generate-prompts
```

### 3. Install and run

```bash
npm install
npm run start   # then press i / a / w for iOS / Android / web
```

### 4. Tests

```bash
npm test
```

## Building for real devices

- **iOS**: requires an Apple Developer account ($99/yr). `eas build --platform ios`
- **Android**: requires a Google Play Console account ($25 one-time). `eas build --platform android`
- Both use [EAS Build](https://docs.expo.dev/eas/), no local Xcode/Android Studio needed.

## Deploying the web build

The app runs on a laptop via `npm run web`, which is no use to the rest of the
family. `vercel.json` configures a static deploy so it becomes a URL anyone can
open.

```bash
npm i -g vercel     # once
vercel login        # once
vercel --prod
```

Vercel runs `npx expo export --platform web` and serves `dist/`.

Three things have to be right, and two of them fail quietly:

1. **Environment variables must exist at build time.** `EXPO_PUBLIC_*` values
   are compiled into the bundle, not read at runtime, so they belong in
   Vercel's project settings — not in a runtime config. Set:

   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

   Both are publishable keys and are meant to ship to the browser; row-level
   security is what actually protects the data.

2. **Supabase must be told the new address.** In Supabase → Authentication →
   URL Configuration, set the Site URL to the deployed domain and add it to
   Redirect URLs. Skip this and every magic-link sign-in lands on a dead page,
   because the link still points at localhost.

3. **The catch-all rewrite is required.** The export produces a single
   `index.html`; without the rewrite in `vercel.json`, any path other than `/`
   returns 404. Vercel checks the filesystem before applying rewrites, so
   static assets under `/_expo/` are unaffected.

What deploying does *not* give you: push notifications for the daily question,
reliable camera capture of printed photos, and the PDF share sheet are all
native-only and stay unavailable on the web build. Speech-to-text works only in
Chrome, Edge and Safari. Those need a device build via EAS.

Contribution links are unaffected by where the app is hosted — they point at
the Supabase function URL directly.

## Notes

- Storage buckets (`memory-photos`, `memory-voice-notes`) and RLS policies are
  created by the migration — a family member can only read/write their own
  family's data.
- The `generate-prompts` function is rate-limited to 20 calls/member/day via
  the `ai_prompt_requests` table.
- Push notifications (`expo-notifications`) and crash reporting (Sentry) are
  installed/configured as plugins but not yet wired to specific events —
  next steps would be a caregiver weekly digest push and Sentry init in `App.tsx`.
