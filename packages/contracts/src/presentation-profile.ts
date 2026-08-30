import { z } from 'zod';

import { ThemeIdSchema } from './theme.js';

export const PRESENTATION_PROFILE_SCHEMA_VERSION = 'pomegranate.ui.presentation-profile.v1' as const;

export const PresentationProfileDefinitionSchema = z.object({
  schemaVersion: z.literal(PRESENTATION_PROFILE_SCHEMA_VERSION),
  id: ThemeIdSchema,
  slider: z.object({
    trackVisibility: z.enum(['visible', 'hidden']),
    fillVisibility: z.enum(['visible', 'hidden']),
    thumbVisibility: z.enum(['visible', 'hidden'])
  }).strict().refine(
    ({ trackVisibility, fillVisibility }) =>
      trackVisibility === 'visible' || fillVisibility === 'visible',
    { message: 'Slider track or fill must remain visible' }
  ),
  actions: z.object({
    content: z.enum(['text', 'icon-text', 'icon'])
  }).strict(),
  canvas: z.object({
    blurPolicy: z.enum(['allow', 'forbid'])
  }).strict()
}).strict();

export type PresentationProfileDefinition = z.infer<typeof PresentationProfileDefinitionSchema>;
