import {
  SURFACE_EXPRESSION_TYPE_SCALE,
  SurfaceExpressionProfileSchema,
  THEME_PART_IDS,
  type SurfaceExpressionCornerRadii,
  type SurfaceExpressionGradientStop,
  type SurfaceExpressionProfile,
  type ThemePartId,
  type ThemeShapeV2
} from '@pomegranate-ui/contracts';

import type { ThemeBindings } from './compile.js';
import type { ResolvedThemeV2 } from './resolve.js';

export type SurfaceExpressionDiagnosticCode =
  | 'SURFACE_EXPRESSION_SCHEMA_INVALID'
  | 'SURFACE_EXPRESSION_UNKNOWN_MATERIAL'
  | 'SURFACE_EXPRESSION_UNKNOWN_SHAPE';

export interface SurfaceExpressionDiagnostic {
  readonly code: SurfaceExpressionDiagnosticCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export type SurfaceExpressionCompilation =
  | {
    readonly ok: true;
    readonly bindings: ThemeBindings;
    readonly diagnostics: readonly [];
  }
  | {
    readonly ok: false;
    readonly bindings: ThemeBindings;
    readonly diagnostics: readonly SurfaceExpressionDiagnostic[];
  };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

function rgba(color: string, opacity: number): string {
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const sourceAlpha = color.length === 9 ? Number.parseInt(color.slice(7, 9), 16) / 255 : 1;
  return `rgba(${red}, ${green}, ${blue}, ${formatNumber(sourceAlpha * opacity)})`;
}

function partKey(part: ThemePartId): string {
  return part.replaceAll('.', '-');
}

function compileCornerRadii(radii: SurfaceExpressionCornerRadii, shape: ThemeShapeV2): string {
  const joined = new Set(shape.joinedEdges);
  const values = [
    joined.has('top') || joined.has('left') ? 0 : radii.topLeft,
    joined.has('top') || joined.has('right') ? 0 : radii.topRight,
    joined.has('bottom') || joined.has('right') ? 0 : radii.bottomRight,
    joined.has('bottom') || joined.has('left') ? 0 : radii.bottomLeft
  ];
  return values.map((value) => `${formatNumber(value)}px`).join(' ');
}

function compileGradient(theme: ResolvedThemeV2, angleDeg: number, stops: readonly SurfaceExpressionGradientStop[]): string {
  const compiledStops = stops.map((stop) => (
    `${rgba(theme.colors[stop.colorRole], stop.opacity)} ${formatNumber(stop.position * 100)}%`
  ));
  return `linear-gradient(${formatNumber(angleDeg)}deg, ${compiledStops.join(', ')})`;
}

function schemaDiagnostics(issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[]): readonly SurfaceExpressionDiagnostic[] {
  return issues.map((issue) => ({
    code: 'SURFACE_EXPRESSION_SCHEMA_INVALID',
    path: issue.path.map((part) => typeof part === 'number' ? part : String(part)),
    message: issue.message
  }));
}

function dependencyDiagnostics(theme: ResolvedThemeV2, profile: SurfaceExpressionProfile): readonly SurfaceExpressionDiagnostic[] {
  const diagnostics: SurfaceExpressionDiagnostic[] = [];
  for (const materialId of Object.keys(profile.materials)) {
    if (!(materialId in theme.materials)) diagnostics.push({
      code: 'SURFACE_EXPRESSION_UNKNOWN_MATERIAL',
      path: ['materials', materialId],
      message: `Surface expression material '${materialId}' is not defined by theme '${theme.id}'.`
    });
  }
  for (const shapeId of Object.keys(profile.shapes)) {
    if (!(shapeId in theme.shapes)) diagnostics.push({
      code: 'SURFACE_EXPRESSION_UNKNOWN_SHAPE',
      path: ['shapes', shapeId],
      message: `Surface expression shape '${shapeId}' is not defined by theme '${theme.id}'.`
    });
  }
  return diagnostics;
}

function failure(diagnostics: readonly SurfaceExpressionDiagnostic[]): SurfaceExpressionCompilation {
  return deepFreeze({ ok: false, bindings: {}, diagnostics: [...diagnostics] });
}

export function compileSurfaceExpressionBindings(
  theme: ResolvedThemeV2,
  input: unknown
): SurfaceExpressionCompilation {
  const parsed = SurfaceExpressionProfileSchema.safeParse(input);
  if (!parsed.success) return failure(schemaDiagnostics(parsed.error.issues));

  const profile = parsed.data;
  const dependencies = dependencyDiagnostics(theme, profile);
  if (dependencies.length > 0) return failure(dependencies);

  const bindings: Record<string, string> = {};
  for (const part of THEME_PART_IDS) {
    const recipe = theme.recipes.parts[part];
    const key = partKey(part);
    const prefix = `--pom-expression-${key}`;
    const material = profile.materials[recipe.material];
    if (material) {
      bindings[`${prefix}-background-image`] = compileGradient(
        theme,
        material.fill.angleDeg,
        material.fill.stops
      );
    }
    const shapeOverride = profile.shapes[recipe.shape];
    if (shapeOverride) {
      bindings[`${prefix}-radius`] = compileCornerRadii(
        shapeOverride.cornerRadiiPx,
        theme.shapes[recipe.shape]!
      );
    }
    const partOverride = profile.parts[part];
    if (partOverride?.typeScale) {
      const scale = SURFACE_EXPRESSION_TYPE_SCALE[partOverride.typeScale];
      bindings[`${prefix}-font-size`] = `${formatNumber(scale.fontSizePx)}px`;
      bindings[`${prefix}-line-height`] = formatNumber(scale.lineHeight);
      bindings[`${prefix}-letter-spacing`] = `${formatNumber(scale.letterSpacingEm)}em`;
    }
    if (partOverride?.textTransform) {
      bindings[`${prefix}-text-transform`] = partOverride.textTransform;
    }
  }

  return deepFreeze({ ok: true, bindings, diagnostics: [] });
}
