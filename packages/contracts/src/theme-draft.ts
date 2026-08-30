import { z } from 'zod';

import { AmbientProfileSchema } from './ambient.js';
import { ThemeIdSchema } from './theme.js';

export const THEME_DRAFT_SCHEMA_VERSION = 'pomegranate.ui.theme-draft.v1' as const;
export const PERSISTED_THEME_DRAFT_SCHEMA_VERSION = 'pomegranate.ui.persisted-theme-draft.v1' as const;

export const THEME_DRAFT_COLOR_ROLES = [
  'canvas',
  'glass',
  'chrome',
  'ambient',
  'text',
  'source'
] as const;

export const ThemeDraftColorRoleSchema = z.enum(THEME_DRAFT_COLOR_ROLES);
const draftColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i, 'Draft colors must use exact #RRGGBB syntax.');
const materialControlSchema = z.number().finite().int().min(0).max(100);

const draftColorsShape = Object.fromEntries(
  THEME_DRAFT_COLOR_ROLES.map((role) => [role, draftColorSchema])
) as Record<(typeof THEME_DRAFT_COLOR_ROLES)[number], typeof draftColorSchema>;

export const ThemeMaterialControlsSchema = z.object({
  glassDensity: materialControlSchema,
  barOpacity: materialControlSchema,
  selectedStrength: materialControlSchema,
  frostLevel: materialControlSchema
}).strict();

export const ThemeDraftSchema = z.object({
  schemaVersion: z.literal(THEME_DRAFT_SCHEMA_VERSION),
  baseTargetId: ThemeIdSchema,
  colors: z.object(draftColorsShape).strict(),
  materials: ThemeMaterialControlsSchema
}).strict();

export const PersistedThemeDraftSchema = z.object({
  schemaVersion: z.literal(PERSISTED_THEME_DRAFT_SCHEMA_VERSION),
  draft: ThemeDraftSchema,
  ambient: AmbientProfileSchema
}).strict().superRefine((persisted, context) => {
  if (persisted.draft.baseTargetId === persisted.ambient.id) return;
  context.addIssue({
    code: 'custom',
    path: ['ambient', 'id'],
    message: 'Ambient profile ID must match the Theme draft base target ID.'
  });
});

export type ThemeDraftColorRole = z.infer<typeof ThemeDraftColorRoleSchema>;
export type ThemeMaterialControls = z.infer<typeof ThemeMaterialControlsSchema>;
export type ThemeDraft = z.infer<typeof ThemeDraftSchema>;
export type PersistedThemeDraft = z.infer<typeof PersistedThemeDraftSchema>;
