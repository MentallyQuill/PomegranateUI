import { describe, expect, it } from 'vitest';

import { ThemeSemanticColorsSchema } from '@pomegranate-ui/contracts';
import {
  validateThemePalette,
  type ThemePaletteRoleGroupConstraint
} from './palette-constraints.js';

describe('opt-in theme palette constraints', () => {
  it('accepts warm-neutral role groups and ignores excluded hues below their saturation threshold', () => {
    const result = validateThemePalette(
      {
        canvas: '#242321',
        surface: '#302E2A',
        chrome: '#625B52',
        text: '#777777',
        accent: '#C18A3D'
      },
      [
        { id: 'neutral-surfaces', roles: ['canvas', 'surface', 'chrome'], maximumSaturation: 0.2 },
        {
          id: 'no-purple',
          roles: ['canvas', 'surface', 'chrome', 'text', 'accent'],
          hueExclusions: [{ fromDeg: 270, toDeg: 350, minimumSaturation: 0.06 }]
        }
      ]
    );

    expect(result).toEqual({ ok: true, diagnostics: [] });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('reports maximum-saturation and hue-exclusion violations in group and role order', () => {
    const result = validateThemePalette(
      { canvas: '#64206F', accent: '#9A269E' },
      [
        {
          id: 'neutral-canvas',
          roles: ['canvas'],
          maximumSaturation: 0.2,
          hueExclusions: [{ fromDeg: 270, toDeg: 350, minimumSaturation: 0.06 }]
        },
        {
          id: 'no-purple-accent',
          roles: ['accent'],
          hueExclusions: [{ fromDeg: 270, toDeg: 350, minimumSaturation: 0.06 }]
        }
      ]
    );

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          code: 'THEME_PALETTE_SATURATION_EXCEEDED',
          path: ['constraints', 0, 'roles', 0],
          groupId: 'neutral-canvas',
          role: 'canvas',
          maximumSaturation: 0.2
        }),
        expect.objectContaining({
          code: 'THEME_PALETTE_HUE_EXCLUDED',
          path: ['constraints', 0, 'roles', 0],
          groupId: 'neutral-canvas',
          role: 'canvas'
        }),
        expect.objectContaining({
          code: 'THEME_PALETTE_HUE_EXCLUDED',
          path: ['constraints', 1, 'roles', 0],
          groupId: 'no-purple-accent',
          role: 'accent'
        })
      ]
    });
    if (!result.ok) expect(result.diagnostics.every(Object.isFrozen)).toBe(true);
  });

  it('supports circular hue exclusions that cross zero degrees', () => {
    const result = validateThemePalette(
      { danger: '#CC3322', warning: '#D2B57A' },
      [{
        id: 'exclude-red',
        roles: ['danger', 'warning'],
        hueExclusions: [{ fromDeg: 340, toDeg: 20, minimumSaturation: 0.2 }]
      }]
    );

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'THEME_PALETTE_HUE_EXCLUDED', role: 'danger' }]
    });
  });

  it('keeps overlapping role groups independent', () => {
    const result = validateThemePalette(
      { accent: '#9A269E' },
      [
        { id: 'first', roles: ['accent'], hueExclusions: [{ fromDeg: 270, toDeg: 350, minimumSaturation: 0.1 }] },
        { id: 'second', roles: ['accent'], maximumSaturation: 0.4 }
      ]
    );

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [
        { code: 'THEME_PALETTE_HUE_EXCLUDED', groupId: 'first', role: 'accent' },
        { code: 'THEME_PALETTE_SATURATION_EXCEEDED', groupId: 'second', role: 'accent' }
      ]
    });
  });

  it('fails closed on invalid constraint profiles before evaluating colors', () => {
    const constraints = [
      { id: '', roles: [] },
      { id: 'duplicate', roles: ['canvas'], maximumSaturation: 1.1 },
      {
        id: 'duplicate',
        roles: ['brand' as any],
        hueExclusions: [{ fromDeg: -1, toDeg: 361, minimumSaturation: Number.NaN }]
      }
    ] as const satisfies readonly ThemePaletteRoleGroupConstraint[];

    const result = validateThemePalette({}, constraints);

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        expect.objectContaining({ code: 'THEME_PALETTE_CONSTRAINT_INVALID', path: ['constraints', 0, 'id'] }),
        expect.objectContaining({ code: 'THEME_PALETTE_CONSTRAINT_INVALID', path: ['constraints', 0, 'roles'] }),
        expect.objectContaining({ code: 'THEME_PALETTE_CONSTRAINT_INVALID', path: ['constraints', 1, 'maximumSaturation'] }),
        expect.objectContaining({ code: 'THEME_PALETTE_CONSTRAINT_INVALID', path: ['constraints', 2, 'id'] }),
        expect.objectContaining({ code: 'THEME_PALETTE_ROLE_UNKNOWN', path: ['constraints', 2, 'roles', 0], role: 'brand' }),
        expect.objectContaining({ code: 'THEME_PALETTE_CONSTRAINT_INVALID', path: ['constraints', 2, 'hueExclusions', 0, 'fromDeg'] }),
        expect.objectContaining({ code: 'THEME_PALETTE_CONSTRAINT_INVALID', path: ['constraints', 2, 'hueExclusions', 0, 'toDeg'] }),
        expect.objectContaining({ code: 'THEME_PALETTE_CONSTRAINT_INVALID', path: ['constraints', 2, 'hueExclusions', 0, 'minimumSaturation'] })
      ]
    });
    expect(JSON.stringify(result)).not.toContain('COLOR_UNRESOLVED');
  });

  it.each([
    { name: 'top-level constraints', constraints: null, path: ['constraints'] },
    { name: 'role group', constraints: [null], path: ['constraints', 0] },
    {
      name: 'hue exclusion',
      constraints: [{ id: 'broken-exclusion', roles: ['canvas'], hueExclusions: [null] }],
      path: ['constraints', 0, 'hueExclusions', 0]
    }
  ])('fails closed on a malformed $name structure', ({ constraints, path }) => {
    expect(() => validateThemePalette({ canvas: '#242321' }, constraints as any)).not.toThrow();
    expect(validateThemePalette({ canvas: '#242321' }, constraints as any)).toEqual({
      ok: false,
      diagnostics: [expect.objectContaining({
        code: 'THEME_PALETTE_CONSTRAINT_INVALID',
        path
      })]
    });
  });

  it('reports unresolved colors instead of throwing on a malformed palette object', () => {
    expect(validateThemePalette(null as any, [
      { id: 'neutral-canvas', roles: ['canvas'], maximumSaturation: 0.2 }
    ])).toEqual({
      ok: false,
      diagnostics: [expect.objectContaining({
        code: 'THEME_PALETTE_COLOR_UNRESOLVED',
        path: ['colors', 'canvas'],
        role: 'canvas'
      })]
    });
  });

  it('fails closed on missing and malformed role colors with exact paths', () => {
    const result = validateThemePalette(
      { canvas: '#oops' },
      [{ id: 'surfaces', roles: ['canvas', 'surface'], maximumSaturation: 0.2 }]
    );

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          code: 'THEME_PALETTE_COLOR_UNRESOLVED',
          path: ['colors', 'canvas'],
          groupId: 'surfaces',
          role: 'canvas'
        }),
        expect.objectContaining({
          code: 'THEME_PALETTE_COLOR_UNRESOLVED',
          path: ['colors', 'surface'],
          groupId: 'surfaces',
          role: 'surface'
        })
      ]
    });
  });

  it('does not alter ordinary ThemeDefinition parsing unless a caller opts in', () => {
    const purplePalette = {
      canvas: '#2C2938',
      surface: '#382D31',
      surfaceElevated: '#4A3A3D',
      surfaceInset: '#211E2B',
      chrome: '#716667',
      text: '#FFFFFF',
      textMuted: '#DED3D5',
      textFaint: '#BCAEB2',
      textOnAccent: '#FFFFFF',
      accent: '#84008E',
      selection: '#70426F',
      focus: '#F0C98B',
      success: '#8FB39C',
      warning: '#D2B57A',
      danger: '#E69B8F',
      border: '#5A4B50',
      borderStrong: '#94817D',
      shadow: '#100D14'
    } as const;

    expect(ThemeSemanticColorsSchema.safeParse(purplePalette).success).toBe(true);
    expect(validateThemePalette(purplePalette, [{
      id: 'caller-supplied-no-purple',
      roles: ['accent'],
      hueExclusions: [{ fromDeg: 270, toDeg: 350, minimumSaturation: 0.06 }]
    }])).toMatchObject({
      ok: false,
      diagnostics: [{ code: 'THEME_PALETTE_HUE_EXCLUDED', role: 'accent' }]
    });
  });
});
