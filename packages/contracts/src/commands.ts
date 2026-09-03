import { z } from 'zod';

import type { PanelId, SubPanelId, WidgetInstanceId } from './ids.js';
import { JsonObjectSchema, type JsonObject } from './json.js';
import {
  PanelIdSchema,
  SubPanelIdSchema,
  WidgetInstanceIdSchema
} from './ids.js';
import {
  DockedPlacementSchema,
  PanelStateSchema,
  ShelfStateSchema,
  SubPanelLayoutIdSchema,
  SubPanelStateSchema,
  VisibleWidgetPlacementSchema,
  WidgetInstanceSchema,
  WidgetPlacementSchema,
  WorkbenchStateSchema,
  type DockedPlacement,
  type PanelState,
  type ShelfState,
  type SubPanelLayoutId,
  type SubPanelState,
  type VisibleWidgetPlacement,
  type WidgetInstance,
  type WidgetPlacement,
  type WorkbenchState
} from './model.js';
import type { WorkbenchEvent } from './events.js';

export type WorkbenchCommand =
  | { readonly type: 'panel.create'; readonly panel: PanelState }
  | { readonly type: 'panel.rename'; readonly panelId: PanelId; readonly name: string }
  | {
      readonly type: 'panel.duplicate';
      readonly panelId: PanelId;
      readonly name: string;
      readonly ids: {
        readonly panelId: PanelId;
        readonly shelfIds: Readonly<Record<string, string>>;
        readonly widgetIds: Readonly<Record<string, WidgetInstanceId>>;
        readonly groupIds: Readonly<Record<string, string>>;
      };
    }
  | { readonly type: 'panel.reset'; readonly panelId: PanelId }
  | { readonly type: 'panel.clear'; readonly panelId: PanelId }
  | { readonly type: 'panel.delete'; readonly panelId: PanelId }
  | { readonly type: 'panel.activate'; readonly panelId: PanelId }
  | { readonly type: 'panel.reorder'; readonly panelId: PanelId; readonly toIndex: number }
  | { readonly type: 'panel.resize-dock'; readonly panelId: PanelId; readonly edge: 'left' | 'right'; readonly width: number }
  | { readonly type: 'panel.resize-columns'; readonly panelId: PanelId; readonly weights: readonly number[] }
  | {
      readonly type: 'sub-panel.activate';
      readonly panelId: PanelId;
      readonly subPanelId: SubPanelId;
      readonly currentScrollTop: number;
    }
  | {
      readonly type: 'sub-panel.create';
      readonly panelId: PanelId;
      readonly subPanel: SubPanelState;
      readonly overview?: SubPanelState;
    }
  | { readonly type: 'sub-panel.rename'; readonly panelId: PanelId; readonly subPanelId: SubPanelId; readonly name: string }
  | { readonly type: 'sub-panel.reorder'; readonly panelId: PanelId; readonly subPanelId: SubPanelId; readonly toIndex: number }
  | { readonly type: 'sub-panel.change-layout'; readonly panelId: PanelId; readonly subPanelId: SubPanelId; readonly layoutId: SubPanelLayoutId }
  | { readonly type: 'sub-panel.resize-columns'; readonly panelId: PanelId; readonly subPanelId: SubPanelId; readonly weights: readonly number[] }
  | { readonly type: 'sub-panel.set-scroll'; readonly panelId: PanelId; readonly subPanelId: SubPanelId; readonly scrollTop: number }
  | {
      readonly type: 'sub-panel.move-widgets';
      readonly panelId: PanelId;
      readonly sourceSubPanelId: SubPanelId;
      readonly targetSubPanelId: SubPanelId;
    }
  | { readonly type: 'sub-panel.delete'; readonly panelId: PanelId; readonly subPanelId: SubPanelId }
  | {
      readonly type: 'sub-panel.duplicate';
      readonly panelId: PanelId;
      readonly subPanelId: SubPanelId;
      readonly subPanel: SubPanelState;
      readonly ids: {
        readonly widgetIds: Readonly<Record<string, WidgetInstanceId>>;
        readonly groupIds: Readonly<Record<string, string>>;
      };
    }
  | { readonly type: 'shelf.create'; readonly shelf: ShelfState }
  | {
      readonly type: 'shelf.create-and-place';
      readonly shelf: ShelfState;
      readonly instanceId: WidgetInstanceId;
      readonly placement: DockedPlacement;
    }
  | { readonly type: 'shelf.resize'; readonly panelId: PanelId; readonly regionId: string; readonly shelfId: string; readonly weight: number }
  | { readonly type: 'widget.create'; readonly instance: WidgetInstance; readonly placement: VisibleWidgetPlacement }
  | { readonly type: 'widget.place'; readonly instanceId: WidgetInstanceId; readonly placement: VisibleWidgetPlacement }
  | { readonly type: 'widget.shelve'; readonly instanceId: WidgetInstanceId }
  | { readonly type: 'widget.restore'; readonly instanceId: WidgetInstanceId }
  | { readonly type: 'widget.delete'; readonly instanceId: WidgetInstanceId }
  | { readonly type: 'widget.group'; readonly instanceId: WidgetInstanceId; readonly targetInstanceId: WidgetInstanceId; readonly groupId: string }
  | { readonly type: 'widget.group.activate'; readonly instanceId: WidgetInstanceId }
  | { readonly type: 'widget.group.reorder'; readonly instanceId: WidgetInstanceId; readonly toIndex: number }
  | { readonly type: 'widget.group.separate'; readonly instanceId: WidgetInstanceId; readonly placement: VisibleWidgetPlacement }
  | { readonly type: 'widget.resize-row'; readonly instanceId: WidgetInstanceId; readonly height: number | null }
  | { readonly type: 'widget.remove'; readonly instanceId: WidgetInstanceId }
  | { readonly type: 'layout.undo' }
  | { readonly type: 'layout.hydrate'; readonly state: WorkbenchState };

