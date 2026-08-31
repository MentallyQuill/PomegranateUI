import {
  THEME_SCHEMA_VERSION_V2,
  type AmbientProfile,
  type CanvasDefinition
} from '@pomegranate-ui/contracts';

import type { ThemeAssetRegistry } from './assets.js';
import { compileCanvasLayers, type CanvasPresentationLayer } from './canvas.js';
import { compileThemeBindings, compileThemeStyleSheet, type ThemeBindings } from './compile.js';
import { collectThemeAssetIds } from './conformance.js';
import { migrateThemeTarget } from './migrate-target.js';
import { applyThemePolicy, type ThemePolicy } from './policy.js';
import { resolveThemeV2, type ResolvedThemeV2, type ThemeDiagnostic } from './resolve.js';

export interface ResolvedThemeTarget {
  readonly id: string;
  readonly theme: ResolvedThemeV2;
  readonly canvas: CanvasDefinition;
  readonly ambient: AmbientProfile;
}

export type ThemeTargetResolution =
  | { readonly ok: true; readonly target: ResolvedThemeTarget; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeDiagnostic[] };

export interface CompiledThemeTarget {
  readonly id: string;
  readonly theme: ResolvedThemeV2;
  readonly bindings: ThemeBindings;
  readonly styleSheet: string;
  readonly canvas: readonly CanvasPresentationLayer[];
  readonly ambient: AmbientProfile;
}

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

function percentage(value: number): string {
  return `${formatNumber(value * 100)}%`;
}

function ambientBindings(theme: ResolvedThemeV2, ambient: AmbientProfile): ThemeBindings {
  const motion = ambient.motion;
  const radius = ambient.radiusRange
    ? ambient.radiusRange.minimum + ambient.radius * (ambient.radiusRange.maximum - ambient.radiusRange.minimum)
    : ambient.radius;
  return Object.freeze({
    '--pom-ambient-color': theme.colors[ambient.colorRole],
    '--pom-ambient-x': percentage(ambient.position.x),
    '--pom-ambient-y': percentage(ambient.position.y),
    '--pom-ambient-radius': percentage(radius),
    '--pom-ambient-power': formatNumber(ambient.power),
    '--pom-ambient-motion-enabled': motion?.enabled ? '1' : '0',
    '--pom-ambient-drift-x': formatNumber(motion?.driftX ?? 0),
    '--pom-ambient-drift-y': formatNumber(motion?.driftY ?? 0),
    '--pom-ambient-duration': `${formatNumber(motion?.durationMs ?? 0)}ms`
  });
}

export function resolveThemeTarget(input: unknown, registry: ThemeAssetRegistry = {}): ThemeTargetResolution {
  const migrated = migrateThemeTarget(input);
  if (!migrated.ok) return migrated;
  const target = migrated.target;
  const resolved = resolveThemeV2({
    ...target.theme,
    schemaVersion: THEME_SCHEMA_VERSION_V2,
    canvas: target.canvas.layers
  }, registry);
  if (!resolved.ok) return resolved;

  return {
    ok: true,
    target: deepFreeze({
      id: target.id,
      theme: resolved.theme,
      canvas: target.canvas,
      ambient: target.ambient
    }),
    diagnostics: []
  };
}

export function collectThemeTargetAssetIds(target: ResolvedThemeTarget): readonly string[] {
  const ordered = [...collectThemeAssetIds({ ...target.theme, canvas: [] })];
  const seen = new Set(ordered);
  for (const layer of target.canvas.layers) {
    if ((layer.kind === 'image' || layer.kind === 'texture') && !seen.has(layer.assetId)) {
      seen.add(layer.assetId);
      ordered.push(layer.assetId);
    }
  }
  return Object.freeze(ordered);
}

export function compileThemeTarget(target: ResolvedThemeTarget, policy: ThemePolicy = {}): CompiledThemeTarget {
  const theme = applyThemePolicy(target.theme, policy);
  const bindings = Object.freeze(Object.fromEntries([
    ...Object.entries(compileThemeBindings(theme)),
    ...Object.entries(ambientBindings(theme, target.ambient))
  ].sort(([left], [right]) => left.localeCompare(right)))) as ThemeBindings;
  const canvas = compileCanvasLayers({ canvas: target.canvas.layers }, theme.assets);
  if (!canvas.ok) {
    throw new Error(`Resolved target '${target.id}' could not compile its canvas: ${canvas.diagnostics.map(({ message }) => message).join('; ')}`);
  }
  return deepFreeze({
    id: target.id,
    theme,
    bindings,
    styleSheet: compileThemeStyleSheet(theme),
    canvas: canvas.layers,
    ambient: target.ambient
  });
}
