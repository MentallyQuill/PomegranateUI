import type { ThemeColorRole, ThemeDefinition, ThemeMaterial } from '@pomegranate-ui/contracts';

function material(
  base: ThemeColorRole,
  fallback: ThemeColorRole = base,
  overrides: Partial<ThemeMaterial> = {}
): ThemeMaterial {
  return {
    base,
    fallback,
    opacity: 0.78,
    blurPx: 22,
    saturation: 1.18,
    border: 'border',
    shadow: 'shadow',
    shadowOpacity: 0.38,
    shadowBlurPx: 70,
    insetHighlight: 0.05,
    bloom: 0,
    ...overrides
  };
}

export const DEEP_CURRENT_THEME: ThemeDefinition = {
  schemaVersion: 'pomegranate.ui.theme.v1',
  id: 'deep-current',
  label: 'Deep Current',
  description: 'Industrial dark-tech glass, ember light, and technical geometry derived from the preserved Sonder mockup direction.',
  colors: {
    canvas: '#111014',
    surface: '#1f1c22',
    surfaceElevated: '#2c272d',
    surfaceInset: '#18161b',
    chrome: '#141217',
    text: '#eee8de',
    textMuted: '#a9a0a0',
    textFaint: '#756c70',
    textOnAccent: '#111014',
    accent: '#e2a069',
    selection: '#ffc38d',
    focus: '#ffc38d',
    success: '#769885',
    warning: '#e2a069',
    danger: '#f0b0a2',
    border: '#353139',
    borderStrong: '#665044',
    shadow: '#000000'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 450, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 400, strongWeight: 600, lineHeight: 1.58, trackingEm: 0 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.04 },
    display: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 520, strongWeight: 680, lineHeight: 1.15, trackingEm: 0.02 },
    scale: { xs: 11, sm: 12, md: 14, lg: 18, xl: 24 }
  },
  geometry: {
    cornerFamily: 'chamfered',
    cornerSm: 6.4,
    cornerMd: 8.8,
    cornerLg: 13.6,
    cornerPill: 999,
    chamfer: 6,
    chamferAngle: 45,
    borderWidth: 1,
    sharedEdge: 'hairline',
    focusWidth: 2,
    focusOffset: 2
  },
  spacing: { density: 'compact', xs: 4, sm: 6, md: 12, lg: 16, xl: 24, chromeHeight: 44 },
  materials: {
    canvas: material('canvas', 'canvas', { opacity: 1, blurPx: 0, saturation: 1, shadowOpacity: 0, shadowBlurPx: 0 }),
    shelf: material('surface'),
    panel: material('surfaceInset', 'surfaceInset', { opacity: 0.28, blurPx: 0, saturation: 1, shadowOpacity: 0, shadowBlurPx: 0 }),
    widget: material('surfaceElevated', 'surfaceInset', { opacity: 0.88, blurPx: 0, saturation: 1, shadowOpacity: 0.16, shadowBlurPx: 34 }),
    field: material('shadow', 'surfaceInset', { opacity: 0.18, blurPx: 0, saturation: 1, shadowOpacity: 0, shadowBlurPx: 0 }),
    button: material('text', 'surfaceElevated', { opacity: 0.04, blurPx: 0, saturation: 1, shadowOpacity: 0, shadowBlurPx: 0 }),
    menu: material('chrome', 'chrome', { opacity: 0.94, blurPx: 28, saturation: 1.25, shadowOpacity: 0.58, shadowBlurPx: 100 }),
    dialog: material('chrome', 'chrome', { opacity: 0.94, blurPx: 28, saturation: 1.25 }),
    floating: material('surfaceElevated', 'surfaceInset', { opacity: 0.94, blurPx: 0, saturation: 1, shadowOpacity: 0.48, shadowBlurPx: 60 })
  },
  iconPackId: 'icons.minimal',
  assets: [{ id: 'icons.minimal', kind: 'icon-pack', required: true }],
  canvas: [
    { kind: 'linear-gradient', angle: 145, stops: [{ color: '#100f1394', position: 0 }, { color: '#20171cc7', position: 1 }] },
    { kind: 'radial-gradient', shape: 'circle', x: 0.18, y: 0.2, stops: [{ color: '#893d483b', position: 0 }, { color: '#11101400', position: 1 }] },
    { kind: 'radial-gradient', shape: 'circle', x: 0.82, y: 0.76, stops: [{ color: '#2f5b5b2e', position: 0 }, { color: '#11101400', position: 1 }] },
    { kind: 'solid', color: '#111014' }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: false }
};
