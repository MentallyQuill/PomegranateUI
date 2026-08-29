import type { ThemeDefinitionV2, ThemeTargetBundle } from '@pomegranate-ui/contracts';

import { ASH_AMBER_TARGET, ASH_AMBER_THEME } from './ash-amber.js';
import { BUNNY_TARGET, BUNNY_THEME } from './bunny.js';
import { DEEP_CURRENT_TARGET, DEEP_CURRENT_THEME } from './deep-current.js';
import { POM_NEUTRAL_TARGET, POM_NEUTRAL_THEME } from './pom-neutral.js';

export const LAB_THEME_IDS = ['deep-current', 'pom-neutral', 'bunny', 'ash-amber'] as const;
export type LabThemeId = (typeof LAB_THEME_IDS)[number];

export interface LabThemePreset {
  readonly id: LabThemeId;
  readonly definition: ThemeDefinitionV2;
}

export interface LabThemePresetInput {
  readonly id: string;
  readonly definition: unknown;
}

export interface LabThemeTarget {
  readonly id: LabThemeId;
  readonly target: ThemeTargetBundle;
}

export const LAB_THEME_PRESETS: readonly LabThemePreset[] = Object.freeze([
  { id: 'deep-current', definition: DEEP_CURRENT_THEME },
  { id: 'pom-neutral', definition: POM_NEUTRAL_THEME },
  { id: 'bunny', definition: BUNNY_THEME },
  { id: 'ash-amber', definition: ASH_AMBER_THEME }
]);

export const LAB_THEME_TARGETS: readonly LabThemeTarget[] = Object.freeze([
  { id: 'deep-current', target: DEEP_CURRENT_TARGET },
  { id: 'pom-neutral', target: POM_NEUTRAL_TARGET },
  { id: 'bunny', target: BUNNY_TARGET },
  { id: 'ash-amber', target: ASH_AMBER_TARGET }
]);

export function isLabThemeId(value: string): value is LabThemeId {
  return (LAB_THEME_IDS as readonly string[]).includes(value);
}
