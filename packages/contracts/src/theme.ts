import { z } from 'zod';

export const THEME_SCHEMA_VERSION = 'pomegranate.ui.theme.v1' as const;
export const THEME_SCHEMA_VERSION_V2 = 'pomegranate.ui.theme.v2' as const;

export const THEME_COLOR_ROLES = [
  'canvas',
  'surface',
  'surfaceElevated',
  'surfaceInset',
  'chrome',
  'text',
  'textMuted',
  'textFaint',
  'textOnAccent',
  'accent',
  'selection',
  'focus',
  'success',
  'warning',
  'danger',
  'border',
  'borderStrong',
  'shadow'
] as const;

export const THEME_MATERIAL_ROLES = [
  'canvas',
  'shelf',
  'panel',
  'widget',
  'field',
  'button',
  'menu',
  'dialog',
  'floating'
] as const;

export const THEME_PART_IDS = [
  'canvas.surface',
  'chrome.shelf',
  'chrome.context',
  'dock.surface',
  'panel.surface',
  'sub-panel.bar',
  'sub-panel.surface',
  'group.surface',
  'widget.surface',
  'widget.header',
  'widget.content',
  'widget.actions',
  'row.surface',
  'separator',
  'field.surface',
  'button.surface',
  'button.icon',
  'menu.surface',
  'dialog.surface',
  'floating.surface',
  'slider.input',
  'slider.track',
  'slider.fill',
  'slider.thumb'
] as const;

const nonBlankString = (label: string) => z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  { message: `${label} must be non-empty and contain no surrounding whitespace.` }
);
const boundedNumber = (minimum: number, maximum: number) => z.number().finite().min(minimum).max(maximum);
const opacitySchema = boundedNumber(0, 1);
const colorSchema = z.string().regex(/^#[0-9a-f]{6}(?:[0-9a-f]{2})?$/i, 'Colors must use #RRGGBB or #RRGGBBAA syntax.');
const themeIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/, 'Theme IDs must use lower-case kebab case.');
const assetIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/, 'Asset IDs must be local dotted or kebab identifiers.');
const fontNameSchema = z.string().regex(/^[a-z0-9 ._-]+$/i, 'Font names may contain only letters, numbers, spaces, dots, underscores, and hyphens.');

export const ThemeColorRoleSchema = z.enum(THEME_COLOR_ROLES);
export const ThemeMaterialRoleSchema = z.enum(THEME_MATERIAL_ROLES);
export const ThemeIdSchema = themeIdSchema;

const semanticColorsShape = Object.fromEntries(
  THEME_COLOR_ROLES.map((role) => [role, colorSchema])
) as Record<(typeof THEME_COLOR_ROLES)[number], typeof colorSchema>;

export const ThemeSemanticColorsSchema = z.object(semanticColorsShape).strict();

export const ThemeTypographyRoleSchema = z.object({
  family: fontNameSchema,
  fallbacks: z.array(fontNameSchema).min(1).max(8),
  weight: z.number().int().min(100).max(900),
  strongWeight: z.number().int().min(100).max(900),
  lineHeight: boundedNumber(1, 2.5),
  trackingEm: boundedNumber(-0.1, 0.25)
}).strict();

export const ThemeTypographySchema = z.object({
  ui: ThemeTypographyRoleSchema,
  prose: ThemeTypographyRoleSchema,
  technical: ThemeTypographyRoleSchema,
  display: ThemeTypographyRoleSchema.optional(),
  scale: z.object({
    xs: boundedNumber(8, 24),
    sm: boundedNumber(9, 28),
    md: boundedNumber(10, 32),
    lg: boundedNumber(12, 48),
    xl: boundedNumber(14, 72)
  }).strict().refine(
    ({ xs, sm, md, lg, xl }) => xs <= sm && sm <= md && md <= lg && lg <= xl,
    { message: 'Typography scale must be ordered from xs through xl.' }
  )
}).strict();

export const ThemeGeometrySchema = z.object({
  cornerFamily: z.enum(['square', 'rounded', 'pill', 'chamfered']),
  cornerSm: boundedNumber(0, 32),
  cornerMd: boundedNumber(0, 48),
  cornerLg: boundedNumber(0, 72),
  cornerPill: boundedNumber(24, 999),
  chamfer: boundedNumber(0, 32),
  chamferAngle: boundedNumber(15, 75),
  borderWidth: boundedNumber(0, 4),
  sharedEdge: z.enum(['none', 'hairline', 'overlap']),
  focusWidth: boundedNumber(2, 6),
  focusOffset: boundedNumber(0, 8)
}).strict();

