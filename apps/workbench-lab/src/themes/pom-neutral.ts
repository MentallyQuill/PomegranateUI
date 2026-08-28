import { mergeTheme } from '@pomegranate-ui/theme';

import { DEEP_CURRENT_THEME } from './deep-current.js';

export const POM_NEUTRAL_THEME = mergeTheme(DEEP_CURRENT_THEME, {
  id: 'pom-neutral',
  label: 'Pom Neutral',
  description: 'A calm, original desktop-inspired light theme with restrained translucency and moderate rounding.',
  colors: {
    canvas: '#e7e9ed', surface: '#f7f8fa', surfaceElevated: '#ffffff', surfaceInset: '#e8ebef', chrome: '#f1f3f6',
    text: '#1f252d', textMuted: '#505966', textFaint: '#687280', textOnAccent: '#ffffff', accent: '#3369d6',
    selection: '#cbdcff', focus: '#245ccb', success: '#24724b', warning: '#805800', danger: '#a33a4b',
    border: '#cdd2d9', borderStrong: '#aeb6c1', shadow: '#39414d'
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
    panel: { base: 'surfaceInset', fallback: 'surfaceInset', opacity: 0.64, blurPx: 0, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0, shadowBlurPx: 0, insetHighlight: 0.2, bloom: 0 },
    widget: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.94, blurPx: 12, saturation: 1.04, border: 'border', shadow: 'shadow', shadowOpacity: 0.11, shadowBlurPx: 28, insetHighlight: 0.5, bloom: 0 },
    field: { base: 'surfaceInset', fallback: 'surfaceInset', opacity: 0.82, blurPx: 0, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0, shadowBlurPx: 0, insetHighlight: 0.12, bloom: 0 },
    button: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.76, blurPx: 8, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0.07, shadowBlurPx: 12, insetHighlight: 0.45, bloom: 0 },
    menu: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.96, blurPx: 30, saturation: 1.08, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.2, shadowBlurPx: 64, insetHighlight: 0.4, bloom: 0 },
    dialog: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 30, saturation: 1.08, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.22, shadowBlurPx: 72, insetHighlight: 0.4, bloom: 0 },
    floating: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 18, saturation: 1.05, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.24, shadowBlurPx: 58, insetHighlight: 0.45, bloom: 0 }
  },
  canvas: [
    { kind: 'linear-gradient', angle: 155, stops: [{ color: '#ffffffcc', position: 0 }, { color: '#dbe0e899', position: 1 }] },
    { kind: 'radial-gradient', shape: 'circle', x: 0.18, y: 0.12, stops: [{ color: '#ffffffcc', position: 0 }, { color: '#e7e9ed00', position: 1 }] },
    { kind: 'solid', color: '#e7e9ed' }
  ],
  capabilities: { translucency: true, textures: false, localImages: false }
});
