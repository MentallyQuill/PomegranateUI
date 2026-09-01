import type {
  PresentationProfileDefinition,
  SurfaceExpressionProfile,
  ThemeTargetBundle
} from '@pomegranate-ui/contracts';
import { ThemeTargetBundleSchema } from '@pomegranate-ui/contracts';

import { ASH_AMBER_TARGET } from './ash-amber.js';
import { ASH_AMBER_SURFACE_EXPRESSION } from './ash-amber-expression.js';
import { BUNNY_TARGET } from './bunny.js';
import { BUNNY_SURFACE_EXPRESSION } from './bunny-expression.js';
import { DEEP_CURRENT_TARGET } from './deep-current.js';
import { POM_NEUTRAL_TARGET } from './pom-neutral.js';
import { POMOS_PRESENTATION_PROFILE } from './pomos-presentation.js';

const DEEP_ATMOSPHERIC_TARGET = ThemeTargetBundleSchema.parse({
  ...DEEP_CURRENT_TARGET,
  theme: {
    ...DEEP_CURRENT_TARGET.theme,
    assets: [
      ...DEEP_CURRENT_TARGET.theme.assets,
      { id: 'image.atmospheric-reservoir', kind: 'image', required: true }
    ]
  },
  canvas: {
    ...DEEP_CURRENT_TARGET.canvas,
    layers: [
      DEEP_CURRENT_TARGET.canvas.layers[0],
      {
        kind: 'image',
        assetId: 'image.atmospheric-reservoir',
        fit: 'cover',
        x: 0.5,
        y: 0.5,
        opacity: 1,
        blurPx: 0,
        saturation: 0.74,
        contrast: 1.04,
        brightness: 0.83,
        blend: 'normal'
      },
      ...DEEP_CURRENT_TARGET.canvas.layers.slice(1)
    ]
  }
});

export const LAB_THEME_IDS = ['deep-current', 'pom-neutral', 'bunny', 'ash-amber'] as const;
export type LabThemeId = (typeof LAB_THEME_IDS)[number];

export interface LabThemePreset {
  readonly id: LabThemeId;
  readonly target: ThemeTargetBundle;
  readonly swatchStyle: string;
  readonly presentation?: PresentationProfileDefinition;
  readonly surfaceExpression?: SurfaceExpressionProfile;
}

export interface LabThemePresetInput {
  readonly id: string;
  readonly target: unknown;
  readonly presentation?: unknown;
  readonly surfaceExpression?: unknown;
}

export const LAB_THEME_PRESETS: readonly LabThemePreset[] = Object.freeze([
  {
    id: 'deep-current',
    target: DEEP_ATMOSPHERIC_TARGET,
    swatchStyle: 'background: linear-gradient(145deg, #071416 0 48%, #8fd8ce 49% 53%, #111a1c 54%);'
  },
  {
    id: 'pom-neutral',
    target: POM_NEUTRAL_TARGET,
    swatchStyle: 'background: linear-gradient(145deg, #f8fafc 0 48%, #3979ec 49% 53%, #d8dde4 54%);',
    presentation: POMOS_PRESENTATION_PROFILE
  },
  {
    id: 'bunny',
    target: BUNNY_TARGET,
    swatchStyle: 'background: linear-gradient(145deg, #fff1f7 0 48%, #ef80b8 49% 53%, #d8cdf0 54%);',
    surfaceExpression: BUNNY_SURFACE_EXPRESSION
  },
  {
    id: 'ash-amber',
    target: ASH_AMBER_TARGET,
    swatchStyle: 'background: linear-gradient(145deg, #071416 0 48%, #8fd8ce 49% 53%, #111a1c 54%);',
    surfaceExpression: ASH_AMBER_SURFACE_EXPRESSION
  }
]);

export const LAB_THEME_TARGETS = LAB_THEME_PRESETS;

export function isLabThemeId(value: string): value is LabThemeId {
  return (LAB_THEME_IDS as readonly string[]).includes(value);
}