const spacingShape = {
  density: z.enum(['compact', 'balanced', 'roomy']),
  xs: boundedNumber(2, 16),
  sm: boundedNumber(3, 24),
  md: boundedNumber(4, 32),
  lg: boundedNumber(6, 48),
  xl: boundedNumber(8, 72),
  chromeHeight: boundedNumber(32, 72)
};

export const ThemeSpacingSchema = z.object(spacingShape).strict().refine(
  ({ xs, sm, md, lg, xl }) => xs <= sm && sm <= md && md <= lg && lg <= xl,
  { message: 'Spacing scale must be ordered from xs through xl.' }
);

export const ThemeMaterialSchema = z.object({
  base: ThemeColorRoleSchema,
  fallback: ThemeColorRoleSchema,
  opacity: opacitySchema,
  blurPx: boundedNumber(0, 80),
  saturation: boundedNumber(0.5, 2),
  border: ThemeColorRoleSchema,
  shadow: ThemeColorRoleSchema,
  shadowOpacity: opacitySchema,
  shadowBlurPx: boundedNumber(0, 160),
  insetHighlight: opacitySchema,
  bloom: opacitySchema,
  textureAssetId: assetIdSchema.optional()
}).strict();

const materialRolesShape = Object.fromEntries(
  THEME_MATERIAL_ROLES.map((role) => [role, ThemeMaterialSchema])
) as Record<(typeof THEME_MATERIAL_ROLES)[number], typeof ThemeMaterialSchema>;

export const ThemeMaterialsSchema = z.object(materialRolesShape).strict();

export const ThemeAssetReferenceSchema = z.object({
  id: assetIdSchema,
  kind: z.enum(['font', 'icon-pack', 'texture', 'image']),
  required: z.boolean().default(true),
  fallbackId: assetIdSchema.optional()
}).strict().refine(
  ({ id, fallbackId }) => fallbackId !== id,
  { message: 'An asset fallback must differ from its primary ID.', path: ['fallbackId'] }
);

export const ThemeGradientStopSchema = z.object({
  color: colorSchema,
  position: opacitySchema
}).strict();

const gradientStopsSchema = z.array(ThemeGradientStopSchema).min(2).max(8).refine(
  (stops) => stops.every((stop, index) => index === 0 || stops[index - 1]!.position <= stop.position),
  { message: 'Gradient stops must be ordered by position.' }
);

const pointSchema = boundedNumber(0, 1);
const blendModeSchema = z.enum(['normal', 'multiply', 'screen', 'overlay', 'soft-light', 'color-burn']);

export const ThemeCanvasLayerSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('solid'),
    color: colorSchema
  }).strict(),
  z.object({
    kind: z.literal('linear-gradient'),
    angle: boundedNumber(-360, 360),
    stops: gradientStopsSchema
  }).strict(),
  z.object({
    kind: z.literal('radial-gradient'),
    shape: z.enum(['circle', 'ellipse']),
    x: pointSchema,
    y: pointSchema,
    stops: gradientStopsSchema
  }).strict(),
  z.object({
    kind: z.literal('conic-gradient'),
    angle: boundedNumber(-360, 360),
    x: pointSchema,
    y: pointSchema,
    stops: gradientStopsSchema
  }).strict(),
  z.object({
    kind: z.literal('four-corner'),
    topLeft: colorSchema,
    topRight: colorSchema,
    bottomLeft: colorSchema,
    bottomRight: colorSchema
  }).strict(),
  z.object({
    kind: z.literal('grid'),
    widthPx: boundedNumber(2, 512),
    heightPx: boundedNumber(2, 512),
    horizontal: colorSchema,
    vertical: colorSchema,
    lineWidthPx: boundedNumber(0.25, 8),
    opacity: opacitySchema,
    mask: z.object({
      angle: boundedNumber(-360, 360),
      stops: gradientStopsSchema
    }).strict().optional()
  }).strict(),
  z.object({
    kind: z.literal('image'),
    assetId: assetIdSchema,
    fit: z.enum(['cover', 'contain', 'fill']),
    x: pointSchema,
    y: pointSchema,
    opacity: opacitySchema,
    blurPx: boundedNumber(0, 40),
    saturation: boundedNumber(0, 2),
    contrast: boundedNumber(0.5, 2).optional(),
    brightness: boundedNumber(0.5, 1.5).optional(),
    blend: blendModeSchema
  }).strict(),
  z.object({
    kind: z.literal('veil'),
    mode: z.enum(['reading', 'vignette']),
    color: colorSchema,
    opacity: opacitySchema
  }).strict(),
  z.object({
    kind: z.literal('texture'),
    assetId: assetIdSchema,
    opacity: opacitySchema,
    blend: blendModeSchema
  }).strict()
]);

