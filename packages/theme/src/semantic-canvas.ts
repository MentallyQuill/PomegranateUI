import {
  THEME_COLOR_ROLES,
  ThemeCanvasLayerSchema,
  type ThemeCanvasLayer,
  type ThemeColorRole
} from '@pomegranate-ui/contracts';

const EXACT_HEX = /^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i;
const COLOR_ROLES = new Set<string>(THEME_COLOR_ROLES);

export interface SemanticCanvasColorReference {
  readonly role: ThemeColorRole;
  readonly alpha?: number;
}

export interface SemanticCanvasGradientStop {
  readonly color: SemanticCanvasColorReference;
  readonly position: number;
}

export type SemanticCanvasLayer =
  | { readonly kind: 'solid'; readonly color: SemanticCanvasColorReference }
  | { readonly kind: 'linear-gradient'; readonly angle: number; readonly stops: readonly SemanticCanvasGradientStop[] }
  | { readonly kind: 'radial-gradient'; readonly shape: 'circle' | 'ellipse'; readonly x: number; readonly y: number; readonly stops: readonly SemanticCanvasGradientStop[] }
  | { readonly kind: 'conic-gradient'; readonly angle: number; readonly x: number; readonly y: number; readonly stops: readonly SemanticCanvasGradientStop[] }
  | {
    readonly kind: 'four-corner';
    readonly topLeft: SemanticCanvasColorReference;
    readonly topRight: SemanticCanvasColorReference;
    readonly bottomLeft: SemanticCanvasColorReference;
    readonly bottomRight: SemanticCanvasColorReference;
  }
  | Extract<ThemeCanvasLayer, { kind: 'image' | 'texture' }>
  | { readonly kind: 'veil'; readonly mode: 'reading' | 'vignette'; readonly color: SemanticCanvasColorReference; readonly opacity: number };

export type SemanticCanvasDiagnosticCode =
  | 'THEME_CANVAS_COLOR_ROLE_UNKNOWN'
  | 'THEME_CANVAS_COLOR_ALPHA_INVALID'
  | 'THEME_CANVAS_COLOR_ROLE_UNRESOLVED'
  | 'THEME_CANVAS_RECIPE_INVALID';

export interface SemanticCanvasDiagnostic {
  readonly code: SemanticCanvasDiagnosticCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
  readonly role?: string;
}

export type SemanticCanvasResolution =
  | { readonly ok: true; readonly layers: readonly ThemeCanvasLayer[]; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly SemanticCanvasDiagnostic[] };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

function alphaHex(value: number): string {
  return Math.round(value * 255).toString(16).padStart(2, '0').toUpperCase();
}

function resolveColor(
  colors: Readonly<Partial<Record<ThemeColorRole, string>>>,
  reference: SemanticCanvasColorReference,
  path: readonly (string | number)[],
  diagnostics: SemanticCanvasDiagnostic[]
): string | null {
  const role = (reference as { readonly role?: unknown } | null | undefined)?.role;
  if (typeof role !== 'string' || !COLOR_ROLES.has(role)) {
    diagnostics.push({
      code: 'THEME_CANVAS_COLOR_ROLE_UNKNOWN',
      path: [...path, 'role'],
      message: `Canvas color role '${String(role)}' is not a ThemeColorRole.`,
      role: typeof role === 'string' ? role : String(role)
    });
    return null;
  }

  const alpha = (reference as { readonly alpha?: unknown }).alpha ?? 1;
  if (typeof alpha !== 'number' || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
    diagnostics.push({
      code: 'THEME_CANVAS_COLOR_ALPHA_INVALID',
      path: [...path, 'alpha'],
      message: `Canvas color alpha for '${role}' must be a finite number between zero and one.`,
      role
    });
    return null;
  }

  const source = colors[role as ThemeColorRole];
  if (typeof source !== 'string' || !EXACT_HEX.test(source)) {
    diagnostics.push({
      code: 'THEME_CANVAS_COLOR_ROLE_UNRESOLVED',
      path: [...path, 'role'],
      message: `Canvas color role '${role}' does not resolve to an exact #RRGGBB or #RRGGBBAA value.`,
      role
    });
    return null;
  }

  const rgb = source.slice(0, 7).toUpperCase();
  const sourceAlpha = source.length === 9 ? Number.parseInt(source.slice(7, 9), 16) / 255 : 1;
  const resolvedAlpha = sourceAlpha * alpha;
  return resolvedAlpha === 1 ? rgb : `${rgb}${alphaHex(resolvedAlpha)}`;
}

