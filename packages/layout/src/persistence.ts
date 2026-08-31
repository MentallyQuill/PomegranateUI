import {
  LAYOUT_SNAPSHOT_V1_SCHEMA,
  LAYOUT_SNAPSHOT_V2_SCHEMA,
  LAYOUT_SNAPSHOT_V3_SCHEMA,
  LayoutSnapshotV1Schema,
  LayoutSnapshotV2Schema,
  LayoutSnapshotV3Schema,
  WORKBENCH_STATE_SCHEMA,
  WorkbenchStateSchema,
  type CommandError,
  type JsonObject,
  type JsonValue,
  type LayoutSnapshotV1,
  type LayoutSnapshotV2,
  type LayoutSnapshotV3,
  type LayoutStorage,
  type PanelState,
  type ShelfState,
  type SubPanelState,
  type VisibleWidgetPlacement,
  type WidgetInstance,
  type WidgetPlacement,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import { acceptLayout, rejectLayout, type LayoutResult } from './errors.js';
import { normalizeDockOrders, normalizePanels, normalizeShelves, normalizeTabGroups } from './state.js';
import { normalizeSubPanels } from './sub-panels.js';
import { createPanelTemplateRegistry, type PanelTemplateRegistry } from './templates.js';

export type LayoutEncodeResult =
  | { readonly ok: true; readonly state: WorkbenchState; readonly value: string }
  | { readonly ok: false; readonly state: WorkbenchState; readonly error: CommandError };

function canonicalJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value === null || typeof value !== 'object') return value;
  const object = value as JsonObject;
  return Object.fromEntries(Object.keys(object).sort().map((key) => [key, canonicalJson(object[key]!)] as const));
}

function canonicalSubPanel(subPanel: SubPanelState): SubPanelState {
  return {
    id: subPanel.id,
    name: subPanel.name,
    layoutId: subPanel.layoutId,
    order: subPanel.order,
    scrollTop: subPanel.scrollTop,
    ...(subPanel.shipped === undefined ? {} : { shipped: subPanel.shipped }),
    ...(subPanel.hidden === undefined ? {} : { hidden: subPanel.hidden })
  };
}

function canonicalPanel(panel: PanelState): PanelState {
  const base = { id: panel.id, name: panel.name, templateId: panel.templateId, order: panel.order };
  return {
    ...base,
    ...(panel.configuration === undefined
      ? {}
      : { configuration: canonicalJson(panel.configuration) as JsonObject }),
    ...(panel.subPanels === undefined || panel.activeSubPanelId === undefined
      ? {}
      : {
          activeSubPanelId: panel.activeSubPanelId,
          subPanels: [...panel.subPanels]
            .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
            .map(canonicalSubPanel)
        })
  };
}

function canonicalShelf(shelf: ShelfState): ShelfState {
  return { id: shelf.id, panelId: shelf.panelId, regionId: shelf.regionId, order: shelf.order, weight: shelf.weight };
}

function canonicalWidget(instance: WidgetInstance): WidgetInstance {
  return { id: instance.id, type: instance.type, manifestVersion: instance.manifestVersion, configuration: canonicalJson(instance.configuration) as JsonObject };
}

function canonicalVisiblePlacement(placement: VisibleWidgetPlacement): VisibleWidgetPlacement {
  if (placement.kind === 'floating') {
    return {
      kind: 'floating',
      panelId: placement.panelId,
      ...(placement.subPanelId === undefined ? {} : { subPanelId: placement.subPanelId }),
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      z: placement.z
    };
  }
  const base = {
    kind: 'docked' as const,
    panelId: placement.panelId,
    ...(placement.subPanelId === undefined || placement.lane === undefined
      ? {}
      : { subPanelId: placement.subPanelId, lane: placement.lane }),
    regionId: placement.regionId,
    shelfId: placement.shelfId,
    order: placement.order
  };
  return placement.group === undefined ? base : {
    ...base,
    group: { id: placement.group.id, order: placement.group.order, active: placement.group.active }
  };
}

function canonicalPlacement(placement: WidgetPlacement): WidgetPlacement {
  return placement.kind === 'shelved'
    ? { kind: 'shelved', panelId: placement.panelId, lastVisible: canonicalVisiblePlacement(placement.lastVisible) }
    : canonicalVisiblePlacement(placement);
}

function nullRecord<T>(entries: readonly (readonly [string, T])[]): Record<string, T> {
  const record = Object.create(null) as Record<string, T>;
  for (const [key, value] of entries) record[key] = value;
  return record;
}

function legacyRegion(panel: PanelState, edge: 'left' | 'main' | 'right', templates: PanelTemplateRegistry): string {
  const resolved = templates.resolve(panel);
  const family = resolved.ok
    ? resolved.template.family
    : panel.templateId === 'library'
      ? 'focus-support'
      : panel.templateId === 'columns'
        ? 'columns'
        : 'story-stage';
  if (family === 'story-stage') return edge === 'main' ? 'stage' : edge;
  if (family === 'focus-support') return edge === 'right' ? 'support' : 'focus';
  if (edge === 'right') {
    const count = typeof panel.configuration?.columns === 'number' && Number.isInteger(panel.configuration.columns)
      ? Math.min(6, Math.max(2, panel.configuration.columns))
      : 3;
    return `column-${count}`;
  }
  return 'column-1';
}

