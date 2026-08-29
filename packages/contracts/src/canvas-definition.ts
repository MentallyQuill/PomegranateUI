import { z } from 'zod';

import { ThemeCanvasLayerSchema, ThemeIdSchema } from './theme.js';

export const CANVAS_SCHEMA_VERSION = 'pomegranate.ui.canvas.v1' as const;

export const CanvasDefinitionSchema = z.object({
  schemaVersion: z.literal(CANVAS_SCHEMA_VERSION),
  id: ThemeIdSchema,
  layers: z.array(ThemeCanvasLayerSchema).min(1).max(12)
}).strict();

export type CanvasDefinition = z.infer<typeof CanvasDefinitionSchema>;