function resolveStops(
  colors: Readonly<Partial<Record<ThemeColorRole, string>>>,
  stops: readonly SemanticCanvasGradientStop[],
  path: readonly (string | number)[],
  diagnostics: SemanticCanvasDiagnostic[]
): readonly { readonly color: string; readonly position: number }[] | null {
  if (!Array.isArray(stops)) {
    diagnostics.push({
      code: 'THEME_CANVAS_RECIPE_INVALID',
      path,
      message: 'Canvas gradient stops must be an array.'
    });
    return null;
  }
  const resolved = stops.map((stop, index) => {
    const color = resolveColor(colors, stop?.color, [...path, index, 'color'], diagnostics);
    return color === null ? null : { color, position: stop.position };
  });
  return resolved.some((stop) => stop === null)
    ? null
    : resolved as readonly { readonly color: string; readonly position: number }[];
}

function resolveLayer(
  colors: Readonly<Partial<Record<ThemeColorRole, string>>>,
  layer: SemanticCanvasLayer,
  order: number,
  diagnostics: SemanticCanvasDiagnostic[]
): ThemeCanvasLayer | null {
  const path = ['layers', order] as const;
  if (!layer || typeof layer !== 'object' || typeof (layer as { kind?: unknown }).kind !== 'string') {
    diagnostics.push({ code: 'THEME_CANVAS_RECIPE_INVALID', path, message: 'Canvas recipe layer must be an object with a kind.' });
    return null;
  }

  let candidate: unknown;
  switch (layer.kind) {
    case 'solid': {
      const color = resolveColor(colors, layer.color, [...path, 'color'], diagnostics);
      if (color === null) return null;
      candidate = { kind: layer.kind, color };
      break;
    }
    case 'linear-gradient': {
      const stops = resolveStops(colors, layer.stops, [...path, 'stops'], diagnostics);
      if (stops === null) return null;
      candidate = { kind: layer.kind, angle: layer.angle, stops };
      break;
    }
    case 'radial-gradient': {
      const stops = resolveStops(colors, layer.stops, [...path, 'stops'], diagnostics);
      if (stops === null) return null;
      candidate = { kind: layer.kind, shape: layer.shape, x: layer.x, y: layer.y, stops };
      break;
    }
    case 'conic-gradient': {
      const stops = resolveStops(colors, layer.stops, [...path, 'stops'], diagnostics);
      if (stops === null) return null;
      candidate = { kind: layer.kind, angle: layer.angle, x: layer.x, y: layer.y, stops };
      break;
    }
    case 'four-corner': {
      const topLeft = resolveColor(colors, layer.topLeft, [...path, 'topLeft'], diagnostics);
      const topRight = resolveColor(colors, layer.topRight, [...path, 'topRight'], diagnostics);
      const bottomLeft = resolveColor(colors, layer.bottomLeft, [...path, 'bottomLeft'], diagnostics);
      const bottomRight = resolveColor(colors, layer.bottomRight, [...path, 'bottomRight'], diagnostics);
      if ([topLeft, topRight, bottomLeft, bottomRight].some((color) => color === null)) return null;
      candidate = { kind: layer.kind, topLeft, topRight, bottomLeft, bottomRight };
      break;
    }
    case 'image':
    case 'texture':
      candidate = { ...layer };
      break;
    case 'veil': {
      const color = resolveColor(colors, layer.color, [...path, 'color'], diagnostics);
      if (color === null) return null;
      candidate = { kind: layer.kind, mode: layer.mode, color, opacity: layer.opacity };
      break;
    }
    default:
      diagnostics.push({
        code: 'THEME_CANVAS_RECIPE_INVALID',
        path: [...path, 'kind'],
        message: `Unsupported semantic canvas layer kind '${String((layer as { kind?: unknown }).kind)}'.`
      });
      return null;
  }

  const parsed = ThemeCanvasLayerSchema.safeParse(candidate);
  if (parsed.success) return parsed.data;
  for (const issue of parsed.error.issues) {
    diagnostics.push({
      code: 'THEME_CANVAS_RECIPE_INVALID',
      path: [...path, ...issue.path.filter((segment): segment is string | number => typeof segment === 'string' || typeof segment === 'number')],
      message: issue.message
    });
  }
  return null;
}

export function resolveSemanticCanvasLayers(
  colors: Readonly<Partial<Record<ThemeColorRole, string>>>,
  layers: readonly SemanticCanvasLayer[]
): SemanticCanvasResolution {
  const diagnostics: SemanticCanvasDiagnostic[] = [];
  const resolved = layers.map((layer, order) => resolveLayer(colors, layer, order, diagnostics));
  if (diagnostics.length > 0) return deepFreeze({ ok: false as const, diagnostics });
  return deepFreeze({
    ok: true as const,
    layers: resolved.filter((layer): layer is ThemeCanvasLayer => layer !== null),
    diagnostics: [] as const
  });
}
