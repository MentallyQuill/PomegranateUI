import type { ThemeDefinition } from '@pomegranate-ui/contracts';

import { BUNNY_THEME } from './bunny.js';
import { DEEP_CURRENT_THEME } from './deep-current.js';
import { POM_NEUTRAL_THEME } from './pom-neutral.js';

export const LAB_THEME_IDS = ['deep-current', 'pom-neutral', 'bunny'] as const;
export type LabThemeId = (typeof LAB_THEME_IDS)[number];

export interface LabThemePreset {
  readonly id: LabThemeId;
  readonly definition: ThemeDefinition;
}

export interface LabThemePresetInput {
  readonly id: string;
  readonly definition: unknown;
}

export const LAB_THEME_PRESETS: readonly LabThemePreset[] = Object.freeze([
  { id: 'deep-current', definition: DEEP_CURRENT_THEME },
  { id: 'pom-neutral', definition: POM_NEUTRAL_THEME },
  { id: 'bunny', definition: BUNNY_THEME }
]);

export function isLabThemeId(value: string): value is LabThemeId {
  return (LAB_THEME_IDS as readonly string[]).includes(value);
}
