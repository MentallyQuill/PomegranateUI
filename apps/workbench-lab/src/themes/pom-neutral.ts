import type { ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

import { material, shapePalette, themeRecipes, themeTarget } from './base.js';

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
    pane: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.42, blurPx: 30, saturation: 1.22, brightness: 1.03, border: 'surfaceElevated', borderOpacity: 0.74, rimOpacity: 0.72, shadowOpacity: 0.22, shadowBlurPx: 52, shadowY: 20 }),
    header: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.13, blurPx: 0, borderWidthPx: 0, rimOpacity: 0 }),
    content: material({ base: 'surface', fallback: 'surface', opacity: 0.12, blurPx: 0, borderWidthPx: 0, rimOpacity: 0 }),
    row: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.28, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.34, rimOpacity: 0.2 }),
    field: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.68, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.78, rimOpacity: 0.52, shadowOpacity: 0.1, shadowBlurPx: 12, shadowY: 3, shadowSpreadPx: 0 }),
    button: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.82, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.9, rimOpacity: 0.62, shadowOpacity: 0.12, shadowBlurPx: 14, shadowY: 4, shadowSpreadPx: 0 }),
    selected: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.88, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.94, rimOpacity: 0.58, shadowOpacity: 0.1, shadowBlurPx: 12, shadowY: 3, shadowSpreadPx: 0 }),
    menu: material({ base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.7, blurPx: 34, saturation: 1.2, border: 'surfaceElevated', borderOpacity: 0.76, rimOpacity: 0.64, shadowOpacity: 0.28, shadowBlurPx: 68, shadowY: 24 }),
    dialog: material({ base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.76, blurPx: 36, saturation: 1.2, border: 'surfaceElevated', borderOpacity: 0.78, rimOpacity: 0.66, shadowOpacity: 0.3, shadowBlurPx: 76, shadowY: 28 }),
    floating: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.62, blurPx: 32, saturation: 1.2, border: 'surfaceElevated', borderOpacity: 0.76, rimOpacity: 0.68, shadowOpacity: 0.3, shadowBlurPx: 70, shadowY: 26 }),
    track: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.34, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.22, rimOpacity: 0 }),
    fill: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.96, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.46, rimOpacity: 0.16 }),
    thumb: material({ base: 'surfaceElevated', opacity: 0.96, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.86, rimOpacity: 0.74, shadowOpacity: 0.22, shadowBlurPx: 10, shadowY: 3, shadowSpreadPx: 0 }),
    opaque: material({ base: 'surface', opacity: 1, blurPx: 0, border: 'border', borderOpacity: 0.7, rimOpacity: 0, reducedTransparency: 'opaque' })
  },
  shapes: shapePalette({ family: 'continuous-rounded', small: 10, medium: 18, large: 22 }),
  recipes: themeRecipes({ widgetGrouping: 'individual', chromePresentation: 'overlay', actionPresentation: 'hover-focus' }),
  controls: { slider: { trackPx: 4, thumbPx: 11, hitTargetPx: 44 } },
  iconPackId: 'icons.minimal',
  assets: [{ id: 'icons.minimal', kind: 'icon-pack', required: true }],
  canvas: [
    { kind: 'solid', color: '#087fc8' },
    { kind: 'linear-gradient', angle: 128, stops: [{ color: '#e8fbff00', position: 0 }, { color: '#e8fbff00', position: 0.15 }, { color: '#c7f5ff85', position: 0.16 }, { color: '#7addf0a6', position: 0.28 }, { color: '#1690d000', position: 0.29 }, { color: '#1690d000', position: 0.64 }, { color: '#d9fbff70', position: 0.65 }, { color: '#d9fbff00', position: 0.69 }] },
    { kind: 'conic-gradient', angle: 205, x: 0.16, y: 0.8, stops: [{ color: '#0b45ad00', position: 0 }, { color: '#0b45ad00', position: 0.12 }, { color: '#9cecff78', position: 0.13 }, { color: '#58cde695', position: 0.16 }, { color: '#0b45ad00', position: 0.17 }, { color: '#0b45ad00', position: 0.48 }, { color: '#e4fcff70', position: 0.49 }, { color: '#e4fcff00', position: 0.51 }] },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.82, y: 0.18, stops: [{ color: '#d3fbffaa', position: 0 }, { color: '#6ce2f05c', position: 0.24 }, { color: '#1d8ad000', position: 0.25 }, { color: '#1d8ad000', position: 0.38 }, { color: '#073e9a4d', position: 0.39 }, { color: '#073e9a00', position: 0.55 }] },
    { kind: 'linear-gradient', angle: 38, stops: [{ color: '#063f9a00', position: 0 }, { color: '#063f9a00', position: 0.42 }, { color: '#063f9a55', position: 0.43 }, { color: '#063f9a55', position: 0.53 }, { color: '#063f9a00', position: 0.54 }, { color: '#063f9a00', position: 1 }] },
    { kind: 'veil', mode: 'vignette', color: '#06336f', opacity: 0.2 }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: false }
};

export const POM_NEUTRAL_TARGET = themeTarget(POM_NEUTRAL_THEME, {
  colorRole: 'accent',
  position: { x: 0.82, y: 0.16 },
  radius: 0.52,
  power: 0.16
});
