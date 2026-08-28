import { describe, expect, it } from 'vitest';

import type { ThemeDefinition } from '@pomegranate-ui/contracts';
import { collectThemeAssetIds, contrastRatio, mergeTheme, resolveTheme } from './index.js';

const material = (base: ThemeDefinition['materials']['widget']['base']) => ({
  base,
  fallback: base,
  opacity: 0.88,
  blurPx: 22,
  saturation: 1.18,
  border: 'border' as const,
  shadow: 'shadow' as const,
  shadowOpacity: 0.38,
  shadowBlurPx: 70,
  insetHighlight: 0.05,
  bloom: 0
});

const VALID_THEME: ThemeDefinition = {
  schemaVersion: 'pomegranate.ui.theme.v1',
  id: 'resolver-fixture',
  label: 'Resolver fixture',
  colors: {
    canvas: '#111014', surface: '#1f1c22', surfaceElevated: '#29252d', surfaceInset: '#0c0b0e', chrome: '#141217',
    text: '#f6f2eb', textMuted: '#a9a0a0', textFaint: '#756c70', textOnAccent: '#111014', accent: '#e2a069',
    selection: '#ffc38d', focus: '#ffc38d', success: '#769885', warning: '#e2a069', danger: '#f0b0a2',
    border: '#353139', borderStrong: '#665044', shadow: '#000000'
  },
  typography: {
    ui: { family: 'Pomegranate Sans', fallbacks: ['system-ui', 'sans-serif'], weight: 450, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
    prose: { family: 'Pomegranate Serif', fallbacks: ['serif'], weight: 400, strongWeight: 600, lineHeight: 1.58, trackingEm: 0 },
    technical: { family: 'Pomegranate Mono', fallbacks: ['monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.04 },
    scale: { xs: 11, sm: 12, md: 14, lg: 18, xl: 24 }
  },
  geometry: {
    cornerFamily: 'chamfered', cornerSm: 4, cornerMd: 8, cornerLg: 14, cornerPill: 999, chamfer: 6,
    chamferAngle: 45, borderWidth: 1, sharedEdge: 'hairline', focusWidth: 2, focusOffset: 2
  },
  spacing: { density: 'balanced', xs: 4, sm: 6, md: 10, lg: 16, xl: 24, chromeHeight: 44 },
  materials: {
    canvas: material('canvas'), shelf: material('surface'), panel: material('surface'), widget: material('surfaceElevated'),
    field: material('surfaceInset'), button: material('surfaceElevated'), menu: material('chrome'), dialog: material('chrome'),
    floating: material('surfaceElevated')
  },
  iconPackId: 'icons.minimal',
  assets: [{ id: 'icons.minimal', kind: 'icon-pack', required: true }],
  canvas: [{ kind: 'solid', color: '#111014' }],
  accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
  capabilities: { translucency: true, textures: false, localImages: false }
};

describe('resolveTheme', () => {
  it('resolves material color roles into immutable presentation-neutral values', () => {
    const result = resolveTheme(VALID_THEME);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.materials.widget).toMatchObject({
      base: '#29252d',
      border: '#353139',
      fallback: '#29252d'
    });
    expect(Object.isFrozen(result.theme)).toBe(true);
    expect(Object.isFrozen(result.theme.materials.widget)).toBe(true);
  });

  it('deep-merges semantic objects and replaces ordered arrays', () => {
    const merged = mergeTheme(VALID_THEME, {
      label: 'Changed fixture',
      colors: { accent: '#112233' },
      canvas: [{ kind: 'solid', color: '#010203' }]
    });
    expect(merged.label).toBe('Changed fixture');
    expect(merged.colors.text).toBe('#f6f2eb');
    expect(merged.colors.accent).toBe('#112233');
    expect(merged.canvas).toEqual([{ kind: 'solid', color: '#010203' }]);
  });

  it('deduplicates local asset ids in deterministic first-use order', () => {
    const result = resolveTheme({
      ...VALID_THEME,
      assets: [
        { id: 'icons.minimal', kind: 'icon-pack', required: true },
        { id: 'texture.paper', kind: 'texture', required: false },
        { id: 'image.hero', kind: 'image', required: false }
      ],
      materials: {
        ...VALID_THEME.materials,
        widget: { ...VALID_THEME.materials.widget, textureAssetId: 'texture.paper' }
      },
      canvas: [
        { kind: 'solid', color: '#111014' },
        { kind: 'image', assetId: 'image.hero', fit: 'cover', x: 0.5, y: 0.5, opacity: 1, blurPx: 0, saturation: 1, blend: 'normal' }
      ]
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(collectThemeAssetIds(result.theme)).toEqual(['icons.minimal', 'texture.paper', 'image.hero']);
  });

  it('calculates known WCAG contrast ratios without browser APIs', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.478, 3);
  });

  it('returns literal schema diagnostics with public paths', () => {
    const result = resolveTheme({ schemaVersion: 'wrong' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'THEME_SCHEMA_INVALID', path: ['schemaVersion'] })
    ]));
  });
});
