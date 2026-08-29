// Supabase Edge Function: a public contribution page.
//
// The family member who matters most is often the one who will never install
// an app — a brother in his seventies, an old friend, a cousin abroad. This
// gives them a plain web page at a private link: a name, a sentence, an
// optional photograph, no account, no password.
//
// Security posture, because this is the one endpoint with no login behind it:
//   - the token is the only credential, and is checked for existence, expiry
//     and revocation on every request
//   - the page discloses only the care recipient's name, nothing else about
//     the family, and never lists what has already been contributed
//   - submissions land with needs_review set, so nothing a stranger sends
//     goes into a practice session until a family member has seen it
//   - per-link submission cap and a hard body-size limit
//
// Deploy with JWT verification DISABLED — the whole point is that visitors
// have no session.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MAX_BODY_BYTES = 8 * 1024 * 1024;
const MAX_SUBMISSIONS_PER_LINK = 200;
const MAX_TEXT = 2000;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function html(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );
}

interface LinkRow {
  id: string;
  family_id: string;
  expires_at: string | null;
  revoked_at: string | null;
  submission_count: number;
}

async function loadLink(token: string): Promise<{ link: LinkRow; recipient: string } | null> {
  if (!token || !/^[A-Za-z0-9_-]{10,64}$/.test(token)) return null;

  const { data: link } = await admin
    .from('contribution_links')
    .select('id, family_id, expires_at, revoked_at, submission_count')
    .eq('token', token)
    .maybeSingle();

  if (!link) return null;
  if (link.revoked_at) return null;
  if (link.expires_at && new Date(link.expires_at) < new Date()) return null;
  if (link.submission_count >= MAX_SUBMISSIONS_PER_LINK) return null;

  const { data: family } = await admin
    .from('families')
    .select('care_recipient_name')
    .eq('id', link.family_id)
    .maybeSingle();

  return { link, recipient: family?.care_recipient_name ?? 'them' };
}