export const ThemeAccessibilitySchema = z.object({
  minimumContrast: boundedNumber(4.5, 7),
  largeTextContrast: boundedNumber(3, 7),
  coarsePointerMinimum: boundedNumber(44, 64),
  reducedTransparencySurface: ThemeColorRoleSchema
}).strict();

export const ThemeCapabilitiesSchema = z.object({
  translucency: z.boolean(),
  textures: z.boolean(),
  localImages: z.boolean()
}).strict();

export const ThemeDefinitionSchema = z.object({
  schemaVersion: z.literal(THEME_SCHEMA_VERSION),
  id: themeIdSchema,
  label: nonBlankString('Theme label'),
  description: nonBlankString('Theme description').optional(),
  colors: ThemeSemanticColorsSchema,
  typography: ThemeTypographySchema,
  geometry: ThemeGeometrySchema,
  spacing: ThemeSpacingSchema,
  materials: ThemeMaterialsSchema,
  iconPackId: assetIdSchema,
  assets: z.array(ThemeAssetReferenceSchema).refine(
    (assets) => new Set(assets.map(({ id }) => id)).size === assets.length,
    { message: 'Theme asset IDs must be unique.' }
  ).default([]),
  canvas: z.array(ThemeCanvasLayerSchema).min(1).max(12),
  accessibility: ThemeAccessibilitySchema,
  capabilities: ThemeCapabilitiesSchema
}).strict();

const themeMaterialIdSchema = themeIdSchema;
const themeShapeIdSchema = themeIdSchema;

export const ThemePartIdSchema = z.enum(THEME_PART_IDS);

export const ThemeShadowV2Schema = z.object({
  x: boundedNumber(-64, 64),
  y: boundedNumber(-64, 64),
  blurPx: boundedNumber(0, 160),
  spreadPx: boundedNumber(-32, 64),
  color: ThemeColorRoleSchema,
  opacity: opacitySchema,
  inset: z.boolean()
}).strict();

export const ThemeMaterialV2Schema = z.object({
  base: ThemeColorRoleSchema,
  fallback: ThemeColorRoleSchema,
  opacity: opacitySchema,
  backdrop: z.object({
    blurPx: boundedNumber(0, 80),
    saturation: boundedNumber(0.5, 2),
    brightness: boundedNumber(0.5, 1.5)
  }).strict(),
  contentTone: z.enum(['auto', 'light', 'dark']),
  border: z.object({
    color: ThemeColorRoleSchema,
    widthPx: boundedNumber(0, 4),
    opacity: opacitySchema
  }).strict(),
  rim: z.object({
    color: ThemeColorRoleSchema,
    opacity: opacitySchema,
    angleDeg: boundedNumber(-360, 360)
  }).strict(),
  shadows: z.array(ThemeShadowV2Schema).max(4),
  texture: z.object({
    assetId: assetIdSchema,
    opacity: opacitySchema,
    blend: blendModeSchema
  }).strict().optional(),
  reducedTransparency: themeMaterialIdSchema
}).strict();

export const ThemeShapeV2Schema = z.object({
  family: z.enum(['none', 'square', 'rounded', 'continuous-rounded', 'pill', 'chamfered']),
  radiusPx: boundedNumber(0, 999),
  chamferPx: boundedNumber(0, 32),
  chamferAngleDeg: boundedNumber(15, 75),
  joinedEdges: z.array(z.enum(['top', 'right', 'bottom', 'left'])).max(4).refine(
    (edges) => new Set(edges).size === edges.length,
    { message: 'Joined edges must be unique.' }
  )
}).strict();

const ThemePartStateV2Schema = z.object({
  material: themeMaterialIdSchema.optional(),
  opacity: opacitySchema.optional()
}).strict();

