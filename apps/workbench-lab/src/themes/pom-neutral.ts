import { mergeTheme } from '@pomegranate-ui/theme';

import { DEEP_CURRENT_THEME } from './deep-current.js';

export const POM_NEUTRAL_THEME = mergeTheme(DEEP_CURRENT_THEME, {
  id: 'pom-neutral',
  label: 'Pom Neutral',
  description: 'An original modern desktop workspace with dimensional wallpaper, luminous frost, and quiet system chrome.',
  colors: {
    canvas: '#cfd9e8', surface: '#edf3fa', surfaceElevated: '#fbfdff', surfaceInset: '#dce6f1', chrome: '#f3f7fc',
    text: '#172234', textMuted: '#46566c', textFaint: '#68778b', textOnAccent: '#ffffff', accent: '#1768ce',
    selection: '#cfe1fb', focus: '#0758b7', success: '#247253', warning: '#805b00', danger: '#a83e55',
    border: '#b9c8da', borderStrong: '#8295ad', shadow: '#263b56'
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
    shelf: { base: 'surface', fallback: 'surface', opacity: 0.72, blurPx: 30, saturation: 1.14, border: 'border', shadow: 'shadow', shadowOpacity: 0.2, shadowBlurPx: 46, insetHighlight: 0.58, bloom: 0 },
    panel: { base: 'surface', fallback: 'surfaceInset', opacity: 0.56, blurPx: 24, saturation: 1.08, border: 'border', shadow: 'shadow', shadowOpacity: 0.12, shadowBlurPx: 30, insetHighlight: 0.55, bloom: 0 },
    widget: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.72, blurPx: 20, saturation: 1.08, border: 'border', shadow: 'shadow', shadowOpacity: 0.16, shadowBlurPx: 32, insetHighlight: 0.62, bloom: 0 },
    field: { base: 'surfaceInset', fallback: 'surfaceInset', opacity: 0.7, blurPx: 16, saturation: 1.04, border: 'border', shadow: 'shadow', shadowOpacity: 0.08, shadowBlurPx: 14, insetHighlight: 0.22, bloom: 0 },
    button: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.7, blurPx: 18, saturation: 1.06, border: 'border', shadow: 'shadow', shadowOpacity: 0.1, shadowBlurPx: 16, insetHighlight: 0.6, bloom: 0 },
    menu: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.96, blurPx: 30, saturation: 1.08, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.2, shadowBlurPx: 64, insetHighlight: 0.4, bloom: 0 },
    dialog: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 30, saturation: 1.08, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.22, shadowBlurPx: 72, insetHighlight: 0.4, bloom: 0 },
    floating: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.98, blurPx: 18, saturation: 1.05, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.24, shadowBlurPx: 58, insetHighlight: 0.45, bloom: 0 }
  },
  canvas: [
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.18, y: 0.12, stops: [{ color: '#f8fbff', position: 0 }, { color: '#dce7f500', position: 0.48 }] },
    { kind: 'four-corner', topLeft: '#e2edfb', topRight: '#9fb4d2', bottomLeft: '#7898a8', bottomRight: '#d4ae99' },
    { kind: 'linear-gradient', angle: 132, stops: [{ color: '#ffffff4d', position: 0 }, { color: '#8da2bd26', position: 0.5 }, { color: '#51698338', position: 1 }] },
    { kind: 'solid', color: '#cfd9e8' }
  ],
  capabilities: { translucency: true, textures: false, localImages: false }
});
