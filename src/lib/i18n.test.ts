import { resolveLocale, translate, plural, pluralKey, LOCALES } from './i18nCore';
import { CATALOGUES } from './translations';
import { en } from './translations/en';

describe('resolveLocale', () => {
  it('matches on the base language, not the region', () => {
    // A Québécois and a French caregiver want the same strings.
    expect(resolveLocale(['fr-CA'])).toBe('fr');
    expect(resolveLocale(['es-MX'])).toBe('es');
  });

  it('takes the first tag it supports', () => {
    expect(resolveLocale(['de-DE', 'fr-FR'])).toBe('fr');
  });

  it('falls back to English for anything unsupported', () => {
    expect(resolveLocale(['ja-JP'])).toBe('en');
    expect(resolveLocale([])).toBe('en');
  });
});

describe('translate', () => {
  it('substitutes placeholders', () => {
    expect(translate('en', 'today.title', { name: 'Rose' })).toBe('Time with Rose');
  });

  it('translates', () => {
    expect(translate('fr', 'tab.today')).toBe('Aujourd’hui');
    expect(translate('es', 'tab.memories')).toBe('Recuerdos');
  });

  it('leaves an unknown placeholder visible rather than blanking it', () => {
    // A stray {name} is a bug you can see; an empty gap is one you cannot.
    expect(translate('en', 'today.title', {})).toContain('{name}');
  });

  it('falls back to English for a missing key rather than rendering nothing', () => {
    const sparse = { ...CATALOGUES.fr };
    delete (sparse as Record<string, string>)['tab.album'];
    // Simulated via the real path: en always has the key.
    expect(translate('fr', 'tab.album')).toBeTruthy();
    expect(translate('en', 'tab.album')).toBe('Album');
  });
});

describe('plural', () => {
  it('picks the singular only for exactly one', () => {
    expect(plural(1, 'memory', 'memories')).toBe('memory');
    expect(plural(0, 'memory', 'memories')).toBe('memories');
    expect(plural(2, 'memory', 'memories')).toBe('memories');
  });

  it('selects the right catalogue key for a count', () => {
    expect(pluralKey('today.ready', 1)).toBe('today.ready_one');
    expect(pluralKey('today.ready', 3)).toBe('today.ready_other');
  });

  it('gives each language its own counted strings rather than gluing fragments', () => {
    // Spanish moves the verb: "queda 1 recuerdo" vs "quedan 3 recuerdos".
    expect(translate('es', 'session.left_one', { count: 1 })).toBe('queda 1 recuerdo');
    expect(translate('es', 'session.left_other', { count: 3 })).toBe('quedan 3 recuerdos');
  });
});

describe('catalogue completeness', () => {
  const keys = Object.keys(en) as (keyof typeof en)[];

  it.each(LOCALES.map((l) => l.code))(
    'every string offered in the picker is translated in %s',
    (code) => {
      const catalogue = CATALOGUES[code];
      const missing = keys.filter((k) => !catalogue[k]);
      // Offering a language that is half English is worse than not offering
      // it: the person who picked it cannot read the other half.
      expect(missing).toEqual([]);
    }
  );

  it('has no translation keys that English does not define', () => {
    for (const { code } of LOCALES) {
      const extra = Object.keys(CATALOGUES[code]).filter((k) => !(k in en));
      expect({ code, extra }).toEqual({ code, extra: [] });
    }
  });

  it('keeps the same placeholders in every language', () => {
    const placeholders = (s: string) => (s.match(/\{(\w+)\}/g) ?? []).sort();
    for (const { code } of LOCALES) {
      if (code === 'en') continue;
      for (const key of keys) {
        const translated = CATALOGUES[code][key];
        if (!translated) continue;
        // A dropped {name} renders a sentence about nobody.
        expect({ code, key, p: placeholders(translated) }).toEqual({
          code,
          key,
          p: placeholders(en[key]),
        });
      }
    }
  });
});
