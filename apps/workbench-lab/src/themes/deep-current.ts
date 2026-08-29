import type { ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

import { material, shapePalette, themeRecipes } from './base.js';

export const DEEP_CURRENT_THEME: ThemeDefinitionV2 = {
  schemaVersion: 'pomegranate.ui.theme.v2',
  id: 'deep-current',
  label: 'Deep Current',
  description: 'Industrial dark-tech glass, cold signal light, and compact technical geometry derived from the preserved Sonder direction.',
  colors: {
    canvas: '#080c0d', surface: '#0b1213', surfaceElevated: '#10191a', surfaceInset: '#040708', chrome: '#0b1213',
    text: '#e7f6f0', textMuted: '#a7b8b2', textFaint: '#748580', textOnAccent: '#071011', accent: '#94d9d0',
    selection: '#244c4a', focus: '#bfeee8', success: '#86d89a', warning: '#d2b57a', danger: '#df7b70',
    border: '#28413f', borderStrong: '#5f807b', shadow: '#000000'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 450, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 400, strongWeight: 600, lineHeight: 1.58, trackingEm: 0 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.04 },
    display: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 520, strongWeight: 680, lineHeight: 1.15, trackingEm: 0.02 },
    scale: { xs: 11, sm: 12, md: 14, lg: 18, xl: 24 }
  },
  spacing: { density: 'compact', xs: 4, sm: 6, md: 10, lg: 16, xl: 24, chromeHeight: 44 },
  materials: {
    canvas: material({ base: 'canvas', opacity: 0, blurPx: 0, borderWidthPx: 0, reducedTransparency: 'canvas' }),
    shelf: material({ base: 'chrome', opacity: 0.62, blurPx: 24, saturation: 0.9, border: 'borderStrong', borderOpacity: 0.3, rimOpacity: 0.09, shadowOpacity: 0.34, shadowBlurPx: 44 }),
    context: material({ base: 'surfaceElevated', opacity: 0.34, blurPx: 18, saturation: 0.92, border: 'borderStrong', borderOpacity: 0.24, rimOpacity: 0.05, shadowOpacity: 0.18, shadowBlurPx: 24 }),
    panel: material({ base: 'surfaceInset', opacity: 0.28, blurPx: 12, saturation: 0.92, border: 'border', borderOpacity: 0.24, rimOpacity: 0.03 }),
    window: material({ base: 'surfaceElevated', fallback: 'surfaceInset', opacity: 0.74, blurPx: 18, saturation: 1.04, border: 'borderStrong', borderOpacity: 0.34, rimOpacity: 0.08, shadowOpacity: 0.3, shadowBlurPx: 38 }),
    header: material({ base: 'chrome', fallback: 'surfaceInset', opacity: 0.34, blurPx: 0, border: 'border', borderOpacity: 0.24, rimOpacity: 0.05 }),
    content: material({ base: 'surface', fallback: 'surfaceInset', opacity: 0.24, blurPx: 0, borderWidthPx: 0, rimOpacity: 0 }),
    row: material({ base: 'surfaceElevated', fallback: 'surfaceInset', opacity: 0.3, blurPx: 0, border: 'border', borderOpacity: 0.18, rimOpacity: 0.03 }),
    field: material({ base: 'surfaceInset', opacity: 0.74, blurPx: 0, border: 'borderStrong', borderOpacity: 0.3, rimOpacity: 0.04 }),
    button: material({ base: 'surfaceElevated', opacity: 0.2, blurPx: 0, border: 'borderStrong', borderOpacity: 0.34, rimOpacity: 0.06 }),
    selected: material({ base: 'selection', fallback: 'surfaceElevated', opacity: 0.42, blurPx: 0, border: 'focus', borderOpacity: 0.5, rimOpacity: 0.08 }),
    menu: material({ base: 'chrome', opacity: 0.9, blurPx: 30, saturation: 1.15, border: 'borderStrong', borderOpacity: 0.5, rimOpacity: 0.1, shadowOpacity: 0.58, shadowBlurPx: 90 }),
    dialog: material({ base: 'chrome', opacity: 0.92, blurPx: 32, saturation: 1.12, border: 'borderStrong', borderOpacity: 0.5, rimOpacity: 0.1, shadowOpacity: 0.62, shadowBlurPx: 96 }),
    floating: material({ base: 'surfaceElevated', fallback: 'surfaceInset', opacity: 0.88, blurPx: 24, border: 'borderStrong', borderOpacity: 0.44, rimOpacity: 0.1, shadowOpacity: 0.54, shadowBlurPx: 64 }),
    track: material({ base: 'surfaceInset', opacity: 0.9, blurPx: 0, border: 'border', borderOpacity: 0.32, rimOpacity: 0 }),
    fill: material({ base: 'accent', opacity: 0.82, blurPx: 0, border: 'accent', borderOpacity: 0.5, rimOpacity: 0 }),
    thumb: material({ base: 'text', fallback: 'surfaceElevated', opacity: 0.92, blurPx: 0, border: 'borderStrong', borderOpacity: 0.56, rimOpacity: 0.12, shadowOpacity: 0.24, shadowBlurPx: 12, shadowY: 3, shadowSpreadPx: 0 }),
    opaque: material({ base: 'surface', opacity: 1, blurPx: 0, border: 'borderStrong', borderOpacity: 0.42, rimOpacity: 0, reducedTransparency: 'opaque' })
  },
  shapes: shapePalette({ family: 'chamfered', small: 4, medium: 7, large: 10, chamferPx: 5 }),
  recipes: themeRecipes({ widgetGrouping: 'unified', chromePresentation: 'compact', actionPresentation: 'compact' }),
  controls: { slider: { trackPx: 3, thumbPx: 10, hitTargetPx: 44 } },
  iconPackId: 'icons.minimal',
  assets: [
    { id: 'icons.minimal', kind: 'icon-pack', required: true },
    { id: 'image.deep-current-stage', kind: 'image', required: true }
  ],
  canvas: [
    { kind: 'solid', color: '#080c0d' },
    { kind: 'image', assetId: 'image.deep-current-stage', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 0.82, blend: 'normal' },
    { kind: 'linear-gradient', angle: 90, stops: [{ color: '#020506e0', position: 0 }, { color: '#07101238', position: 0.54 }, { color: '#020506b8', position: 1 }] },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.68, y: 0.38, stops: [{ color: '#94d9d02e', position: 0 }, { color: '#07101200', position: 0.58 }] }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: true }
};
