import { THEME_PART_IDS, type ThemeDefinitionV2, type ThemePartId, type ThemePartRecipeV2 } from '@pomegranate-ui/contracts';

const defaultPart: ThemePartRecipeV2 = {
  material: 'terminal',
  shape: 'square',
  typography: 'technical',
  spacing: 'sm',
  overflow: 'visible',
  separator: 'hairline',
  elevation: 0,
  states: {
    hover: { material: 'signal' },
    pressed: { material: 'signal', opacity: 0.82 },
    selected: { material: 'signal' },
    focus: { material: 'signal' },
    inactive: { opacity: 0.72 },
    disabledOpacity: 0.4
  }
};

const parts = Object.fromEntries(THEME_PART_IDS.map((part) => [part, {
  ...defaultPart,
  shape: part.startsWith('slider.') || part === 'button.icon' ? 'pill' : 'square',
  material: part === 'slider.fill' || part === 'slider.thumb' ? 'signal' : 'terminal'
}])) as Record<ThemePartId, ThemePartRecipeV2>;

export const EXTERNAL_THEME: ThemeDefinitionV2 = {
  schemaVersion: 'pomegranate.ui.theme.v2',
  id: 'copper-terminal-fixture',
  label: 'Copper Terminal Fixture',
  description: 'An external square, monospaced, copper-on-ink consumer fixture that is not a Lab preset.',
  colors: {
    canvas: '#090604', surface: '#17100b', surfaceElevated: '#21160e', surfaceInset: '#050302', chrome: '#120c08',
    text: '#ffe6ce', textMuted: '#d5b99f', textFaint: '#ad9076', textOnAccent: '#150b04', accent: '#ff9d52',
    selection: '#6d3515', focus: '#ffc28f', success: '#9fca82', warning: '#ffc06a', danger: '#ff8068',
    border: '#57341f', borderStrong: '#b86d38', shadow: '#000000'
  },
  typography: {
    ui: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 700, lineHeight: 1.35, trackingEm: 0.02 },
    prose: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 400, strongWeight: 650, lineHeight: 1.5, trackingEm: 0.01 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 500, strongWeight: 750, lineHeight: 1.35, trackingEm: 0.04 },
    display: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 650, strongWeight: 800, lineHeight: 1.1, trackingEm: 0.06 },
    scale: { xs: 10, sm: 12, md: 14, lg: 19, xl: 26 }
  },
  spacing: { density: 'compact', xs: 3, sm: 6, md: 9, lg: 14, xl: 22, chromeHeight: 40 },
  materials: {
    terminal: {
      base: 'surface', fallback: 'surface', opacity: 0.94,
      backdrop: { blurPx: 0, saturation: 1, brightness: 1 }, contentTone: 'light',
      border: { color: 'border', widthPx: 1, opacity: 0.9 },
      rim: { color: 'accent', opacity: 0.16, angleDeg: 90 },
      shadows: [{ x: 3, y: 3, blurPx: 0, spreadPx: 0, color: 'shadow', opacity: 0.8, inset: false }],
      reducedTransparency: 'terminal'
    },
    signal: {
      base: 'accent', fallback: 'accent', opacity: 0.9,
      backdrop: { blurPx: 0, saturation: 1, brightness: 1 }, contentTone: 'dark',
      border: { color: 'focus', widthPx: 1, opacity: 0.8 },
      rim: { color: 'surfaceElevated', opacity: 0.24, angleDeg: 90 }, shadows: [], reducedTransparency: 'signal'
    }
  },
  shapes: {
    square: { family: 'square', radiusPx: 0, chamferPx: 0, chamferAngleDeg: 45, joinedEdges: [] },
    pill: { family: 'pill', radiusPx: 999, chamferPx: 0, chamferAngleDeg: 45, joinedEdges: [] }
  },
  recipes: { parts, widgetGrouping: 'unified', chromePresentation: 'compact', actionPresentation: 'hover-focus' },
  controls: { slider: { trackPx: 3, thumbPx: 9, hitTargetPx: 44 } },
  iconPackId: 'icons.external-fixture',
  assets: [{ id: 'icons.external-fixture', kind: 'icon-pack', required: true }],
  canvas: [
    { kind: 'solid', color: '#090604' },
    { kind: 'linear-gradient', angle: 135, stops: [{ color: '#ff9d5218', position: 0 }, { color: '#09060400', position: 0.62 }] }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: false, textures: false, localImages: false }
};
