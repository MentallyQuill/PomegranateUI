import type {
  PresentationProfileDefinition,
  SurfaceExpressionProfile,
  ThemeColorRole,
  ThemeTargetBundle
} from '@pomegranate-ui/contracts';
import { ThemeTargetBundleSchema } from '@pomegranate-ui/contracts';
import { resolveThemeCanvasAuthoringProfile, type ThemeCanvasAuthoringProfile } from '@pomegranate-ui/theme';

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

function authored(role: ThemeColorRole, roleValue: string, authoredValue: string) {
  const alpha = authoredValue.length === 9 ? Number.parseInt(authoredValue.slice(7), 16) / 255 : undefined;
  return {
    role,
    ...(alpha === undefined ? {} : { alpha }),
    baseline: { roleValue, authoredValue: authoredValue.slice(0, 7) }
  };
}

const DEEP_CANVAS_AUTHORING = {
  defaults: { imageStrength: 100, overlayStrength: 100, gradientAngle: 90, vignetteStrength: 100 },
  layers: [
    { layer: { kind: 'solid', color: authored('canvas', DEEP_ATMOSPHERIC_TARGET.theme.colors.canvas, '#080c0d') } },
    {
      authoringGroup: 'image',
      layer: { kind: 'image', assetId: 'image.atmospheric-reservoir', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 0.74, contrast: 1.04, brightness: 0.83, blend: 'normal' }
    },
    {
      authoringGroup: 'vignette',
      layer: { kind: 'linear-gradient', angle: 0, stops: [{ color: authored('canvas', DEEP_ATMOSPHERIC_TARGET.theme.colors.canvas, '#030607d6'), position: 0 }, { color: authored('canvas', DEEP_ATMOSPHERIC_TARGET.theme.colors.canvas, '#03060700'), position: 0.36 }, { color: authored('canvas', DEEP_ATMOSPHERIC_TARGET.theme.colors.canvas, '#0204054d'), position: 1 }] }
    },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'linear-gradient', angle: 90, stops: [{ color: authored('canvas', DEEP_ATMOSPHERIC_TARGET.theme.colors.canvas, '#030607db'), position: 0 }, { color: authored('surfaceInset', DEEP_ATMOSPHERIC_TARGET.theme.colors.surfaceInset, '#0306077a'), position: 0.25 }, { color: authored('surface', DEEP_ATMOSPHERIC_TARGET.theme.colors.surface, '#0407081f'), position: 0.56 }, { color: authored('canvas', DEEP_ATMOSPHERIC_TARGET.theme.colors.canvas, '#03060761'), position: 1 }] }
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
    { layer: { kind: 'solid', color: authored('canvas', POM_NEUTRAL_TARGET.theme.colors.canvas, '#075bb8') } },
    {
      authoringGroup: 'image',
      layer: { kind: 'image', assetId: 'image.pomos-tahoe', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 0.98, contrast: 1.04, brightness: 0.96, blend: 'normal' }
    },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'linear-gradient', angle: 132, stops: [{ color: authored('canvas', POM_NEUTRAL_TARGET.theme.colors.canvas, '#02265c38'), position: 0 }, { color: authored('focus', POM_NEUTRAL_TARGET.theme.colors.focus, '#8ff4ff12'), position: 0.42 }, { color: authored('text', POM_NEUTRAL_TARGET.theme.colors.text, '#e9feff0a'), position: 0.58 }, { color: authored('canvas', POM_NEUTRAL_TARGET.theme.colors.canvas, '#033b7d20'), position: 1 }] }
    },
    { authoringGroup: 'vignette', layer: { kind: 'veil', mode: 'vignette', color: authored('canvas', POM_NEUTRAL_TARGET.theme.colors.canvas, '#031d52'), opacity: 0.2 } }
  ]
} as const satisfies ThemeCanvasAuthoringProfile;

const BUNNY_CANVAS_AUTHORING = {
  defaults: { imageStrength: 100, overlayStrength: 100, gradientAngle: 0, vignetteStrength: 100 },
  layers: [
    { layer: { kind: 'solid', color: authored('canvas', BUNNY_TARGET.theme.colors.canvas, '#faeef6') } },
    {
      authoringGroup: 'image',
      layer: { kind: 'image', assetId: 'image.bunny-garden', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 1, blend: 'normal' }
    },
    {
      authoringGroup: 'overlay',
      layer: { kind: 'four-corner', topLeft: authored('accent', BUNNY_TARGET.theme.colors.accent, '#ffd8e838'), topRight: authored('selection', BUNNY_TARGET.theme.colors.selection, '#e4dcff38'), bottomLeft: authored('success', BUNNY_TARGET.theme.colors.success, '#d5f3e938'), bottomRight: authored('warning', BUNNY_TARGET.theme.colors.warning, '#fff0bd38') }
    },
    { authoringGroup: 'vignette', layer: { kind: 'veil', mode: 'reading', color: authored('canvas', BUNNY_TARGET.theme.colors.canvas, '#faeef6'), opacity: 0.08 } }
  ]
} as const satisfies ThemeCanvasAuthoringProfile;

const ASH_CANVAS_AUTHORING = {
  defaults: { imageStrength: 100, overlayStrength: 90, gradientAngle: 90, vignetteStrength: 40 },
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

function targetWithAuthoredCanvas(target: ThemeTargetBundle, profile: ThemeCanvasAuthoringProfile): ThemeTargetBundle {
  const resolved = resolveThemeCanvasAuthoringProfile(target.theme.colors, profile, profile.defaults);
  if (!resolved.ok) throw new Error(`Canvas authoring profile for '${target.id}' is invalid: ${JSON.stringify(resolved.diagnostics)}`);
  return ThemeTargetBundleSchema.parse({
    ...target,
    canvas: { ...target.canvas, layers: resolved.layers }
  });
}

export const LAB_THEME_PRESETS: readonly LabThemePreset[] = Object.freeze([
  {
    id: 'deep-current',
    target: targetWithAuthoredCanvas(DEEP_ATMOSPHERIC_TARGET, DEEP_CANVAS_AUTHORING),
    canvasAuthoring: DEEP_CANVAS_AUTHORING
  },
  {
    id: 'pom-neutral',
    target: targetWithAuthoredCanvas(POM_NEUTRAL_TARGET, POM_CANVAS_AUTHORING),
    canvasAuthoring: POM_CANVAS_AUTHORING,
    presentation: POMOS_PRESENTATION_PROFILE
  },
  {
    id: 'bunny',
    target: targetWithAuthoredCanvas(BUNNY_TARGET, BUNNY_CANVAS_AUTHORING),
    canvasAuthoring: BUNNY_CANVAS_AUTHORING,
    surfaceExpression: BUNNY_SURFACE_EXPRESSION
  },
  {
    id: 'ash-amber',
    target: targetWithAuthoredCanvas(ASH_AMBER_TARGET, ASH_CANVAS_AUTHORING),
    canvasAuthoring: ASH_CANVAS_AUTHORING,
    surfaceExpression: ASH_AMBER_SURFACE_EXPRESSION
  }
]);

export const LAB_THEME_TARGETS = LAB_THEME_PRESETS;

export function isLabThemeId(value: string): value is LabThemeId {
  return (LAB_THEME_IDS as readonly string[]).includes(value);
}
