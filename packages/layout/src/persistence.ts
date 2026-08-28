import {
  LAYOUT_SNAPSHOT_V1_SCHEMA,
  LayoutSnapshotV1Schema,
  WORKBENCH_STATE_SCHEMA,
  WorkbenchStateSchema,
  type CommandError,
  type JsonObject,
  type JsonValue,
  type LayoutSnapshotV1,
  type LayoutStorage,
  type PanelState,
  type WidgetInstance,
  type WidgetPlacement,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import { acceptLayout, rejectLayout, type LayoutResult } from './errors.js';
import { normalizeDockOrders, normalizePanels } from './state.js';

export type LayoutEncodeResult =
  | { readonly ok: true; readonly state: WorkbenchState; readonly value: string }
  | { readonly ok: false; readonly state: WorkbenchState; readonly error: CommandError };

function canonicalJson(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value === null || typeof value !== 'object') return value;
  const object = value as JsonObject;
  return Object.fromEntries(
    Object.keys(object).sort().map((key) => [key, canonicalJson(object[key]!)] as const)
  );
}

function canonicalPanel(panel: PanelState): PanelState {
  const base = {
    id: panel.id,
    name: panel.name,
    templateId: panel.templateId,
    order: panel.order
  };
  return panel.configuration === undefined
    ? base
    : { ...base, configuration: canonicalJson(panel.configuration) as JsonObject };
}

function canonicalWidget(instance: WidgetInstance): WidgetInstance {
  return {
    id: instance.id,
    type: instance.type,
    manifestVersion: instance.manifestVersion,
    configuration: canonicalJson(instance.configuration) as JsonObject
  };
}

function canonicalPlacement(placement: WidgetPlacement): WidgetPlacement {
  return placement.kind === 'docked'
    ? {
        kind: 'docked',
        panelId: placement.panelId,
        edge: placement.edge,
        shelfId: placement.shelfId,
        order: placement.order
      }
    : {
        kind: 'floating',
        panelId: placement.panelId,
        x: placement.x,
        y: placement.y,
        width: placement.width,
        height: placement.height,
        z: placement.z
      };
}

function nullRecord<T>(entries: readonly (readonly [string, T])[]): Record<string, T> {
  const record = Object.create(null) as Record<string, T>;
  for (const [key, value] of entries) record[key] = value;
  return record;
}

function normalizeSnapshot(
  snapshot: LayoutSnapshotV1,
  currentState: WorkbenchState
): LayoutResult {
  const panels = normalizePanels(
    snapshot.panels
      .map(canonicalPanel)
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
  );
  const panelIds = new Set(panels.map((panel) => panel.id));
  if (panelIds.size !== panels.length) {
    return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot contains duplicate Panel ids.');
  }
  if (
    (panels.length === 0 && snapshot.activePanelId !== null)
    || (panels.length > 0 && (snapshot.activePanelId === null || !panelIds.has(snapshot.activePanelId)))
  ) {
    return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot active Panel does not exist.');
  }

  const widgetEntries = Object.entries(snapshot.widgets).sort(([left], [right]) => left.localeCompare(right));
  const placementEntries = Object.entries(snapshot.placements).sort(([left], [right]) => left.localeCompare(right));
  const widgetKeys = widgetEntries.map(([key]) => key);
  const placementKeys = placementEntries.map(([key]) => key);
  if (
    widgetKeys.length !== placementKeys.length
    || widgetKeys.some((key, index) => key !== placementKeys[index])
  ) {
    return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Every Widget must have exactly one placement.');
  }

  for (const [key, instance] of widgetEntries) {
    if (key !== instance.id) {
      return rejectLayout(currentState, 'INVALID_SNAPSHOT', `Widget record key '${key}' does not match its stable id.`);
    }
  }
  for (const [key, placement] of placementEntries) {
    if (!panelIds.has(placement.panelId)) {
      return rejectLayout(
        currentState,
        'INVALID_SNAPSHOT',
        `Widget placement '${key}' references missing Panel '${placement.panelId}'.`
      );
    }
  }

  const widgets = nullRecord(widgetEntries.map(([key, value]) => [key, canonicalWidget(value)] as const));
  const rawPlacements = nullRecord(
    placementEntries.map(([key, value]) => [key, canonicalPlacement(value)] as const)
  );
  const placements = nullRecord(
    Object.entries(normalizeDockOrders(rawPlacements))
      .sort(([left], [right]) => left.localeCompare(right))
  );
  const normalized: WorkbenchState = {
    schema: WORKBENCH_STATE_SCHEMA,
    revision: snapshot.revision,
    activePanelId: snapshot.activePanelId,
    panels,
    widgets,
    placements
  };
  if (!WorkbenchStateSchema.safeParse(normalized).success) {
    return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Normalized layout state is structurally invalid.');
  }
  return acceptLayout(normalized);
}

