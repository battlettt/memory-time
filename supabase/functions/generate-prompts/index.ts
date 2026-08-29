// Supabase Edge Function: given a topic (and whatever's already known about the
// care recipient), returns a handful of specific sub-questions to help a family
// member figure out what to add. Keeps the Anthropic API key server-side.
//
// Deploy: supabase functions deploy generate-prompts
// Requires secret: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const DAILY_LIMIT_PER_MEMBER = 20;

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

interface RequestBody {
  familyId: string;
  topic: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: 'Invalid session' }, 401);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { familyId, topic } = body;
  if (!familyId || !topic) {
    return json({ error: 'familyId and topic are required' }, 400);
  }

  // RLS on `members` means this only succeeds if the caller actually belongs to the family.
  const { data: membership, error: membershipError } = await supabase
    .from('members')
    .select('id, family_id')
    .eq('family_id', familyId)
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return json({ error: 'Not a member of this family' }, 403);
  }

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const { count } = await supabase
    .from('ai_prompt_requests')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', membership.id)
    .gte('created_at', since.toISOString());

  if ((count ?? 0) >= DAILY_LIMIT_PER_MEMBER) {
    return json({ error: 'Daily prompt limit reached, try again tomorrow.' }, 429);
  }

  const { data: existingSections } = await supabase
    .from('life_story_sections')
    .select('title, content')
    .eq('family_id', familyId)
    .limit(10);

  const context = (existingSections ?? [])
    .map((s) => `${s.title}: ${s.content}`)
    .join('\n')
    .slice(0, 2000);

  const { data: family } = await supabase
    .from('families')
    .select('care_recipient_name')
    .eq('id', familyId)
    .single();

  const careRecipientName = family?.care_recipient_name ?? 'this person';

  const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system:
        'You help families capture memories for a loved one with memory loss. ' +
        'Given a topic and whatever is already known, suggest specific, concrete ' +
        'sub-questions a family member could answer to add to a memory app. ' +
        'Avoid generic questions; use any known context to ask sharper follow-ups. ' +
        'Respond with a JSON array of 4-5 short question strings, nothing else.',
      messages: [
        {
          role: 'user',
          content: `Care recipient: ${careRecipientName}\nTopic: ${topic}\nKnown so far:\n${context || '(nothing yet)'}`,
        },
      ],
    }),
  });

  if (!anthropicResponse.ok) {
    const errText = await anthropicResponse.text();
    return json({ error: 'AI request failed', detail: errText }, 502);
  }

  const anthropicJson = await anthropicResponse.json();
  const rawText: string = anthropicJson.content?.[0]?.text ?? '[]';

  // Claude sometimes wraps the JSON array in a markdown code fence despite
  // being asked not to; strip that before parsing.
  const cleanedText = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let prompts: string[];
  try {
    prompts = JSON.parse(cleanedText);
  } catch {
    prompts = cleanedText
      .split('\n')
      .map((line) =>
        line
          .replace(/^[-*\d.)\s]+/, '')
          .replace(/^["']+|["',]+$/g, '')
          .trim()
      )
      .filter((line) => line && line !== '[' && line !== ']');
  }

  await supabase.from('ai_prompt_requests').insert({ member_id: membership.id, topic });

  return json({ prompts });
});
