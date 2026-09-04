import type { ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

import { material, shapePalette, themeRecipes, themeTarget } from './base.js';

const POM_NEUTRAL_RECIPES: ThemeDefinitionV2['recipes'] = (() => {
  const recipes = themeRecipes({
    widgetGrouping: 'individual',
    chromePresentation: 'overlay',
    actionPresentation: 'hover-focus',
    toolbarTogglePresentation: 'bottom-chevrons'
  });
  recipes.parts['group.surface'] = {
    ...recipes.parts['group.surface'],
    material: 'pane',
    overflow: 'clip',
    elevation: 2
  };
  return recipes;
})();

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
    ui: { family: 'Inter', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 430, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Inter', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 400, strongWeight: 600, lineHeight: 1.52, trackingEm: 0 },
    technical: { family: 'Roboto Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.005 },
    display: { family: 'Inter', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 560, strongWeight: 680, lineHeight: 1.15, trackingEm: -0.01 },
    scale: { xs: 11, sm: 12, md: 14, lg: 18, xl: 24 }
  },
  spacing: { density: 'balanced', xs: 5, sm: 8, md: 12, lg: 18, xl: 28, chromeHeight: 38 },
  materials: {
    canvas: material({ base: 'canvas', opacity: 0, blurPx: 0, borderWidthPx: 0, reducedTransparency: 'canvas' }),
    shelf: material({ base: 'chrome', fallback: 'surface', opacity: 0.22, blurPx: 32, saturation: 1.32, brightness: 1.06, border: 'surfaceElevated', borderOpacity: 0.62, rimOpacity: 0.86, shadowOpacity: 0.2, shadowBlurPx: 42, shadowY: 14 }),
    context: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.18, blurPx: 26, saturation: 1.24, brightness: 1.04, border: 'surfaceElevated', borderOpacity: 0.48, rimOpacity: 0.62, shadowOpacity: 0.12, shadowBlurPx: 28, shadowY: 9 }),
    panel: material({ base: 'surface', opacity: 0, blurPx: 0, borderWidthPx: 0, rimOpacity: 0, reducedTransparency: 'panel' }),
    pane: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.3, blurPx: 34, saturation: 1.32, brightness: 1.05, border: 'surfaceElevated', borderOpacity: 0.58, rimOpacity: 0.8, shadowOpacity: 0.26, shadowBlurPx: 58, shadowY: 22 }),
    header: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.18, blurPx: 0, borderWidthPx: 0, rimOpacity: 0.56 }),
    content: material({ base: 'surface', fallback: 'surface', opacity: 0.07, blurPx: 0, borderWidthPx: 0, rimOpacity: 0.08 }),
    row: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.16, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.24, rimOpacity: 0.34 }),
    field: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.52, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.7, rimOpacity: 0.68, shadowOpacity: 0.1, shadowBlurPx: 14, shadowY: 3, shadowSpreadPx: 0 }),
    button: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.72, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.84, rimOpacity: 0.78, shadowOpacity: 0.14, shadowBlurPx: 16, shadowY: 4, shadowSpreadPx: 0 }),
    selected: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.82, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.9, rimOpacity: 0.74, shadowOpacity: 0.12, shadowBlurPx: 14, shadowY: 3, shadowSpreadPx: 0 }),
    menu: material({ base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.7, blurPx: 34, saturation: 1.2, border: 'surfaceElevated', borderOpacity: 0.76, rimOpacity: 0.64, shadowOpacity: 0.28, shadowBlurPx: 68, shadowY: 24 }),
    dialog: material({ base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.76, blurPx: 36, saturation: 1.2, border: 'surfaceElevated', borderOpacity: 0.78, rimOpacity: 0.66, shadowOpacity: 0.3, shadowBlurPx: 76, shadowY: 28 }),
    floating: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.62, blurPx: 32, saturation: 1.2, border: 'surfaceElevated', borderOpacity: 0.76, rimOpacity: 0.68, shadowOpacity: 0.3, shadowBlurPx: 70, shadowY: 26 }),
    track: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.46, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.28, rimOpacity: 0.12 }),
    fill: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.96, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.46, rimOpacity: 0.16 }),
    thumb: material({ base: 'surfaceElevated', opacity: 0.96, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.86, rimOpacity: 0.74, shadowOpacity: 0.22, shadowBlurPx: 10, shadowY: 3, shadowSpreadPx: 0 }),
    opaque: material({ base: 'surface', opacity: 1, blurPx: 0, border: 'border', borderOpacity: 0.7, rimOpacity: 0, reducedTransparency: 'opaque' })
  },
  shapes: shapePalette({ family: 'continuous-rounded', small: 12, medium: 20, large: 26 }),
  recipes: POM_NEUTRAL_RECIPES,
  controls: { slider: { trackPx: 4, thumbPx: 11, hitTargetPx: 44 } },
  iconPackId: 'icons.minimal',
  assets: [
    { id: 'icons.minimal', kind: 'icon-pack', required: true },
    { id: 'image.pomos-tahoe', kind: 'image', required: true }
  ],
  canvas: [
    { kind: 'solid', color: '#075bb8' },
    { kind: 'image', assetId: 'image.pomos-tahoe', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 0.98, contrast: 1.04, brightness: 0.96, blend: 'normal' },
    { kind: 'linear-gradient', angle: 132, stops: [{ color: '#02265c38', position: 0 }, { color: '#8ff4ff12', position: 0.42 }, { color: '#e9feff0a', position: 0.58 }, { color: '#033b7d20', position: 1 }] },
    { kind: 'veil', mode: 'vignette', color: '#031d52', opacity: 0.2 }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: true }
};

export const POM_NEUTRAL_TARGET = themeTarget(POM_NEUTRAL_THEME, {
  colorRole: 'accent',
  position: { x: 0.82, y: 0.16 },
  radius: 0.52,
  power: 0.16
});