const PAGE_CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; padding:24px 16px 64px; background:#FBF7F0; color:#22201D;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         font-size:17px; line-height:1.6; }
  .wrap { max-width:34rem; margin:0 auto; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-size:28px; line-height:1.25; margin:0 0 8px; }
  p.sub { color:#6B6560; margin:0 0 24px; }
  label { display:block; font-weight:700; margin:20px 0 6px; }
  .hint { font-weight:400; color:#6B6560; font-size:15px; }
  input[type=text], textarea {
    width:100%; padding:14px; font:inherit; color:inherit; background:#fff;
    border:1.5px solid #E8E0D4; border-radius:14px; }
  textarea { min-height:150px; resize:vertical; }
  input:focus, textarea:focus { outline:none; border-color:#15605C; border-width:2px; }
  input[type=file] { font:inherit; margin-top:6px; }
  button { width:100%; min-height:56px; margin-top:28px; font:inherit; font-weight:700;
    font-size:18px; color:#fff; background:#15605C; border:0; border-radius:14px; cursor:pointer; }
  button:disabled { opacity:.5; cursor:default; }
  .note { margin-top:20px; padding:14px; background:#F7EAD2; border-radius:14px; font-size:15px; }
  .ok { text-align:center; padding:40px 0; }
  .ok .tick { font-size:44px; }
  .err { background:#F7E2DD; color:#B3402F; padding:14px; border-radius:14px; margin-top:16px; }
`;

function formPage(token: string, recipient: string): string {
  const name = escapeHtml(recipient);
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>A memory of ${name}</title><style>${PAGE_CSS}</style></head><body><div class="wrap">
<h1>Share a memory of ${name}</h1>
<p class="sub">${name}'s family is collecting memories to look through together. Yours would be
very welcome — a sentence is plenty. You don't need an account.</p>
<form id="f">
  <label>Your name <span class="hint">so they know who it's from</span>
    <input type="text" id="who" maxlength="80" required autocomplete="name"></label>
  <label>The memory
    <textarea id="msg" maxlength="${MAX_TEXT}" required
      placeholder="The summer we drove to the coast and the car broke down outside Perth…"></textarea></label>
  <label>A photograph <span class="hint">optional</span>
    <input type="file" id="photo" accept="image/*"></label>
  <div class="note">This goes to ${name}'s family, who will read it before it's used.</div>
  <button type="submit" id="go">Send it</button>
  <div id="err"></div>
</form>
</div><script>
const f=document.getElementById('f'),go=document.getElementById('go'),err=document.getElementById('err');
f.addEventListener('submit',async e=>{
  e.preventDefault(); go.disabled=true; go.textContent='Sending…'; err.innerHTML='';
  try{
    const file=document.getElementById('photo').files[0];
    let photo=null;
    if(file){
      if(file.size>5*1024*1024){throw new Error('That photo is a bit too large — under 5MB please.');}
      photo=await new Promise((res,rej)=>{const r=new FileReader();
        r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file);});
    }
    const r=await fetch(location.pathname+location.search,{method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({token:${JSON.stringify(token)},
        who:document.getElementById('who').value,
        msg:document.getElementById('msg').value, photo})});
    if(!r.ok){const t=await r.text();throw new Error(t||'Something went wrong.');}
    document.querySelector('.wrap').innerHTML=
      '<div class="ok"><div class="tick">\\u2713</div><h1>Thank you</h1>'+
      '<p class="sub">That\\u2019s been sent to the family.</p></div>';
  }catch(ex){
    err.innerHTML='<div class="err">'+String(ex.message||ex)+'</div>';
    go.disabled=false; go.textContent='Send it';
  }
});
</script></body></html>`;
}

function messagePage(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title><style>${PAGE_CSS}</style></head><body><div class="wrap">
<h1>${escapeHtml(title)}</h1><p class="sub">${escapeHtml(body)}</p></div></body></html>`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const found = await loadLink(url.searchParams.get('token') ?? '');
    if (!found) {
      return html(
        messagePage(
          'This link is no longer active',
          'It may have expired or been turned off. Ask whoever sent it for a new one.'
        ),
        404
      );
    }
    return html(formPage(url.searchParams.get('token')!, found.recipient));
  }

  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return new Response('That was too large.', { status: 413 });

  let body: { token?: string; who?: string; msg?: string; photo?: string | null };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response('Bad request.', { status: 400 });
  }

  const found = await loadLink(body.token ?? '');
  if (!found) return new Response('This link is no longer active.', { status: 403 });

  const who = (body.who ?? '').trim().slice(0, 80);
  const msg = (body.msg ?? '').trim().slice(0, MAX_TEXT);
  if (!who || !msg) return new Response('Please fill in your name and the memory.', { status: 400 });

  let photoPath: string | null = null;
  if (body.photo) {
    try {
      const bytes = Uint8Array.from(atob(body.photo), (c) => c.charCodeAt(0));
      if (bytes.byteLength > 6 * 1024 * 1024) throw new Error('too large');
      photoPath = `${found.link.family_id}/contrib-${Date.now()}.jpg`;
      const { error } = await admin.storage
        .from('memory-photos')
        .upload(photoPath, bytes, { contentType: 'image/jpeg' });
      if (error) photoPath = null;
    } catch {
      photoPath = null;
    }
  }

  // added_by is null: the sender is not a member, and inventing one would put
  // a stranger's name on the family's roster.
  const { error: insertError } = await admin.from('memories').insert({
    family_id: found.link.family_id,
    category: 'event',
    question: `A memory from ${who}`,
    answer: msg,
    photo_path: photoPath,
    note: `Sent by ${who} through a contribution link.`,
    added_by: null,
    source: 'link',
    needs_review: true,
  });

  if (insertError) return new Response('Could not save that, sorry.', { status: 500 });

  await admin
    .from('contribution_links')
    .update({ submission_count: found.link.submission_count + 1 })
    .eq('id', found.link.id);

  return new Response('ok', { status: 200 });
});
