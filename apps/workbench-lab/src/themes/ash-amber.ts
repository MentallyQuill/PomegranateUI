import { THEME_COLOR_ROLES, type ThemeDefinitionV2 } from '@pomegranate-ui/contracts';
import {
  resolveSemanticCanvasLayers,
  validateThemePalette,
  type SemanticCanvasLayer,
  type ThemePaletteRoleGroupConstraint
} from '@pomegranate-ui/theme';

import { material, shapePalette, themeRecipes, themeTarget } from './base.js';

const ASH_AMBER_COLORS = {
  canvas: '#242321', surface: '#302E2A', surfaceElevated: '#413D36', surfaceInset: '#191918', chrome: '#625B52',
  text: '#F3F0EA', textMuted: '#D0C9BE', textFaint: '#A79E91', textOnAccent: '#211C14', accent: '#C18A3D',
  selection: '#51493E', focus: '#E0B568', success: '#8FA68A', warning: '#D2B57A', danger: '#C9836F',
  border: '#514B43', borderStrong: '#80756A', shadow: '#0D0D0C'
} as const satisfies ThemeDefinitionV2['colors'];

export const ASH_AMBER_PALETTE_CONSTRAINTS = [
  {
    id: 'ash-neutral-chrome',
    roles: ['canvas', 'surface', 'surfaceElevated', 'surfaceInset', 'chrome', 'border', 'borderStrong', 'shadow'],
    maximumSaturation: 0.2
  },
  {
    id: 'ash-no-purple-magenta',
    roles: THEME_COLOR_ROLES,
    hueExclusions: [{ fromDeg: 270, toDeg: 350, minimumSaturation: 0.06 }]
  },
  {
    id: 'ash-restrained-accents',
    roles: ['accent', 'selection', 'focus', 'warning'],
    maximumSaturation: 0.7
  }
] as const satisfies readonly ThemePaletteRoleGroupConstraint[];

const ASH_AMBER_CANVAS_RECIPE = [
  { kind: 'solid', color: { role: 'canvas' } },
  { kind: 'image', assetId: 'image.ash-amber-stage', fit: 'cover', x: 0.5, y: 0.5, opacity: 0.72, blurPx: 0, saturation: 0.82, blend: 'normal' },
  {
    kind: 'linear-gradient',
    angle: 90,
    stops: [
      { color: { role: 'surfaceInset', alpha: 0.92 }, position: 0 },
      { color: { role: 'surface', alpha: 0.56 }, position: 0.5 },
      { color: { role: 'canvas', alpha: 0.88 }, position: 1 }
    ]
  },
  {
    kind: 'radial-gradient',
    shape: 'ellipse',
    x: 0.57,
    y: 0.97,
    stops: [
      { color: { role: 'warning', alpha: 0.26 }, position: 0 },
      { color: { role: 'chrome', alpha: 0.12 }, position: 0.34 },
      { color: { role: 'canvas', alpha: 0 }, position: 0.68 }
    ]
  },
  { kind: 'veil', mode: 'reading', color: { role: 'surface' }, opacity: 0.28 }
] as const satisfies readonly SemanticCanvasLayer[];

const paletteValidation = validateThemePalette(ASH_AMBER_COLORS, ASH_AMBER_PALETTE_CONSTRAINTS);
if (!paletteValidation.ok) {
  throw new Error(`Ash & Amber palette constraints failed: ${JSON.stringify(paletteValidation.diagnostics)}`);
}
const canvasResolution = resolveSemanticCanvasLayers(ASH_AMBER_COLORS, ASH_AMBER_CANVAS_RECIPE);
if (!canvasResolution.ok) {
  throw new Error(`Ash & Amber semantic canvas failed: ${JSON.stringify(canvasResolution.diagnostics)}`);
}