function snapshotFromState(state: WorkbenchState): LayoutSnapshotV1 | null {
  const parsed = WorkbenchStateSchema.safeParse(state);
  if (!parsed.success) return null;
  const candidate: LayoutSnapshotV1 = {
    schema: LAYOUT_SNAPSHOT_V1_SCHEMA,
    revision: parsed.data.revision,
    activePanelId: parsed.data.activePanelId,
    panels: parsed.data.panels as readonly PanelState[],
    widgets: parsed.data.widgets as Readonly<Record<string, WidgetInstance>>,
    placements: parsed.data.placements as Readonly<Record<string, WidgetPlacement>>
  };
  const normalized = normalizeSnapshot(candidate, state);
  if (!normalized.ok) return null;
  return {
    schema: LAYOUT_SNAPSHOT_V1_SCHEMA,
    revision: normalized.state.revision,
    activePanelId: normalized.state.activePanelId,
    panels: normalized.state.panels,
    widgets: normalized.state.widgets,
    placements: normalized.state.placements
  };
}

export function encodeLayoutSnapshot(state: WorkbenchState): LayoutEncodeResult {
  try {
    const snapshot = snapshotFromState(state);
    if (!snapshot || !LayoutSnapshotV1Schema.safeParse(snapshot).success) {
      return {
        ok: false,
        state,
        error: {
          code: 'INVALID_SNAPSHOT',
          message: 'Workbench state cannot be encoded as a valid layout snapshot.',
          recoverable: true
        }
      };
    }
    return { ok: true, state, value: JSON.stringify(snapshot) };
  } catch {
    return {
      ok: false,
      state,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Layout snapshot encoding failed unexpectedly.',
        recoverable: false
      }
    };
  }
}

export function decodeLayoutSnapshot(raw: string, currentState: WorkbenchState): LayoutResult {
  try {
    const parsedJson: unknown = JSON.parse(raw);
    const parsedSnapshot = LayoutSnapshotV1Schema.safeParse(parsedJson);
    if (!parsedSnapshot.success) {
      return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot does not match pomegranate.ui.layout.v1.');
    }
    return normalizeSnapshot(parsedSnapshot.data as LayoutSnapshotV1, currentState);
  } catch {
    return rejectLayout(currentState, 'INVALID_SNAPSHOT', 'Layout snapshot is not valid JSON.');
  }
}

export async function loadLayout(
  storage: LayoutStorage,
  key: string,
  currentState: WorkbenchState
): Promise<LayoutResult> {
  try {
    const raw = await storage.load(key);
    if (raw === null) {
      return rejectLayout(currentState, 'INVALID_SNAPSHOT', `No layout snapshot exists for '${key}'.`, { key });
    }
    return decodeLayoutSnapshot(raw, currentState);
  } catch {
    return rejectLayout(currentState, 'INTERNAL_ERROR', 'Layout storage load failed.', { key }, false);
  }
}

export async function saveLayout(
  storage: LayoutStorage,
  key: string,
  state: WorkbenchState
): Promise<LayoutResult> {
  const encoded = encodeLayoutSnapshot(state);
  if (!encoded.ok) return { ok: false, state, error: encoded.error };
  try {
    await storage.save(key, encoded.value);
    return acceptLayout(state);
  } catch {
    return rejectLayout(state, 'INTERNAL_ERROR', 'Layout storage save failed.', { key }, false);
  }
}