export function migrateLayoutSnapshotV1(
  snapshot: LayoutSnapshotV1,
  templates: PanelTemplateRegistry = createPanelTemplateRegistry()
): LayoutSnapshotV2 {
  const panelsById = new Map(snapshot.panels.map((panel) => [panel.id, panel]));
  const placements: Record<string, WidgetPlacement> = {};
  const usedRegions = new Map<string, { panelId: PanelState['id']; regionId: string }>();
  for (const [instanceId, placement] of Object.entries(snapshot.placements)) {
    if (placement.kind === 'floating') {
      placements[instanceId] = canonicalVisiblePlacement(placement);
      continue;
    }
    const panel = panelsById.get(placement.panelId);
    const regionId = legacyRegion(panel ?? { id: placement.panelId, name: 'Unavailable', templateId: 'story-stage.v1', order: 0 }, placement.edge, templates);
    usedRegions.set(`${placement.panelId}\u0000${regionId}`, { panelId: placement.panelId, regionId });
    placements[instanceId] = {
      kind: 'docked', panelId: placement.panelId, regionId, shelfId: 'primary', order: placement.order,
      ...(placement.group ? { group: placement.group } : {})
    };
  }
  return {
    schema: LAYOUT_SNAPSHOT_V2_SCHEMA,
    revision: snapshot.revision,
    activePanelId: snapshot.activePanelId,
    panels: snapshot.panels,
    shelves: [...usedRegions.values()].map(({ panelId, regionId }) => ({ id: 'primary', panelId, regionId, order: 0, weight: 1 })),
    widgets: snapshot.widgets,
    placements
  };
}

function normalizeSnapshot(snapshot: LayoutSnapshotV2 | LayoutSnapshotV3, currentState: WorkbenchState): LayoutResult {
  const panels = normalizePanels(snapshot.panels.map(canonicalPanel).sort((a, b) => a.order - b.order || a.id.localeCompare(b.id)));
  const panelIds = new Set(panels.map((panel) => panel.id));
  if (panelIds.size !== panels.length) return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot contains duplicate Panel ids.');
  if ((panels.length === 0 && snapshot.activePanelId !== null) || (panels.length > 0 && (snapshot.activePanelId === null || !panelIds.has(snapshot.activePanelId)))) {
    return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot active Panel does not exist.');
  }
  const shelves = normalizeShelves(snapshot.shelves.map(canonicalShelf));
  const shelfKeys = new Set<string>();
  for (const shelf of shelves) {
    const key = `${shelf.panelId}\u0000${shelf.regionId}\u0000${shelf.id}`;
    if (!panelIds.has(shelf.panelId) || shelfKeys.has(key)) return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot contains an invalid or duplicate shelf.');
    shelfKeys.add(key);
  }
  const widgetEntries = Object.entries(snapshot.widgets).sort(([a], [b]) => a.localeCompare(b));
  const placementEntries = Object.entries(snapshot.placements).sort(([a], [b]) => a.localeCompare(b));
  if (widgetEntries.length !== placementEntries.length || widgetEntries.some(([key], index) => key !== placementEntries[index]?.[0])) {
    return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Every Widget must have exactly one placement.');
  }
  for (const [key, instance] of widgetEntries) {
    if (key !== instance.id) return rejectLayout(currentState, 'INVALID_SNAPSHOT', `Widget record key '${key}' does not match its stable id.`);
  }
  for (const [key, placement] of placementEntries) {
    if (!panelIds.has(placement.panelId)) return rejectLayout(currentState, 'INVALID_SNAPSHOT', `Widget placement '${key}' references a missing Panel.`);
    const visible = placement.kind === 'shelved' ? placement.lastVisible : placement;
    if (visible.kind === 'docked' && !shelfKeys.has(`${visible.panelId}\u0000${visible.regionId}\u0000${visible.shelfId}`)) {
      return rejectLayout(currentState, 'INVALID_SNAPSHOT', `Widget placement '${key}' references a missing shelf.`);
    }
  }
  const widgets = nullRecord(widgetEntries.map(([key, value]) => [key, canonicalWidget(value)] as const));
  const rawPlacements = nullRecord(placementEntries.map(([key, value]) => [key, canonicalPlacement(value)] as const));
  const placements = nullRecord(Object.entries(normalizeTabGroups(normalizeDockOrders(rawPlacements))).sort(([a], [b]) => a.localeCompare(b)));
  const normalized: WorkbenchState = {
    schema: WORKBENCH_STATE_SCHEMA,
    revision: snapshot.revision,
    activePanelId: snapshot.activePanelId,
    panels,
    shelves,
    widgets,
    placements
  };
  if (!WorkbenchStateSchema.safeParse(normalized).success) return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Normalized layout state is structurally invalid.');
  return acceptLayout(normalized);
}

