// Design tokens.
//
// Two ideas drive this system:
//
// 1. This is a family artifact, not a clinical tool. The ground is warm paper
//    rather than cool gray, the display face is a serif, and photographs are
//    given room — the app should feel closer to an album on a side table than
//    to a dashboard.
//
// 2. A primary user is an older adult with possible vision and motor
//    impairment. Body text stays large, tap targets stay generous, and every
//    text/background pair below clears WCAG AA (4.5:1) — the warmth is never
//    bought with contrast.

export const fonts = {
  // Body: Atkinson Hyperlegible, drawn specifically so low-vision readers can
  // tell similar letterforms apart.
  regular: 'AtkinsonHyperlegible_400Regular',
  bold: 'AtkinsonHyperlegible_700Bold',
  // Display: Lora. A warm, book-like serif — this is where the album feeling
  // comes from. Used only at large sizes, where a serif costs nothing in
  // legibility and adds a great deal of character.
  display: 'Lora_600SemiBold',
  displayBold: 'Lora_700Bold',
};

export const colors = {
  // Warm paper ground.
  background: '#FBF7F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EDE3',
  surfaceSunken: '#EFE8DC',

  // Deep teal: calm and warm-leaning where a corporate blue would feel cold.
  // 7.5:1 against white.
  primary: '#15605C',
  primaryPressed: '#0F4A47',
  primarySoft: '#DCEBE9',
  onPrimary: '#FFFFFF',

  // Amber carries human warmth — attribution, AI suggestions, highlights.
  // Reserved for icons, fills and large numerals (3.7:1 on cream), never body text.
  accent: '#B0740F',
  accentStrong: '#96620B',
  accentSoft: '#F7EAD2',
  onAccent: '#FFFFFF',

  success: '#2F7A4F',
  successSoft: '#DFF0E4',
  onSuccess: '#FFFFFF',

  // A terracotta-leaning red: unmistakably an error without being alarming
  // in a product people use at emotionally tender moments.
  destructive: '#B3402F',
  destructiveSoft: '#F7E2DD',
  onDestructive: '#FFFFFF',

  // Warm near-black rather than blue-black, so text sits on cream naturally.
  text: '#22201D',
  subtext: '#6B6560',
  border: '#E8E0D4',
  borderStrong: '#D6C9B6',

  // Aliases kept so older screens keep compiling.
  primaryText: '#FFFFFF',
  error: '#B3402F',
  onSurfaceMuted: '#4A453F',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

// Shadows are tinted warm brown rather than slate; a cool shadow on a cream
// ground reads as dirt.
export const shadows = {
  sm: {
    shadowColor: '#3A2E1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#3A2E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3A2E1E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 9,
  },
};

export const typography = {
  // Serif, for screen titles and the moments that carry feeling.
  display: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 40, color: colors.text },
  title: { fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 34, color: colors.text },
  serifLarge: { fontFamily: fonts.display, fontSize: 24, lineHeight: 33, color: colors.text },

  // Sans, for everything that has to be read quickly or at length.
  heading: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 27, color: colors.text },
  subheading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, color: colors.text },
  // bodyLarge is for elder-facing surfaces (session answers, album captions).
  bodyLarge: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 30, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 26, color: colors.text },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 26, color: colors.text },
  subtext: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.subtext },
  label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20, color: colors.subtext, letterSpacing: 0.4 },
  button: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 24 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.subtext },
};

export const minTapTarget = 56;
export const iconSize = { sm: 18, md: 22, lg: 28, xl: 36 };
