import { z } from 'zod';

import {
  PanelIdSchema,
  WidgetInstanceIdSchema,
  WidgetTypeSchema,
  type PanelId,
  type WidgetInstanceId,
  type WidgetType
} from './ids.js';
import { JsonObjectSchema, type JsonObject } from './json.js';

export const WORKBENCH_STATE_SCHEMA = 'pomegranate.ui.state.v2' as const;
export const LAYOUT_SNAPSHOT_V1_SCHEMA = 'pomegranate.ui.layout.v1' as const;
export const LAYOUT_SNAPSHOT_V2_SCHEMA = 'pomegranate.ui.layout.v2' as const;

export type PanelEdge = 'left' | 'main' | 'right';
export const WidgetShapeSchema = z.enum(['narrow', 'medium', 'wide', 'stage', 'strip']);
export type WidgetShape = z.infer<typeof WidgetShapeSchema>;

export type WidgetPlacementHint =
  | {
      readonly kind: 'docked';
      readonly regionRole: import('./templates.js').PanelRegionRole;
      readonly shelfId: string;
    }
  | {
      readonly kind: 'floating';
      readonly width: number;
      readonly height: number;
    };

export interface WidgetCatalogMetadata {
  readonly category: string;
  readonly purpose: string;
  readonly keywords: readonly string[];
  readonly iconKey: string;
  readonly shape: WidgetShape;
  readonly minColumns: number;
  readonly geometry: {
    readonly minHeight: number;
    readonly idealHeight: number;
    readonly maxHeight: number;
  };
  readonly supportedStates: readonly string[];
}

export interface WidgetManifest {
  readonly type: WidgetType;
  readonly version: string;
  readonly title: string;
  readonly capabilities: readonly string[];
  readonly defaultConfiguration: JsonObject;
  readonly defaultPlacement: WidgetPlacementHint;
  readonly catalog?: WidgetCatalogMetadata;
}

export interface WidgetInstance {
  readonly id: WidgetInstanceId;
  readonly type: WidgetType;
  readonly manifestVersion: string;
  readonly configuration: JsonObject;
}

export interface PanelState {
  readonly id: PanelId;
  readonly name: string;
  readonly templateId: string;
  readonly order: number;
  readonly configuration?: JsonObject;
}

export type DockedPlacement = {
  readonly kind: 'docked';
  readonly panelId: PanelId;
  readonly regionId: string;
  readonly shelfId: string;
  readonly order: number;
  readonly group?: {
    readonly id: string;
    readonly order: number;
    readonly active: boolean;
  };
};

export type FloatingPlacement = {
  readonly kind: 'floating';
  readonly panelId: PanelId;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly z: number;
};

export type VisibleWidgetPlacement = DockedPlacement | FloatingPlacement;

export type ShelvedPlacement = {
  readonly kind: 'shelved';
  readonly panelId: PanelId;
  readonly lastVisible: VisibleWidgetPlacement;
};

export type WidgetPlacement = VisibleWidgetPlacement | ShelvedPlacement;

export interface ShelfState {
  readonly id: string;
  readonly panelId: PanelId;
  readonly regionId: string;
  readonly order: number;
  readonly weight: number;
}

export interface WorkbenchState {
  readonly schema: typeof WORKBENCH_STATE_SCHEMA;
  readonly revision: number;
  readonly activePanelId: PanelId | null;
  readonly panels: readonly PanelState[];
  readonly shelves: readonly ShelfState[];
  readonly widgets: Readonly<Record<string, WidgetInstance>>;
  readonly placements: Readonly<Record<string, WidgetPlacement>>;
}

export interface LayoutSnapshotV1 {
  readonly schema: typeof LAYOUT_SNAPSHOT_V1_SCHEMA;
  readonly revision: number;
  readonly activePanelId: PanelId | null;
  readonly panels: readonly PanelState[];
  readonly widgets: Readonly<Record<string, WidgetInstance>>;
  readonly placements: Readonly<Record<string, LegacyWidgetPlacement>>;
}

export interface LayoutSnapshotV2 extends Omit<WorkbenchState, 'schema'> {
  readonly schema: typeof LAYOUT_SNAPSHOT_V2_SCHEMA;
}

export type LegacyDockedPlacement = Omit<DockedPlacement, 'regionId'> & { readonly edge: PanelEdge };
export type LegacyWidgetPlacement = LegacyDockedPlacement | FloatingPlacement;

const unpaddedString = (label: string) => z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  { message: `${label} must be non-empty and contain no surrounding whitespace.` }
);
const nonnegativeInteger = z.number().int().nonnegative();
const finiteNumber = z.number().finite();

export const PanelEdgeSchema = z.enum(['left', 'main', 'right']);

export const WidgetPlacementHintSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('docked'),
    regionRole: z.enum(['left-instruments', 'stage', 'composer', 'right-instruments', 'focus', 'support', 'column']),
    shelfId: unpaddedString('shelfId')
  }).strict(),
  z.object({
    kind: z.literal('floating'),
    width: finiteNumber.positive(),
    height: finiteNumber.positive()
  }).strict()
]);

