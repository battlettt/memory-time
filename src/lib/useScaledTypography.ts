import { useMemo } from 'react';
import { useFamily } from '../state/FamilyContext';
import { useFamilySettings } from './useFamilySettings';
import { scaleTypography, type Typography } from './theme';

/** How much larger "large text" is. Enough to matter, not enough to reflow badly. */
export const LARGE_TEXT_SCALE = 1.25;

/**
 * Type scaled for the reader.
 *
 * Deliberately applied to elder-facing surfaces only — sessions, the album,
 * elder mode. Those are the screens a person with age-related vision loss
 * actually reads; the contributor screens are used by adult children on their
 * own phones and enlarging those just costs layout.
 */
export function useScaledTypography(extraScale = 1): Typography {
  const { current } = useFamily();
  const { settings } = useFamilySettings();
  const scale = (settings?.large_text ? LARGE_TEXT_SCALE : 1) * extraScale;
  return useMemo(() => scaleTypography(scale), [scale]);
}
