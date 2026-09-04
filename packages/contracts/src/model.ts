import { z } from 'zod';

import {
  PanelIdSchema,
  SubPanelIdSchema,
  WidgetInstanceIdSchema,
  WidgetTypeSchema,
  type PanelId,
  type SubPanelId,
  type WidgetInstanceId,
  type WidgetType
} from './ids.js';
import { JsonObjectSchema, type JsonObject } from './json.js';

export const WORKBENCH_STATE_SCHEMA = 'pomegranate.ui.state.v2' as const;
export const LAYOUT_SNAPSHOT_V1_SCHEMA = 'pomegranate.ui.layout.v1' as const;
export const LAYOUT_SNAPSHOT_V2_SCHEMA = 'pomegranate.ui.layout.v2' as const;
export const LAYOUT_SNAPSHOT_V3_SCHEMA = 'pomegranate.ui.layout.v3' as const;

export type PanelEdge = 'left' | 'main' | 'right';
export const SubPanelLayoutIdSchema = z.enum(['single', 'two-equal', 'three-equal', 'wide-left', 'wide-right']);
export type SubPanelLayoutId = z.infer<typeof SubPanelLayoutIdSchema>;
export const WidgetShapeSchema = z.enum(['narrow', 'medium', 'wide', 'stage', 'strip']);
export type WidgetShape = z.infer<typeof WidgetShapeSchema>;
export const WidgetMultiplicitySchema = z.enum(['single', 'multiple']);
export type WidgetMultiplicity = z.infer<typeof WidgetMultiplicitySchema>;

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
  readonly multiplicity: WidgetMultiplicity;
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

export interface StoryLayoutState {
  readonly preferredMeasure: number;
  readonly toolbarColumns: {
    readonly left: number;
    readonly right: number;
  };
}

export interface PanelState {
  readonly id: PanelId;
  readonly name: string;
  readonly templateId: string;
  readonly order: number;
  readonly configuration?: JsonObject;
  readonly storyLayout?: StoryLayoutState;
  readonly columnWeights?: readonly number[];
  readonly activeSubPanelId?: SubPanelId;
  readonly subPanels?: readonly SubPanelState[];
}

export interface SubPanelState {
  readonly id: SubPanelId;
  readonly name: string;
  readonly layoutId: SubPanelLayoutId;
  readonly order: number;
  readonly scrollTop: number;
  readonly columnWeights?: readonly number[];
  readonly shipped?: boolean;
  readonly hidden?: boolean;
}

export type DockedPlacement = {
  readonly kind: 'docked';
  readonly panelId: PanelId;
  readonly subPanelId?: SubPanelId;
  readonly lane?: number;
  readonly regionId: string;
  readonly shelfId: string;
  readonly order: number;
  readonly height?: number;
  readonly group?: {
    readonly id: string;
    readonly order: number;
    readonly active: boolean;
  };
};

