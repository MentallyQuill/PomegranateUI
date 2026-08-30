import {
  AMBIENT_SCHEMA_VERSION,
  CANVAS_SCHEMA_VERSION,
  THEME_SCHEMA_VERSION_V3,
  THEME_TARGET_SCHEMA_VERSION,
  ThemeTargetBundleSchema,
  type ThemeDefinitionV2,
  type ThemeTargetBundle
} from '@pomegranate-ui/contracts';

import {
  migrateTheme,
  type ThemeMigrationDiagnostic,
  type ThemeMigrationDiagnosticCode
} from './migrate.js';

export type ThemeTargetMigrationResult =
  | { readonly ok: true; readonly target: ThemeTargetBundle; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeMigrationDiagnostic[] };

function diagnosticPath(path: readonly PropertyKey[]): readonly (string | number)[] {
  return path.map((part) => typeof part === 'number' ? part : String(part));
}

function diagnostics(
  code: ThemeMigrationDiagnosticCode,
  issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[]
): readonly ThemeMigrationDiagnostic[] {
  return issues.map((issue) => ({ code, path: diagnosticPath(issue.path), message: issue.message }));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

function liftTheme(theme: ThemeDefinitionV2): ThemeTargetBundle | null {
  const { schemaVersion: _themeVersion, canvas, ...themeWithoutCanvas } = theme;
  const lifted = ThemeTargetBundleSchema.safeParse({
    schemaVersion: THEME_TARGET_SCHEMA_VERSION,
    id: theme.id,
    theme: {
      ...themeWithoutCanvas,
      schemaVersion: THEME_SCHEMA_VERSION_V3
    },
    canvas: {
      schemaVersion: CANVAS_SCHEMA_VERSION,
      id: theme.id,
      layers: canvas
    },
    ambient: {
      schemaVersion: AMBIENT_SCHEMA_VERSION,
      id: theme.id,
      colorRole: 'accent',
      position: { x: 0.5, y: 0.5 },
      radius: 0.5,
      power: 0
    }
  });
  return lifted.success ? lifted.data : null;
}

export function migrateThemeTarget(input: unknown): ThemeTargetMigrationResult {
  const schemaVersion = input !== null && typeof input === 'object' && 'schemaVersion' in input
    ? (input as { readonly schemaVersion?: unknown }).schemaVersion
    : undefined;

  if (schemaVersion === THEME_TARGET_SCHEMA_VERSION) {
    const parsed = ThemeTargetBundleSchema.safeParse(input);
    return parsed.success
      ? { ok: true, target: deepFreeze(parsed.data), diagnostics: [] }
      : { ok: false, diagnostics: diagnostics('THEME_MIGRATION_INPUT_INVALID', parsed.error.issues) };
  }

  if (schemaVersion !== 'pomegranate.ui.theme.v1' && schemaVersion !== 'pomegranate.ui.theme.v2') {
    return {
      ok: false,
      diagnostics: [{
        code: schemaVersion === undefined ? 'THEME_MIGRATION_INPUT_INVALID' : 'THEME_MIGRATION_VERSION_UNSUPPORTED',
        path: ['schemaVersion'],
        message: schemaVersion === undefined
          ? 'Theme target input must declare schemaVersion.'
          : `Unsupported theme or target schema version '${String(schemaVersion)}'.`
      }]
    };
  }

  const migrated = migrateTheme(input);
  if (!migrated.ok) return migrated;
  const target = liftTheme(migrated.theme);
  if (!target) {
    return {
      ok: false,
      diagnostics: [{
        code: 'THEME_MIGRATION_OUTPUT_INVALID',
        path: [],
        message: 'Valid theme input could not be represented as a separated theme target.'
      }]
    };
  }
  return { ok: true, target: deepFreeze(target), diagnostics: [] };
}
