// Supabase Edge Function: turn photographs into draft memories.
//
// The bottleneck in this app has never been the algorithm — it is that
// somebody has to sit down and type memories in, and they stop after week one.
// This takes a batch of photos from the family's library and drafts a
// question, an answer and a date guess for each, so contributing becomes
// confirming rather than composing.
//
// Nothing here writes to the database. Drafts are returned to the client for a
// person to correct and approve first: a plausible-sounding invention about
// someone's grandmother is worse than a blank field.
//
// Deploy: supabase functions deploy draft-memories
// Requires secret: ANTHROPIC_API_KEY

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const MAX_IMAGES_PER_REQUEST = 8;
const DAILY_IMAGE_LIMIT_PER_MEMBER = 120;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

interface IncomingImage {
  /** Base64 without the data: prefix. Resized client-side before sending. */
  base64: string;
  mediaType?: string;
  /** EXIF capture date if the file carried one, as an ISO date. */
  takenOn?: string | null;
}

interface Draft {
  index: number;
  question: string;
  answer: string;
  category: 'relationship' | 'identity' | 'event';
  occurredOn: string | null;
  occurredPrecision: 'day' | 'month' | 'year' | 'decade' | null;
  confident: boolean;
}

const SYSTEM_PROMPT = `You help a family build a memory-practice reel for a relative living with memory loss.

Given one photograph, draft a single question-and-answer pair they could practise with.

Rules:
- The question is what a caregiver would ask aloud while holding the photo. Short, warm, concrete: "Who is this with you in the garden?" — never "Identify the individual pictured."
- The answer is what the caregiver would say back, in the second person, addressed to the person with memory loss: "That's Sarah, your granddaughter."
- You cannot know who these people are. Never invent a name, a place or a relationship. Where a specific detail is needed, leave a short bracketed blank the family will fill in, like "That's [name], your [relationship]".
- Never assert that this person was present, went somewhere, owned something, or took part in what the photo shows. You do not know that, and a confidently worded invention is worse than a blank: the person practising has memory loss and will be asked to accept it as their own memory. Write "That's [who this is]" and let the family supply the claim.
- A capture date tells you when the shutter was pressed. It does not tell you that this person was there. Do not write "you attended" or "you were at" on the strength of a date.
- Set "confident" to false whenever the draft contains a bracketed blank or you are guessing at what the picture shows.
- category: "relationship" for a photo mainly about a person and who they are to the family, "identity" for something about the person's own life, work or character, "event" for an occasion or place.
- Use the capture date only if one is supplied. Never guess a date from how old a photograph looks.

Respond with a single JSON object and nothing else:
{"question": "...", "answer": "...", "category": "relationship|identity|event", "confident": true|false}`;

function stripFence(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

async function draftOne(image: IncomingImage, index: number): Promise<Draft | null> {
  const takenLine = image.takenOn
    ? `The photo file says it was taken on ${image.takenOn}.`
    : 'The photo file carries no capture date.';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType || 'image/jpeg',
                data: image.base64,
              },
            },
            { type: 'text', text: takenLine },
          ],
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const body = await response.json();
  const raw: string = body.content?.[0]?.text ?? '';

  try {
    const parsed = JSON.parse(stripFence(raw));
    if (!parsed.question || !parsed.answer) return null;

    // Only the EXIF date is trusted. A model guessing "this looks like the
    // 1960s" would be inventing family history.
    const takenOn = image.takenOn ?? null;

    return {
      index,
      question: String(parsed.question).slice(0, 300),
      answer: String(parsed.answer).slice(0, 500),
      category: ['relationship', 'identity', 'event'].includes(parsed.category)
        ? parsed.category
        : 'event',
      occurredOn: takenOn,
      occurredPrecision: takenOn ? 'day' : null,
      confident: parsed.confident === true,
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json({ error: 'Invalid session' }, 401);

  let body: { familyId?: string; images?: IncomingImage[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { familyId, images } = body;
  if (!familyId || !Array.isArray(images) || images.length === 0) {
    return json({ error: 'familyId and at least one image are required' }, 400);
  }
  if (images.length > MAX_IMAGES_PER_REQUEST) {
    return json({ error: `Send at most ${MAX_IMAGES_PER_REQUEST} photos at a time` }, 400);
  }

  // RLS means this only resolves if the caller really belongs to the family.
  const { data: membership, error: membershipError } = await supabase
    .from('members')
    .select('id')
    .eq('family_id', familyId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (membershipError || !membership) return json({ error: 'Not a member of this family' }, 403);

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_prompt_requests')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', membership.id)
    .eq('topic', 'photo-import')
    .gte('created_at', since.toISOString());

  if ((count ?? 0) + images.length > DAILY_IMAGE_LIMIT_PER_MEMBER) {
    return json({ error: 'Daily photo limit reached, try again tomorrow.' }, 429);
  }

  const drafts = await Promise.all(images.map((image, index) => draftOne(image, index)));

  // Log one row per image so the rate limit reflects actual model calls.
  await supabase.from('ai_prompt_requests').insert(
    images.map(() => ({ member_id: membership.id, topic: 'photo-import' }))
  );

  return json({ drafts: drafts.filter((d): d is Draft => d !== null) });
});
