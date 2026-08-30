import type { ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

import { material, shapePalette, themeRecipes, themeTarget } from './base.js';

export const ASH_AMBER_THEME: ThemeDefinitionV2 = {
  schemaVersion: 'pomegranate.ui.theme.v2',
  id: 'ash-amber',
  label: 'Ash & Amber',
  description: 'Muted plum atmospheric glass with warm ash-brown title bars, restrained amber signal light, and compact workbench geometry.',
  colors: {
    canvas: '#2C2938', surface: '#382D31', surfaceElevated: '#4A3A3D', surfaceInset: '#211E2B', chrome: '#716667',
    text: '#FFFFFF', textMuted: '#DED3D5', textFaint: '#BCAEB2', textOnAccent: '#FFFFFF', accent: '#84008E',
    selection: '#70426F', focus: '#F0C98B', success: '#8FB39C', warning: '#D2B57A', danger: '#E69B8F',
    border: '#5A4B50', borderStrong: '#94817D', shadow: '#100D14'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 450, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 400, strongWeight: 600, lineHeight: 1.58, trackingEm: 0 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.035 },
    display: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 520, strongWeight: 680, lineHeight: 1.15, trackingEm: 0.015 },
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
    selected: material({ base: 'accent', fallback: 'surfaceElevated', opacity: 0.06, blurPx: 0, border: 'focus', borderOpacity: 0.52, rimOpacity: 0.08 }),
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
    { id: 'image.deep-current-stage', kind: 'image', required: true }
  ],
  canvas: [
    { kind: 'solid', color: '#2C2938' },
    { kind: 'image', assetId: 'image.deep-current-stage', fit: 'cover', x: 0.5, y: 0.5, opacity: 0.66, blurPx: 0, saturation: 0.42, blend: 'normal' },
    { kind: 'linear-gradient', angle: 90, stops: [{ color: '#211E2BE8', position: 0 }, { color: '#382D3188', position: 0.5 }, { color: '#2C2938E0', position: 1 }] },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.57, y: 0.97, stops: [{ color: '#D2B57A66', position: 0 }, { color: '#84008E2E', position: 0.34 }, { color: '#2C293800', position: 0.68 }] },
    { kind: 'veil', mode: 'reading', color: '#382D31', opacity: 0.24 }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: true }
};

export const ASH_AMBER_TARGET = themeTarget(ASH_AMBER_THEME, {
  colorRole: 'accent',
  position: { x: 0.57, y: 0.97 },
  radius: 0.6,
  power: 0.56
});
