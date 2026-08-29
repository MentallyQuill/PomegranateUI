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
  description: 'Industrial dark-tech glass, cold signal light, and technical geometry derived from the preserved Sonder mockup direction.',
  colors: {
    canvas: '#080c0d',
    surface: '#0b1213',
    surfaceElevated: '#10191a',
    surfaceInset: '#040708',
    chrome: '#0b1213',
    text: '#e7f6f0',
    textMuted: '#a7b8b2',
    textFaint: '#71827d',
    textOnAccent: '#071011',
    accent: '#94d9d0',
    selection: '#94d9d0',
    focus: '#bfeee8',
    success: '#86d89a',
    warning: '#d2b57a',
    danger: '#df7b70',
    border: '#17201f',
    borderStrong: '#5f807b',
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
    shelf: material('chrome', 'chrome', { opacity: 0.62, blurPx: 24, saturation: 0.9, shadowOpacity: 0.34, shadowBlurPx: 44, insetHighlight: 0.09 }),
    panel: material('surfaceInset', 'surfaceInset', { opacity: 0.48, blurPx: 20, saturation: 0.92, shadowOpacity: 0.22, shadowBlurPx: 34, insetHighlight: 0.06 }),
    widget: material('surfaceElevated', 'surfaceInset', { opacity: 0.74, blurPx: 18, saturation: 1.04, shadowOpacity: 0.28, shadowBlurPx: 38, insetHighlight: 0.08 }),
    field: material('shadow', 'surfaceInset', { opacity: 0.32, blurPx: 16, saturation: 0.96, shadowOpacity: 0.12, shadowBlurPx: 18, insetHighlight: 0.04 }),
    button: material('text', 'surfaceElevated', { opacity: 0.08, blurPx: 16, saturation: 1, shadowOpacity: 0.12, shadowBlurPx: 16, insetHighlight: 0.08 }),
    menu: material('chrome', 'chrome', { opacity: 0.88, blurPx: 32, saturation: 1.2, shadowOpacity: 0.62, shadowBlurPx: 100, insetHighlight: 0.1 }),
    dialog: material('chrome', 'chrome', { opacity: 0.9, blurPx: 32, saturation: 1.18, insetHighlight: 0.1 }),
    floating: material('surfaceElevated', 'surfaceInset', { opacity: 0.88, blurPx: 24, saturation: 1.08, shadowOpacity: 0.54, shadowBlurPx: 64, insetHighlight: 0.1 })
  },
  iconPackId: 'icons.minimal',
  assets: [
    { id: 'icons.minimal', kind: 'icon-pack', required: true },
    { id: 'image.deep-current-stage', kind: 'image', required: true }
  ],
  canvas: [
    { kind: 'linear-gradient', angle: 90, stops: [{ color: '#020506e0', position: 0 }, { color: '#07101238', position: 0.54 }, { color: '#020506b8', position: 1 }] },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.68, y: 0.38, stops: [{ color: '#94d9d02e', position: 0 }, { color: '#07101200', position: 0.58 }] },
    { kind: 'image', assetId: 'image.deep-current-stage', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 0.82, blend: 'normal' },
    { kind: 'solid', color: '#080c0d' }
  ],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: true }
};
