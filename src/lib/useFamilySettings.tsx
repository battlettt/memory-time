import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { supabase } from './supabase';
import { useFamily } from '../state/FamilyContext';
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

interface SettingsValue {
  settings: FamilySettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
  update: (patch: Partial<FamilySettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsValue | null>(null);

/**
 * Settings are shared state, not a per-screen fetch.
 *
 * They used to be fetched independently by each screen, which meant turning
 * something on in Settings left every other screen holding a stale copy until
 * it remounted. For most preferences that is a papercut. For memorial mode it
 * is the whole point failing: a family marks that someone has died and the
 * home screen carries on saying "Start a session".
 *
 * A realtime subscription is included so a change made on one relative's
 * phone reaches the others.
 */
export function FamilySettingsProvider({ children }: { children: React.ReactNode }) {
  const { current } = useFamily();
  const familyId = current?.family.id ?? null;
  const [settings, setSettings] = useState<FamilySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const instanceId = useId();

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

    // Fall back to defaults rather than blocking: a family created before this
    // table existed should still get a working app, not an empty screen.
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
    if (!familyId) return;

    const channel = supabase
      .channel(`family_settings:${familyId}:${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'family_settings',
          filter: `family_id=eq.${familyId}`,
        },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, refresh]);

  const update = useCallback(
    async (patch: Partial<FamilySettings>) => {
      if (!familyId) return;
      const next = {
        family_id: familyId,
        ...DEFAULT_SETTINGS,
        ...settings,
        ...patch,
        updated_at: new Date().toISOString(),
      } as FamilySettings;

      // Optimistic: these are switches an adult is watching, and a round trip
      // makes a toggle feel broken.
      setSettings(next);

      const { error } = await supabase.from('family_settings').upsert(next);
      if (error) {
        await refresh();
        throw new Error(error.message);
      }
    },
    [familyId, settings, refresh]
  );

  const value = useMemo(
    () => ({ settings, loading, refresh, update }),
    [settings, loading, refresh, update]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useFamilySettings(): SettingsValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useFamilySettings must be used within FamilySettingsProvider');
  return ctx;
}
