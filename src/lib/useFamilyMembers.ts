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

  const nameFor = (memberId: string) =>
    members.find((m) => m.id === memberId)?.display_name ?? 'A family member';

  return { members, nameFor };
}