export const WidgetCatalogMetadataSchema = z.object({
  category: unpaddedString('Widget catalog category'),
  purpose: unpaddedString('Widget catalog purpose'),
  keywords: z.array(unpaddedString('Widget catalog keyword')).refine(
    (values) => new Set(values).size === values.length,
    { message: 'Widget catalog keywords must be unique.' }
  ),
  iconKey: unpaddedString('Widget catalog iconKey'),
  shape: WidgetShapeSchema,
  minColumns: z.number().int().positive(),
  geometry: z.object({
    minHeight: finiteNumber.positive(),
    idealHeight: finiteNumber.positive(),
    maxHeight: finiteNumber.positive()
  }).strict().refine(
    ({ minHeight, idealHeight, maxHeight }) => minHeight <= idealHeight && idealHeight <= maxHeight,
    { message: 'Widget catalog geometry must satisfy minHeight <= idealHeight <= maxHeight.' }
  ),
  supportedStates: z.array(unpaddedString('Widget catalog state')).refine(
    (values) => new Set(values).size === values.length,
    { message: 'Widget catalog states must be unique.' }
  )
}).strict();

export const WidgetManifestSchema = z.object({
  type: WidgetTypeSchema,
  version: unpaddedString('version'),
  title: unpaddedString('title'),
  capabilities: z.array(unpaddedString('capability')).refine(
    (values) => new Set(values).size === values.length,
    { message: 'Widget capabilities must be unique.' }
  ),
  defaultConfiguration: JsonObjectSchema,
  defaultPlacement: WidgetPlacementHintSchema,
  catalog: WidgetCatalogMetadataSchema.optional()
}).strict();

export const WidgetInstanceSchema = z.object({
  id: WidgetInstanceIdSchema,
  type: WidgetTypeSchema,
  manifestVersion: unpaddedString('manifestVersion'),
  configuration: JsonObjectSchema
}).strict();

export const PanelStateSchema = z.object({
  id: PanelIdSchema,
  name: unpaddedString('Panel name'),
  templateId: unpaddedString('templateId'),
  order: nonnegativeInteger,
  configuration: JsonObjectSchema.optional()
}).strict();

export const DockedPlacementSchema = z.object({
  kind: z.literal('docked'),
  panelId: PanelIdSchema,
  regionId: unpaddedString('regionId'),
  shelfId: unpaddedString('shelfId'),
  order: nonnegativeInteger,
  group: z.object({
    id: unpaddedString('groupId'),
    order: nonnegativeInteger,
    active: z.boolean()
  }).strict().optional()
}).strict();

export const FloatingPlacementSchema = z.object({
  kind: z.literal('floating'),
  panelId: PanelIdSchema,
  x: finiteNumber,
  y: finiteNumber,
  width: finiteNumber.positive(),
  height: finiteNumber.positive(),
  z: nonnegativeInteger
}).strict();

export const VisibleWidgetPlacementSchema = z.discriminatedUnion('kind', [
  DockedPlacementSchema,
  FloatingPlacementSchema
]);

export const ShelvedPlacementSchema = z.object({
  kind: z.literal('shelved'),
  panelId: PanelIdSchema,
  lastVisible: VisibleWidgetPlacementSchema
}).strict();

export const WidgetPlacementSchema = z.discriminatedUnion('kind', [
  DockedPlacementSchema,
  FloatingPlacementSchema,
  ShelvedPlacementSchema
]);

export const ShelfStateSchema = z.object({
  id: unpaddedString('shelfId'),
  panelId: PanelIdSchema,
  regionId: unpaddedString('regionId'),
  order: nonnegativeInteger,
  weight: finiteNumber.min(0.05).max(1)
}).strict();

const workbenchCollections = {
  revision: nonnegativeInteger,
  activePanelId: PanelIdSchema.nullable(),
  panels: z.array(PanelStateSchema),
  shelves: z.array(ShelfStateSchema),
  widgets: z.record(z.string(), WidgetInstanceSchema),
  placements: z.record(z.string(), WidgetPlacementSchema)
};

export const WorkbenchStateSchema = z.object({
  schema: z.literal(WORKBENCH_STATE_SCHEMA),
  ...workbenchCollections
}).strict();

export const LayoutSnapshotV1Schema = z.object({
  schema: z.literal(LAYOUT_SNAPSHOT_V1_SCHEMA),
  revision: nonnegativeInteger,
  activePanelId: PanelIdSchema.nullable(),
  panels: z.array(PanelStateSchema),
  widgets: z.record(z.string(), WidgetInstanceSchema),
  placements: z.record(z.string(), z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('docked'),
      panelId: PanelIdSchema,
      edge: PanelEdgeSchema,
      shelfId: unpaddedString('shelfId'),
      order: nonnegativeInteger,
      group: z.object({
        id: unpaddedString('groupId'),
        order: nonnegativeInteger,
        active: z.boolean()
      }).strict().optional()
    }).strict(),
    FloatingPlacementSchema
  ]))
}).strict();

export const LayoutSnapshotV2Schema = z.object({
  schema: z.literal(LAYOUT_SNAPSHOT_V2_SCHEMA),
  ...workbenchCollections
}).strict();

export type WorkbenchStateInput = z.input<typeof WorkbenchStateSchema>;
export type ParsedWorkbenchState = z.output<typeof WorkbenchStateSchema>;
export type LayoutSnapshotV1Input = z.input<typeof LayoutSnapshotV1Schema>;
export type ParsedLayoutSnapshotV1 = z.output<typeof LayoutSnapshotV1Schema>;
export type LayoutSnapshotV2Input = z.input<typeof LayoutSnapshotV2Schema>;
export type ParsedLayoutSnapshotV2 = z.output<typeof LayoutSnapshotV2Schema>;
