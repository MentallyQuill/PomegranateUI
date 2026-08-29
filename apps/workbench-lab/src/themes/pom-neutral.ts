import { mergeTheme } from '@pomegranate-ui/theme';

import { DEEP_CURRENT_THEME } from './deep-current.js';

export const POM_NEUTRAL_THEME = mergeTheme(DEEP_CURRENT_THEME, {
  id: 'pom-neutral',
  label: 'PomOS',
  description: 'An original blue desktop workspace with floating liquid glass, luminous edges, and calm system chrome.',
  colors: {
    canvas: '#1687ed', surface: '#f6faff', surfaceElevated: '#ffffff', surfaceInset: '#e7eef7', chrome: '#f8fbff',
    text: '#131a23', textMuted: '#151d28', textFaint: '#0d1826', textOnAccent: '#ffffff', accent: '#0868c4',
    selection: '#b9ddff', focus: '#071d38', success: '#247253', warning: '#805b00', danger: '#a83e55',
    border: '#b8c8dc', borderStrong: '#7e94af', shadow: '#153b68'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 430, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 400, strongWeight: 600, lineHeight: 1.52, trackingEm: 0 },
    technical: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.01 },
    display: { family: 'Pomegranate Sans', fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'], weight: 560, strongWeight: 680, lineHeight: 1.15, trackingEm: -0.01 }
  },
  geometry: {
    cornerFamily: 'rounded', cornerSm: 10, cornerMd: 18, cornerLg: 24, chamfer: 0, borderWidth: 1, sharedEdge: 'hairline', focusWidth: 2, focusOffset: 2
  },
  spacing: { density: 'balanced', xs: 5, sm: 8, md: 12, lg: 18, xl: 28, chromeHeight: 36 },
  materials: {
    canvas: { base: 'canvas', fallback: 'canvas', opacity: 1, blurPx: 0, saturation: 1, border: 'border', shadow: 'shadow', shadowOpacity: 0, shadowBlurPx: 0, insetHighlight: 0, bloom: 0 },
    shelf: { base: 'surface', fallback: 'surface', opacity: 0.32, blurPx: 28, saturation: 1.28, border: 'border', shadow: 'shadow', shadowOpacity: 0.08, shadowBlurPx: 24, insetHighlight: 0.44, bloom: 0 },
    panel: { base: 'surface', fallback: 'surfaceInset', opacity: 0.18, blurPx: 28, saturation: 1.2, border: 'border', shadow: 'shadow', shadowOpacity: 0.08, shadowBlurPx: 30, insetHighlight: 0.5, bloom: 0 },
    widget: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.5, blurPx: 28, saturation: 1.22, border: 'border', shadow: 'shadow', shadowOpacity: 0.22, shadowBlurPx: 48, insetHighlight: 0.7, bloom: 0 },
    field: { base: 'surfaceElevated', fallback: 'surfaceInset', opacity: 0.52, blurPx: 20, saturation: 1.16, border: 'border', shadow: 'shadow', shadowOpacity: 0.08, shadowBlurPx: 14, insetHighlight: 0.32, bloom: 0 },
    button: { base: 'surfaceElevated', fallback: 'surface', opacity: 0.44, blurPx: 22, saturation: 1.18, border: 'border', shadow: 'shadow', shadowOpacity: 0.09, shadowBlurPx: 16, insetHighlight: 0.62, bloom: 0 },
    menu: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.78, blurPx: 30, saturation: 1.2, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.24, shadowBlurPx: 64, insetHighlight: 0.55, bloom: 0 },
    dialog: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.82, blurPx: 30, saturation: 1.18, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.26, shadowBlurPx: 72, insetHighlight: 0.55, bloom: 0 },
    floating: { base: 'surfaceElevated', fallback: 'surfaceElevated', opacity: 0.72, blurPx: 26, saturation: 1.2, border: 'borderStrong', shadow: 'shadow', shadowOpacity: 0.28, shadowBlurPx: 64, insetHighlight: 0.58, bloom: 0 }
  },
  canvas: [
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.08, y: 0.82, stops: [{ color: '#eefaffea', position: 0 }, { color: '#a6ddff99', position: 0.24 }, { color: '#2691ef00', position: 0.54 }] },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.9, y: 0.08, stops: [{ color: '#bdf7ffdd', position: 0 }, { color: '#42c8ff88', position: 0.25 }, { color: '#245fd900', position: 0.56 }] },
    { kind: 'radial-gradient', shape: 'ellipse', x: 0.62, y: 0.92, stops: [{ color: '#f3f6ffd4', position: 0 }, { color: '#939eff70', position: 0.28 }, { color: '#3528aa00', position: 0.62 }] },
    { kind: 'four-corner', topLeft: '#8bd6ff', topRight: '#1687ed', bottomLeft: '#0061ce', bottomRight: '#5445d8' },
    { kind: 'linear-gradient', angle: 124, stops: [{ color: '#ffffff52', position: 0 }, { color: '#63c8ff1f', position: 0.42 }, { color: '#182d9b4d', position: 1 }] },
    { kind: 'solid', color: '#1687ed' }
  ],
  capabilities: { translucency: true, textures: false, localImages: false }
});
