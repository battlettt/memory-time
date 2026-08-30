import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Localization from 'expo-localization';
import { readCache, writeCache } from './cache';
import { LOCALES, pluralKey, resolveLocale, translate } from './i18nCore';
import type { Locale, TranslationKey } from './translations';

export { LOCALES, resolveLocale, translate, pluralKey };
export type { Locale, TranslationKey };

const CACHE_KEY = 'locale';

interface I18nValue {
  locale: Locale;
  /** null means "follow the device". */
  override: Locale | null;
  setLocale: (locale: Locale | null) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  /** Picks the `_one`/`_other` variant, then interpolates. */
  tCount: (base: string, count: number, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const deviceLocale = useMemo(
    () => resolveLocale(Localization.getLocales().map((l) => l.languageTag)),
    []
  );
  const [override, setOverrideState] = useState<Locale | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readCache<Locale | null>(CACHE_KEY)
      .then((saved) => {
        if (saved) setOverrideState(saved);
      })
      .finally(() => setReady(true));
  }, []);

  const locale = override ?? deviceLocale;

  const setLocale = useCallback((next: Locale | null) => {
    setOverrideState(next);
    writeCache(CACHE_KEY, next);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale]
  );

  const tCount = useCallback(
    (base: string, count: number, vars?: Record<string, string | number>) =>
      translate(locale, pluralKey(base, count) as TranslationKey, { count, ...vars }),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, override, setLocale, t, tCount }),
    [locale, override, setLocale, t, tCount]
  );

  // Rendering English for a frame and then switching would be worse than a
  // brief blank, so hold until the saved choice is known.
  if (!ready) return null;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** Convenience for the common case. */
export function useT() {
  return useI18n().t;
}
