import { randomUUID } from 'expo-crypto';
import { supabase } from './supabase';

/**
 * Private links that let someone contribute without an account.
 *
 * Family coverage is what makes a reel feel like a life rather than one
 * person's view of it, and the relatives with the best stories are often the
 * least likely to install anything.
 */

export interface ContributionLink {
  id: string;
  family_id: string;
  token: string;
  label: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  submission_count: number;
  created_at: string;
}

const FUNCTIONS_BASE = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1`;

export function contributionUrl(token: string): string {
  return `${FUNCTIONS_BASE}/contribute?token=${token}`;
}

/** URL-safe and long enough that guessing is not worth anyone's time. */
function newToken(): string {
  return randomUUID().replace(/-/g, '');
}

export async function createContributionLink(
  familyId: string,
  memberId: string,
  label?: string
): Promise<ContributionLink> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  const { data, error } = await supabase
    .from('contribution_links')
    .insert({
      family_id: familyId,
      token: newToken(),
      label: label?.trim() || null,
      created_by: memberId,
      expires_at: expiresAt.toISOString(),
    })
    .select('*')
    .maybeSingle();

  if (error || !data) throw new Error(error?.message ?? 'Could not create a link');
  return data as ContributionLink;
}

export async function listContributionLinks(familyId: string): Promise<ContributionLink[]> {
  const { data } = await supabase
    .from('contribution_links')
    .select('*')
    .eq('family_id', familyId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as ContributionLink[];
}

export async function revokeContributionLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('contribution_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}
