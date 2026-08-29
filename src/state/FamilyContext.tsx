import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { randomUUID } from 'expo-crypto';
import { supabase } from '../lib/supabase';
import type { Family, Member } from '../lib/types';
import { useAuth } from './AuthContext';

interface FamilyMembership {
  family: Family;
  member: Member;
}

interface FamilyContextValue {
  memberships: FamilyMembership[];
  current: FamilyMembership | null;
  loading: boolean;
  setCurrentFamilyId: (familyId: string) => void;
  refresh: () => Promise<void>;
  createFamily: (name: string, careRecipientName: string, displayName: string) => Promise<void>;
  joinFamilyWithCode: (code: string, displayName: string) => Promise<{ error: string | null }>;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [memberships, setMemberships] = useState<FamilyMembership[]>([]);
  const [currentFamilyId, setCurrentFamilyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!session) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: memberRows } = await supabase
      .from('members')
      .select('*, families(*)')
      .eq('user_id', session.user.id);

    const loaded: FamilyMembership[] = (memberRows ?? [])
      .filter((row: any) => row.families)
      .map((row: any) => ({
        member: {
          id: row.id,
          family_id: row.family_id,
          user_id: row.user_id,
          role: row.role,
          display_name: row.display_name,
          created_at: row.created_at,
        },
        family: row.families,
      }));

    setMemberships(loaded);
    setCurrentFamilyId((prev) => prev ?? loaded[0]?.family.id ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createFamily = useCallback(
    async (name: string, careRecipientName: string, displayName: string) => {
      if (!session) throw new Error('Must be signed in');

      // Generated client-side so we never need to read the family row back
      // before the member row exists: the families SELECT policy requires
      // membership, which doesn't exist until the second insert below.
      const familyId = randomUUID();

      const { error: familyError } = await supabase
        .from('families')
        .insert({ id: familyId, name, care_recipient_name: careRecipientName });
      if (familyError) throw new Error(familyError.message);

      const { error: memberError } = await supabase.from('members').insert({
        family_id: familyId,
        user_id: session.user.id,
        role: 'elder',
        display_name: displayName,
      });
      if (memberError) throw new Error(memberError.message);

      await refresh();
      setCurrentFamilyId(familyId);
    },
    [session, refresh]
  );

  const joinFamilyWithCode = useCallback(
    async (code: string, displayName: string) => {
      if (!session) return { error: 'Must be signed in' };

      const { data: invite, error: inviteError } = await supabase
        .from('invites')
        .select('family_id, expires_at')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();

      if (inviteError || !invite) return { error: 'Invite code not found' };
      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        return { error: 'This invite code has expired' };
      }

      const { error: memberError } = await supabase.from('members').insert({
        family_id: invite.family_id,
        user_id: session.user.id,
        role: 'contributor',
        display_name: displayName,
      });
      if (memberError) return { error: memberError.message };

      await refresh();
      setCurrentFamilyId(invite.family_id);
      return { error: null };
    },
    [session, refresh]
  );

  const current = useMemo(
    () => memberships.find((m) => m.family.id === currentFamilyId) ?? null,
    [memberships, currentFamilyId]
  );

  const value: FamilyContextValue = {
    memberships,
    current,
    loading,
    setCurrentFamilyId,
    refresh,
    createFamily,
    joinFamilyWithCode,
  };

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily(): FamilyContextValue {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
