import { supabase } from './supabase';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)

function randomCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export async function createInviteCode(familyId: string, memberId: string): Promise<string> {
  const code = randomCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const { error } = await supabase.from('invites').insert({
    family_id: familyId,
    code,
    created_by: memberId,
    expires_at: expiresAt.toISOString(),
  });
  if (error) throw new Error(error.message);
  return code;
}
