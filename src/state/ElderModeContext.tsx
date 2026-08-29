import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Elder mode is a whole-app state, not a screen.
 *
 * Every session in this app so far needs a caregiver holding the device and
 * pressing "They remembered" — which means the app is unusable during most of
 * the hours in a day. This is the mode you hand over: photographs, their
 * family's voices, no questions, nothing to get wrong, and no tab bar to
 * wander out of into Safari.
 *
 * It replaces the navigator rather than sitting inside it, because a lock
 * that can be tapped past is not a lock.
 */
interface ElderModeValue {
  active: boolean;
  enter: () => void;
  exit: () => void;
}

const ElderModeContext = createContext<ElderModeValue | null>(null);

export function ElderModeProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);

  const enter = useCallback(() => setActive(true), []);
  const exit = useCallback(() => setActive(false), []);

  const value = useMemo(() => ({ active, enter, exit }), [active, enter, exit]);

  return <ElderModeContext.Provider value={value}>{children}</ElderModeContext.Provider>;
}

export function useElderMode(): ElderModeValue {
  const ctx = useContext(ElderModeContext);
  if (!ctx) throw new Error('useElderMode must be used within ElderModeProvider');
  return ctx;
}
