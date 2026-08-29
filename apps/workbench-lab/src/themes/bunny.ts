import { mergeTheme } from '@pomegranate-ui/theme';

import { DEEP_CURRENT_THEME } from './deep-current.js';

export const BUNNY_THEME = mergeTheme(DEEP_CURRENT_THEME, {
  id: 'bunny',
  label: 'Bunny',
  description: 'A polished Japanese stationery theme with milky glass, balanced pastels, and one restrained bunny signature.',
  colors: {
    canvas: '#f3ebe5', surface: '#fff9f5', surfaceElevated: '#fffdfb', surfaceInset: '#eeeaf5', chrome: '#fff7f3',
    text: '#493e50', textMuted: '#665a6d', textFaint: '#796d80', textOnAccent: '#382430', accent: '#df739d',
    selection: '#f8cddd', focus: '#6951a1', success: '#397a69', warning: '#825b00', danger: '#a84567',
    border: '#dfcbd8', borderStrong: '#b989a5', shadow: '#735d72'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 480, strongWeight: 700, lineHeight: 1.4, trackingEm: 0.01 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 400, strongWeight: 650, lineHeight: 1.62, trackingEm: 0.01 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.03 },
    display: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 650, strongWeight: 750, lineHeight: 1.18, trackingEm: 0.01 },
    scale: { xs: 11, sm: 13, md: 15, lg: 19, xl: 26 }
  },
  geometry: {
    cornerFamily: 'rounded', cornerSm: 10, cornerMd: 16, cornerLg: 24, cornerPill: 999, chamfer: 0, borderWidth: 1, sharedEdge: 'none', focusWidth: 3, focusOffset: 3
  },
  spacing: { density: 'roomy', xs: 6, sm: 9, md: 14, lg: 21, xl: 32, chromeHeight: 52 },
  materials: {
    canvas: { base: 'canvas', fallback: 'canvas', opacity: 1, blurPx: 0, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0, shadowBlurPx: 0, insetHighlight: 0, bloom: 0 },
    shelf: { base: 'chrome', fallback: 'surface', opacity: 0.74, blurPx: 30, saturation: 1.16, border: 'border', shadow: 'shadow', shadowOpacity: 0.18, shadowBlurPx: 42, insetHighlight: 0.72, bloom: 0.04 },
    panel: { base: 'surfaceInset', fallback: 'surfaceInset', opacity: 0.62, blurPx: 22, saturation: 1.1, border: 'border', shadow: 'shadow', shadowOpacity: 0.1, shadowBlurPx: 26, insetHighlight: 0.48, bloom: 0 },
    widget: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.82, blurPx: 20, saturation: 1.12, border: 'border', shadow: 'shadow', shadowOpacity: 0.16, shadowBlurPx: 34, insetHighlight: 0.78, bloom: 0.04 },
    field: { base: 'surfaceInset', fallback: 'surfaceInset', opacity: 0.72, blurPx: 14, saturation: 1.08, border: 'border', shadow: 'shadow', shadowOpacity: 0.06, shadowBlurPx: 14, insetHighlight: 0.32, bloom: 0 },
    button: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.68, blurPx: 12, saturation: 1.08, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.1, shadowBlurPx: 16, insetHighlight: 0.72, bloom: 0.04 },
    menu: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.97, blurPx: 28, saturation: 1.12, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.2, shadowBlurPx: 62, insetHighlight: 0.62, bloom: 0.06 },
    dialog: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 28, saturation: 1.12, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.22, shadowBlurPx: 70, insetHighlight: 0.66, bloom: 0.06 },
    floating: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 16, saturation: 1.1, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.22, shadowBlurPx: 56, insetHighlight: 0.7, bloom: 0.08 }
  },
  canvas: [
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.5, y: 0.18, stops: [{ color: '#fffdfbf2', position: 0 }, { color: '#f3ebe500', position: 0.58 }] },
    { kind: 'four-corner', topLeft: '#f6cedd', topRight: '#d9d2f1', bottomLeft: '#d5ece5', bottomRight: '#f1deb9' },
    { kind: 'conic-gradient', angle: 16, x: 0.52, y: 0.45, stops: [{ color: '#ffffff24', position: 0 }, { color: '#df739d18', position: 0.32 }, { color: '#7ec7b71f', position: 0.66 }, { color: '#ffffff24', position: 1 }] },
    { kind: 'solid', color: '#f3ebe5' }
  ],
  capabilities: { translucency: true, textures: false, localImages: false }
});
