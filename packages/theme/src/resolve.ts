import {
  THEME_MATERIAL_ROLES,
  ThemeDefinitionSchema,
  ThemePatchSchema,
  type ThemeDefinition,
  type ThemeDefinitionV2,
  type ThemeMaterialV2,
  type ThemeMaterialRole,
  type ThemePatch
} from '@pomegranate-ui/contracts';
import { resolveThemeAssets, type ThemeAssetRegistry } from './assets.js';
import { migrateTheme } from './migrate.js';

export type ThemeDiagnosticCode =
  | 'THEME_SCHEMA_INVALID'
  | 'THEME_UNKNOWN_PRESET'
  | 'THEME_ASSET_MISSING'
  | 'THEME_ASSET_KIND_MISMATCH'
  | 'THEME_ICON_PACK_MISSING'
  | 'THEME_MIGRATION_INPUT_INVALID'
  | 'THEME_MIGRATION_OUTPUT_INVALID'
  | 'THEME_CONTRAST_UNSAFE';

export interface ThemeDiagnostic {
  readonly code: ThemeDiagnosticCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export interface ResolvedMaterial {
  readonly base: string;
  readonly fallback: string;
  readonly opacity: number;
  readonly blurPx: number;
  readonly saturation: number;
  readonly border: string;
  readonly shadow: string;
  readonly shadowOpacity: number;
  readonly shadowBlurPx: number;
  readonly insetHighlight: number;
  readonly bloom: number;
  readonly textureAssetId?: string;
}

export interface ResolvedTheme extends Omit<ThemeDefinition, 'materials'> {
  readonly materials: Readonly<Record<ThemeMaterialRole, ResolvedMaterial>>;
}

export type ThemeResolution =
  | { readonly ok: true; readonly theme: ResolvedTheme; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeDiagnostic[] };

export interface ResolvedMaterialV2 extends Omit<ThemeMaterialV2, 'base' | 'fallback' | 'border' | 'rim' | 'shadows'> {
  readonly base: string;
  readonly fallback: string;
  readonly border: Omit<ThemeMaterialV2['border'], 'color'> & { readonly color: string };
  readonly rim: Omit<ThemeMaterialV2['rim'], 'color'> & { readonly color: string };
  readonly shadows: readonly (Omit<ThemeMaterialV2['shadows'][number], 'color'> & { readonly color: string })[];
}

export interface ResolvedThemeV2 extends Omit<ThemeDefinitionV2, 'materials' | 'assets'> {
  readonly materials: Readonly<Record<string, ResolvedMaterialV2>>;
  readonly assets: ThemeAssetRegistry;
}

export type ThemeResolutionV2 =
  | { readonly ok: true; readonly theme: ResolvedThemeV2; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeDiagnostic[] };

function diagnosticPath(path: readonly PropertyKey[]): readonly (string | number)[] {
  return path.map((part) => typeof part === 'number' ? part : String(part));
}

function schemaDiagnostics(issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[]): readonly ThemeDiagnostic[] {
  return issues.map((issue) => ({
    code: 'THEME_SCHEMA_INVALID',
    path: diagnosticPath(issue.path),
    message: issue.message
  }));
}

export class ThemeMergeError extends Error {
  readonly diagnostics: readonly ThemeDiagnostic[];

  constructor(diagnostics: readonly ThemeDiagnostic[]) {
    super('Theme merge produced an invalid definition.');
    this.name = 'ThemeMergeError';
    this.diagnostics = diagnostics;
  }
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export function resolveTheme(input: unknown): ThemeResolution {
  const parsed = ThemeDefinitionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      diagnostics: schemaDiagnostics(parsed.error.issues)
    };
  }

  const theme = parsed.data;
  const materials = Object.fromEntries(THEME_MATERIAL_ROLES.map((role) => {
    const material = theme.materials[role];
    return [role, {
      base: theme.colors[material.base],
      fallback: theme.colors[material.fallback],
      opacity: material.opacity,
      blurPx: material.blurPx,
      saturation: material.saturation,
      border: theme.colors[material.border],
      shadow: theme.colors[material.shadow],
      shadowOpacity: material.shadowOpacity,
      shadowBlurPx: material.shadowBlurPx,
      insetHighlight: material.insetHighlight,
      bloom: material.bloom,
      ...(material.textureAssetId ? { textureAssetId: material.textureAssetId } : {})
    } satisfies ResolvedMaterial];
  })) as Record<ThemeMaterialRole, ResolvedMaterial>;

  return {
    ok: true,
    theme: deepFreeze({ ...theme, materials }),
    diagnostics: []
  };
}

export function resolveThemeV2(input: unknown, registry: ThemeAssetRegistry = {}): ThemeResolutionV2 {
  const migrated = migrateTheme(input);
  if (!migrated.ok) return { ok: false, diagnostics: migrated.diagnostics };

  const theme = migrated.theme;
  const resolvedAssets = resolveThemeAssets(theme, registry);
  if (!resolvedAssets.ok) return { ok: false, diagnostics: resolvedAssets.diagnostics };

  const materials = Object.fromEntries(Object.entries(theme.materials).map(([id, material]) => [id, {
    ...material,
    base: theme.colors[material.base],
    fallback: theme.colors[material.fallback],
    border: { ...material.border, color: theme.colors[material.border.color] },
    rim: { ...material.rim, color: theme.colors[material.rim.color] },
    shadows: material.shadows.map((shadow) => ({ ...shadow, color: theme.colors[shadow.color] }))
  } satisfies ResolvedMaterialV2])) as Record<string, ResolvedMaterialV2>;

  return {
    ok: true,
    theme: deepFreeze({
      ...theme,
      materials,
      assets: resolvedAssets.assets
    }),
    diagnostics: []
  };
}

export function mergeTheme(baseInput: ThemeDefinition, patchInput: ThemePatch): ThemeDefinition {
  const base = ThemeDefinitionSchema.safeParse(baseInput);
  const patch = ThemePatchSchema.safeParse(patchInput);
  if (!base.success) throw new ThemeMergeError(schemaDiagnostics(base.error.issues));
  if (!patch.success) throw new ThemeMergeError(schemaDiagnostics(patch.error.issues));

  const next = patch.data;
  const typography = next.typography ? {
    ...base.data.typography,
    ...next.typography,
    ui: { ...base.data.typography.ui, ...next.typography.ui },
    prose: { ...base.data.typography.prose, ...next.typography.prose },
    technical: { ...base.data.typography.technical, ...next.typography.technical },
    ...(next.typography.display
      ? { display: { ...base.data.typography.display, ...next.typography.display } }
      : {}),
    scale: { ...base.data.typography.scale, ...next.typography.scale }
  } : base.data.typography;
  const materials = next.materials ? Object.fromEntries(THEME_MATERIAL_ROLES.map((role) => [
    role,
    { ...base.data.materials[role], ...next.materials?.[role] }
  ])) : base.data.materials;
  const merged = ThemeDefinitionSchema.safeParse({
    ...base.data,
    ...next,
    colors: { ...base.data.colors, ...next.colors },
    typography,
    geometry: { ...base.data.geometry, ...next.geometry },
    spacing: { ...base.data.spacing, ...next.spacing },
    materials,
    accessibility: { ...base.data.accessibility, ...next.accessibility },
    capabilities: { ...base.data.capabilities, ...next.capabilities }
  });
  if (!merged.success) throw new ThemeMergeError(schemaDiagnostics(merged.error.issues));
  return merged.data;
}
