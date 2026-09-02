import { describe, expect, it } from 'vitest';

import {
  resolveThemeCanvasAuthoringProfile,
  resolveSemanticCanvasLayers,
  type SemanticCanvasLayer
} from './semantic-canvas.js';

describe('semantic canvas recipes', () => {
  it('preserves an authored baseline color until its semantic role changes', () => {
    const profile = {
      defaults: { imageStrength: 100, overlayStrength: 100, gradientAngle: 0, vignetteStrength: 100 },
      layers: [{
        layer: {
          kind: 'solid' as const,
          color: { role: 'canvas' as const, baseline: { roleValue: '#112233', authoredValue: '#080c0d' } }
        }
      }]
    };

    const baseline = resolveThemeCanvasAuthoringProfile({ canvas: '#112233' }, profile, profile.defaults);
    const edited = resolveThemeCanvasAuthoringProfile({ canvas: '#445566' }, profile, profile.defaults);

    expect(baseline.ok && baseline.layers).toEqual([{ kind: 'solid', color: '#080C0D' }]);
    expect(edited.ok && edited.layers).toEqual([{ kind: 'solid', color: '#445566' }]);
  });

  it('maps every layered canvas color through semantic roles without mutating input', () => {
    const colors = {
      canvas: '#112233',
      surface: '#44556680',
      surfaceElevated: '#667788',
      surfaceInset: '#223344',
      chrome: '#776655',
      accent: '#CC8833',
      selection: '#886633',
      warning: '#D2B57A'
    } as const;
    const layers = [
      { kind: 'solid', color: { role: 'canvas', alpha: 0.5 } },
      {
        kind: 'linear-gradient',
        angle: 90,
        stops: [
          { color: { role: 'surface', alpha: 0.5 }, position: 0 },
          { color: { role: 'warning' }, position: 1 }
        ]
      },
      {
        kind: 'radial-gradient',
        shape: 'ellipse',
        x: 0.25,
        y: 0.75,
        stops: [
          { color: { role: 'accent', alpha: 0.25 }, position: 0 },
          { color: { role: 'canvas', alpha: 0 }, position: 1 }
        ]
      },
      {
        kind: 'conic-gradient',
        angle: 45,
        x: 0.5,
        y: 0.5,
        stops: [
          { color: { role: 'selection', alpha: 0.4 }, position: 0 },
          { color: { role: 'surfaceElevated' }, position: 1 }
        ]
      },
      {
        kind: 'four-corner',
        topLeft: { role: 'surfaceInset' },
        topRight: { role: 'chrome', alpha: 0.75 },
        bottomLeft: { role: 'canvas' },
        bottomRight: { role: 'surfaceElevated', alpha: 0.125 }
      },
      {
        kind: 'image',
        assetId: 'image.stage',
        fit: 'cover',
        x: 0.5,
        y: 0.5,
        opacity: 0.4,
        blurPx: 0,
        saturation: 0.1,
        blend: 'normal'
      },
      { kind: 'veil', mode: 'reading', color: { role: 'surface', alpha: 0.8 }, opacity: 0.3 },
      { kind: 'texture', assetId: 'texture.grain', opacity: 0.12, blend: 'soft-light' }
    ] as const satisfies readonly SemanticCanvasLayer[];
    const colorsBefore = structuredClone(colors);
    const layersBefore = structuredClone(layers);

    const result = resolveSemanticCanvasLayers(colors, layers);

    expect(result).toEqual({
      ok: true,
      diagnostics: [],
      layers: [
        { kind: 'solid', color: '#11223380' },
        {
          kind: 'linear-gradient',
          angle: 90,
          stops: [
            { color: '#44556640', position: 0 },
            { color: '#D2B57A', position: 1 }
          ]
        },
        {
          kind: 'radial-gradient',
          shape: 'ellipse',
          x: 0.25,
          y: 0.75,
          stops: [
            { color: '#CC883340', position: 0 },
            { color: '#11223300', position: 1 }
          ]
        },
        {
          kind: 'conic-gradient',
          angle: 45,
          x: 0.5,
          y: 0.5,
          stops: [
            { color: '#88663366', position: 0 },
            { color: '#667788', position: 1 }
          ]
        },
        {
          kind: 'four-corner',
          topLeft: '#223344',
          topRight: '#776655BF',
          bottomLeft: '#112233',
          bottomRight: '#66778820'
        },
        {
          kind: 'image',
          assetId: 'image.stage',
          fit: 'cover',
          x: 0.5,
          y: 0.5,
          opacity: 0.4,
          blurPx: 0,
          saturation: 0.1,
          blend: 'normal'
        },
        { kind: 'veil', mode: 'reading', color: '#44556666', opacity: 0.3 },
        { kind: 'texture', assetId: 'texture.grain', opacity: 0.12, blend: 'soft-light' }
      ]
    });
    expect(colors).toEqual(colorsBefore);
    expect(layers).toEqual(layersBefore);
    expect(Object.isFrozen(result)).toBe(true);
    if (result.ok) expect(result.layers.every(Object.isFrozen)).toBe(true);
  });

  it('fails closed with typed paths for an unknown role, invalid alpha, and unresolved role values', () => {
    const result = resolveSemanticCanvasLayers(
      { canvas: '#112233', surface: '#oops' },
      [
        { kind: 'solid', color: { role: 'brand' as any } },
        { kind: 'veil', mode: 'reading', color: { role: 'canvas', alpha: Number.NaN }, opacity: 0.2 },
        {
          kind: 'linear-gradient',
          angle: 0,
          stops: [
            { color: { role: 'surface' }, position: 0 },
            { color: { role: 'warning' }, position: 1 }
          ]
        }
      ]
    );

    expect(result).toEqual({
      ok: false,
      diagnostics: [
        expect.objectContaining({
          code: 'THEME_CANVAS_COLOR_ROLE_UNKNOWN',
          path: ['layers', 0, 'color', 'role'],
          role: 'brand'
        }),
        expect.objectContaining({
          code: 'THEME_CANVAS_COLOR_ALPHA_INVALID',
          path: ['layers', 1, 'color', 'alpha'],
          role: 'canvas'
        }),
        expect.objectContaining({
          code: 'THEME_CANVAS_COLOR_ROLE_UNRESOLVED',
          path: ['layers', 2, 'stops', 0, 'color', 'role'],
          role: 'surface'
        }),
        expect.objectContaining({
          code: 'THEME_CANVAS_COLOR_ROLE_UNRESOLVED',
          path: ['layers', 2, 'stops', 1, 'color', 'role'],
          role: 'warning'
        })
      ]
    });
    expect(Object.isFrozen(result)).toBe(true);
    if (!result.ok) expect(result.diagnostics.every(Object.isFrozen)).toBe(true);
  });

  it.each([-0.01, 1.01, Number.POSITIVE_INFINITY])('rejects alpha %s without returning partial layers', (alpha) => {
    const result = resolveSemanticCanvasLayers(
      { canvas: '#112233' },
      [{ kind: 'solid', color: { role: 'canvas', alpha } }]
    );

    expect(result).toMatchObject({
      ok: false,
      diagnostics: [{
        code: 'THEME_CANVAS_COLOR_ALPHA_INVALID',
        path: ['layers', 0, 'color', 'alpha'],
        role: 'canvas'
      }]
    });
    expect(result).not.toHaveProperty('layers');
  });

  it('validates mapped output against the existing CanvasDefinition v1 layer shape', () => {
    const result = resolveSemanticCanvasLayers(
      { canvas: '#112233' },
      [{
        kind: 'radial-gradient',
        shape: 'ellipse',
        x: 2,
        y: 0.5,
        stops: [
          { color: { role: 'canvas' }, position: 0 },
          { color: { role: 'canvas', alpha: 0 }, position: 1 }
        ]
      }]
    );

    expect(result).toEqual({
      ok: false,
      diagnostics: [expect.objectContaining({
        code: 'THEME_CANVAS_RECIPE_INVALID',
        path: ['layers', 0, 'x']
      })]
    });
  });
});
