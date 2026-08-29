import {
  compileThemeTarget,
  resolveThemeTarget,
  type CompiledThemeTarget,
  type ResolvedThemeTarget,
  type ThemeAssetRegistry,
  type ThemeDevicePolicy,
  type ThemeDiagnostic
} from '@pomegranate-ui/theme';

import {
  defaultMaterialControls,
  materialControlPolicy,
  normalizeMaterialControl,
  type LabMaterialControlId,
  type LabMaterialControls
} from './material-controls.js';
import {
  LAB_THEME_PRESETS,
  isLabThemeId,
  type LabThemeId,
  type LabThemePresetInput
} from './presets.js';

export interface ThemePreferenceAdapter {
  read(): string | null;
  write(id: LabThemeId): void;
}

export interface LabThemeSnapshot {
  readonly activeId: LabThemeId;
  readonly resolved: ResolvedThemeTarget;
  readonly compiled: CompiledThemeTarget;
  readonly materialControls: LabMaterialControls;
  readonly cssText: string;
  readonly diagnostics: readonly ThemeDiagnostic[];
}

export type ThemeActivationResult =
  | { readonly ok: true; readonly snapshot: LabThemeSnapshot }
  | { readonly ok: false; readonly diagnostics: readonly ThemeDiagnostic[] };

function unknownPresetDiagnostic(id: string): readonly ThemeDiagnostic[] {
  return Object.freeze([Object.freeze({
    code: 'THEME_UNKNOWN_PRESET' as const,
    path: Object.freeze(['id']),
    message: `Unknown Workbench Lab theme preset '${id}'.`
  })]);
}

function registryFromIds(ids: ReadonlySet<string>): ThemeAssetRegistry {
  return Object.freeze(Object.fromEntries([...ids].map((id) => [id, Object.freeze({
    kind: id.startsWith('image.') ? 'image' as const : id.startsWith('texture.') ? 'texture' as const : 'icon-pack' as const,
    source: id
  })])));
}

function serializeBindings(bindings: Readonly<Record<string, string>>): string {
  return Object.entries(bindings)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([property, value]) => `${property}:${value}`)
    .join(';');
}

function createSnapshot(
  id: LabThemeId,
  target: ResolvedThemeTarget,
  materialControls: LabMaterialControls,
  devicePolicy?: ThemeDevicePolicy
): ThemeActivationResult {
  const controlsPolicy = materialControlPolicy(materialControls);
  const compiled = compileThemeTarget(target, {
    ...controlsPolicy,
    ...(devicePolicy ? { device: devicePolicy } : {})
  });
  return {
    ok: true,
    snapshot: Object.freeze({
      activeId: id,
      resolved: target,
      compiled,
      materialControls: Object.freeze({ ...materialControls }),
      cssText: serializeBindings(compiled.bindings),
      diagnostics: Object.freeze([])
    })
  };
}

export function createLabThemeController(options: {
  readonly presets?: readonly LabThemePresetInput[];
  readonly initialId?: string | null;
  readonly preference?: ThemePreferenceAdapter;
  readonly assetRegistry?: ThemeAssetRegistry;
  readonly devicePolicy?: ThemeDevicePolicy;
  /** @deprecated Use assetRegistry when exact host sources are available. */
  readonly availableAssets?: ReadonlySet<string>;
} = {}) {
  const presets = options.presets ?? LAB_THEME_PRESETS;
  const assetRegistry = options.assetRegistry
    ?? registryFromIds(options.availableAssets ?? new Set(['icons.minimal', 'image.deep-current-stage', 'image.bunny-garden']));
  const byId = new Map(presets.map((preset) => [preset.id, preset.target]));
  const materialDrafts = new Map<LabThemeId, LabMaterialControls>();

  const resolvePreset = (id: string, requestedControls?: LabMaterialControls): ThemeActivationResult => {
    if (!isLabThemeId(id) || !byId.has(id)) return { ok: false, diagnostics: unknownPresetDiagnostic(id) };
    const target = byId.get(id);
    const resolution = resolveThemeTarget(target, assetRegistry);
    if (!resolution.ok) return resolution;
    const materialControls = requestedControls ?? materialDrafts.get(id) ?? defaultMaterialControls(id);
    return createSnapshot(id, resolution.target, materialControls, options.devicePolicy);
  };

  let storedId: string | null = null;
  try {
    storedId = options.preference?.read() ?? null;
  } catch {
    storedId = null;
  }
  const preferredId = options.initialId ?? storedId ?? 'deep-current';
  const preferred = resolvePreset(preferredId);
  const fallback = preferred.ok ? preferred : resolvePreset('deep-current');
  if (!fallback.ok) throw new Error('The Workbench Lab Deep Current theme must resolve successfully.');
  let snapshot = fallback.snapshot;

  return Object.freeze({
    getSnapshot: () => snapshot,
    activate(id: string): ThemeActivationResult {
      const result = resolvePreset(id);
      if (!result.ok) return result;
      snapshot = result.snapshot;
      try {
        options.preference?.write(result.snapshot.activeId);
      } catch {
        // The in-memory theme remains usable when host preference storage is unavailable.
      }
      return result;
    },
    setMaterialControl(id: LabMaterialControlId, value: number): ThemeActivationResult {
      const materialControls = Object.freeze({
        ...snapshot.materialControls,
        [id]: normalizeMaterialControl(value)
      });
      const result = resolvePreset(snapshot.activeId, materialControls);
      if (!result.ok) return result;
      materialDrafts.set(snapshot.activeId, materialControls);
      snapshot = result.snapshot;
      return result;
    },
    resetMaterialControls(): ThemeActivationResult {
      const materialControls = defaultMaterialControls(snapshot.activeId);
      const result = resolvePreset(snapshot.activeId, materialControls);
      if (!result.ok) return result;
      materialDrafts.delete(snapshot.activeId);
      snapshot = result.snapshot;
      return result;
    }
  });
}
