import { CATALOGUES, type Locale, type TranslationKey } from './translations';

/**
 * The pure half of internationalisation: locale resolution, lookup and
 * interpolation, with no React and no storage. Kept separate from the
 * provider so it can be tested directly.
 */

/**
 * Only languages with a complete catalogue are listed, and a test enforces
 * that. Offering a language that is half English would be worse than not
 * offering it — the person choosing it is telling you they cannot read the
 * other half.
 *
 * Adding one is a data change: a new file, an entry here, and the
 * completeness test tells you what is still missing.
 */
export const LOCALES: { code: Locale; label: string; english: string }[] = [
  { code: 'en', label: 'English', english: 'English' },
  { code: 'fr', label: 'Français', english: 'French' },
  { code: 'es', label: 'Español', english: 'Spanish' },
];

/**
 * Pick a locale from whatever the device reports.
 *
 * Device tags look like "fr-CA" or "pt-BR"; only the base language is matched,
 * because a Québécois caregiver and a French one want the same strings here.
 */
export function resolveLocale(tags: readonly string[]): Locale {
  for (const tag of tags) {
    const base = tag.toLowerCase().split(/[-_]/)[0];
    const match = LOCALES.find((l) => l.code === base);
    if (match) return match.code;
  }
  return 'en';
}

/**
 * Look up a string, substituting {placeholders}.
 *
 * Falls back to English and then to the key itself rather than rendering
 * blank: a missing translation should look like an untranslated app, never
 * like a broken one.
 */
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>
): string {
  const catalogue = CATALOGUES[locale] ?? CATALOGUES.en;
  const template = catalogue[key] ?? CATALOGUES.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole
  );
}

/**
 * English pluralisation only, deliberately.
 *
 * Several languages have plural rules English does not share — Polish has
 * three forms — so anything needing a count carries its own `_one`/`_other`
 * keys per language rather than being assembled from fragments.
 */
export function plural(count: number, one: string, other: string): string {
  return count === 1 ? one : other;
}

/** Choose between a `_one` and `_other` key for a count. */
export function pluralKey<K extends string>(base: K, count: number): `${K}_one` | `${K}_other` {
  return count === 1 ? `${base}_one` : `${base}_other`;
}
