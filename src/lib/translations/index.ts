import { en, type TranslationKey } from './en';
import { fr } from './fr';
import { es } from './es';

export type { TranslationKey };
export type Locale = 'en' | 'fr' | 'es';

/**
 * Catalogues other than English are typed as partial on purpose.
 *
 * A half-translated language should show English for the strings it is
 * missing, not a blank or a raw key — an untranslated app is usable, a broken
 * one is not. Completeness for the languages we actually list in the picker
 * is enforced by a test instead, so the gap is caught in CI rather than by
 * somebody's grandmother.
 */
export type Catalogue = Partial<Record<TranslationKey, string>>;

export const CATALOGUES: Record<Locale, Catalogue> & { en: typeof en } = {
  en,
  fr,
  es,
};
