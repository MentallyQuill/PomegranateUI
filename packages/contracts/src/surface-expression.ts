import { z } from 'zod';

import {
  THEME_PART_IDS,
  ThemeColorRoleSchema,
  type ThemePartId
} from './theme.js';

export const SURFACE_EXPRESSION_SCHEMA_VERSION = 'pomegranate.ui.surface-expression.v1' as const;

const expressionIdSchema = z.string().regex(
  /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/,
  'Surface expression IDs must use lower-case kebab case.'
);
const boundedNumber = (minimum: number, maximum: number) => z.number().finite().min(minimum).max(maximum);
const radiusSchema = boundedNumber(0, 999);
const opacitySchema = boundedNumber(0, 1);

export const SurfaceExpressionCornerRadiiSchema = z.object({
  topLeft: radiusSchema,
  topRight: radiusSchema,
  bottomRight: radiusSchema,
  bottomLeft: radiusSchema
}).strict();

export const SurfaceExpressionShapeSchema = z.object({
  cornerRadiiPx: SurfaceExpressionCornerRadiiSchema
}).strict();

export const SurfaceExpressionGradientStopSchema = z.object({
  colorRole: ThemeColorRoleSchema,
  opacity: opacitySchema,
  position: opacitySchema
}).strict();

const gradientStopsSchema = z.array(SurfaceExpressionGradientStopSchema).min(2).max(8).refine(
  (stops) => stops.every((stop, index) => index === 0 || stops[index - 1]!.position <= stop.position),
  { message: 'Surface expression gradient stops must be ordered by position.' }
);

export const SurfaceExpressionMaterialSchema = z.object({
  fill: z.object({
    kind: z.literal('linear-gradient'),
    angleDeg: boundedNumber(-360, 360),
    stops: gradientStopsSchema
  }).strict()
}).strict();

export const SURFACE_EXPRESSION_TYPE_STEPS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
export const SurfaceExpressionTypeStepSchema = z.enum(SURFACE_EXPRESSION_TYPE_STEPS);

export const SURFACE_EXPRESSION_TEXT_TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'] as const;
export const SurfaceExpressionTextTransformSchema = z.enum(SURFACE_EXPRESSION_TEXT_TRANSFORMS);

export const SurfaceExpressionPartOverrideSchema = z.object({
  typeScale: SurfaceExpressionTypeStepSchema.optional(),
  textTransform: SurfaceExpressionTextTransformSchema.optional()
}).strict().refine(
  (override) => override.typeScale !== undefined || override.textTransform !== undefined,
  { message: 'A Surface expression part override must define a type scale or text transform.' }
);

const partOverridesShape = Object.fromEntries(
  THEME_PART_IDS.map((part) => [part, SurfaceExpressionPartOverrideSchema.optional()])
) as Record<ThemePartId, z.ZodOptional<typeof SurfaceExpressionPartOverrideSchema>>;

export const SurfaceExpressionPartsSchema = z.object(partOverridesShape).strict();

export const SurfaceExpressionProfileSchema = z.object({
  schemaVersion: z.literal(SURFACE_EXPRESSION_SCHEMA_VERSION),
  id: expressionIdSchema,
  shapes: z.record(expressionIdSchema, SurfaceExpressionShapeSchema).refine(
    (shapes) => Object.keys(shapes).length <= 16,
    { message: 'Surface expressions may define at most 16 named shapes.' }
  ),
  materials: z.record(expressionIdSchema, SurfaceExpressionMaterialSchema).refine(
    (materials) => Object.keys(materials).length <= 32,
    { message: 'Surface expressions may define at most 32 named materials.' }
  ),
  parts: SurfaceExpressionPartsSchema
}).strict();

export type SurfaceExpressionCornerRadii = z.infer<typeof SurfaceExpressionCornerRadiiSchema>;
export type SurfaceExpressionShape = z.infer<typeof SurfaceExpressionShapeSchema>;
export type SurfaceExpressionGradientStop = z.infer<typeof SurfaceExpressionGradientStopSchema>;
export type SurfaceExpressionMaterial = z.infer<typeof SurfaceExpressionMaterialSchema>;
export type SurfaceExpressionTypeStep = z.infer<typeof SurfaceExpressionTypeStepSchema>;
export type SurfaceExpressionTextTransform = z.infer<typeof SurfaceExpressionTextTransformSchema>;
export type SurfaceExpressionPartOverride = z.infer<typeof SurfaceExpressionPartOverrideSchema>;
export type SurfaceExpressionProfile = z.infer<typeof SurfaceExpressionProfileSchema>;

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export const SURFACE_EXPRESSION_TYPE_SCALE = deepFreeze({
  xs: { fontSizePx: 11, lineHeight: 1.4, letterSpacingEm: 0.01 },
  sm: { fontSizePx: 12, lineHeight: 1.4, letterSpacingEm: 0.01 },
  md: { fontSizePx: 14, lineHeight: 1.45, letterSpacingEm: 0 },
  lg: { fontSizePx: 17, lineHeight: 1.55, letterSpacingEm: 0 },
  xl: { fontSizePx: 21, lineHeight: 1.25, letterSpacingEm: 0.01 }
} as const);

export const DEFAULT_SURFACE_EXPRESSION: SurfaceExpressionProfile = deepFreeze(
  SurfaceExpressionProfileSchema.parse({
    schemaVersion: SURFACE_EXPRESSION_SCHEMA_VERSION,
    id: 'default',
    shapes: {},
    materials: {},
    parts: {}
  })
);