export const ThemePartRecipeV2Schema = z.object({
  material: themeMaterialIdSchema,
  shape: themeShapeIdSchema,
  typography: z.enum(['ui', 'prose', 'technical', 'display']),
  spacing: z.enum(['xs', 'sm', 'md', 'lg', 'xl']),
  overflow: z.enum(['visible', 'clip', 'scroll']),
  separator: z.enum(['none', 'hairline', 'space']),
  elevation: z.number().int().min(0).max(5),
  states: z.object({
    hover: ThemePartStateV2Schema.optional(),
    pressed: ThemePartStateV2Schema.optional(),
    selected: ThemePartStateV2Schema.optional(),
    focus: ThemePartStateV2Schema.optional(),
    inactive: ThemePartStateV2Schema.optional(),
    disabledOpacity: opacitySchema
  }).strict()
}).strict();

const partRecipesShape = Object.fromEntries(
  THEME_PART_IDS.map((part) => [part, ThemePartRecipeV2Schema])
) as Record<(typeof THEME_PART_IDS)[number], typeof ThemePartRecipeV2Schema>;

export const ThemeRecipesV2Schema = z.object({
  parts: z.object(partRecipesShape).strict(),
  widgetGrouping: z.enum(['individual', 'unified']),
  chromePresentation: z.enum(['full', 'compact', 'overlay']),
  shellPresentation: z.enum(['standard', 'instrumented']).optional(),
  actionPresentation: z.enum(['always', 'compact', 'hover-focus'])
}).strict();

export const ThemeControlsV2Schema = z.object({
  slider: z.object({
    trackPx: boundedNumber(2, 12),
    thumbPx: boundedNumber(8, 32),
    hitTargetPx: boundedNumber(44, 64)
  }).strict()
}).strict();

export const ThemeDefinitionV2Schema = z.object({
  schemaVersion: z.literal(THEME_SCHEMA_VERSION_V2),
  id: themeIdSchema,
  label: nonBlankString('Theme label'),
  description: nonBlankString('Theme description').optional(),
  colors: ThemeSemanticColorsSchema,
  typography: ThemeTypographySchema,
  spacing: ThemeSpacingSchema,
  materials: z.record(themeMaterialIdSchema, ThemeMaterialV2Schema).refine(
    (materials) => Object.keys(materials).length >= 1 && Object.keys(materials).length <= 32,
    { message: 'Themes must define between 1 and 32 named materials.' }
  ),
  shapes: z.record(themeShapeIdSchema, ThemeShapeV2Schema).refine(
    (shapes) => Object.keys(shapes).length >= 1 && Object.keys(shapes).length <= 16,
    { message: 'Themes must define between 1 and 16 named shapes.' }
  ),
  recipes: ThemeRecipesV2Schema,
  controls: ThemeControlsV2Schema,
  iconPackId: assetIdSchema,
  assets: z.array(ThemeAssetReferenceSchema).refine(
    (assets) => new Set(assets.map(({ id }) => id)).size === assets.length,
    { message: 'Theme asset IDs must be unique.' }
  ).default([]),
  canvas: z.array(ThemeCanvasLayerSchema).min(1).max(12),
  accessibility: ThemeAccessibilitySchema,
  capabilities: ThemeCapabilitiesSchema
}).strict().superRefine((theme, context) => {
  const materialIds = new Set(Object.keys(theme.materials));
  const shapeIds = new Set(Object.keys(theme.shapes));
  for (const [materialId, material] of Object.entries(theme.materials)) {
    if (!materialIds.has(material.reducedTransparency)) {
      context.addIssue({
        code: 'custom',
        path: ['materials', materialId, 'reducedTransparency'],
        message: `Unknown reduced-transparency material '${material.reducedTransparency}'.`
      });
    }
  }
  for (const part of THEME_PART_IDS) {
    const recipe = theme.recipes.parts[part];
    if (!materialIds.has(recipe.material)) {
      context.addIssue({
        code: 'custom',
        path: ['recipes', 'parts', part, 'material'],
        message: `Unknown material '${recipe.material}'.`
      });
    }
    if (!shapeIds.has(recipe.shape)) {
      context.addIssue({
        code: 'custom',
        path: ['recipes', 'parts', part, 'shape'],
        message: `Unknown shape '${recipe.shape}'.`
      });
    }
    for (const state of ['hover', 'pressed', 'selected', 'focus', 'inactive'] as const) {
      const stateMaterial = recipe.states[state]?.material;
      if (stateMaterial && !materialIds.has(stateMaterial)) {
        context.addIssue({
          code: 'custom',
          path: ['recipes', 'parts', part, 'states', state, 'material'],
          message: `Unknown material '${stateMaterial}'.`
        });
      }
    }
  }
});

