import { describe, expect, it } from 'vitest';

import type { ThemeDefinition } from '@pomegranate-ui/contracts';
import { migrateTheme } from './migrate.js';

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

describe('migrateTheme', () => {
  it('migrates legacy v1 themes into complete v2 recipes without changing identity', () => {
    const result = migrateTheme(VALID_THEME);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.theme).toMatchObject({
      schemaVersion: 'pomegranate.ui.theme.v2',
      id: 'resolver-fixture',
      label: 'Resolver fixture'
    });
    expect(result.theme.recipes.parts['widget.surface']).toMatchObject({
      material: 'widget',
      shape: 'widget'
    });
    expect(result.theme.controls.slider.hitTargetPx).toBe(44);
  });

  it('returns literal input diagnostics and never a partial migrated theme', () => {
    const result = migrateTheme({ schemaVersion: 'unsupported' });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result).not.toHaveProperty('theme');
    expect(result.diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        code: 'THEME_MIGRATION_INPUT_INVALID',
        path: ['schemaVersion']
      })
    ]));
  });

  it('is deterministic, deep-frozen, and idempotent for v2 inputs', () => {
    const first = migrateTheme(VALID_THEME);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = migrateTheme(first.theme);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.theme).toEqual(first.theme);
    expect(Object.isFrozen(second.theme)).toBe(true);
    expect(Object.isFrozen(second.theme.recipes.parts['widget.surface'])).toBe(true);
  });
});
