import type { ThemeTargetBundle } from '@pomegranate-ui/contracts';

import { ASH_AMBER_TARGET } from './ash-amber.js';
import { BUNNY_TARGET } from './bunny.js';
import { DEEP_CURRENT_TARGET } from './deep-current.js';
import { POM_NEUTRAL_TARGET } from './pom-neutral.js';

export const LAB_THEME_IDS = ['deep-current', 'pom-neutral', 'bunny', 'ash-amber'] as const;
export type LabThemeId = (typeof LAB_THEME_IDS)[number];

export interface LabThemePreset {
  readonly id: LabThemeId;
  readonly target: ThemeTargetBundle;
}

export interface LabThemePresetInput {
  readonly id: string;
  readonly target: unknown;
}

export const LAB_THEME_PRESETS: readonly LabThemePreset[] = Object.freeze([
  { id: 'deep-current', target: DEEP_CURRENT_TARGET },
  { id: 'pom-neutral', target: POM_NEUTRAL_TARGET },
  { id: 'bunny', target: BUNNY_TARGET },
  { id: 'ash-amber', target: ASH_AMBER_TARGET }
]);

export const LAB_THEME_TARGETS = LAB_THEME_PRESETS;

export function isLabThemeId(value: string): value is LabThemeId {
  return (LAB_THEME_IDS as readonly string[]).includes(value);
}
