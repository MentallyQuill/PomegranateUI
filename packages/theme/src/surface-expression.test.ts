import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SURFACE_EXPRESSION,
  THEME_PART_IDS,
  type SurfaceExpressionProfile,
  type ThemePartId,
  type ThemePartRecipeV2
} from '@pomegranate-ui/contracts';
import {
  applyThemePolicy,
  compileSurfaceExpressionBindings,
  type ResolvedThemeV2
} from './index.js';

const plainPart = {
  material: 'opaque',
  shape: 'plain',
  typography: 'ui',
  spacing: 'md',
  overflow: 'visible',
  separator: 'none',
  elevation: 0,
  states: { disabledOpacity: 0.5 }
} as const;

function resolvedTheme(): ResolvedThemeV2 {
  const parts = Object.fromEntries(THEME_PART_IDS.map((id) => [id, plainPart])) as Record<ThemePartId, ThemePartRecipeV2>;
  parts['widget.surface'] = { ...plainPart, material: 'glass', shape: 'adaptive-pane', elevation: 2 };
  parts['widget.content'] = { ...plainPart, material: 'glass', shape: 'adaptive-pane' };
  return {
    schemaVersion: 'pomegranate.ui.theme.v2',
    id: 'compiler-fixture',
    label: 'Compiler fixture',
    colors: {
      canvas: '#102040', surface: '#eaf4ff', surfaceElevated: '#ffffff', surfaceInset: '#dcecff', chrome: '#f4f9ff',
      text: '#101820', textMuted: '#405060', textFaint: '#687888', textOnAccent: '#ffffff', accent: '#1677ff',
      selection: '#86bfff', focus: '#1677ff', success: '#168050', warning: '#a06000', danger: '#c03030',
      border: '#ffffff', borderStrong: '#adc8e8', shadow: '#102040'
    },
    typography: {
      ui: { family: 'Pomegranate Sans', fallbacks: ['system-ui'], weight: 450, strongWeight: 650, lineHeight: 1.35, trackingEm: 0 },
      prose: { family: 'Pomegranate Serif', fallbacks: ['serif'], weight: 400, strongWeight: 600, lineHeight: 1.58, trackingEm: 0 },
      technical: { family: 'Pomegranate Mono', fallbacks: ['monospace'], weight: 450, strongWeight: 650, lineHeight: 1.4, trackingEm: 0.02 },
      scale: { xs: 11, sm: 12, md: 14, lg: 18, xl: 24 }
    },
    spacing: { density: 'balanced', xs: 4, sm: 6, md: 10, lg: 16, xl: 24, chromeHeight: 44 },
    materials: {
      glass: {
        base: '#ffffff', fallback: '#eaf4ff', opacity: 0.38,
        backdrop: { blurPx: 24, saturation: 1.2, brightness: 1 }, contentTone: 'dark',
        border: { color: '#ffffff', widthPx: 1, opacity: 0.55 },
        rim: { color: '#ffffff', opacity: 0.62, angleDeg: 180 },
        shadows: [{ x: 0, y: 18, blurPx: 50, spreadPx: -8, color: '#102040', opacity: 0.22, inset: false }],
        reducedTransparency: 'opaque'
      },
      opaque: {
        base: '#eaf4ff', fallback: '#eaf4ff', opacity: 1,
        backdrop: { blurPx: 0, saturation: 1, brightness: 1 }, contentTone: 'dark',
        border: { color: '#adc8e8', widthPx: 1, opacity: 0.8 },
        rim: { color: '#ffffff', opacity: 0.4, angleDeg: 180 }, shadows: [], reducedTransparency: 'opaque'
      }
    },
    shapes: {
      plain: { family: 'square', radiusPx: 0, chamferPx: 0, chamferAngleDeg: 45, joinedEdges: [] },
      'adaptive-pane': { family: 'continuous-rounded', radiusPx: 18, chamferPx: 0, chamferAngleDeg: 45, joinedEdges: ['bottom', 'left'] }
    },
    recipes: {
      parts,
      widgetGrouping: 'individual',
      chromePresentation: 'compact',
      actionPresentation: 'hover-focus'
    },
    controls: { slider: { trackPx: 4, thumbPx: 11, hitTargetPx: 44 } },
    iconPackId: 'icons.minimal',
    assets: { 'icons.minimal': { kind: 'icon-pack', source: '/assets/minimal-icons.svg' } },
    canvas: [{ kind: 'solid', color: '#102040' }],
    accessibility: { minimumContrast: 4.5, largeTextContrast: 3, coarsePointerMinimum: 44, reducedTransparencySurface: 'surface' },
    capabilities: { translucency: true, textures: false, localImages: false }
  };
}

