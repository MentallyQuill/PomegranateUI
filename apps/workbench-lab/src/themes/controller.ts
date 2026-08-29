import { collectThemeAssetIds, resolveTheme, type ResolvedTheme, type ThemeDiagnostic } from '@pomegranate-ui/theme';
import type { ThemeDefinition } from '@pomegranate-ui/contracts';

import { compileThemeBindings } from './bindings.js';
import {
  defaultMaterialControls,
  normalizeMaterialControl,
  projectMaterialControls,
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
  readonly resolved: ResolvedTheme;
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

function missingAssetDiagnostics(theme: ResolvedTheme, availableAssets: ReadonlySet<string>): readonly ThemeDiagnostic[] {
  const declarations = new Map(theme.assets.map((asset) => [asset.id, asset]));
  return collectThemeAssetIds(theme).flatMap((id) => {
    if (availableAssets.has(id)) return [];
    const declaration = declarations.get(id);
    if (declaration && !declaration.required && id !== theme.iconPackId) return [];
    if (declaration?.fallbackId && availableAssets.has(declaration.fallbackId)) return [];
    return [Object.freeze({
      code: 'THEME_ASSET_MISSING' as const,
      path: Object.freeze(['assets', id]),
      message: `Required local theme asset '${id}' is unavailable.`
    })];
  });
}

function createSnapshot(id: LabThemeId, theme: ResolvedTheme, materialControls: LabMaterialControls): LabThemeSnapshot {
  return Object.freeze({
    activeId: id,
    resolved: theme,
    materialControls: Object.freeze({ ...materialControls }),
    cssText: compileThemeBindings(theme, materialControls),
    diagnostics: Object.freeze([])
  });
}

export function createLabThemeController(options: {
  readonly presets?: readonly LabThemePresetInput[];
  readonly initialId?: string | null;
  readonly preference?: ThemePreferenceAdapter;
  readonly availableAssets?: ReadonlySet<string>;
} = {}) {
  const presets = options.presets ?? LAB_THEME_PRESETS;
  const availableAssets = options.availableAssets ?? new Set(['icons.minimal', 'image.deep-current-stage', 'image.bunny-garden']);
  const byId = new Map(presets.map((preset) => [preset.id, preset.definition]));
  const materialDrafts = new Map<LabThemeId, LabMaterialControls>();

  const resolvePreset = (id: string, requestedControls?: LabMaterialControls): ThemeActivationResult => {
    if (!isLabThemeId(id) || !byId.has(id)) return { ok: false, diagnostics: unknownPresetDiagnostic(id) };
    const definition = byId.get(id);
    const baseResolution = resolveTheme(definition);
    if (!baseResolution.ok) return baseResolution;
    const materialControls = requestedControls ?? materialDrafts.get(id) ?? defaultMaterialControls(id);
    const projected = projectMaterialControls(definition as ThemeDefinition, materialControls);
    const resolution = resolveTheme(projected);
    if (!resolution.ok) return resolution;
    const assetDiagnostics = missingAssetDiagnostics(resolution.theme, availableAssets);
    if (assetDiagnostics.length > 0) return { ok: false, diagnostics: assetDiagnostics };
    return { ok: true, snapshot: createSnapshot(id, resolution.theme, materialControls) };
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
