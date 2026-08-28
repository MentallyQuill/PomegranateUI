import { z } from 'zod';

import type { PanelId, WidgetInstanceId } from './ids.js';
import { JsonObjectSchema, type JsonObject } from './json.js';
import {
  PanelIdSchema,
  WidgetInstanceIdSchema
} from './ids.js';
import {
  PanelStateSchema,
  WidgetInstanceSchema,
  WidgetPlacementSchema,
  WorkbenchStateSchema,
  type PanelState,
  type WidgetInstance,
  type WidgetPlacement,
  type WorkbenchState
} from './model.js';
import type { WorkbenchEvent } from './events.js';

export type WorkbenchCommand =
  | { readonly type: 'panel.create'; readonly panel: PanelState }
  | { readonly type: 'panel.activate'; readonly panelId: PanelId }
  | { readonly type: 'panel.reorder'; readonly panelId: PanelId; readonly toIndex: number }
  | { readonly type: 'widget.create'; readonly instance: WidgetInstance; readonly placement: WidgetPlacement }
  | { readonly type: 'widget.place'; readonly instanceId: WidgetInstanceId; readonly placement: WidgetPlacement }
  | { readonly type: 'widget.remove'; readonly instanceId: WidgetInstanceId }
  | { readonly type: 'layout.hydrate'; readonly state: WorkbenchState };

export const WorkbenchCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('panel.create'), panel: PanelStateSchema }).strict(),
  z.object({ type: z.literal('panel.activate'), panelId: PanelIdSchema }).strict(),
  z.object({
    type: z.literal('panel.reorder'),
    panelId: PanelIdSchema,
    toIndex: z.number().int().nonnegative()
  }).strict(),
  z.object({
    type: z.literal('widget.create'),
    instance: WidgetInstanceSchema,
    placement: WidgetPlacementSchema
  }).strict(),
  z.object({
    type: z.literal('widget.place'),
    instanceId: WidgetInstanceIdSchema,
    placement: WidgetPlacementSchema
  }).strict(),
  z.object({ type: z.literal('widget.remove'), instanceId: WidgetInstanceIdSchema }).strict(),
  z.object({ type: z.literal('layout.hydrate'), state: WorkbenchStateSchema }).strict()
]);

export type WorkbenchCommandInput = z.input<typeof WorkbenchCommandSchema>;
export type ParsedWorkbenchCommand = z.output<typeof WorkbenchCommandSchema>;

export type CommandErrorCode =
  | 'DUPLICATE_ID'
  | 'MISSING_PANEL'
  | 'MISSING_WIDGET'
  | 'UNKNOWN_WIDGET_TYPE'
  | 'INVALID_INDEX'
  | 'INVALID_PLACEMENT'
  | 'INVALID_SNAPSHOT'
  | 'INTERNAL_ERROR';

export interface CommandError {
  readonly code: CommandErrorCode;
  readonly message: string;
  readonly recoverable: boolean;
  readonly details?: JsonObject;
}

export type CommandResult =
  | {
      readonly ok: true;
      readonly state: WorkbenchState;
      readonly events: readonly WorkbenchEvent[];
    }
  | {
      readonly ok: false;
      readonly state: WorkbenchState;
      readonly events: readonly [];
      readonly error: CommandError;
    };

export const CommandErrorSchema = z.object({
  code: z.enum([
    'DUPLICATE_ID',
    'MISSING_PANEL',
    'MISSING_WIDGET',
    'UNKNOWN_WIDGET_TYPE',
    'INVALID_INDEX',
    'INVALID_PLACEMENT',
    'INVALID_SNAPSHOT',
    'INTERNAL_ERROR'
  ]),
  message: z.string().min(1),
  recoverable: z.boolean(),
  details: JsonObjectSchema.optional()
}).strict();
