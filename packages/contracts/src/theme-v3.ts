import { z } from 'zod';

import {
  THEME_SCHEMA_VERSION_V2,
  ThemeDefinitionV2Schema
} from './theme.js';

export const THEME_SCHEMA_VERSION_V3 = 'pomegranate.ui.theme.v3' as const;

const {
  schemaVersion: _v2SchemaVersion,
  canvas: _v2Canvas,
  ...themeDefinitionV3Shape
} = ThemeDefinitionV2Schema.shape;

export const ThemeDefinitionV3Schema = z.object({
  ...themeDefinitionV3Shape,
  schemaVersion: z.literal(THEME_SCHEMA_VERSION_V3)
}).strict().superRefine((theme, context) => {
  const compatibility = ThemeDefinitionV2Schema.safeParse({
    ...theme,
    schemaVersion: THEME_SCHEMA_VERSION_V2,
    canvas: [{ kind: 'solid', color: theme.colors.canvas }]
  });
  if (compatibility.success) return;

  for (const issue of compatibility.error.issues) {
    if (issue.path[0] === 'schemaVersion' || issue.path[0] === 'canvas') continue;
    context.addIssue({
      code: 'custom',
      path: issue.path,
      message: issue.message
    });
  }
});

export type ThemeDefinitionV3 = z.infer<typeof ThemeDefinitionV3Schema>;
