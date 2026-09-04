import {
  PersistedThemeDraftSchema,
  DEFAULT_SURFACE_EXPRESSION,
  THEME_DRAFT_COLOR_ROLES,
  type PersistedThemeDraft,
  type PresentationProfileDefinition,
  type ThemeDraftStorage,
  type ThemeTargetBundle,
  type ThemeDraftColorRole,
  type ThemeTypography,
  type ThemeTypographyRole
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
  type ThemeCanvasAuthoringProfile,
  type ThemeCanvasAvailability,
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
import { BUNDLED_FONT_CHOICES, bundledFontChoice } from './bundled-fonts.js';
import {
  LAB_THEME_PRESETS,
  isLabThemeId,
  type LabThemeId,
  type LabThemePresetInput
} from './presets.js';
import {
  LAB_THEME_DRAFT_KEY,
  loadPersistedThemeDraft,
  savePersistedThemeDraft,
  themeDraftStorageKey
} from './draft-storage.js';

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
  readonly lastValidEditable: PersistedThemeDraft;
  readonly applied: LabThemeSnapshot;
  readonly diagnostics: readonly LabThemeDiagnostic[];
  readonly canvasAvailability: ThemeCanvasAvailability;
  readonly colorInputs: {
    readonly hex: Readonly<Record<ThemeDraftColorRole, string>>;
    readonly rgb: Readonly<Record<ThemeDraftColorRole, readonly [string, string, string]>>;
  };
  readonly dirty: boolean;
  readonly saving: boolean;
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
  editColorHex(role: ThemeDraftColorRole, value: string): ThemeDraftEditResult;
  editColorRgb(role: ThemeDraftColorRole, channel: 0 | 1 | 2, value: string): ThemeDraftEditResult;
  editTypographyRole(role: ThemeTypographyRoleId, patch: Partial<ThemeTypographyRole>): ThemeDraftEditResult;
  editTypographyScale(step: ThemeTypographyScaleId, value: number): ThemeDraftEditResult;
  resetTypography(): ThemeDraftEditResult;
  resetDraft(): ThemeDraftEditResult;
  saveDraft(): Promise<ThemeDraftSaveResult>;
  loadDraft(): Promise<ThemeDraftEditResult>;
}

export type ThemeTypographyRoleId = 'ui' | 'prose' | 'display' | 'technical';
export type ThemeTypographyScaleId = keyof ThemeTypography['scale'];

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

