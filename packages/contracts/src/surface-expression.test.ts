import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SURFACE_EXPRESSION,
  SURFACE_EXPRESSION_SCHEMA_VERSION,
  SURFACE_EXPRESSION_TYPE_SCALE,
  SurfaceExpressionProfileSchema
} from './surface-expression.js';

const validProfile = () => ({
  schemaVersion: 'pomegranate.ui.surface-expression.v1',
  id: 'soft-stationery',
  shapes: {
    'asymmetric-shell': {
      cornerRadiiPx: { topLeft: 12, topRight: 12, bottomRight: 26, bottomLeft: 26 }
    }
  },
  materials: {
    'milky-pane': {
      fill: {
        kind: 'linear-gradient',
        angleDeg: 150,
        stops: [
          { colorRole: 'surfaceElevated', opacity: 0.95, position: 0 },
          { colorRole: 'surface', opacity: 0.98, position: 1 }
        ]
      }
    }
  },
  parts: {
    'panel.surface': { typeScale: 'lg', textTransform: 'none' }
  }
});

describe('SurfaceExpressionProfileSchema', () => {
  it('accepts reusable shape, material, and fixed-part presentation overrides', () => {
    expect(SurfaceExpressionProfileSchema.parse(validProfile())).toEqual(validProfile());
  });

  it('provides a deeply frozen empty fallback profile', () => {
    expect(DEFAULT_SURFACE_EXPRESSION).toEqual({
      schemaVersion: SURFACE_EXPRESSION_SCHEMA_VERSION,
      id: 'default',
      shapes: {},
      materials: {},
      parts: {}
    });
    expect(Object.isFrozen(DEFAULT_SURFACE_EXPRESSION)).toBe(true);
    expect(Object.isFrozen(DEFAULT_SURFACE_EXPRESSION.parts)).toBe(true);
  });

  it('rejects more expression records than the existing theme maxima', () => {
    const shapes = Object.fromEntries(Array.from({ length: 17 }, (_, index) => [
      `shape-${index}`,
      { cornerRadiiPx: { topLeft: 1, topRight: 1, bottomRight: 1, bottomLeft: 1 } }
    ]));
    const materials = Object.fromEntries(Array.from({ length: 33 }, (_, index) => [
      `material-${index}`,
      validProfile().materials['milky-pane']
    ]));

    expect(SurfaceExpressionProfileSchema.safeParse({ ...validProfile(), shapes }).success).toBe(false);
    expect(SurfaceExpressionProfileSchema.safeParse({ ...validProfile(), materials }).success).toBe(false);
  });

  it.each([
    ['negative radius', (profile: ReturnType<typeof validProfile>) => { profile.shapes['asymmetric-shell'].cornerRadiiPx.topLeft = -1; }],
    ['radius above 999', (profile: ReturnType<typeof validProfile>) => { profile.shapes['asymmetric-shell'].cornerRadiiPx.bottomRight = 1000; }],
    ['angle above 360', (profile: ReturnType<typeof validProfile>) => { profile.materials['milky-pane'].fill.angleDeg = 361; }],
    ['opacity above one', (profile: ReturnType<typeof validProfile>) => { profile.materials['milky-pane'].fill.stops[0]!.opacity = 1.01; }],
    ['position below zero', (profile: ReturnType<typeof validProfile>) => { profile.materials['milky-pane'].fill.stops[0]!.position = -0.01; }]
  ])('rejects a %s', (_label, mutate) => {
    const profile = validProfile();
    mutate(profile);
    expect(SurfaceExpressionProfileSchema.safeParse(profile).success).toBe(false);
  });

  it('requires two through eight ordered semantic gradient stops', () => {
    const tooFew = validProfile();
    tooFew.materials['milky-pane'].fill.stops = [
      { colorRole: 'surface', opacity: 1, position: 0 }
    ];
    const tooMany = validProfile();
    tooMany.materials['milky-pane'].fill.stops = Array.from({ length: 9 }, (_, index) => ({
      colorRole: 'surface' as const,
      opacity: 1,
      position: index / 8
    }));
    const unordered = validProfile();
    unordered.materials['milky-pane'].fill.stops = [
      { colorRole: 'surface', opacity: 1, position: 0.8 },
      { colorRole: 'surfaceElevated', opacity: 1, position: 0.2 }
    ];
    const rawColor = validProfile() as ReturnType<typeof validProfile> & {
      materials: { 'milky-pane': { fill: { stops: Array<{ colorRole: string; opacity: number; position: number }> } } }
    };
    rawColor.materials['milky-pane'].fill.stops[0]!.colorRole = '#ffffff';

    expect(SurfaceExpressionProfileSchema.safeParse(tooFew).success).toBe(false);
    expect(SurfaceExpressionProfileSchema.safeParse(tooMany).success).toBe(false);
    expect(SurfaceExpressionProfileSchema.safeParse(unordered).success).toBe(false);
    expect(SurfaceExpressionProfileSchema.safeParse(rawColor).success).toBe(false);
  });

  it('uses a strict optional-key object generated from the fixed Theme part IDs', () => {
    const unknownPart = {
      ...validProfile(),
      parts: { ...validProfile().parts, 'bunny.special': { typeScale: 'lg' } }
    };
    const emptyOverride = {
      ...validProfile(),
      parts: { 'panel.surface': {} }
    };

    expect(SurfaceExpressionProfileSchema.safeParse({ ...validProfile(), parts: {} }).success).toBe(true);
    expect(SurfaceExpressionProfileSchema.safeParse(unknownPart).success).toBe(false);
    expect(SurfaceExpressionProfileSchema.safeParse(emptyOverride).success).toBe(false);
  });
});

describe('SURFACE_EXPRESSION_TYPE_SCALE', () => {
  it('defines literal, deeply frozen typography values including the 17px reading step', () => {
    expect(SURFACE_EXPRESSION_TYPE_SCALE).toEqual({
      xs: { fontSizePx: 11, lineHeight: 1.4, letterSpacingEm: 0.01 },
      sm: { fontSizePx: 12, lineHeight: 1.4, letterSpacingEm: 0.01 },
      md: { fontSizePx: 14, lineHeight: 1.45, letterSpacingEm: 0 },
      lg: { fontSizePx: 17, lineHeight: 1.55, letterSpacingEm: 0 },
      xl: { fontSizePx: 21, lineHeight: 1.25, letterSpacingEm: 0.01 }
    });
    expect(Object.isFrozen(SURFACE_EXPRESSION_TYPE_SCALE)).toBe(true);
    expect(Object.isFrozen(SURFACE_EXPRESSION_TYPE_SCALE.lg)).toBe(true);
  });
});
