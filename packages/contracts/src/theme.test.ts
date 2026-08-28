import { describe, expect, it } from 'vitest';

import { ThemeDefinitionSchema } from './theme.js';

const material = (base: string, fallback = base) => ({
  base,
  fallback,
  opacity: 0.88,
  blurPx: 22,
  saturation: 1.18,
  border: 'border',
  shadow: 'shadow',
  shadowOpacity: 0.38,
  shadowBlurPx: 70,
  insetHighlight: 0.05,
  bloom: 0
});

export const VALID_THEME = {
  schemaVersion: 'pomegranate.ui.theme.v1',
  id: 'test-deep-current',
  label: 'Test Deep Current',
  description: 'A complete contract fixture.',
  colors: {
    canvas: '#111014',
    surface: '#1f1c22',
    surfaceElevated: '#29252d',
    surfaceInset: '#0c0b0e',
    chrome: '#141217',
    text: '#f6f2eb',
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
    cornerSm: 4,
    cornerMd: 8,
    cornerLg: 14,
    cornerPill: 999,
    chamfer: 6,
    chamferAngle: 45,
    borderWidth: 1,
    sharedEdge: 'hairline',
    focusWidth: 2,
    focusOffset: 2
  },
  spacing: {
    density: 'balanced',
    xs: 4,
    sm: 6,
    md: 10,
    lg: 16,
    xl: 24,
    chromeHeight: 44
  },
  materials: {
    canvas: material('canvas'),
    shelf: material('surface'),
    panel: material('surface'),
    widget: material('surfaceElevated'),
    field: material('surfaceInset'),
    button: material('surfaceElevated'),
    menu: material('chrome'),
    dialog: material('chrome'),
    floating: material('surfaceElevated')
  },
  iconPackId: 'icons.minimal',
  assets: [{ id: 'icons.minimal', kind: 'icon-pack', required: true }],
  canvas: [
    { kind: 'solid', color: '#111014' },
    {
      kind: 'radial-gradient',
      shape: 'circle',
      x: 0.18,
      y: 0.2,
      stops: [
        { color: '#893d48', position: 0 },
        { color: '#11101400', position: 1 }
      ]
    },
    { kind: 'veil', mode: 'reading', color: '#111014', opacity: 0.2 }
  ],
  accessibility: {
    minimumContrast: 4.5,
    largeTextContrast: 3,
    coarsePointerMinimum: 44,
    reducedTransparencySurface: 'surface'
  },
  capabilities: {
    translucency: true,
    textures: false,
    localImages: false
  }
} as const;

describe('ThemeDefinitionSchema', () => {
  it('accepts a complete pomegranate.ui.theme.v1 definition', () => {
    const parsed = ThemeDefinitionSchema.parse(VALID_THEME);
    expect(parsed.schemaVersion).toBe('pomegranate.ui.theme.v1');
    expect(parsed.colors.text).toBe('#f6f2eb');
    expect(parsed.materials.widget.base).toBe('surfaceElevated');
    expect(parsed.canvas.map((layer) => layer.kind)).toEqual(['solid', 'radial-gradient', 'veil']);
  });

  it('rejects duplicate local asset identifiers', () => {
    const result = ThemeDefinitionSchema.safeParse({
      ...VALID_THEME,
      assets: [
        { id: 'icons.minimal', kind: 'icon-pack', required: true },
        { id: 'icons.minimal', kind: 'image', required: false }
      ]
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === 'assets')).toBe(true);
    }
  });

  it.each([
    {
      name: 'an unknown schema version',
      candidate: { ...VALID_THEME, schemaVersion: 'pomegranate.ui.theme.v2' },
      path: 'schemaVersion'
    },
    {
      name: 'a remote image URL',
      candidate: {
        ...VALID_THEME,
        canvas: [{ kind: 'image', assetId: 'https://example.test/a.png', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 1, blend: 'normal' }]
      },
      path: 'canvas.0.assetId'
    },
    {
      name: 'an arbitrary selector',
      candidate: { ...VALID_THEME, selector: 'main[data-theme]' },
      path: ''
    },
    {
      name: 'a missing semantic text role',
      candidate: { ...VALID_THEME, colors: { ...VALID_THEME.colors, text: undefined } },
      path: 'colors.text'
    }
  ])('rejects $name', ({ candidate, path }) => {
    const result = ThemeDefinitionSchema.safeParse(candidate);
    expect(result.success).toBe(false);
    if (!result.success && path.length > 0) {
      expect(result.error.issues.some((issue) => issue.path.join('.') === path)).toBe(true);
    }
  });
});
