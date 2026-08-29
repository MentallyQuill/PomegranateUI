import {
  THEME_MATERIAL_ROLES,
  THEME_PART_IDS,
  ThemeDefinitionV1Schema,
  ThemeDefinitionV2Schema,
  type ThemeDefinitionV1,
  type ThemeDefinitionV2,
  type ThemeMaterialRole,
  type ThemeMaterialV2,
  type ThemePartId,
  type ThemePartRecipeV2,
  type ThemeShapeV2
} from '@pomegranate-ui/contracts';

export type ThemeMigrationDiagnosticCode =
  | 'THEME_MIGRATION_INPUT_INVALID'
  | 'THEME_MIGRATION_OUTPUT_INVALID';

export interface ThemeMigrationDiagnostic {
  readonly code: ThemeMigrationDiagnosticCode;
  readonly path: readonly (string | number)[];
  readonly message: string;
}

export type ThemeMigrationResult =
  | { readonly ok: true; readonly theme: ThemeDefinitionV2; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeMigrationDiagnostic[] };

const PART_MATERIALS: Readonly<Record<ThemePartId, ThemeMaterialRole>> = {
  'canvas.surface': 'canvas',
  'chrome.shelf': 'shelf',
  'chrome.context': 'shelf',
  'dock.surface': 'panel',
  'panel.surface': 'panel',
  'group.surface': 'panel',
  'widget.surface': 'widget',
  'widget.header': 'widget',
  'widget.content': 'widget',
  'widget.actions': 'widget',
  'row.surface': 'field',
  separator: 'field',
  'field.surface': 'field',
  'button.surface': 'button',
  'button.icon': 'button',
  'menu.surface': 'menu',
  'dialog.surface': 'dialog',
  'floating.surface': 'floating',
  'slider.input': 'field',
  'slider.track': 'field',
  'slider.fill': 'button',
  'slider.thumb': 'button'
};

const PART_SHAPES: Readonly<Record<ThemePartId, string>> = {
  'canvas.surface': 'none',
  'chrome.shelf': 'large',
  'chrome.context': 'pill',
  'dock.surface': 'large',
  'panel.surface': 'large',
  'group.surface': 'widget',
  'widget.surface': 'widget',
  'widget.header': 'widget',
  'widget.content': 'widget',
  'widget.actions': 'widget',
  'row.surface': 'small',
  separator: 'none',
  'field.surface': 'small',
  'button.surface': 'small',
  'button.icon': 'pill',
  'menu.surface': 'large',
  'dialog.surface': 'large',
  'floating.surface': 'large',
  'slider.input': 'pill',
  'slider.track': 'pill',
  'slider.fill': 'pill',
  'slider.thumb': 'pill'
};

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

function migrateMaterial(
  material: ThemeDefinitionV1['materials'][ThemeMaterialRole],
  reducedTransparency: string,
  borderWidth: number,
  opaque = false
): ThemeMaterialV2 {
  const base = opaque ? material.fallback : material.base;
  return {
    base,
    fallback: material.fallback,
    opacity: opaque ? 1 : material.opacity,
    backdrop: {
      blurPx: opaque ? 0 : material.blurPx,
      saturation: opaque ? 1 : material.saturation,
      brightness: 1
    },
    contentTone: 'auto',
    border: { color: material.border, widthPx: borderWidth, opacity: 1 },
    rim: { color: 'surfaceElevated', opacity: opaque ? 0 : material.insetHighlight, angleDeg: 180 },
    shadows: material.shadowOpacity > 0 ? [{
      x: 0,
      y: Math.min(24, Math.round(material.shadowBlurPx / 4)),
      blurPx: material.shadowBlurPx,
      spreadPx: 0,
      color: material.shadow,
      opacity: material.shadowOpacity,
      inset: false
    }] : [],
    ...(material.textureAssetId ? {
      texture: { assetId: material.textureAssetId, opacity: 1, blend: 'normal' as const }
    } : {}),
    reducedTransparency
  };
}

function shapeFamily(theme: ThemeDefinitionV1): ThemeShapeV2['family'] {
  return theme.geometry.cornerFamily;
}

