import { mergeTheme } from '@pomegranate-ui/theme';

import { DEEP_CURRENT_THEME } from './deep-current.js';

export const BUNNY_THEME = mergeTheme(DEEP_CURRENT_THEME, {
  id: 'bunny',
  label: 'Bunny',
  description: 'An original kawaii-inspired pastel theme with pillowy geometry, friendly type, and uncompromised readability.',
  colors: {
    canvas: '#faeef6', surface: '#fff8fc', surfaceElevated: '#ffffff', surfaceInset: '#f3eaf9', chrome: '#fff1f7',
    text: '#45364d', textMuted: '#67566f', textFaint: '#806f88', textOnAccent: '#3b2634', accent: '#ed75aa',
    selection: '#ffd4e5', focus: '#7552bd', success: '#3c8a73', warning: '#8b6200', danger: '#ad4267',
    border: '#e8cddd', borderStrong: '#c891ae', shadow: '#765775'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 480, strongWeight: 700, lineHeight: 1.4, trackingEm: 0.01 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 400, strongWeight: 650, lineHeight: 1.62, trackingEm: 0.01 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.03 },
    display: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 650, strongWeight: 750, lineHeight: 1.18, trackingEm: 0.01 },
    scale: { xs: 11, sm: 13, md: 15, lg: 19, xl: 26 }
  },
  geometry: {
    cornerFamily: 'pill', cornerSm: 10, cornerMd: 18, cornerLg: 26, cornerPill: 999, chamfer: 0, borderWidth: 1.5, sharedEdge: 'none', focusWidth: 3, focusOffset: 3
  },
  spacing: { density: 'roomy', xs: 6, sm: 9, md: 14, lg: 21, xl: 32, chromeHeight: 52 },
  materials: {
    canvas: { base: 'canvas', fallback: 'canvas', opacity: 1, blurPx: 0, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0, shadowBlurPx: 0, insetHighlight: 0, bloom: 0 },
    shelf: { base: 'chrome', fallback: 'surface', opacity: 0.9, blurPx: 22, saturation: 1.12, border: 'border', shadow: 'shadow', shadowOpacity: 0.12, shadowBlurPx: 36, insetHighlight: 0.62, bloom: 0.08 },
    panel: { base: 'surfaceInset', fallback: 'surfaceInset', opacity: 0.66, blurPx: 0, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0, shadowBlurPx: 0, insetHighlight: 0.34, bloom: 0 },
    widget: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.95, blurPx: 12, saturation: 1.08, border: 'border', shadow: 'shadow', shadowOpacity: 0.13, shadowBlurPx: 30, insetHighlight: 0.7, bloom: 0.06 },
    field: { base: 'surfaceInset', fallback: 'surfaceInset', opacity: 0.86, blurPx: 0, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0, shadowBlurPx: 0, insetHighlight: 0.25, bloom: 0 },
    button: { base: 'selection', fallback: 'surfaceElevated', opacity: 0.76, blurPx: 6, saturation: 1.05, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.08, shadowBlurPx: 14, insetHighlight: 0.7, bloom: 0.05 },
    menu: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.97, blurPx: 28, saturation: 1.12, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.2, shadowBlurPx: 62, insetHighlight: 0.62, bloom: 0.06 },
    dialog: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 28, saturation: 1.12, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.22, shadowBlurPx: 70, insetHighlight: 0.66, bloom: 0.06 },
    floating: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 16, saturation: 1.1, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.22, shadowBlurPx: 56, insetHighlight: 0.7, bloom: 0.08 }
  },
  canvas: [
    { kind: 'four-corner', topLeft: '#ffd8e8', topRight: '#e4dcff', bottomLeft: '#d5f3e9', bottomRight: '#fff0bd' },
    { kind: 'radial-gradient', shape: 'circle', x: 0.5, y: 0.22, stops: [{ color: '#ffffffee', position: 0 }, { color: '#faeef600', position: 0.7 }] },
    { kind: 'solid', color: '#faeef6' }
  ],
  capabilities: { translucency: true, textures: false, localImages: false }
});
