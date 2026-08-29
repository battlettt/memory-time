import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { FamilySettings } from './types';

export const DEFAULT_SETTINGS: Omit<FamilySettings, 'family_id' | 'updated_at'> = {
  daily_prompt_enabled: true,
  daily_prompt_hour: 18,
  session_size_limit: 8,
  large_text: false,
  retire_after_misses: 4,
  memorial_mode: false,
  memorial_since: null,
};

/**
 * Per-family preferences.
 *
 * Falls back to defaults rather than blocking: a family created before the
 * settings table existed should still get a working app, not an empty screen.
 */
export function useFamilySettings(familyId: string | null) {
  const [settings, setSettings] = useState<FamilySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!familyId) {
      setSettings(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('family_settings')
      .select('*')
      .eq('family_id', familyId)
      .maybeSingle();

    setSettings(
      data ?? {
        family_id: familyId,
        ...DEFAULT_SETTINGS,
        updated_at: new Date().toISOString(),
      }
    );
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const update = useCallback(
    async (patch: Partial<FamilySettings>) => {
      if (!familyId) return;
      // Optimistic: these are toggles an adult is watching, and a round trip
      // makes a switch feel broken.
      setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
      const { error } = await supabase
        .from('family_settings')
        .upsert({
          family_id: familyId,
          ...DEFAULT_SETTINGS,
          ...settings,
          ...patch,
          updated_at: new Date().toISOString(),
        });
      if (error) {
        await refresh();
        throw new Error(error.message);
      }
    },
    [familyId, settings, refresh]
  );

  return { settings, loading, refresh, update };
}