export type FloatingPlacement = {
  readonly kind: 'floating';
  readonly panelId: PanelId;
  readonly subPanelId?: SubPanelId;
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
  readonly dockColumn?: number;
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

export interface LayoutSnapshotV3 extends Omit<WorkbenchState, 'schema'> {
  readonly schema: typeof LAYOUT_SNAPSHOT_V3_SCHEMA;
}

export type LegacyDockedPlacement = Omit<DockedPlacement, 'regionId'> & { readonly edge: PanelEdge };
export type LegacyWidgetPlacement = LegacyDockedPlacement | FloatingPlacement;

const unpaddedString = (label: string) => z.string().refine(
  (value) => value.length > 0 && value.trim() === value,
  { message: `${label} must be non-empty and contain no surrounding whitespace.` }
);
const nonnegativeInteger = z.number().int().nonnegative();
const finiteNumber = z.number().finite();
const storyToolbarColumnCount = z.number().int().min(1).max(6);
const NormalizedColumnWeightsSchema = z.array(finiteNumber.min(0.05).max(1)).min(1).max(6).refine(
  (weights) => Math.abs(weights.reduce((total, weight) => total + weight, 0) - 1) < 1e-6,
  { message: 'Column weights must be normalized to a total of 1.' }
);

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
  multiplicity: WidgetMultiplicitySchema,
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

export const SubPanelStateSchema = z.object({
  id: SubPanelIdSchema,
  name: unpaddedString('Sub-panel name'),
  layoutId: SubPanelLayoutIdSchema,
  order: nonnegativeInteger,
  scrollTop: finiteNumber.nonnegative(),
  columnWeights: NormalizedColumnWeightsSchema.optional(),
  shipped: z.boolean().optional(),
  hidden: z.boolean().optional()
}).strict().superRefine((subPanel, context) => {
  const expected = {
    single: 1,
    'two-equal': 2,
    'three-equal': 3,
    'wide-left': 2,
    'wide-right': 2
  }[subPanel.layoutId];
  if (subPanel.columnWeights && subPanel.columnWeights.length !== expected) {
    context.addIssue({
      code: 'custom',
      path: ['columnWeights'],
      message: 'Column weights must match the selected sub-panel layout.'
    });
  }
});

export const StoryLayoutStateSchema = z.object({
  preferredMeasure: finiteNumber.min(420),
  toolbarColumns: z.object({
    left: storyToolbarColumnCount,
    right: storyToolbarColumnCount
  }).strict()
}).strict();

export const PanelStateSchema = z.object({
  id: PanelIdSchema,
  name: unpaddedString('Panel name'),
  templateId: unpaddedString('templateId'),
  order: nonnegativeInteger,
  configuration: JsonObjectSchema.optional(),
  storyLayout: StoryLayoutStateSchema.optional(),
  columnWeights: NormalizedColumnWeightsSchema.min(2).optional(),
  activeSubPanelId: SubPanelIdSchema.optional(),
  subPanels: z.array(SubPanelStateSchema).optional()
}).strict().superRefine((panel, context) => {
  const hasActive = panel.activeSubPanelId !== undefined;
  const hasSubPanels = panel.subPanels !== undefined;
  if (hasActive !== hasSubPanels) {
    context.addIssue({
      code: 'custom',
      path: hasActive ? ['subPanels'] : ['activeSubPanelId'],
      message: 'activeSubPanelId and subPanels must be provided together.'
    });
    return;
  }
  if (panel.subPanels && !panel.subPanels.some((subPanel) => (
    subPanel.id === panel.activeSubPanelId && subPanel.hidden !== true
  ))) {
    context.addIssue({
      code: 'custom',
      path: ['activeSubPanelId'],
      message: 'activeSubPanelId must identify a visible sub-panel.'
    });
  }
  if (panel.subPanels && new Set(panel.subPanels.map(({ id }) => id)).size !== panel.subPanels.length) {
    context.addIssue({
      code: 'custom',
      path: ['subPanels'],
      message: 'Sub-panel identities must be unique within a Panel.'
    });
  }
  if (panel.subPanels && new Set(panel.subPanels.map(({ order }) => order)).size !== panel.subPanels.length) {
    context.addIssue({
      code: 'custom',
      path: ['subPanels'],
      message: 'Sub-panel order slots must be unique within a Panel.'
    });
  }
});

export const DockedPlacementSchema = z.object({
  kind: z.literal('docked'),
  panelId: PanelIdSchema,
  subPanelId: SubPanelIdSchema.optional(),
  lane: nonnegativeInteger.optional(),
  regionId: unpaddedString('regionId'),
  shelfId: unpaddedString('shelfId'),
  order: nonnegativeInteger,
  height: finiteNumber.min(64).max(2048).optional(),
  group: z.object({
    id: unpaddedString('groupId'),
    order: nonnegativeInteger,
    active: z.boolean()
  }).strict().optional()
}).strict().superRefine((placement, context) => {
  if ((placement.subPanelId === undefined) !== (placement.lane === undefined)) {
    context.addIssue({
      code: 'custom',
      path: placement.subPanelId === undefined ? ['subPanelId'] : ['lane'],
      message: 'Docked sub-panel ownership and lane must be provided together.'
    });
  }
});

export const FloatingPlacementSchema = z.object({
  kind: z.literal('floating'),
  panelId: PanelIdSchema,
  subPanelId: SubPanelIdSchema.optional(),
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
  weight: finiteNumber.min(0.05).max(1),
  dockColumn: nonnegativeInteger.optional()
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

export const LayoutSnapshotV3Schema = z.object({
  schema: z.literal(LAYOUT_SNAPSHOT_V3_SCHEMA),
  ...workbenchCollections
}).strict();

export type WorkbenchStateInput = z.input<typeof WorkbenchStateSchema>;
export type ParsedWorkbenchState = z.output<typeof WorkbenchStateSchema>;
export type LayoutSnapshotV1Input = z.input<typeof LayoutSnapshotV1Schema>;
export type ParsedLayoutSnapshotV1 = z.output<typeof LayoutSnapshotV1Schema>;
export type LayoutSnapshotV2Input = z.input<typeof LayoutSnapshotV2Schema>;
export type ParsedLayoutSnapshotV2 = z.output<typeof LayoutSnapshotV2Schema>;
export type LayoutSnapshotV3Input = z.input<typeof LayoutSnapshotV3Schema>;
export type ParsedLayoutSnapshotV3 = z.output<typeof LayoutSnapshotV3Schema>;
