import {
  PersistedThemeDraftSchema,
  DEFAULT_SURFACE_EXPRESSION,
  type PersistedThemeDraft,
  type PresentationProfileDefinition,
  type ThemeDraftStorage,
  type ThemeTargetBundle
} from '@pomegranate-ui/contracts';
import {
  compilePresentationProfile,
  compileThemeTarget,
  compileSurfaceExpressionBindings,
  createThemeDraft,
  projectThemeDraft,
  resolveAmbientProfile,
  resolveThemeTarget,
  type AmbientAccessibilityPreferences,
  type AmbientCapabilityLimits,
  type CompiledThemeTarget,
  type PresentationBindings,
  type PresentationDiagnostic,
  type ResolvedAmbientProfile,
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
import { loadPersistedThemeDraft, savePersistedThemeDraft } from './draft-storage.js';

export interface ThemePreferenceAdapter {
  read(): string | null;
  write(id: LabThemeId): void;
}

export interface LabThemeSnapshot {
  readonly activeId: LabThemeId;
  readonly resolved: ResolvedThemeTarget;
  readonly compiled: CompiledThemeTarget;
  readonly materialControls: LabMaterialControls;
  readonly resolvedAmbient: ResolvedAmbientProfile;
  readonly presentation: PresentationProfileDefinition;
  readonly presentationBindings: PresentationBindings;
  readonly expressionBindings: Readonly<Record<string, string>>;
  readonly cssText: string;
  readonly diagnostics: readonly LabThemeDiagnostic[];
}

export type LabThemeDiagnostic = ThemeDiagnostic | PresentationDiagnostic;

export interface LabThemeAuthoringSnapshot {
  readonly editable: unknown;
  readonly applied: LabThemeSnapshot;
  readonly diagnostics: readonly LabThemeDiagnostic[];
  readonly dirty: boolean;
}

export type ThemeActivationResult =
  | { readonly ok: true; readonly snapshot: LabThemeSnapshot }
  | { readonly ok: false; readonly diagnostics: readonly LabThemeDiagnostic[] };

export type ThemeDraftEditResult =
  | { readonly ok: true; readonly authoring: LabThemeAuthoringSnapshot }
  | { readonly ok: false; readonly authoring: LabThemeAuthoringSnapshot; readonly diagnostics: readonly LabThemeDiagnostic[] };

export type ThemeDraftSaveResult =
  | { readonly ok: true; readonly authoring: LabThemeAuthoringSnapshot }
  | { readonly ok: false; readonly authoring: LabThemeAuthoringSnapshot; readonly diagnostics: readonly LabThemeDiagnostic[] };

export interface LabThemeController {
  getSnapshot(): LabThemeSnapshot;
  getAuthoringSnapshot(): LabThemeAuthoringSnapshot;
  activate(id: string): ThemeActivationResult;
  setMaterialControl(id: LabMaterialControlId, value: number): ThemeActivationResult;
  resetMaterialControls(): ThemeActivationResult;
  editDraft(next: unknown): ThemeDraftEditResult;
  resetDraft(): ThemeDraftEditResult;
  saveDraft(): Promise<ThemeDraftSaveResult>;
  loadDraft(): Promise<ThemeDraftEditResult>;
}

function diagnostic(code: ThemeDiagnostic['code'], path: readonly (string | number)[], message: string): readonly ThemeDiagnostic[] {
  return Object.freeze([Object.freeze({ code, path: Object.freeze([...path]), message })]);
}

function unknownPresetDiagnostic(id: string): readonly ThemeDiagnostic[] {
  return diagnostic('THEME_UNKNOWN_PRESET', ['id'], `Unknown Workbench Lab theme preset '${id}'.`);
}

function schemaDiagnostics(issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[]): readonly ThemeDiagnostic[] {
  return Object.freeze(issues.map((issue) => Object.freeze({
    code: 'THEME_SCHEMA_INVALID' as const,
    path: Object.freeze(issue.path.map((part) => typeof part === 'number' ? part : String(part))),
    message: issue.message
  })));
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
  presentationInput: unknown | undefined,
  materialControls: LabMaterialControls,
  surfaceExpressionInput: unknown,
  devicePolicy: ThemeDevicePolicy | undefined,
  ambientOptions: {
    readonly fallback?: PersistedThemeDraft['ambient'];
    readonly sceneOverride?: PersistedThemeDraft['ambient'];
    readonly limits?: AmbientCapabilityLimits;
    readonly accessibility?: AmbientAccessibilityPreferences;
  }
): ThemeActivationResult {
  const presentation = compilePresentationProfile(presentationInput, target.canvas);
  if (!presentation.ok) return presentation;
  const resolvedAmbient = resolveAmbientProfile({
    fallback: ambientOptions.fallback ?? target.ambient,
    target: target.ambient,
    ...(ambientOptions.sceneOverride ? { sceneOverride: ambientOptions.sceneOverride } : {}),
    limits: ambientOptions.limits ?? { enabled: true, maximumPower: 1, allowMotion: true, allowTransparency: true },
    accessibility: ambientOptions.accessibility ?? { reducedMotion: false, reducedTransparency: devicePolicy?.reducedTransparency === true }
  });
  const { source: _source, transparencyEnabled: _transparencyEnabled, ...effectiveAmbient } = resolvedAmbient;
  const compiled = compileThemeTarget({ ...target, ambient: effectiveAmbient }, {
    ...materialControlPolicy(materialControls),
    ...(devicePolicy ? { device: devicePolicy } : {})
  });
  const surfaceExpression = surfaceExpressionInput ?? DEFAULT_SURFACE_EXPRESSION;
  const expression = compileSurfaceExpressionBindings(compiled.theme, surfaceExpression);
  if (!expression.ok) return {
    ok: false,
    diagnostics: Object.freeze(expression.diagnostics.map((entry) => Object.freeze({
      code: 'THEME_SCHEMA_INVALID' as const,
      path: Object.freeze(['surfaceExpression', ...entry.path]),
      message: entry.message
    })))
  };
  const cssBindings = {
    ...compiled.bindings,
    ...presentation.bindings,
    ...expression.bindings,
    '--pom-ambient-transparency-enabled': resolvedAmbient.transparencyEnabled ? '1' : '0'
  };
  return {
    ok: true,
    snapshot: Object.freeze({
      activeId: id,
      resolved: target,
      compiled,
      materialControls: Object.freeze({ ...materialControls }),
      resolvedAmbient,
      presentation: presentation.profile,
      presentationBindings: presentation.bindings,
      expressionBindings: expression.bindings,
      cssText: serializeBindings(cssBindings),
      diagnostics: Object.freeze([])
    })
  };
}

function cloneEditable(value: unknown): unknown {
  try {
    return structuredClone(value);
  } catch {
    return value;
  }
}

function seedDraft(id: LabThemeId, target: ThemeTargetBundle): PersistedThemeDraft {
  const draft = createThemeDraft(target);
  return PersistedThemeDraftSchema.parse({
    schemaVersion: 'pomegranate.ui.persisted-theme-draft.v1',
    draft: { ...draft, materials: defaultMaterialControls(id) },
    ambient: target.ambient
  });
}

function sameColors(left: PersistedThemeDraft, right: PersistedThemeDraft): boolean {
  return Object.keys(left.draft.colors).every((role) => (
    left.draft.colors[role as keyof PersistedThemeDraft['draft']['colors']]
      === right.draft.colors[role as keyof PersistedThemeDraft['draft']['colors']]
  ));
}

export function createLabThemeController(options: {
  readonly presets?: readonly LabThemePresetInput[];
  readonly initialId?: string | null;
  readonly preference?: ThemePreferenceAdapter;
  readonly draftStorage?: ThemeDraftStorage;
  readonly assetRegistry?: ThemeAssetRegistry;
  readonly devicePolicy?: ThemeDevicePolicy;
  readonly ambientFallback?: PersistedThemeDraft['ambient'];
  readonly sceneAmbientOverride?: PersistedThemeDraft['ambient'];
  readonly ambientLimits?: AmbientCapabilityLimits;
  readonly ambientAccessibility?: AmbientAccessibilityPreferences;
  /** @deprecated Use assetRegistry when exact host sources are available. */
  readonly availableAssets?: ReadonlySet<string>;
} = {}): LabThemeController {
  const presets = options.presets ?? LAB_THEME_PRESETS;
  const assetRegistry = options.assetRegistry
    ?? registryFromIds(options.availableAssets ?? new Set([
      'icons.minimal',
      'image.deep-current-stage',
      'image.bunny-garden',
      'image.ash-amber-stage'
    ]));
  const byId = new Map(presets.map((preset) => [preset.id, preset]));
  const validDrafts = new Map<LabThemeId, PersistedThemeDraft>();
  const dirtyDrafts = new Map<LabThemeId, boolean>();
  const snapshotAmbientOptions = {
    ...(options.ambientFallback ? { fallback: options.ambientFallback } : {}),
    ...(options.sceneAmbientOverride ? { sceneOverride: options.sceneAmbientOverride } : {}),
    ...(options.ambientLimits ? { limits: options.ambientLimits } : {}),
    ...(options.ambientAccessibility ? { accessibility: options.ambientAccessibility } : {})
  };

  const rawTarget = (id: string): ThemeTargetBundle | null => {
    const target = byId.get(id)?.target;
    const parsed = target ? (target as ThemeTargetBundle) : null;
    return parsed;
  };

  const resolveRawPreset = (id: string): ThemeActivationResult => {
    if (!isLabThemeId(id) || !byId.has(id)) return { ok: false, diagnostics: unknownPresetDiagnostic(id) };
    const preset = byId.get(id)!;
    const resolution = resolveThemeTarget(preset.target, assetRegistry);
    if (!resolution.ok) return resolution;
    return createSnapshot(
      id,
      resolution.target,
      preset.presentation,
      defaultMaterialControls(id),
      preset.surfaceExpression,
      options.devicePolicy,
      snapshotAmbientOptions
    );
  };

  const applyPersisted = (id: LabThemeId, persisted: PersistedThemeDraft): ThemeActivationResult => {
    const base = rawTarget(id);
    if (!base) return { ok: false, diagnostics: unknownPresetDiagnostic(id) };
    const seed = seedDraft(id, base);
    let candidate: ThemeTargetBundle;
    if (sameColors(seed, persisted)) {
      candidate = { ...base, ambient: persisted.ambient };
    } else {
      const projection = projectThemeDraft(base, persisted.draft, persisted.ambient);
      if (!projection.ok) return projection;
      candidate = projection.target;
    }
    const resolution = resolveThemeTarget(candidate, assetRegistry);
    if (!resolution.ok) return resolution;
    return createSnapshot(
      id,
      resolution.target,
      byId.get(id)?.presentation,
      persisted.draft.materials,
      byId.get(id)?.surfaceExpression,
      options.devicePolicy,
      snapshotAmbientOptions
    );
  };

  let storedId: string | null = null;
  try { storedId = options.preference?.read() ?? null; } catch { storedId = null; }
  const preferredId = options.initialId ?? storedId ?? 'deep-current';
  const preferred = resolveRawPreset(preferredId);
  const fallback = preferred.ok ? preferred : resolveRawPreset('deep-current');
  if (!fallback.ok) throw new Error('The Workbench Lab Deep Current theme must resolve successfully.');
  let snapshot = fallback.snapshot;
  let editable: unknown = seedDraft(snapshot.activeId, rawTarget(snapshot.activeId)!);
  let authoringDiagnostics: readonly LabThemeDiagnostic[] = Object.freeze([]);
  let dirty = false;
  validDrafts.set(snapshot.activeId, editable as PersistedThemeDraft);

  const authoring = (): LabThemeAuthoringSnapshot => Object.freeze({
    editable,
    applied: snapshot,
    diagnostics: authoringDiagnostics,
    dirty
  });

  const editDraft = (next: unknown): ThemeDraftEditResult => {
    editable = cloneEditable(next);
    dirty = true;
    const parsed = PersistedThemeDraftSchema.safeParse(next);
    if (!parsed.success) {
      authoringDiagnostics = schemaDiagnostics(parsed.error.issues);
      return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
    }
    if (parsed.data.draft.baseTargetId !== snapshot.activeId) {
      authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['draft', 'baseTargetId'], 'Draft base target must match the active target.');
      return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
    }
    const result = applyPersisted(snapshot.activeId, parsed.data);
    if (!result.ok) {
      authoringDiagnostics = result.diagnostics;
      return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
    }
    editable = parsed.data;
    snapshot = result.snapshot;
    authoringDiagnostics = Object.freeze([]);
    validDrafts.set(snapshot.activeId, parsed.data);
    dirtyDrafts.set(snapshot.activeId, true);
    return { ok: true, authoring: authoring() };
  };

  return Object.freeze({
    getSnapshot: () => snapshot,
    getAuthoringSnapshot: authoring,
    activate(id: string): ThemeActivationResult {
      const raw = resolveRawPreset(id);
      if (!raw.ok) return raw;
      const activeId = raw.snapshot.activeId;
      const target = rawTarget(activeId)!;
      const persisted = validDrafts.get(activeId) ?? seedDraft(activeId, target);
      const result = applyPersisted(activeId, persisted);
      if (!result.ok) return result;
      snapshot = result.snapshot;
      editable = persisted;
      authoringDiagnostics = Object.freeze([]);
      dirty = dirtyDrafts.get(activeId) ?? false;
      validDrafts.set(activeId, persisted);
      try { options.preference?.write(activeId); } catch { /* In-memory activation remains usable. */ }
      return result;
    },
    setMaterialControl(id: LabMaterialControlId, value: number): ThemeActivationResult {
      const current = PersistedThemeDraftSchema.parse(validDrafts.get(snapshot.activeId) ?? editable);
      const result = editDraft({
        ...current,
        draft: {
          ...current.draft,
          materials: { ...current.draft.materials, [id]: normalizeMaterialControl(value) }
        }
      });
      return result.ok ? { ok: true, snapshot } : { ok: false, diagnostics: result.diagnostics };
    },
    resetMaterialControls(): ThemeActivationResult {
      const current = PersistedThemeDraftSchema.parse(validDrafts.get(snapshot.activeId) ?? editable);
      const result = editDraft({
        ...current,
        draft: { ...current.draft, materials: defaultMaterialControls(snapshot.activeId) }
      });
      return result.ok ? { ok: true, snapshot } : { ok: false, diagnostics: result.diagnostics };
    },
    editDraft,
    resetDraft(): ThemeDraftEditResult {
      const next = seedDraft(snapshot.activeId, rawTarget(snapshot.activeId)!);
      const result = editDraft(next);
      if (result.ok) {
        dirty = false;
        dirtyDrafts.set(snapshot.activeId, false);
        return { ok: true, authoring: authoring() };
      }
      return result;
    },
    async saveDraft(): Promise<ThemeDraftSaveResult> {
      const parsed = PersistedThemeDraftSchema.safeParse(editable);
      if (!parsed.success) {
        authoringDiagnostics = schemaDiagnostics(parsed.error.issues);
        return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
      }
      if (!options.draftStorage) {
        authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['storage'], 'Theme draft storage is unavailable.');
        return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
      }
      const saved = await savePersistedThemeDraft(options.draftStorage, parsed.data);
      if (!saved.ok) {
        authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['storage'], saved.message);
        return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
      }
      dirty = false;
      dirtyDrafts.set(snapshot.activeId, false);
      authoringDiagnostics = Object.freeze([]);
      return { ok: true, authoring: authoring() };
    },
    async loadDraft(): Promise<ThemeDraftEditResult> {
      if (!options.draftStorage) {
        authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['storage'], 'Theme draft storage is unavailable.');
        return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
      }
      const loaded = await loadPersistedThemeDraft(options.draftStorage);
      if (!loaded.ok) {
        authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['storage'], loaded.message);
        return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
      }
      if (loaded.value === null || loaded.value.draft.baseTargetId !== snapshot.activeId) {
        return { ok: true, authoring: authoring() };
      }
      const result = editDraft(loaded.value);
      if (result.ok) {
        dirty = false;
        dirtyDrafts.set(snapshot.activeId, false);
        return { ok: true, authoring: authoring() };
      }
      return result;
    }
  });
}