const typographyPatchSchema = z.object({
  ui: ThemeTypographyRoleSchema.partial().optional(),
  prose: ThemeTypographyRoleSchema.partial().optional(),
  technical: ThemeTypographyRoleSchema.partial().optional(),
  display: ThemeTypographyRoleSchema.partial().optional(),
  scale: z.object({
    xs: boundedNumber(8, 24).optional(),
    sm: boundedNumber(9, 28).optional(),
    md: boundedNumber(10, 32).optional(),
    lg: boundedNumber(12, 48).optional(),
    xl: boundedNumber(14, 72).optional()
  }).strict().optional()
}).strict();

const materialPatchSchema = ThemeMaterialSchema.partial();
const materialPatchShape = {
  canvas: materialPatchSchema.optional(),
  shelf: materialPatchSchema.optional(),
  panel: materialPatchSchema.optional(),
  widget: materialPatchSchema.optional(),
  field: materialPatchSchema.optional(),
  button: materialPatchSchema.optional(),
  menu: materialPatchSchema.optional(),
  dialog: materialPatchSchema.optional(),
  floating: materialPatchSchema.optional()
};

export const ThemePatchSchema = z.object({
  id: themeIdSchema.optional(),
  label: nonBlankString('Theme label').optional(),
  description: nonBlankString('Theme description').optional(),
  colors: ThemeSemanticColorsSchema.partial().optional(),
  typography: typographyPatchSchema.optional(),
  geometry: ThemeGeometrySchema.partial().optional(),
  spacing: z.object({
    density: spacingShape.density.optional(),
    xs: spacingShape.xs.optional(),
    sm: spacingShape.sm.optional(),
    md: spacingShape.md.optional(),
    lg: spacingShape.lg.optional(),
    xl: spacingShape.xl.optional(),
    chromeHeight: spacingShape.chromeHeight.optional()
  }).strict().optional(),
  materials: z.object(materialPatchShape).strict().optional(),
  iconPackId: assetIdSchema.optional(),
  assets: z.array(ThemeAssetReferenceSchema).optional(),
  canvas: z.array(ThemeCanvasLayerSchema).min(1).max(12).optional(),
  accessibility: ThemeAccessibilitySchema.partial().optional(),
  capabilities: ThemeCapabilitiesSchema.partial().optional()
}).strict();

export type ThemeColorRole = z.infer<typeof ThemeColorRoleSchema>;
export type ThemeMaterialRole = z.infer<typeof ThemeMaterialRoleSchema>;
export type ThemeSemanticColors = z.infer<typeof ThemeSemanticColorsSchema>;
export type ThemeTypographyRole = z.infer<typeof ThemeTypographyRoleSchema>;
export type ThemeTypography = z.infer<typeof ThemeTypographySchema>;
export type ThemeGeometry = z.infer<typeof ThemeGeometrySchema>;
export type ThemeSpacing = z.infer<typeof ThemeSpacingSchema>;
export type ThemeMaterial = z.infer<typeof ThemeMaterialSchema>;
export type ThemeAssetReference = z.infer<typeof ThemeAssetReferenceSchema>;
export type ThemeCanvasLayer = z.infer<typeof ThemeCanvasLayerSchema>;
export type ThemeDefinition = z.infer<typeof ThemeDefinitionSchema>;
export type ThemePatch = z.infer<typeof ThemePatchSchema>;
export type ThemePartId = z.infer<typeof ThemePartIdSchema>;
export type ThemeShadowV2 = z.infer<typeof ThemeShadowV2Schema>;
export type ThemeMaterialV2 = z.infer<typeof ThemeMaterialV2Schema>;
export type ThemeShapeV2 = z.infer<typeof ThemeShapeV2Schema>;
export type ThemePartRecipeV2 = z.infer<typeof ThemePartRecipeV2Schema>;
export type ThemeRecipesV2 = z.infer<typeof ThemeRecipesV2Schema>;
export type ThemeControlsV2 = z.infer<typeof ThemeControlsV2Schema>;
export type ThemeDefinitionV2 = z.infer<typeof ThemeDefinitionV2Schema>;

export const ThemeDefinitionV1Schema = ThemeDefinitionSchema;
export type ThemeDefinitionV1 = ThemeDefinition;
export type ThemeDefinitionInput = ThemeDefinitionV1 | ThemeDefinitionV2;
export type ThemePartRecipe = ThemePartRecipeV2;