export const WorkbenchCommandSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('panel.create'), panel: PanelStateSchema }).strict(),
  z.object({ type: z.literal('panel.rename'), panelId: PanelIdSchema, name: z.string().trim().min(1) }).strict(),
  z.object({
    type: z.literal('panel.duplicate'),
    panelId: PanelIdSchema,
    name: z.string().trim().min(1),
    ids: z.object({
      panelId: PanelIdSchema,
      shelfIds: z.record(z.string(), z.string().trim().min(1)),
      widgetIds: z.record(z.string(), WidgetInstanceIdSchema),
      groupIds: z.record(z.string(), z.string().trim().min(1))
    }).strict()
  }).strict(),
  z.object({ type: z.literal('panel.reset'), panelId: PanelIdSchema }).strict(),
  z.object({ type: z.literal('panel.clear'), panelId: PanelIdSchema }).strict(),
  z.object({ type: z.literal('panel.delete'), panelId: PanelIdSchema }).strict(),
  z.object({ type: z.literal('panel.activate'), panelId: PanelIdSchema }).strict(),
  z.object({
    type: z.literal('panel.reorder'),
    panelId: PanelIdSchema,
    toIndex: z.number().int().nonnegative()
  }).strict(),
  z.object({
    type: z.literal('panel.resize-dock'),
    panelId: PanelIdSchema,
    edge: z.enum(['left', 'right']),
    width: z.number().finite().min(200).max(420)
  }).strict(),
  z.object({
    type: z.literal('panel.resize-columns'),
    panelId: PanelIdSchema,
    weights: z.array(z.number().finite().positive()).min(2).max(6)
  }).strict(),
  z.object({
    type: z.literal('sub-panel.activate'),
    panelId: PanelIdSchema,
    subPanelId: SubPanelIdSchema,
    currentScrollTop: z.number().finite().nonnegative()
  }).strict(),
  z.object({
    type: z.literal('sub-panel.create'),
    panelId: PanelIdSchema,
    subPanel: SubPanelStateSchema,
    overview: SubPanelStateSchema.optional()
  }).strict(),
  z.object({
    type: z.literal('sub-panel.rename'),
    panelId: PanelIdSchema,
    subPanelId: SubPanelIdSchema,
    name: z.string().trim().min(1).max(48)
  }).strict(),
  z.object({
    type: z.literal('sub-panel.reorder'),
    panelId: PanelIdSchema,
    subPanelId: SubPanelIdSchema,
    toIndex: z.number().int().nonnegative()
  }).strict(),
  z.object({
    type: z.literal('sub-panel.change-layout'),
    panelId: PanelIdSchema,
    subPanelId: SubPanelIdSchema,
    layoutId: SubPanelLayoutIdSchema
  }).strict(),
  z.object({
    type: z.literal('sub-panel.resize-columns'),
    panelId: PanelIdSchema,
    subPanelId: SubPanelIdSchema,
    weights: z.array(z.number().finite().positive()).min(2).max(6)
  }).strict(),
  z.object({
    type: z.literal('sub-panel.set-scroll'),
    panelId: PanelIdSchema,
    subPanelId: SubPanelIdSchema,
    scrollTop: z.number().finite().nonnegative()
  }).strict(),
  z.object({
    type: z.literal('sub-panel.move-widgets'),
    panelId: PanelIdSchema,
    sourceSubPanelId: SubPanelIdSchema,
    targetSubPanelId: SubPanelIdSchema
  }).strict().refine(
    ({ sourceSubPanelId, targetSubPanelId }) => sourceSubPanelId !== targetSubPanelId,
    { path: ['targetSubPanelId'], message: 'Widget movement requires two distinct sub-panels.' }
  ),
  z.object({
    type: z.literal('sub-panel.delete'),
    panelId: PanelIdSchema,
    subPanelId: SubPanelIdSchema
  }).strict(),
  z.object({
    type: z.literal('sub-panel.duplicate'),
    panelId: PanelIdSchema,
    subPanelId: SubPanelIdSchema,
    subPanel: SubPanelStateSchema,
    ids: z.object({
      widgetIds: z.record(z.string(), WidgetInstanceIdSchema),
      groupIds: z.record(z.string(), z.string().trim().min(1))
    }).strict()
  }).strict(),
  z.object({ type: z.literal('shelf.create'), shelf: ShelfStateSchema }).strict(),
  z.object({
    type: z.literal('shelf.create-and-place'),
    shelf: ShelfStateSchema,
    instanceId: WidgetInstanceIdSchema,
    placement: DockedPlacementSchema
  }).strict().refine(
    ({ shelf, placement }) => shelf.panelId === placement.panelId
      && shelf.regionId === placement.regionId
      && shelf.id === placement.shelfId,
    { path: ['placement'], message: 'Placement must target the Shelf created by this command.' }
  ),
  z.object({
    type: z.literal('shelf.resize'),
    panelId: PanelIdSchema,
    regionId: z.string().trim().min(1),
    shelfId: z.string().trim().min(1),
    weight: z.number().finite().min(0.05).max(1)
  }).strict(),
  z.object({
    type: z.literal('widget.create'),
    instance: WidgetInstanceSchema,
    placement: VisibleWidgetPlacementSchema
  }).strict(),
  z.object({
    type: z.literal('widget.place'),
    instanceId: WidgetInstanceIdSchema,
    placement: VisibleWidgetPlacementSchema
  }).strict(),
  z.object({ type: z.literal('widget.shelve'), instanceId: WidgetInstanceIdSchema }).strict(),
  z.object({ type: z.literal('widget.restore'), instanceId: WidgetInstanceIdSchema }).strict(),
  z.object({ type: z.literal('widget.delete'), instanceId: WidgetInstanceIdSchema }).strict(),
  z.object({
    type: z.literal('widget.group'),
    instanceId: WidgetInstanceIdSchema,
    targetInstanceId: WidgetInstanceIdSchema,
    groupId: z.string().min(1).refine((value) => value.trim() === value)
  }).strict(),
  z.object({
    type: z.literal('widget.resize-row'),
    instanceId: WidgetInstanceIdSchema,
    height: z.number().finite().min(64).max(2048).nullable()
  }).strict(),
  z.object({
    type: z.literal('widget.group.activate'),
    instanceId: WidgetInstanceIdSchema
  }).strict(),
  z.object({
    type: z.literal('widget.group.reorder'),
    instanceId: WidgetInstanceIdSchema,
    toIndex: z.number().int().nonnegative()
  }).strict(),
  z.object({
    type: z.literal('widget.group.separate'),
    instanceId: WidgetInstanceIdSchema,
    placement: VisibleWidgetPlacementSchema
  }).strict(),
  z.object({ type: z.literal('widget.remove'), instanceId: WidgetInstanceIdSchema }).strict(),
  z.object({ type: z.literal('layout.undo') }).strict(),
  z.object({ type: z.literal('layout.hydrate'), state: WorkbenchStateSchema }).strict()
]);

export type WorkbenchCommandInput = z.input<typeof WorkbenchCommandSchema>;
export type ParsedWorkbenchCommand = z.output<typeof WorkbenchCommandSchema>;

export type CommandErrorCode =
  | 'DUPLICATE_ID'
  | 'MISSING_PANEL'
  | 'MISSING_WIDGET'
  | 'MISSING_SHELF'
  | 'UNKNOWN_TEMPLATE'
  | 'CAPABILITY_DENIED'
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
    'MISSING_SHELF',
    'UNKNOWN_TEMPLATE',
    'CAPABILITY_DENIED',
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