const expression = (): SurfaceExpressionProfile => ({
  schemaVersion: 'pomegranate.ui.surface-expression.v1',
  id: 'soft-stationery',
  shapes: {
    'adaptive-pane': {
      cornerRadiiPx: { topLeft: 12, topRight: 13, bottomRight: 26, bottomLeft: 27 }
    }
  },
  materials: {
    glass: {
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
    'widget.content': { typeScale: 'lg', textTransform: 'none' }
  }
});

describe('compileSurfaceExpressionBindings', () => {
  it('resolves semantic gradients and applies joined edges after asymmetric radii', () => {
    const result = compileSurfaceExpressionBindings(resolvedTheme(), expression());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bindings['--pom-expression-widget-surface-background-image']).toBe(
      'linear-gradient(150deg, rgba(255, 255, 255, 0.95) 0%, rgba(234, 244, 255, 0.98) 100%)'
    );
    expect(result.bindings['--pom-expression-widget-surface-radius']).toBe('0px 13px 0px 0px');
    expect(result.bindings['--pom-expression-widget-content-font-size']).toBe('17px');
    expect(result.bindings['--pom-expression-widget-content-line-height']).toBe('1.55');
    expect(result.bindings['--pom-expression-widget-content-letter-spacing']).toBe('0em');
    expect(result.bindings['--pom-expression-widget-content-text-transform']).toBe('none');
    expect(Object.isFrozen(result.bindings)).toBe(true);
  });

  it('emits only bindings reached by actual material, shape, and part overrides', () => {
    const result = compileSurfaceExpressionBindings(resolvedTheme(), expression());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.bindings)).toEqual([
      '--pom-expression-widget-surface-background-image',
      '--pom-expression-widget-surface-radius',
      '--pom-expression-widget-content-background-image',
      '--pom-expression-widget-content-radius',
      '--pom-expression-widget-content-font-size',
      '--pom-expression-widget-content-line-height',
      '--pom-expression-widget-content-letter-spacing',
      '--pom-expression-widget-content-text-transform'
    ]);
    expect(result.bindings['--pom-expression-panel-surface-radius']).toBeUndefined();
  });

  it('compiles the empty profile as a frozen non-Bunny fallback', () => {
    const result = compileSurfaceExpressionBindings(resolvedTheme(), DEFAULT_SURFACE_EXPRESSION);

    expect(result).toEqual({ ok: true, bindings: {}, diagnostics: [] });
    if (result.ok) {
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.bindings)).toBe(true);
      expect(Object.isFrozen(result.diagnostics)).toBe(true);
    }
  });

  it('fails closed for invalid profiles and unknown theme dependencies', () => {
    const invalid = compileSurfaceExpressionBindings(resolvedTheme(), { ...expression(), unexpected: true });
    const unknownMaterial = expression();
    unknownMaterial.materials = { missing: expression().materials.glass! };
    const unknownShape = expression();
    unknownShape.shapes = { missing: expression().shapes['adaptive-pane']! };

    const materialResult = compileSurfaceExpressionBindings(resolvedTheme(), unknownMaterial);
    const shapeResult = compileSurfaceExpressionBindings(resolvedTheme(), unknownShape);

    expect(invalid.ok).toBe(false);
    expect(materialResult.ok).toBe(false);
    expect(shapeResult.ok).toBe(false);
    if (!invalid.ok) expect(invalid.bindings).toEqual({});
    if (!materialResult.ok) expect(materialResult.diagnostics[0]?.code).toBe('SURFACE_EXPRESSION_UNKNOWN_MATERIAL');
    if (!shapeResult.ok) expect(shapeResult.diagnostics[0]?.code).toBe('SURFACE_EXPRESSION_UNKNOWN_SHAPE');
  });

  it('omits a decorative gradient when policy redirects a part to an unexpressed opaque fallback', () => {
    const reduced = applyThemePolicy(resolvedTheme(), { device: { reducedTransparency: true } });
    const result = compileSurfaceExpressionBindings(reduced, expression());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bindings['--pom-expression-widget-surface-background-image']).toBeUndefined();
    expect(result.bindings['--pom-expression-widget-surface-radius']).toBe('0px 13px 0px 0px');
  });
});
