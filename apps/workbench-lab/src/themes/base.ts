import {
  AMBIENT_SCHEMA_VERSION,
  CANVAS_SCHEMA_VERSION,
  THEME_PART_IDS,
  THEME_SCHEMA_VERSION_V3,
  THEME_TARGET_SCHEMA_VERSION,
  ThemeTargetBundleSchema,
  type AmbientProfile,
  type ThemeColorRole,
  type ThemeDefinitionV2,
  type ThemeMaterialV2,
  type ThemePartId,
  type ThemePartRecipeV2,
  type ThemeShapeV2,
  type ThemeTargetBundle
} from '@pomegranate-ui/contracts';

export const LAB_MATERIAL_IDS = [
  'canvas', 'shelf', 'context', 'panel', 'pane', 'header', 'content', 'row', 'field',
  'button', 'selected', 'menu', 'dialog', 'floating', 'track', 'fill', 'thumb', 'opaque'
] as const;
export type LabMaterialId = (typeof LAB_MATERIAL_IDS)[number];

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export function themeTarget(
  themeInput: ThemeDefinitionV2,
  ambient: Omit<AmbientProfile, 'schemaVersion' | 'id'>
): ThemeTargetBundle {
  const theme = structuredClone(themeInput);
  const { schemaVersion: _themeVersion, canvas, ...themeWithoutCanvas } = theme;
  return deepFreeze(ThemeTargetBundleSchema.parse({
    schemaVersion: THEME_TARGET_SCHEMA_VERSION,
    id: theme.id,
    theme: { ...themeWithoutCanvas, schemaVersion: THEME_SCHEMA_VERSION_V3 },
    canvas: { schemaVersion: CANVAS_SCHEMA_VERSION, id: theme.id, layers: canvas },
    ambient: { ...ambient, schemaVersion: AMBIENT_SCHEMA_VERSION, id: theme.id }
  }));
}

export interface MaterialOptions {
  readonly base: ThemeColorRole;
  readonly fallback?: ThemeColorRole;
  readonly opacity: number;
  readonly blurPx: number;
  readonly saturation?: number;
  readonly brightness?: number;
  readonly contentTone?: ThemeMaterialV2['contentTone'];
  readonly border?: ThemeColorRole;
  readonly borderWidthPx?: number;
  readonly borderOpacity?: number;
  readonly rimOpacity?: number;
  readonly rimAngleDeg?: number;
  readonly shadowOpacity?: number;
  readonly shadowBlurPx?: number;
  readonly shadowY?: number;
  readonly shadowSpreadPx?: number;
  readonly reducedTransparency?: LabMaterialId;
}

export function material(options: MaterialOptions): ThemeMaterialV2 {
  return {
    base: options.base,
    fallback: options.fallback ?? options.base,
    opacity: options.opacity,
    backdrop: {
      blurPx: options.blurPx,
      saturation: options.saturation ?? 1,
      brightness: options.brightness ?? 1
    },
    contentTone: options.contentTone ?? 'auto',
    border: {
      color: options.border ?? 'border',
      widthPx: options.borderWidthPx ?? 1,
      opacity: options.borderOpacity ?? 0.55
    },
    rim: {
      color: 'surfaceElevated',
      opacity: options.rimOpacity ?? 0.12,
      angleDeg: options.rimAngleDeg ?? 180
    },
    shadows: (options.shadowOpacity ?? 0) > 0 ? [{
      x: 0,
      y: options.shadowY ?? 16,
      blurPx: options.shadowBlurPx ?? 42,
      spreadPx: options.shadowSpreadPx ?? -6,
      color: 'shadow',
      opacity: options.shadowOpacity ?? 0,
      inset: false
    }] : [],
    reducedTransparency: options.reducedTransparency ?? 'opaque'
  };
}

export function shapePalette(options: {
  readonly family: ThemeShapeV2['family'];
  readonly small: number;
  readonly medium: number;
  readonly large: number;
  readonly chamferPx?: number;
}): ThemeDefinitionV2['shapes'] {
  const shape = (
    radiusPx: number,
    joinedEdges: ThemeShapeV2['joinedEdges'] = [],
    family: ThemeShapeV2['family'] = options.family
  ): ThemeShapeV2 => ({
    family,
    radiusPx,
    chamferPx: family === 'chamfered' ? options.chamferPx ?? 6 : 0,
    chamferAngleDeg: 45,
    joinedEdges
  });
  return {
    none: shape(0, [], 'none'),
    chrome: shape(options.large),
    pane: shape(options.medium),
    header: shape(options.medium, ['bottom']),
    content: shape(options.medium, ['top']),
    group: shape(options.medium),
    row: shape(options.small),
    field: shape(options.small),
    button: shape(options.small),
    pill: shape(999, [], 'pill')
  };
}