function migrateV1(theme: ThemeDefinitionV1): ThemeDefinitionV2 | null {
  const materials: Record<string, ThemeMaterialV2> = {};
  for (const role of THEME_MATERIAL_ROLES) {
    const opaqueId = `${role}-opaque`;
    materials[role] = migrateMaterial(theme.materials[role], opaqueId, theme.geometry.borderWidth);
    materials[opaqueId] = migrateMaterial(theme.materials[role], opaqueId, theme.geometry.borderWidth, true);
  }

  const family = shapeFamily(theme);
  const shapes: Record<string, ThemeShapeV2> = {
    none: { family: 'none', radiusPx: 0, chamferPx: 0, chamferAngleDeg: 45, joinedEdges: [] },
    small: {
      family,
      radiusPx: theme.geometry.cornerSm,
      chamferPx: family === 'chamfered' ? theme.geometry.chamfer : 0,
      chamferAngleDeg: theme.geometry.chamferAngle,
      joinedEdges: []
    },
    widget: {
      family,
      radiusPx: theme.geometry.cornerMd,
      chamferPx: family === 'chamfered' ? theme.geometry.chamfer : 0,
      chamferAngleDeg: theme.geometry.chamferAngle,
      joinedEdges: []
    },
    large: {
      family,
      radiusPx: theme.geometry.cornerLg,
      chamferPx: family === 'chamfered' ? theme.geometry.chamfer : 0,
      chamferAngleDeg: theme.geometry.chamferAngle,
      joinedEdges: []
    },
    pill: {
      family: 'pill',
      radiusPx: theme.geometry.cornerPill,
      chamferPx: 0,
      chamferAngleDeg: theme.geometry.chamferAngle,
      joinedEdges: []
    }
  };

  const parts = Object.fromEntries(THEME_PART_IDS.map((part) => [part, {
    material: PART_MATERIALS[part],
    shape: PART_SHAPES[part],
    typography: 'ui',
    spacing: part === 'canvas.surface' || part === 'separator' ? 'xs' : 'md',
    overflow: part === 'widget.content' ? 'scroll' : 'visible',
    separator: part === 'separator' ? theme.geometry.sharedEdge === 'none' ? 'space' : 'hairline' : 'none',
    elevation: ['canvas.surface', 'separator', 'slider.input', 'slider.track', 'slider.fill'].includes(part) ? 0 : 2,
    states: { disabledOpacity: 0.5 }
  } satisfies ThemePartRecipeV2])) as Record<ThemePartId, ThemePartRecipeV2>;

  const migrated = ThemeDefinitionV2Schema.safeParse({
    schemaVersion: 'pomegranate.ui.theme.v2',
    id: theme.id,
    label: theme.label,
    ...(theme.description ? { description: theme.description } : {}),
    colors: theme.colors,
    typography: theme.typography,
    spacing: theme.spacing,
    materials,
    shapes,
    recipes: {
      parts,
      widgetGrouping: 'individual',
      chromePresentation: 'full',
      actionPresentation: 'always'
    },
    controls: {
      slider: {
        trackPx: Math.max(2, Math.min(12, theme.geometry.borderWidth * 2 + 2)),
        thumbPx: Math.max(8, Math.min(32, theme.geometry.cornerMd + 4)),
        hitTargetPx: theme.accessibility.coarsePointerMinimum
      }
    },
    iconPackId: theme.iconPackId,
    assets: theme.assets,
    canvas: theme.canvas,
    accessibility: theme.accessibility,
    capabilities: theme.capabilities
  });

  return migrated.success ? migrated.data : null;
}

export function migrateTheme(input: unknown): ThemeMigrationResult {
  const v2 = ThemeDefinitionV2Schema.safeParse(input);
  if (v2.success) return { ok: true, theme: deepFreeze(v2.data), diagnostics: [] };

  const v1 = ThemeDefinitionV1Schema.safeParse(input);
  if (!v1.success) {
    return {
      ok: false,
      diagnostics: diagnostics('THEME_MIGRATION_INPUT_INVALID', v1.error.issues)
    };
  }

  const migrated = migrateV1(v1.data);
  if (!migrated) {
    return {
      ok: false,
      diagnostics: [{
        code: 'THEME_MIGRATION_OUTPUT_INVALID',
        path: [],
        message: 'Valid v1 input could not be represented as a v2 theme.'
      }]
    };
  }

  return { ok: true, theme: deepFreeze(migrated), diagnostics: [] };
}
