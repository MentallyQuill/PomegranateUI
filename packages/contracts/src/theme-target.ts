import { z } from 'zod';

import { AmbientProfileSchema } from './ambient.js';
import { CanvasDefinitionSchema } from './canvas-definition.js';
import { ThemeIdSchema } from './theme.js';
import { ThemeDefinitionV3Schema } from './theme-v3.js';

export const THEME_TARGET_SCHEMA_VERSION = 'pomegranate.ui.theme-target.v1' as const;

export const ThemeTargetBundleSchema = z.object({
  schemaVersion: z.literal(THEME_TARGET_SCHEMA_VERSION),
  id: ThemeIdSchema,
  theme: ThemeDefinitionV3Schema,
  canvas: CanvasDefinitionSchema,
  ambient: AmbientProfileSchema
}).strict().superRefine((target, context) => {
  for (const owner of ['theme', 'canvas', 'ambient'] as const) {
    if (target[owner].id === target.id) continue;
    context.addIssue({
      code: 'custom',
      path: [owner, 'id'],
      message: `${owner[0]!.toUpperCase()}${owner.slice(1)} ID must match the target ID.`
    });
  }
});

export type ThemeTargetBundle = z.infer<typeof ThemeTargetBundleSchema>;