function snapshotFromState(state: WorkbenchState): LayoutSnapshotV3 | null {
  const parsed = WorkbenchStateSchema.safeParse(state);
  if (!parsed.success) return null;
  const candidate: LayoutSnapshotV3 = {
    schema: LAYOUT_SNAPSHOT_V3_SCHEMA,
    revision: parsed.data.revision,
    activePanelId: parsed.data.activePanelId,
    panels: parsed.data.panels as readonly PanelState[],
    shelves: parsed.data.shelves as readonly ShelfState[],
    widgets: parsed.data.widgets as Readonly<Record<string, WidgetInstance>>,
    placements: parsed.data.placements as Readonly<Record<string, WidgetPlacement>>
  };
  const normalized = normalizeSnapshot(candidate, state);
  if (!normalized.ok) throw new Error(normalized.error.message);
  return {
    schema: LAYOUT_SNAPSHOT_V3_SCHEMA,
    revision: normalized.state.revision,
    activePanelId: normalized.state.activePanelId,
    panels: normalized.state.panels,
    shelves: normalized.state.shelves,
    widgets: normalized.state.widgets,
    placements: normalized.state.placements
  };
}

export function encodeLayoutSnapshot(state: WorkbenchState): LayoutEncodeResult {
  try {
    const snapshot = snapshotFromState(state);
    if (!snapshot || !LayoutSnapshotV3Schema.safeParse(snapshot).success) {
      return { ok: false, state, error: { code: 'INVALID_SNAPSHOT', message: 'Workbench state cannot be encoded as a valid layout snapshot.', recoverable: true } };
    }
    return { ok: true, state, value: JSON.stringify(snapshot) };
  } catch (error) {
    return { ok: false, state, error: { code: 'INTERNAL_ERROR', message: error instanceof Error ? error.message : 'Layout snapshot encoding failed unexpectedly.', recoverable: false } };
  }
}

export function decodeLayoutSnapshot(raw: string, currentState: WorkbenchState): LayoutResult {
  try {
    const parsedJson: unknown = JSON.parse(raw);
    const schema = parsedJson !== null && typeof parsedJson === 'object' ? (parsedJson as { schema?: unknown }).schema : undefined;
    if (schema === LAYOUT_SNAPSHOT_V1_SCHEMA) {
      const parsed = LayoutSnapshotV1Schema.safeParse(parsedJson);
      if (!parsed.success) return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot does not match pomegranate.ui.layout.v1.');
      return normalizeSnapshot(migrateLayoutSnapshotV1(parsed.data as LayoutSnapshotV1), currentState);
    }
    if (schema === LAYOUT_SNAPSHOT_V2_SCHEMA) {
      const parsed = LayoutSnapshotV2Schema.safeParse(parsedJson);
      if (!parsed.success) return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot does not match pomegranate.ui.layout.v2.');
      return normalizeSnapshot(parsed.data as LayoutSnapshotV2, currentState);
    }
    if (schema === LAYOUT_SNAPSHOT_V3_SCHEMA) {
      const normalizedInput = parsedJson !== null && typeof parsedJson === 'object'
        ? {
            ...normalizeSubPanels({
              ...(parsedJson as WorkbenchState),
              schema: WORKBENCH_STATE_SCHEMA
            }),
            schema: LAYOUT_SNAPSHOT_V3_SCHEMA
          }
        : parsedJson;
      const parsed = LayoutSnapshotV3Schema.safeParse(normalizedInput);
      if (!parsed.success) return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot does not match pomegranate.ui.layout.v3.');
      return normalizeSnapshot(parsed.data as LayoutSnapshotV3, currentState);
    }
    return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot schema is unsupported.');
  } catch {
    return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot is not valid JSON.');
  }
}

export async function loadLayout(storage: LayoutStorage, key: string, currentState: WorkbenchState): Promise<LayoutResult> {
  try {
    const raw = await storage.load(key);
    return raw === null
      ? rejectLayout(currentState, 'INVALID_SNAPSHOT', `No layout snapshot exists for '${key}'.`, { key })
      : decodeLayoutSnapshot(raw, currentState);
  } catch {
    return rejectLayout(currentState, 'INTERNAL_ERROR', 'Layout storage load failed.', { key }, false);
  }
}

export async function saveLayout(storage: LayoutStorage, key: string, state: WorkbenchState): Promise<LayoutResult> {
  const encoded = encodeLayoutSnapshot(state);
  if (!encoded.ok) return { ok: false, state, error: encoded.error };
  try {
    await storage.save(key, encoded.value);
    return acceptLayout(state);
  } catch {
    return rejectLayout(state, 'INTERNAL_ERROR', 'Layout storage save failed.', { key }, false);
  }
}
