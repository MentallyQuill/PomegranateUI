import type { ThemeTypographyRole } from '@pomegranate-ui/contracts';

export const THEME_TYPOGRAPHY_ROLE_IDS = ['ui', 'prose', 'display', 'technical'] as const;
export type ThemeTypographyRoleId = (typeof THEME_TYPOGRAPHY_ROLE_IDS)[number];

export interface BundledFontChoice {
  readonly family: string;
  readonly label: string;
  readonly fallbacks: ThemeTypographyRole['fallbacks'];
}

const geist = Object.freeze({ family: 'Pomegranate Sans', label: 'Geist', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'] });
const newsreader = Object.freeze({ family: 'Pomegranate Serif', label: 'Newsreader', fallbacks: ['ui-serif', 'serif'] });
const geistMono = Object.freeze({ family: 'Pomegranate Mono', label: 'Geist Mono', fallbacks: ['ui-monospace', 'monospace'] });
const inter = Object.freeze({ family: 'Inter', label: 'Inter', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'] });
const robotoMono = Object.freeze({ family: 'Roboto Mono', label: 'Roboto Mono', fallbacks: ['ui-monospace', 'monospace'] });
const nunito = Object.freeze({ family: 'Nunito', label: 'Nunito', fallbacks: ['ui-rounded', 'ui-sans-serif', 'sans-serif'] });
const fraunces = Object.freeze({ family: 'Fraunces', label: 'Fraunces', fallbacks: ['ui-serif', 'serif'] });
const sourceSans3 = Object.freeze({ family: 'Source Sans 3', label: 'Source Sans 3', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'] });
const alegreya = Object.freeze({ family: 'Alegreya', label: 'Alegreya', fallbacks: ['ui-serif', 'serif'] });

export const BUNDLED_FONT_CHOICES: Readonly<Record<ThemeTypographyRoleId, readonly BundledFontChoice[]>> = Object.freeze({
  ui: Object.freeze([geist, inter, nunito, sourceSans3]),
  prose: Object.freeze([newsreader, inter, fraunces, alegreya]),
  display: Object.freeze([newsreader, inter, fraunces, alegreya]),
  technical: Object.freeze([geistMono, robotoMono, nunito, sourceSans3])
});

export function bundledFontChoice(role: ThemeTypographyRoleId, family: string): BundledFontChoice | undefined {
  return BUNDLED_FONT_CHOICES[role].find((choice) => choice.family === family);
}