export const ASH_AMBER_THEME: ThemeDefinitionV2 = {
  schemaVersion: 'pomegranate.ui.theme.v2',
  id: 'ash-amber',
  label: 'Ash & Amber',
  description: 'Neutral graphite atmospheric glass with warm ash-brown title bars, restrained amber signal light, and compact workbench geometry.',
  colors: ASH_AMBER_COLORS,
  typography: {
    ui: { family: 'Source Sans 3', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 450, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Alegreya', fallbacks: ['ui-serif', 'serif'], weight: 400, strongWeight: 600, lineHeight: 1.58, trackingEm: 0 },
    technical: { family: 'Source Sans 3', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.035 },
    display: { family: 'Alegreya', fallbacks: ['ui-serif', 'serif'], weight: 520, strongWeight: 680, lineHeight: 1.15, trackingEm: 0.015 },
    scale: { xs: 11, sm: 12, md: 14, lg: 18, xl: 24 }
  },
  spacing: { density: 'compact', xs: 4, sm: 6, md: 10, lg: 16, xl: 24, chromeHeight: 44 },
  materials: {
    canvas: material({ base: 'canvas', opacity: 0, blurPx: 0, borderWidthPx: 0, reducedTransparency: 'canvas' }),
    shelf: material({ base: 'chrome', fallback: 'surface', opacity: 0.6, blurPx: 20, saturation: 0.82, border: 'borderStrong', borderOpacity: 0.42, rimOpacity: 0.08, shadowOpacity: 0.3, shadowBlurPx: 44 }),
    context: material({ base: 'chrome', fallback: 'surface', opacity: 0.46, blurPx: 16, saturation: 0.86, border: 'borderStrong', borderOpacity: 0.34, rimOpacity: 0.06, shadowOpacity: 0.18, shadowBlurPx: 28 }),
    panel: material({ base: 'surfaceInset', opacity: 0, blurPx: 0, borderWidthPx: 0, rimOpacity: 0, reducedTransparency: 'panel' }),
    pane: material({ base: 'surfaceElevated', fallback: 'surfaceInset', opacity: 0.2, blurPx: 20, saturation: 0.9, border: 'borderStrong', borderOpacity: 0.38, rimOpacity: 0.08, shadowOpacity: 0.34, shadowBlurPx: 44 }),
    header: material({ base: 'chrome', fallback: 'chrome', opacity: 0.74, blurPx: 0, border: 'borderStrong', borderOpacity: 0.28, rimOpacity: 0.07 }),
    content: material({ base: 'surface', fallback: 'surfaceInset', opacity: 0.28, blurPx: 0, borderWidthPx: 0, rimOpacity: 0 }),
    row: material({ base: 'surfaceElevated', fallback: 'surfaceInset', opacity: 0.28, blurPx: 0, border: 'border', borderOpacity: 0.2, rimOpacity: 0.03 }),
    field: material({ base: 'surfaceInset', opacity: 0.76, blurPx: 0, border: 'borderStrong', borderOpacity: 0.34, rimOpacity: 0.04 }),
    button: material({ base: 'chrome', fallback: 'surface', opacity: 0.3, blurPx: 0, border: 'borderStrong', borderOpacity: 0.38, rimOpacity: 0.06 }),
    selected: material({ base: 'selection', fallback: 'surfaceElevated', opacity: 0.06, blurPx: 0, border: 'focus', borderOpacity: 0.52, rimOpacity: 0.08 }),
    menu: material({ base: 'surface', opacity: 0.88, blurPx: 26, saturation: 0.96, border: 'borderStrong', borderOpacity: 0.5, rimOpacity: 0.1, shadowOpacity: 0.58, shadowBlurPx: 88 }),
    dialog: material({ base: 'surface', opacity: 0.9, blurPx: 28, saturation: 0.96, border: 'borderStrong', borderOpacity: 0.52, rimOpacity: 0.1, shadowOpacity: 0.62, shadowBlurPx: 94 }),
    floating: material({ base: 'surfaceElevated', fallback: 'surfaceInset', opacity: 0.84, blurPx: 22, saturation: 0.94, border: 'borderStrong', borderOpacity: 0.46, rimOpacity: 0.1, shadowOpacity: 0.52, shadowBlurPx: 66 }),
    track: material({ base: 'surfaceInset', opacity: 0.9, blurPx: 0, border: 'border', borderOpacity: 0.34, rimOpacity: 0 }),
    fill: material({ base: 'warning', opacity: 0.82, blurPx: 0, border: 'warning', borderOpacity: 0.52, rimOpacity: 0 }),
    thumb: material({ base: 'text', fallback: 'surfaceElevated', opacity: 0.92, blurPx: 0, border: 'warning', borderOpacity: 0.56, rimOpacity: 0.12, shadowOpacity: 0.24, shadowBlurPx: 12, shadowY: 3, shadowSpreadPx: 0 }),
    opaque: material({ base: 'surface', opacity: 1, blurPx: 0, border: 'borderStrong', borderOpacity: 0.46, rimOpacity: 0, reducedTransparency: 'opaque' })
  },
  shapes: shapePalette({ family: 'rounded', small: 4, medium: 4, large: 4 }),
  recipes: themeRecipes({ widgetGrouping: 'unified', chromePresentation: 'compact', actionPresentation: 'compact' }),
  controls: { slider: { trackPx: 3, thumbPx: 10, hitTargetPx: 44 } },
  iconPackId: 'icons.minimal',
  assets: [
    { id: 'icons.minimal', kind: 'icon-pack', required: true },
    { id: 'image.ash-amber-stage', kind: 'image', required: true }
  ],
  canvas: [...canvasResolution.layers],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: true }
};

export const ASH_AMBER_TARGET = themeTarget(ASH_AMBER_THEME, {
  colorRole: 'selection',
  position: { x: 0.57, y: 0.97 },
  radius: 0.6,
  power: 0.56
});