const PART_MATERIALS: Readonly<Record<ThemePartId, LabMaterialId>> = {
  'canvas.surface': 'canvas',
  'chrome.shelf': 'shelf',
  'chrome.context': 'context',
  'dock.surface': 'panel',
  'panel.surface': 'panel',
  'sub-panel.bar': 'shelf',
  'sub-panel.surface': 'panel',
  'group.surface': 'panel',
  'widget.surface': 'pane',
  'widget.header': 'header',
  'widget.content': 'content',
  'widget.actions': 'header',
  'row.surface': 'row',
  separator: 'row',
  'story.measure-resizer': 'row',
  'field.surface': 'field',
  'button.surface': 'button',
  'button.icon': 'button',
  'menu.surface': 'menu',
  'dialog.surface': 'dialog',
  'floating.surface': 'floating',
  'slider.input': 'field',
  'slider.track': 'track',
  'slider.fill': 'fill',
  'slider.thumb': 'thumb'
};

const PART_SHAPES: Readonly<Record<ThemePartId, string>> = {
  'canvas.surface': 'none',
  'chrome.shelf': 'chrome',
  'chrome.context': 'pill',
  'dock.surface': 'none',
  'panel.surface': 'none',
  'sub-panel.bar': 'none',
  'sub-panel.surface': 'none',
  'group.surface': 'group',
  'widget.surface': 'pane',
  'widget.header': 'header',
  'widget.content': 'content',
  'widget.actions': 'content',
  'row.surface': 'row',
  separator: 'none',
  'story.measure-resizer': 'none',
  'field.surface': 'field',
  'button.surface': 'button',
  'button.icon': 'pill',
  'menu.surface': 'pane',
  'dialog.surface': 'pane',
  'floating.surface': 'pane',
  'slider.input': 'pill',
  'slider.track': 'pill',
  'slider.fill': 'pill',
  'slider.thumb': 'pill'
};

export function themeRecipes(options: {
  readonly widgetGrouping: ThemeDefinitionV2['recipes']['widgetGrouping'];
  readonly chromePresentation: ThemeDefinitionV2['recipes']['chromePresentation'];
  readonly actionPresentation: ThemeDefinitionV2['recipes']['actionPresentation'];
  readonly toolbarTogglePresentation?: ThemeDefinitionV2['recipes']['toolbarTogglePresentation'];
}): ThemeDefinitionV2['recipes'] {
  const parts = Object.fromEntries(THEME_PART_IDS.map((part) => [part, {
    material: PART_MATERIALS[part],
    shape: PART_SHAPES[part],
    typography: part === 'separator' || part === 'story.measure-resizer' ? 'technical' : 'ui',
    spacing: part === 'canvas.surface' || part === 'separator' || part === 'story.measure-resizer' ? 'xs' : 'md',
    overflow: ['widget.surface', 'menu.surface', 'dialog.surface', 'floating.surface'].includes(part) ? 'clip' : 'visible',
    separator: part === 'separator' ? 'hairline' : 'none',
    elevation: part === 'floating.surface' || part === 'dialog.surface' ? 4
      : part === 'menu.surface' ? 3
        : part === 'sub-panel.bar' ? 3
        : part === 'widget.surface' ? 2
          : 0,
    states: {
      hover: ['button.surface', 'button.icon', 'row.surface'].includes(part) ? { material: 'selected' } : undefined,
      pressed: ['button.surface', 'button.icon'].includes(part) ? { material: 'selected', opacity: 0.88 } : undefined,
      selected: ['button.surface', 'button.icon', 'row.surface'].includes(part) ? { material: 'selected' } : undefined,
      focus: ['button.surface', 'button.icon', 'field.surface', 'slider.input'].includes(part) ? { material: 'selected' } : undefined,
      inactive: { opacity: 0.78 },
      disabledOpacity: 0.46
    }
  } satisfies ThemePartRecipeV2])) as Record<ThemePartId, ThemePartRecipeV2>;
  return {
    parts,
    ...options,
    toolbarTogglePresentation: options.toolbarTogglePresentation ?? 'edge-labels'
  };
}
