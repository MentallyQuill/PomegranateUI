import { mergeTheme } from '@pomegranate-ui/theme';

import { DEEP_CURRENT_THEME } from './deep-current.js';

export const POM_NEUTRAL_THEME = mergeTheme(DEEP_CURRENT_THEME, {
  id: 'pom-neutral',
  label: 'Pom Neutral',
  description: 'A calm, original desktop-inspired light theme with restrained translucency and moderate rounding.',
  colors: {
    canvas: '#dfe7f1', surface: '#f5f8fc', surfaceElevated: '#ffffff', surfaceInset: '#e8eef6', chrome: '#f8fafc',
    text: '#18212d', textMuted: '#4d5a6b', textFaint: '#69778a', textOnAccent: '#ffffff', accent: '#2f68cc',
    selection: '#d9e7ff', focus: '#1f5fc4', success: '#1f7a55', warning: '#8a6200', danger: '#b33f56',
    border: '#c7d1df', borderStrong: '#98a8bc', shadow: '#26384d'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 430, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['ui-serif', 'serif'], weight: 400, strongWeight: 600, lineHeight: 1.55, trackingEm: 0 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['ui-monospace', 'monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.02 },
    display: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 560, strongWeight: 680, lineHeight: 1.15, trackingEm: -0.01 }
  },
  geometry: {
    cornerFamily: 'rounded', cornerSm: 7, cornerMd: 12, cornerLg: 18, chamfer: 0, borderWidth: 1, sharedEdge: 'hairline', focusWidth: 2, focusOffset: 2
  },
  spacing: { density: 'balanced', xs: 5, sm: 8, md: 12, lg: 18, xl: 28, chromeHeight: 48 },
  materials: {
    canvas: { base: 'canvas', fallback: 'canvas', opacity: 1, blurPx: 0, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0, shadowBlurPx: 0, insetHighlight: 0, bloom: 0 },
    shelf: { base: 'surface', fallback: 'surface', opacity: 0.9, blurPx: 24, saturation: 1.08, border: 'border', shadow: 'shadow', shadowOpacity: 0.13, shadowBlurPx: 38, insetHighlight: 0.45, bloom: 0 },
    panel: { base: 'surface', fallback: 'surfaceInset', opacity: 0.86, blurPx: 14, saturation: 1.02, border: 'border', shadow: 'shadow', shadowOpacity: 0.06, shadowBlurPx: 24, insetHighlight: 0.45, bloom: 0 },
    widget: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.94, blurPx: 12, saturation: 1.04, border: 'border', shadow: 'shadow', shadowOpacity: 0.11, shadowBlurPx: 28, insetHighlight: 0.5, bloom: 0 },
    field: { base: 'surfaceInset', fallback: 'surfaceInset', opacity: 0.82, blurPx: 0, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0, shadowBlurPx: 0, insetHighlight: 0.12, bloom: 0 },
    button: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.76, blurPx: 8, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0.07, shadowBlurPx: 12, insetHighlight: 0.45, bloom: 0 },
    menu: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.96, blurPx: 30, saturation: 1.08, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.2, shadowBlurPx: 64, insetHighlight: 0.4, bloom: 0 },
    dialog: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 30, saturation: 1.08, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.22, shadowBlurPx: 72, insetHighlight: 0.4, bloom: 0 },
    floating: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 18, saturation: 1.05, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.24, shadowBlurPx: 58, insetHighlight: 0.45, bloom: 0 }
  },
  canvas: [
    { kind: 'linear-gradient', angle: 145, stops: [{ color: '#f8fbff', position: 0 }, { color: '#d8e2ef', position: 1 }] },
    { kind: 'radial-gradient', shape: 'circle', x: 0.2, y: 0.08, stops: [{ color: '#ffffff', position: 0 }, { color: '#dfe7f100', position: 0.62 }] },
    { kind: 'solid', color: '#dfe7f1' }
  ],
  capabilities: { translucency: true, textures: false, localImages: false }
});
