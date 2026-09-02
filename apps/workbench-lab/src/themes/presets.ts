import type {
  PresentationProfileDefinition,
  SurfaceExpressionProfile,
  ThemeTargetBundle
} from '@pomegranate-ui/contracts';
import { ThemeTargetBundleSchema } from '@pomegranate-ui/contracts';
import type { ThemeCanvasAuthoringProfile } from '@pomegranate-ui/theme';

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
  readonly canvasAuthoring: ThemeCanvasAuthoringProfile;
  readonly presentation?: PresentationProfileDefinition;
  readonly surfaceExpression?: SurfaceExpressionProfile;
}

export interface LabThemePresetInput {
  readonly id: string;
  readonly target: unknown;
  readonly canvasAuthoring?: ThemeCanvasAuthoringProfile;
  readonly presentation?: unknown;
  readonly surfaceExpression?: unknown;
}

const DEEP_CANVAS_AUTHORING = {
  defaults: { imageStrength: 100, overlayStrength: 100, gradientAngle: 90, vignetteStrength: 100 },
  layers: [
    { layer: { kind: 'solid', color: { role: 'canvas' } } },
    {
      authoringGroup: 'image',
      layer: { kind: 'image', assetId: 'image.atmospheric-reservoir', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 0.74, contrast: 1.04, brightness: 0.83, blend: 'normal' }
    },
    {
      authoringGroup: 'vignette',
      layer: { kind: 'linear-gradient', angle: 0, stops: [{ color: { role: 'canvas', alpha: 0.84 }, position: 0 }, { color: { role: 'canvas', alpha: 0 }, position: 0.36 }, { color: { role: 'canvas', alpha: 0.3 }, position: 1 }] }
    },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'linear-gradient', angle: 90, stops: [{ color: { role: 'canvas', alpha: 0.86 }, position: 0 }, { color: { role: 'surfaceInset', alpha: 0.48 }, position: 0.25 }, { color: { role: 'surface', alpha: 0.12 }, position: 0.56 }, { color: { role: 'canvas', alpha: 0.38 }, position: 1 }] }
    },
    {
      layer: {
        kind: 'grid', widthPx: 72, heightPx: 72, horizontal: '#cde7dd0f', vertical: '#cde7dd0b', lineWidthPx: 1, opacity: 0.2,
        mask: { angle: 90, stops: [{ color: '#00000000', position: 0.2 }, { color: '#000000', position: 0.72 }, { color: '#00000000', position: 1 }] }
      }
    }
  ]
} as const satisfies ThemeCanvasAuthoringProfile;

const POM_CANVAS_AUTHORING = {
  defaults: { imageStrength: 100, overlayStrength: 100, gradientAngle: 132, vignetteStrength: 100 },
  layers: [
    { layer: { kind: 'solid', color: { role: 'canvas' } } },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'radial-gradient', shape: 'ellipse', x: 0.8, y: 0.08, stops: [{ color: { role: 'text', alpha: 0 }, position: 0 }, { color: { role: 'focus', alpha: 0.72 }, position: 0.2 }, { color: { role: 'accent', alpha: 0 }, position: 0.6 }] }
    },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'linear-gradient', angle: 132, stops: [{ color: { role: 'canvas', alpha: 0 }, position: 0 }, { color: { role: 'focus', alpha: 0.25 }, position: 0.46 }, { color: { role: 'canvas', alpha: 0 }, position: 1 }] }
    },
    { authoringGroup: 'vignette', layer: { kind: 'veil', mode: 'vignette', color: { role: 'canvas' }, opacity: 0.25 } }
  ]
} as const satisfies ThemeCanvasAuthoringProfile;

const BUNNY_CANVAS_AUTHORING = {
  defaults: { imageStrength: 100, overlayStrength: 100, gradientAngle: 0, vignetteStrength: 100 },
  layers: [
    { layer: { kind: 'solid', color: { role: 'canvas' } } },
    {
      authoringGroup: 'image',
      layer: { kind: 'image', assetId: 'image.bunny-garden', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 1, blend: 'normal' }
    },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'four-corner', topLeft: { role: 'accent', alpha: 0.22 }, topRight: { role: 'selection', alpha: 0.22 }, bottomLeft: { role: 'success', alpha: 0.22 }, bottomRight: { role: 'warning', alpha: 0.22 } }
    },
    { authoringGroup: 'vignette', layer: { kind: 'veil', mode: 'reading', color: { role: 'canvas' }, opacity: 0.08 } }
  ]
} as const satisfies ThemeCanvasAuthoringProfile;

const ASH_CANVAS_AUTHORING = {
  defaults: { imageStrength: 100, overlayStrength: 100, gradientAngle: 90, vignetteStrength: 100 },
  layers: [
    { layer: { kind: 'solid', color: { role: 'canvas' } } },
    {
      authoringGroup: 'image',
      layer: { kind: 'image', assetId: 'image.ash-amber-stage', fit: 'cover', x: 0.5, y: 0.5, opacity: 0.72, blurPx: 0, saturation: 0.82, blend: 'normal' }
    },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'linear-gradient', angle: 90, stops: [{ color: { role: 'surfaceInset', alpha: 0.92 }, position: 0 }, { color: { role: 'surface', alpha: 0.56 }, position: 0.5 }, { color: { role: 'canvas', alpha: 0.88 }, position: 1 }] }
    },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'radial-gradient', shape: 'ellipse', x: 0.57, y: 0.97, stops: [{ color: { role: 'warning', alpha: 0.26 }, position: 0 }, { color: { role: 'chrome', alpha: 0.12 }, position: 0.34 }, { color: { role: 'canvas', alpha: 0 }, position: 0.68 }] }
    },
    { authoringGroup: 'vignette', layer: { kind: 'veil', mode: 'reading', color: { role: 'surface' }, opacity: 0.28 } }
  ]
} as const satisfies ThemeCanvasAuthoringProfile;

export const LAB_THEME_PRESETS: readonly LabThemePreset[] = Object.freeze([
  {
    id: 'deep-current',
    target: DEEP_ATMOSPHERIC_TARGET,
    canvasAuthoring: DEEP_CANVAS_AUTHORING,
    swatchStyle: 'background: linear-gradient(145deg, #071416 0 48%, #8fd8ce 49% 53%, #111a1c 54%);'
  },
  {
    id: 'pom-neutral',
    target: POM_NEUTRAL_TARGET,
    canvasAuthoring: POM_CANVAS_AUTHORING,
    swatchStyle: 'background: linear-gradient(145deg, #f8fafc 0 48%, #3979ec 49% 53%, #d8dde4 54%);',
    presentation: POMOS_PRESENTATION_PROFILE
  },
  {
    id: 'bunny',
    target: BUNNY_TARGET,
    canvasAuthoring: BUNNY_CANVAS_AUTHORING,
    swatchStyle: 'background: linear-gradient(145deg, #fff1f7 0 48%, #ef80b8 49% 53%, #d8cdf0 54%);',
    surfaceExpression: BUNNY_SURFACE_EXPRESSION
  },
  {
    id: 'ash-amber',
    target: ASH_AMBER_TARGET,
    canvasAuthoring: ASH_CANVAS_AUTHORING,
    swatchStyle: 'background: linear-gradient(145deg, #071416 0 48%, #8fd8ce 49% 53%, #111a1c 54%);',
    surfaceExpression: ASH_AMBER_SURFACE_EXPRESSION
  }
]);

export const LAB_THEME_TARGETS = LAB_THEME_PRESETS;

export function isLabThemeId(value: string): value is LabThemeId {
  return (LAB_THEME_IDS as readonly string[]).includes(value);
}
