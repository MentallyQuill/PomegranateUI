import { describe, expect, it } from 'vitest';

import type { ThemeDefinition } from '@pomegranate-ui/contracts';
import { applyThemePolicy, collectThemeAssetIds, contrastRatio, mergeTheme, resolveTheme, resolveThemeV2 } from './index.js';

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
  it('resolves both schema generations into an immutable v2 presentation model', () => {
    const result = resolveThemeV2(VALID_THEME, {
      'icons.minimal': { kind: 'icon-pack', source: '/assets/minimal-icons.svg' }
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme.schemaVersion).toBe('pomegranate.ui.theme.v2');
    expect(result.theme.materials.widget).toMatchObject({
      base: '#29252d',
      fallback: '#29252d'
    });
    expect(result.theme.assets['icons.minimal']).toEqual({
      kind: 'icon-pack',
      source: '/assets/minimal-icons.svg'
    });
    expect(Object.isFrozen(result.theme)).toBe(true);
    expect(Object.isFrozen(result.theme.recipes.parts['widget.surface'])).toBe(true);
  });

  it('fails closed with a literal diagnostic when a required icon pack is unavailable', () => {
    const result = resolveThemeV2(VALID_THEME, {});

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result).not.toHaveProperty('theme');
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'THEME_ICON_PACK_MISSING', path: ['iconPackId'] })
    ]));
  });

  it('lets device accessibility veto replace translucent part materials without mutating the source', () => {
    const resolved = resolveThemeV2(VALID_THEME, {
      'icons.minimal': { kind: 'icon-pack', source: '/assets/minimal-icons.svg' }
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    const originalMaterial = resolved.theme.recipes.parts['widget.surface'].material;

    const effective = applyThemePolicy(resolved.theme, {
      runtime: { materialOpacity: { widget: 0.4 }, materialBlurPx: { widget: 18 } },
      device: { reducedTransparency: true }
    });

    expect(effective.recipes.parts['widget.surface'].material).toBe('widget-opaque');
    expect(effective.materials['widget-opaque']).toMatchObject({
      opacity: 1,
      backdrop: { blurPx: 0 }
    });
    expect(resolved.theme.recipes.parts['widget.surface'].material).toBe(originalMaterial);
    expect(Object.isFrozen(effective)).toBe(true);
  });

  it('applies bounded user material preferences after runtime overrides', () => {
    const resolved = resolveThemeV2(VALID_THEME, {
      'icons.minimal': { kind: 'icon-pack', source: '/assets/minimal-icons.svg' }
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    const effective = applyThemePolicy(resolved.theme, {
      runtime: { materialOpacity: { widget: 0.7 }, materialBlurPx: { widget: 18 } },
      user: { materialOpacity: { widget: 0.35 }, materialBlurPx: { widget: 200 } },
      device: { maximumBlurPx: 30 }
    });

    expect(effective.materials.widget?.opacity).toBe(0.35);
    expect(effective.materials.widget?.backdrop.blurPx).toBe(30);
  });

  it('collects v2 asset dependencies in deterministic first-use order', () => {
    const resolved = resolveThemeV2(VALID_THEME, {
      'icons.minimal': { kind: 'icon-pack', source: '/assets/minimal-icons.svg' }
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;

    expect(collectThemeAssetIds(resolved.theme)).toEqual(['icons.minimal']);
  });

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
