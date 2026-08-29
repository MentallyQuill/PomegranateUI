import type { ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

import { material, shapePalette, themeRecipes } from './base.js';

export const POM_NEUTRAL_THEME: ThemeDefinitionV2 = {
  schemaVersion: 'pomegranate.ui.theme.v2',
  id: 'pom-neutral',
  label: 'PomOS',
  description: 'An original blue desktop workspace with coherent adaptive glass, continuous rounded windows, and calm compact chrome.',
  colors: {
    canvas: '#167fdc', surface: '#eaf4ff', surfaceElevated: '#ffffff', surfaceInset: '#dcecff', chrome: '#f6fbff',
    text: '#101820', textMuted: '#34495e', textFaint: '#536a80', textOnAccent: '#ffffff', accent: '#0868c4',
    selection: '#9ed1ff', focus: '#003f7d', success: '#247253', warning: '#805b00', danger: '#a83e55',
    border: '#c8def2', borderStrong: '#7899ba', shadow: '#153b68'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 430, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 400, strongWeight: 600, lineHeight: 1.52, trackingEm: 0 },
    technical: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.005 },
    display: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 560, strongWeight: 680, lineHeight: 1.15, trackingEm: -0.01 },
    scale: { xs: 11, sm: 12, md: 14, lg: 18, xl: 24 }
  },
  spacing: { density: 'balanced', xs: 5, sm: 8, md: 12, lg: 18, xl: 28, chromeHeight: 38 },
  materials: {
    canvas: material({ base: 'canvas', opacity: 0, blurPx: 0, borderWidthPx: 0, reducedTransparency: 'canvas' }),
    shelf: material({ base: 'chrome', fallback: 'surface', opacity: 0.3, blurPx: 30, saturation: 1.24, brightness: 1.04, border: 'surfaceElevated', borderOpacity: 0.68, rimOpacity: 0.68, shadowOpacity: 0.16, shadowBlurPx: 36, shadowY: 12 }),
    context: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.2, blurPx: 24, saturation: 1.18, brightness: 1.03, border: 'surfaceElevated', borderOpacity: 0.56, rimOpacity: 0.5, shadowOpacity: 0.1, shadowBlurPx: 24, shadowY: 8 }),
    panel: material({ base: 'surface', opacity: 0, blurPx: 0, borderWidthPx: 0, rimOpacity: 0, reducedTransparency: 'panel' }),
    window: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.42, blurPx: 30, saturation: 1.22, brightness: 1.03, border: 'surfaceElevated', borderOpacity: 0.74, rimOpacity: 0.72, shadowOpacity: 0.22, shadowBlurPx: 52, shadowY: 20 }),
    header: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.13, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.3, rimOpacity: 0.22 }),
    content: material({ base: 'surface', fallback: 'surface', opacity: 0.12, blurPx: 0, borderWidthPx: 0, rimOpacity: 0 }),
    row: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.2, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.28, rimOpacity: 0.18 }),
    field: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.46, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.62, rimOpacity: 0.42, shadowOpacity: 0.08, shadowBlurPx: 12, shadowY: 3, shadowSpreadPx: 0 }),
    button: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.34, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.58, rimOpacity: 0.5, shadowOpacity: 0.08, shadowBlurPx: 12, shadowY: 4, shadowSpreadPx: 0 }),
    selected: material({ base: 'selection', fallback: 'surface', opacity: 0.56, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.74, rimOpacity: 0.42 }),
    menu: material({ base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.7, blurPx: 34, saturation: 1.2, border: 'surfaceElevated', borderOpacity: 0.76, rimOpacity: 0.64, shadowOpacity: 0.28, shadowBlurPx: 68, shadowY: 24 }),
    dialog: material({ base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.76, blurPx: 36, saturation: 1.2, border: 'surfaceElevated', borderOpacity: 0.78, rimOpacity: 0.66, shadowOpacity: 0.3, shadowBlurPx: 76, shadowY: 28 }),
    floating: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.62, blurPx: 32, saturation: 1.2, border: 'surfaceElevated', borderOpacity: 0.76, rimOpacity: 0.68, shadowOpacity: 0.3, shadowBlurPx: 70, shadowY: 26 }),
    track: material({ base: 'surfaceInset', opacity: 0.76, blurPx: 0, border: 'borderStrong', borderOpacity: 0.2, rimOpacity: 0 }),
    fill: material({ base: 'accent', opacity: 0.88, blurPx: 0, border: 'accent', borderOpacity: 0.38, rimOpacity: 0.12 }),
    thumb: material({ base: 'surfaceElevated', opacity: 0.96, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.86, rimOpacity: 0.74, shadowOpacity: 0.22, shadowBlurPx: 10, shadowY: 3, shadowSpreadPx: 0 }),
    opaque: material({ base: 'surface', opacity: 1, blurPx: 0, border: 'border', borderOpacity: 0.7, rimOpacity: 0, reducedTransparency: 'opaque' })
  },
  shapes: shapePalette({ family: 'continuous-rounded', small: 10, medium: 18, large: 22 }),
  recipes: themeRecipes({ widgetGrouping: 'individual', chromePresentation: 'overlay', actionPresentation: 'hover-focus' }),
  controls: { slider: { trackPx: 4, thumbPx: 11, hitTargetPx: 44 } },
  iconPackId: 'icons.minimal',
  assets: [{ id: 'icons.minimal', kind: 'icon-pack', required: true }],
  canvas: [
    { kind: 'solid', color: '#167fdc' },
    { kind: 'four-corner', topLeft: '#a9e2ff', topRight: '#1687ed', bottomLeft: '#0061ce', bottomRight: '#5445d8' },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.08, y: 0.82, stops: [{ color: '#eefaffea', position: 0 }, { color: '#a6ddff99', position: 0.24 }, { color: '#2691ef00', position: 0.54 }] },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.9, y: 0.08, stops: [{ color: '#bdf7ffdd', position: 0 }, { color: '#42c8ff88', position: 0.25 }, { color: '#245fd900', position: 0.56 }] },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.62, y: 0.92, stops: [{ color: '#f3f6ffd4', position: 0 }, { color: '#939eff70', position: 0.28 }, { color: '#3528aa00', position: 0.62 }] },
    { kind: 'linear-gradient', angle: 124, stops: [{ color: '#ffffff52', position: 0 }, { color: '#63c8ff1f', position: 0.42 }, { color: '#182d9b4d', position: 1 }] }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: false }
};
