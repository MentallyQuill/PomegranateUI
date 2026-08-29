import { z } from 'zod';

import { ThemeIdSchema } from './theme.js';

export const AMBIENT_SCHEMA_VERSION = 'pomegranate.ui.ambient.v1' as const;

const normalizedNumberSchema = z.number().finite().min(0).max(1);

export const AmbientProfileSchema = z.object({
  schemaVersion: z.literal(AMBIENT_SCHEMA_VERSION),
  id: ThemeIdSchema,
  colorRole: z.enum(['accent', 'selection', 'danger', 'success', 'warning']),
  position: z.object({
    x: normalizedNumberSchema,
    y: normalizedNumberSchema
  }).strict(),
  radius: normalizedNumberSchema,
  power: normalizedNumberSchema,
  motion: z.object({
    enabled: z.boolean(),
    driftX: z.number().finite().min(-1).max(1),
    driftY: z.number().finite().min(-1).max(1),
    durationMs: z.number().int().min(250).max(120000)
  }).strict().optional()
}).strict();

export type AmbientProfile = z.infer<typeof AmbientProfileSchema>;
