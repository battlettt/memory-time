import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { clearFamilyCache } from '../lib/cache';
import { clearSignedUrlCache } from '../lib/media';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      signInWithEmail: async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: true },
        });
        return { error: error?.message ?? null };
      },
      signOut: async () => {
        // Clear the local copy before dropping the session. This app is meant
        // for a tablet in a care home, which is a device other people sign
        // into; leaving a family's memories in local storage would be a
        // quiet breach every time somebody handed it over.
        await clearFamilyCache();
        clearSignedUrlCache();
        await supabase.auth.signOut();
      },
    }),
    [session, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
