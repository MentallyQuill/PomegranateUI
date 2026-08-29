import type { ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

import { material, shapePalette, themeRecipes } from './base.js';

export const BUNNY_THEME: ThemeDefinitionV2 = {
  schemaVersion: 'pomegranate.ui.theme.v2',
  id: 'bunny',
  label: 'Bunny',
  description: 'A polished Japanese character-goods theme with luminous garden color, milky glass, soft depth, and one restrained bunny signature.',
  colors: {
    canvas: '#f8e9f3', surface: '#fff8f5', surfaceElevated: '#fffdfb', surfaceInset: '#eee8f4', chrome: '#fff5f1',
    text: '#45364d', textMuted: '#665a6d', textFaint: '#716477', textOnAccent: '#21121a', accent: '#d65f96',
    selection: '#f3b8d0', focus: '#6951a1', success: '#397a69', warning: '#825b00', danger: '#a84567',
    border: '#ead4e0', borderStrong: '#b989a5', shadow: '#735d72'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-rounded', 'ui-sans-serif', 'system-ui', 'sans-serif'], weight: 480, strongWeight: 700, lineHeight: 1.4, trackingEm: 0.01 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 400, strongWeight: 650, lineHeight: 1.62, trackingEm: 0.01 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.03 },
    display: { family: 'Pomegranate Sans', fallbacks: ['ui-rounded', 'ui-sans-serif', 'system-ui', 'sans-serif'], weight: 650, strongWeight: 750, lineHeight: 1.18, trackingEm: 0.01 },
    scale: { xs: 11, sm: 13, md: 15, lg: 19, xl: 26 }
  },
  spacing: { density: 'roomy', xs: 6, sm: 9, md: 14, lg: 21, xl: 32, chromeHeight: 52 },
  materials: {
    canvas: material({ base: 'canvas', opacity: 0, blurPx: 0, borderWidthPx: 0, reducedTransparency: 'canvas' }),
    shelf: material({ base: 'chrome', fallback: 'surface', opacity: 0.28, blurPx: 24, saturation: 1.14, brightness: 1.05, border: 'surfaceElevated', borderOpacity: 0.78, rimOpacity: 0.78, shadowOpacity: 0.16, shadowBlurPx: 42, shadowY: 14 }),
    context: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.2, blurPx: 20, saturation: 1.12, brightness: 1.04, border: 'surfaceElevated', borderOpacity: 0.66, rimOpacity: 0.64, shadowOpacity: 0.1, shadowBlurPx: 24, shadowY: 8 }),
    panel: material({ base: 'surfaceElevated', opacity: 0, blurPx: 0, borderWidthPx: 0, rimOpacity: 0, reducedTransparency: 'panel' }),
    window: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.24, blurPx: 22, saturation: 1.16, brightness: 1.04, border: 'surfaceElevated', borderOpacity: 0.84, rimOpacity: 0.82, shadowOpacity: 0.18, shadowBlurPx: 46, shadowY: 18 }),
    header: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.16, blurPx: 0, borderWidthPx: 0, rimOpacity: 0 }),
    content: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.1, blurPx: 0, borderWidthPx: 0, rimOpacity: 0 }),
    row: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.2, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.5, rimOpacity: 0.42 }),
    field: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.42, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.76, rimOpacity: 0.64, shadowOpacity: 0.06, shadowBlurPx: 12, shadowY: 3, shadowSpreadPx: 0 }),
    button: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.36, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.76, rimOpacity: 0.72, shadowOpacity: 0.1, shadowBlurPx: 16, shadowY: 5, shadowSpreadPx: 0 }),
    selected: material({ base: 'selection', fallback: 'surfaceElevated', opacity: 0.62, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.82, rimOpacity: 0.68 }),
    menu: material({ base: 'surfaceElevated', opacity: 0.72, blurPx: 30, saturation: 1.14, border: 'surfaceElevated', borderOpacity: 0.88, rimOpacity: 0.78, shadowOpacity: 0.24, shadowBlurPx: 64, shadowY: 24 }),
    dialog: material({ base: 'surfaceElevated', opacity: 0.76, blurPx: 32, saturation: 1.14, border: 'surfaceElevated', borderOpacity: 0.9, rimOpacity: 0.8, shadowOpacity: 0.26, shadowBlurPx: 72, shadowY: 28 }),
    floating: material({ base: 'surfaceElevated', opacity: 0.66, blurPx: 26, saturation: 1.12, border: 'surfaceElevated', borderOpacity: 0.88, rimOpacity: 0.8, shadowOpacity: 0.24, shadowBlurPx: 60, shadowY: 22 }),
    track: material({ base: 'surfaceInset', opacity: 0.66, blurPx: 0, border: 'borderStrong', borderOpacity: 0.2, rimOpacity: 0 }),
    fill: material({ base: 'accent', opacity: 0.76, blurPx: 0, border: 'accent', borderOpacity: 0.3, rimOpacity: 0.12 }),
    thumb: material({ base: 'surfaceElevated', opacity: 0.96, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.9, rimOpacity: 0.82, shadowOpacity: 0.2, shadowBlurPx: 12, shadowY: 4, shadowSpreadPx: 0 }),
    opaque: material({ base: 'surface', opacity: 1, blurPx: 0, border: 'border', borderOpacity: 0.72, rimOpacity: 0, reducedTransparency: 'opaque' })
  },
  shapes: shapePalette({ family: 'continuous-rounded', small: 12, medium: 20, large: 28 }),
  recipes: themeRecipes({ widgetGrouping: 'individual', chromePresentation: 'full', actionPresentation: 'compact' }),
  controls: { slider: { trackPx: 4, thumbPx: 12, hitTargetPx: 46 } },
  iconPackId: 'icons.minimal',
  assets: [
    { id: 'icons.minimal', kind: 'icon-pack', required: true },
    { id: 'image.bunny-garden', kind: 'image', required: true }
  ],
  canvas: [
    { kind: 'solid', color: '#f8e9f3' },
    { kind: 'image', assetId: 'image.bunny-garden', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 0.9, blend: 'normal' },
    { kind: 'four-corner', topLeft: '#f6cedd66', topRight: '#d9d2f166', bottomLeft: '#d5ece566', bottomRight: '#f1deb966' },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.5, y: 0.16, stops: [{ color: '#fffdfbb8', position: 0 }, { color: '#faeef600', position: 0.62 }] },
    { kind: 'veil', mode: 'reading', color: '#fff8f5', opacity: 0.06 }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 46, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: true }
};
