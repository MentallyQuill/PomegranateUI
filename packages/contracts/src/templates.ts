import { z } from 'zod';

import { WidgetShapeSchema } from './model.js';

export const PANEL_REGION_ROLES = [
  'left-instruments',
  'stage',
  'composer',
  'right-instruments',
  'focus',
  'support',
  'column'
] as const;

export const PanelRegionRoleSchema = z.enum(PANEL_REGION_ROLES);

const identifier = (label: string) => z.string().min(1).refine(
  (value) => value.trim() === value,
  { message: label + ' must contain no surrounding whitespace.' }
);

export const PanelRegionDefinitionSchema = z.object({
  id: identifier('Region ID'),
  label: identifier('Region label'),
  role: PanelRegionRoleSchema,
  order: z.number().int().nonnegative(),
  acceptedShapes: z.array(WidgetShapeSchema).min(1).refine(
    (values) => new Set(values).size === values.length,
    { message: 'Accepted Widget shapes must be unique.' }
  ),
  minimumWidth: z.number().finite().positive(),
  minimumHeight: z.number().finite().positive(),
  enabledWhen: z.object({
    option: z.literal('columns'),
    minimum: z.number().int().min(2).max(6)
  }).strict().optional()
}).strict();

export const PanelTemplateDefinitionSchema = z.object({
  id: identifier('Template ID'),
  label: identifier('Template label'),
  family: z.enum(['story-stage', 'focus-support', 'columns']),
  regions: z.array(PanelRegionDefinitionSchema).min(1),
  options: z.object({
    columns: z.object({
      minimum: z.literal(2),
      maximum: z.literal(6),
      default: z.number().int().min(2).max(6)
    }).strict().optional()
  }).strict()
}).strict().superRefine((template, context) => {
  const ids = new Set<string>();
  const orders = new Set<number>();
  for (const [index, region] of template.regions.entries()) {
    if (ids.has(region.id)) context.addIssue({ code: 'custom', path: ['regions', index, 'id'], message: 'Region IDs must be unique.' });
    if (orders.has(region.order)) context.addIssue({ code: 'custom', path: ['regions', index, 'order'], message: 'Region orders must be unique.' });
    ids.add(region.id);
    orders.add(region.order);
  }
  if (template.family === 'columns' && !template.options.columns) {
    context.addIssue({ code: 'custom', path: ['options', 'columns'], message: 'Columns templates must declare bounded column options.' });
  }
  if (template.family !== 'columns' && template.options.columns) {
    context.addIssue({ code: 'custom', path: ['options', 'columns'], message: 'Only Columns templates may declare column options.' });
  }
});

export type PanelRegionRole = z.infer<typeof PanelRegionRoleSchema>;
export type PanelRegionDefinition = z.infer<typeof PanelRegionDefinitionSchema>;
export type PanelTemplateDefinition = z.infer<typeof PanelTemplateDefinitionSchema>;
