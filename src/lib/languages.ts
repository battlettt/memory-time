/**
 * Heritage languages.
 *
 * People with dementia frequently lose a language learned later in life and
 * revert to their first one. A daughter's voice saying a name in Cantonese or
 * Punjabi can land when the same sentence in English no longer does, and the
 * family usually already speaks it — they just have nowhere to put it.
 *
 * Codes are BCP-47 so they can be handed straight to speech recognition.
 * The list is a starting set, not a claim about who uses this app; anything
 * missing can be typed into the memory itself in the meantime.
 */

export interface LanguageOption {
  code: string;
  label: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en-GB', label: 'English' },
  { code: 'pa-IN', label: 'Punjabi' },
  { code: 'yue-Hant-HK', label: 'Cantonese' },
  { code: 'cmn-Hans-CN', label: 'Mandarin' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'pt-PT', label: 'Portuguese' },
  { code: 'pl-PL', label: 'Polish' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'ur-PK', label: 'Urdu' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'el-GR', label: 'Greek' },
  { code: 'uk-UA', label: 'Ukrainian' },
  { code: 'tl-PH', label: 'Tagalog' },
  { code: 'vi-VN', label: 'Vietnamese' },
];

export function languageLabel(code: string | null): string | null {
  if (!code) return null;
  return LANGUAGES.find((l) => l.code === code)?.label ?? code;
}
