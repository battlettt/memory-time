import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Member } from './types';

export function useFamilyMembers(familyId: string | null) {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!familyId) {
      setMembers([]);
      return;
    }
    supabase
      .from('members')
      .select('*')
      .eq('family_id', familyId)
      .then(({ data }) => setMembers(data ?? []));
  }, [familyId]);

  // added_by is nullable now that removing a member nulls it rather than
  // failing, so a memory can genuinely outlive the person who contributed it.
  const nameFor = (memberId: string | null) =>
    (memberId ? members.find((m) => m.id === memberId)?.display_name : null) ?? 'A family member';

  return { members, nameFor };
}
