import type { ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

import { material, shapePalette, themeRecipes, themeTarget } from './base.js';

const BUNNY_SHAPES: ThemeDefinitionV2['shapes'] = {
  ...shapePalette({ family: 'continuous-rounded', small: 12, medium: 17, large: 24 }),
  shell: {
    family: 'continuous-rounded', radiusPx: 26, chamferPx: 0, chamferAngleDeg: 45, joinedEdges: []
  },
  dock: {
    family: 'continuous-rounded', radiusPx: 20, chamferPx: 0, chamferAngleDeg: 45, joinedEdges: []
  },
  reader: {
    family: 'continuous-rounded', radiusPx: 18, chamferPx: 0, chamferAngleDeg: 45, joinedEdges: []
  }
};

const BUNNY_RECIPES: ThemeDefinitionV2['recipes'] = (() => {
  const recipes = themeRecipes({
    widgetGrouping: 'individual',
    chromePresentation: 'full',
    actionPresentation: 'always'
  });
  recipes.parts['dock.surface'] = { ...recipes.parts['dock.surface'], material: 'canvas', shape: 'dock' };
  recipes.parts['panel.surface'] = { ...recipes.parts['panel.surface'], shape: 'shell' };
  recipes.parts['group.surface'] = { ...recipes.parts['group.surface'], shape: 'dock' };
  recipes.parts['widget.content'] = { ...recipes.parts['widget.content'], shape: 'reader' };
  recipes.parts['row.surface'] = { ...recipes.parts['row.surface'], shape: 'pill' };
  recipes.parts['button.surface'] = { ...recipes.parts['button.surface'], shape: 'pill' };
  return recipes;
})();

export const BUNNY_THEME: ThemeDefinitionV2 = {
  schemaVersion: 'pomegranate.ui.theme.v2',
  id: 'bunny',
  label: 'Bunny',
  description: 'A polished stationery theme with four-corner pastel atmosphere, milky surfaces, soft geometry, and calm rounded type.',
  colors: {
    canvas: '#faeef6', surface: '#fff8fc', surfaceElevated: '#ffffff', surfaceInset: '#f3e8f0', chrome: '#fff7fc',
    text: '#45364d', textMuted: '#665a6d', textFaint: '#716477', textOnAccent: '#21121a', accent: '#ed75aa',
    selection: '#f6c1d8', focus: '#6951a1', success: '#397a69', warning: '#825b00', danger: '#a84567',
    border: '#e8cddd', borderStrong: '#c891ae', shadow: '#765775'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-rounded', 'ui-sans-serif', 'system-ui', 'sans-serif'], weight: 480, strongWeight: 700, lineHeight: 1.4, trackingEm: 0.01 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 400, strongWeight: 650, lineHeight: 1.62, trackingEm: 0.01 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.03 },
    display: { family: 'Pomegranate Sans', fallbacks: ['ui-rounded', 'ui-sans-serif', 'system-ui', 'sans-serif'], weight: 650, strongWeight: 750, lineHeight: 1.18, trackingEm: 0.01 },
    scale: { xs: 11, sm: 12, md: 14, lg: 17, xl: 21 }
  },
  spacing: { density: 'roomy', xs: 4, sm: 6, md: 10, lg: 16, xl: 24, chromeHeight: 52 },
  materials: {
    canvas: material({ base: 'canvas', opacity: 0, blurPx: 0, borderWidthPx: 0, reducedTransparency: 'canvas' }),
    shelf: material({ base: 'chrome', fallback: 'surface', opacity: 0.8, blurPx: 22, saturation: 1.08, brightness: 1.04, border: 'surfaceElevated', borderWidthPx: 1.5, borderOpacity: 0.85, rimOpacity: 0.78, shadowOpacity: 0.14, shadowBlurPx: 48, shadowY: 18 }),
    context: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.68, blurPx: 20, saturation: 1.08, brightness: 1.04, border: 'surfaceElevated', borderOpacity: 0.72, rimOpacity: 0.64, shadowOpacity: 0.08, shadowBlurPx: 24, shadowY: 8 }),
    panel: material({ base: 'chrome', fallback: 'surface', opacity: 0.58, blurPx: 22, saturation: 1.08, brightness: 1.04, border: 'surfaceElevated', borderWidthPx: 1.5, borderOpacity: 0.85, rimOpacity: 0.7, shadowOpacity: 0.14, shadowBlurPx: 48, shadowY: 18 }),
    pane: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.88, blurPx: 18, saturation: 1.08, brightness: 1.03, border: 'border', borderWidthPx: 1, borderOpacity: 0.9, rimOpacity: 0.72, shadowOpacity: 0.12, shadowBlurPx: 26, shadowY: 9, shadowSpreadPx: 0 }),
    header: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.16, blurPx: 0, borderWidthPx: 0, rimOpacity: 0 }),
    content: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.1, blurPx: 0, borderWidthPx: 0, rimOpacity: 0 }),
    row: material({ base: 'surfaceElevated', fallback: 'surface', opacity: 0.72, blurPx: 0, border: 'surfaceElevated', borderOpacity: 0.62, rimOpacity: 0.42 }),
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
  shapes: BUNNY_SHAPES,
  recipes: BUNNY_RECIPES,
  controls: { slider: { trackPx: 4, thumbPx: 12, hitTargetPx: 44 } },
  iconPackId: 'icons.minimal',
  assets: [{ id: 'icons.minimal', kind: 'icon-pack', required: true }],
  canvas: [
    { kind: 'solid', color: '#faeef6' },
    { kind: 'four-corner', topLeft: '#ffd8e8', topRight: '#e4dcff', bottomLeft: '#d5f3e9', bottomRight: '#fff0bd' }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: false }
};

export const BUNNY_TARGET = themeTarget(BUNNY_THEME, {
  colorRole: 'selection',
  position: { x: 0.5, y: 0.16 },
  radius: 0.48,
  power: 0.12
});