function bundledTypographyDiagnostics(persisted: PersistedThemeDraft): readonly ThemeDiagnostic[] {
  const typography = persisted.draft.typography;
  if (!typography) return Object.freeze([]);
  const roles: readonly ThemeTypographyRoleId[] = typography.display
    ? ['ui', 'prose', 'display', 'technical']
    : ['ui', 'prose', 'technical'];
  for (const role of roles) {
    const value = role === 'display' ? typography.display! : typography[role];
    const choice = bundledFontChoice(role, value.family);
    if (!choice) {
      return diagnostic(
        'THEME_SCHEMA_INVALID',
        ['draft', 'typography', role, 'family'],
        `${value.family} is not a bundled ${role} font. Choose ${BUNDLED_FONT_CHOICES[role].map(({ label }) => label).join(', ')}.`
      );
    }
    if (value.fallbacks.length !== choice.fallbacks.length
      || value.fallbacks.some((fallback, index) => fallback !== choice.fallbacks[index])) {
      return diagnostic(
        'THEME_SCHEMA_INVALID',
        ['draft', 'typography', role, 'fallbacks'],
        `${choice.label} must use its bundled fallback stack.`
      );
    }
  }
  return Object.freeze([]);
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

function seedDraft(
  id: LabThemeId,
  target: ThemeTargetBundle,
  canvasAuthoring?: ThemeCanvasAuthoringProfile
): PersistedThemeDraft {
  const draft = createThemeDraft(target, canvasAuthoring?.defaults);
  return PersistedThemeDraftSchema.parse({
    schemaVersion: 'pomegranate.ui.persisted-theme-draft.v2',
    draft: { ...draft, materials: defaultMaterialControls(id) },
    ambient: target.ambient
  });
}

const EXACT_HEX = /^#[0-9a-f]{6}$/i;

function rgbChannels(hex: string): [string, string, string] {
  return [
    String(Number.parseInt(hex.slice(1, 3), 16)),
    String(Number.parseInt(hex.slice(3, 5), 16)),
    String(Number.parseInt(hex.slice(5, 7), 16))
  ];
}

function rgbHex(values: readonly string[]): string | null {
  const numbers = values.map(Number);
  if (numbers.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return null;
  return `#${numbers.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function canvasAvailability(profile?: ThemeCanvasAuthoringProfile): ThemeCanvasAvailability {
  const groups = profile?.layers.map(({ authoringGroup }) => authoringGroup) ?? [];
  return Object.freeze({
    image: groups.includes('image'),
    overlay: groups.includes('overlay'),
    gradient: profile?.layers.some(({ authoringGroup, layer }) => authoringGroup === 'overlay' && layer.kind === 'linear-gradient') ?? false,
    vignette: groups.includes('vignette')
  });
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
      'image.atmospheric-reservoir',
      'image.pomos-tahoe',
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
    const canvasAuthoring = byId.get(id)?.canvasAuthoring;
    const projection = projectThemeDraft(base, persisted.draft, persisted.ambient, canvasAuthoring);
    if (!projection.ok) return projection;
    const candidate = projection.target;
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
  let editable: unknown = seedDraft(snapshot.activeId, rawTarget(snapshot.activeId)!, byId.get(snapshot.activeId)?.canvasAuthoring);
  let authoringDiagnostics: readonly LabThemeDiagnostic[] = Object.freeze([]);
  let dirty = false;
  let saving = false;
  let editRevision = 0;
  let pendingSave: Promise<ThemeDraftSaveResult> | null = null;
  const colorInputDiagnostics = new Map<ThemeDraftColorRole, LabThemeDiagnostic>();
  const colorHexInputs = Object.fromEntries(THEME_DRAFT_COLOR_ROLES.map((role) => [
    role,
    (editable as PersistedThemeDraft).draft.colors[role]
  ])) as Record<ThemeDraftColorRole, string>;
  const colorRgbInputs = Object.fromEntries(THEME_DRAFT_COLOR_ROLES.map((role) => [
    role,
    rgbChannels((editable as PersistedThemeDraft).draft.colors[role])
  ])) as Record<ThemeDraftColorRole, [string, string, string]>;
  validDrafts.set(snapshot.activeId, editable as PersistedThemeDraft);

  const combinedDiagnostics = (): readonly LabThemeDiagnostic[] => Object.freeze([
    ...authoringDiagnostics,
    ...colorInputDiagnostics.values()
  ]);

  const syncColorInputs = (draft: PersistedThemeDraft): void => {
    for (const role of THEME_DRAFT_COLOR_ROLES) {
      if (colorInputDiagnostics.has(role)) continue;
      colorHexInputs[role] = draft.draft.colors[role];
      colorRgbInputs[role] = rgbChannels(draft.draft.colors[role]);
    }
  };

  const clearColorInputDiagnostics = (): void => {
    colorInputDiagnostics.clear();
  };

  const authoring = (): LabThemeAuthoringSnapshot => Object.freeze({
    editable,
    lastValidEditable: structuredClone(validDrafts.get(snapshot.activeId) ?? seedDraft(snapshot.activeId, rawTarget(snapshot.activeId)!, byId.get(snapshot.activeId)?.canvasAuthoring)),
    applied: snapshot,
    diagnostics: combinedDiagnostics(),
    canvasAvailability: canvasAvailability(byId.get(snapshot.activeId)?.canvasAuthoring),
    colorInputs: Object.freeze({
      hex: Object.freeze({ ...colorHexInputs }),
      rgb: Object.freeze(Object.fromEntries(THEME_DRAFT_COLOR_ROLES.map((role) => [
        role,
        Object.freeze([...colorRgbInputs[role]])
      ])) as Record<ThemeDraftColorRole, readonly [string, string, string]>)
    }),
    dirty,
    saving
  });

  const editDraft = (next: unknown): ThemeDraftEditResult => {
    editRevision += 1;
    editable = cloneEditable(next);
    dirty = true;
    const parsed = PersistedThemeDraftSchema.safeParse(next);
    if (!parsed.success) {
      authoringDiagnostics = schemaDiagnostics(parsed.error.issues);
      return { ok: false, authoring: authoring(), diagnostics: combinedDiagnostics() };
    }
    if (parsed.data.draft.baseTargetId !== snapshot.activeId) {
      authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['draft', 'baseTargetId'], 'Draft base target must match the active target.');
      return { ok: false, authoring: authoring(), diagnostics: combinedDiagnostics() };
    }
    const typographyDiagnostics = bundledTypographyDiagnostics(parsed.data);
    if (typographyDiagnostics.length > 0) {
      authoringDiagnostics = typographyDiagnostics;
      return { ok: false, authoring: authoring(), diagnostics: combinedDiagnostics() };
    }
    const result = applyPersisted(snapshot.activeId, parsed.data);
    if (!result.ok) {
      authoringDiagnostics = result.diagnostics;
      return { ok: false, authoring: authoring(), diagnostics: combinedDiagnostics() };
    }
    editable = parsed.data;
    snapshot = result.snapshot;
    authoringDiagnostics = Object.freeze([]);
    validDrafts.set(snapshot.activeId, parsed.data);
    dirtyDrafts.set(snapshot.activeId, true);
    syncColorInputs(parsed.data);
    return { ok: true, authoring: authoring() };
  };

  const editColorHex = (role: ThemeDraftColorRole, value: string): ThemeDraftEditResult => {
    colorHexInputs[role] = value;
    if (!EXACT_HEX.test(value)) {
      editRevision += 1;
      dirty = true;
      dirtyDrafts.set(snapshot.activeId, true);
      colorInputDiagnostics.set(role, Object.freeze({
        code: 'THEME_SCHEMA_INVALID',
        path: Object.freeze(['draft', 'colors', role]),
        message: `${role} must be an exact #RRGGBB color.`
      }));
      const diagnostics = combinedDiagnostics();
      return { ok: false, authoring: authoring(), diagnostics };
    }
    colorInputDiagnostics.delete(role);
    const normalized = value.toLowerCase();
    colorHexInputs[role] = normalized;
    colorRgbInputs[role] = rgbChannels(normalized);
    const current = structuredClone(validDrafts.get(snapshot.activeId) ?? authoring().lastValidEditable);
    current.draft.colors[role] = normalized;
    return editDraft(current);
  };

  const editColorRgb = (role: ThemeDraftColorRole, channel: 0 | 1 | 2, value: string): ThemeDraftEditResult => {
    colorRgbInputs[role][channel] = value;
    const nextHex = rgbHex(colorRgbInputs[role]);
    if (nextHex !== null) return editColorHex(role, nextHex);
    editRevision += 1;
    dirty = true;
    dirtyDrafts.set(snapshot.activeId, true);
    colorInputDiagnostics.set(role, Object.freeze({
      code: 'THEME_SCHEMA_INVALID',
      path: Object.freeze(['draft', 'colors', role, channel]),
      message: 'RGB channels must be whole numbers from 0 to 255.'
    }));
    const diagnostics = combinedDiagnostics();
    return { ok: false, authoring: authoring(), diagnostics };
  };

  const currentPersisted = (): PersistedThemeDraft => PersistedThemeDraftSchema.parse(
    validDrafts.get(snapshot.activeId) ?? editable
  );

  const currentTypography = (current: PersistedThemeDraft): ThemeTypography => (
    current.draft.typography ?? snapshot.resolved.theme.typography
  );

  return Object.freeze({
    getSnapshot: () => snapshot,
    getAuthoringSnapshot: authoring,
    activate(id: string): ThemeActivationResult {
      const raw = resolveRawPreset(id);
      if (!raw.ok) return raw;
      const activeId = raw.snapshot.activeId;
      const target = rawTarget(activeId)!;
      const persisted = validDrafts.get(activeId) ?? seedDraft(activeId, target, byId.get(activeId)?.canvasAuthoring);
      const result = applyPersisted(activeId, persisted);
      if (!result.ok) return result;
      snapshot = result.snapshot;
      editable = persisted;
      authoringDiagnostics = Object.freeze([]);
      clearColorInputDiagnostics();
      syncColorInputs(persisted);
      editRevision += 1;
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
    editColorHex,
    editColorRgb,
    editTypographyRole(role: ThemeTypographyRoleId, patch: Partial<ThemeTypographyRole>): ThemeDraftEditResult {
      const current = currentPersisted();
      const typography = currentTypography(current);
      const existing = role === 'display'
        ? typography.display ?? typography.ui
        : typography[role];
      return editDraft({
        ...current,
        draft: {
          ...current.draft,
          typography: {
            ...typography,
            [role]: { ...existing, ...patch }
          }
        }
      });
    },
    editTypographyScale(step: ThemeTypographyScaleId, value: number): ThemeDraftEditResult {
      const current = currentPersisted();
      const typography = currentTypography(current);
      return editDraft({
        ...current,
        draft: {
          ...current.draft,
          typography: {
            ...typography,
            scale: { ...typography.scale, [step]: value }
          }
        }
      });
    },
    resetTypography(): ThemeDraftEditResult {
      const current = currentPersisted();
      const target = rawTarget(snapshot.activeId);
      if (!target) {
        const diagnostics = unknownPresetDiagnostic(snapshot.activeId);
        return { ok: false, authoring: authoring(), diagnostics };
      }
      return editDraft({
        ...current,
        draft: { ...current.draft, typography: structuredClone(target.theme.typography) }
      });
    },
    resetDraft(): ThemeDraftEditResult {
      clearColorInputDiagnostics();
      authoringDiagnostics = Object.freeze([]);
      const next = seedDraft(snapshot.activeId, rawTarget(snapshot.activeId)!, byId.get(snapshot.activeId)?.canvasAuthoring);
      const result = editDraft(next);
      if (result.ok) {
        dirty = false;
        dirtyDrafts.set(snapshot.activeId, false);
        return { ok: true, authoring: authoring() };
      }
      return result;
    },
    saveDraft(): Promise<ThemeDraftSaveResult> {
      if (pendingSave) return pendingSave;
      const inputDiagnostics = combinedDiagnostics();
      if (inputDiagnostics.length > 0) {
        return Promise.resolve({ ok: false, authoring: authoring(), diagnostics: inputDiagnostics });
      }
      const parsed = PersistedThemeDraftSchema.safeParse(editable);
      if (!parsed.success) {
        authoringDiagnostics = schemaDiagnostics(parsed.error.issues);
        const diagnostics = combinedDiagnostics();
        return Promise.resolve({ ok: false, authoring: authoring(), diagnostics });
      }
      if (!options.draftStorage) {
        authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['storage'], 'Theme draft storage is unavailable.');
        const diagnostics = combinedDiagnostics();
        return Promise.resolve({ ok: false, authoring: authoring(), diagnostics });
      }
      const savedRevision = editRevision;
      const savedId = snapshot.activeId;
      saving = true;
      const operation = (async (): Promise<ThemeDraftSaveResult> => {
        const saved = await savePersistedThemeDraft(
          options.draftStorage!,
          parsed.data,
          themeDraftStorageKey(savedId)
        );
        if (!saved.ok) {
          const storageDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['storage'], saved.message);
          authoringDiagnostics = editRevision === savedRevision && snapshot.activeId === savedId
            ? storageDiagnostics
            : Object.freeze([...authoringDiagnostics, ...storageDiagnostics]);
          saving = false;
          const diagnostics = combinedDiagnostics();
          return { ok: false, authoring: authoring(), diagnostics };
        }
        if (editRevision === savedRevision && snapshot.activeId === savedId) {
          dirty = false;
          dirtyDrafts.set(savedId, false);
          authoringDiagnostics = Object.freeze([]);
        }
        saving = false;
        return { ok: true, authoring: authoring() };
      })();
      pendingSave = operation;
      void operation.finally(() => {
        if (pendingSave === operation) pendingSave = null;
      });
      return operation;
    },
    async loadDraft(): Promise<ThemeDraftEditResult> {
      if (!options.draftStorage) {
        authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['storage'], 'Theme draft storage is unavailable.');
        return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
      }
      const activeId = snapshot.activeId;
      const canvasDefaults = byId.get(activeId)?.canvasAuthoring?.defaults;
      let loaded = await loadPersistedThemeDraft(
        options.draftStorage,
        canvasDefaults,
        themeDraftStorageKey(activeId)
      );
      if (!loaded.ok) {
        authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['storage'], loaded.message);
        return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
      }
      if (loaded.value === null) {
        const legacy = await loadPersistedThemeDraft(options.draftStorage, canvasDefaults, LAB_THEME_DRAFT_KEY);
        if (!legacy.ok) {
          authoringDiagnostics = diagnostic('THEME_SCHEMA_INVALID', ['storage'], legacy.message);
          return { ok: false, authoring: authoring(), diagnostics: authoringDiagnostics };
        }
        if (legacy.value?.draft.baseTargetId === activeId) {
          loaded = legacy;
          const migrated = await savePersistedThemeDraft(
            options.draftStorage,
            legacy.value,
            themeDraftStorageKey(activeId)
          );
          if (migrated.ok) {
            try { await options.draftStorage.remove?.(LAB_THEME_DRAFT_KEY); } catch { /* The migrated per-theme copy remains usable. */ }
          }
        }
      }
      if (snapshot.activeId !== activeId || loaded.value === null || loaded.value.draft.baseTargetId !== activeId) {
        return { ok: true, authoring: authoring() };
      }
      clearColorInputDiagnostics();
      authoringDiagnostics = Object.freeze([]);
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
