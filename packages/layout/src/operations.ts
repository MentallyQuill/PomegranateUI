import {
  PanelStateSchema,
  WidgetInstanceSchema,
  WidgetPlacementSchema,
  type DockedPlacement,
  type JsonObject,
  type PanelId,
  type PanelState,
  type ShelfState,
  type WidgetInstance,
  type WidgetInstanceId,
  type WidgetManifest,
  type VisibleWidgetPlacement,
  type WidgetPlacement,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import { acceptLayout, rejectLayout, type LayoutFailure, type LayoutResult } from './errors.js';
import { nextRevision, normalizeDockOrders, normalizePanels, normalizeShelves, normalizeTabGroups } from './state.js';
import type { PanelTemplateRegistry } from './templates.js';

export interface ShelfKey {
  readonly panelId: PanelId;
  readonly regionId: string;
  readonly shelfId: string;
}

export interface PlacementContext {
  readonly templates: PanelTemplateRegistry;
  readonly manifestFor: (instance: WidgetInstance) => WidgetManifest | undefined;
}

function hasPanel(state: WorkbenchState, panelId: PanelId): boolean {
  return state.panels.some((panel) => panel.id === panelId);
}

function validatePlacement(
  state: WorkbenchState,
  placement: VisibleWidgetPlacement,
  instance?: WidgetInstance,
  context?: PlacementContext
): { readonly ok: true; readonly placement: VisibleWidgetPlacement } | LayoutFailure {
  const parsed = WidgetPlacementSchema.safeParse(placement);
  if (!parsed.success) {
    return rejectLayout(state, 'INVALID_PLACEMENT', 'Widget placement is structurally invalid.');
  }
  if (!hasPanel(state, parsed.data.panelId)) {
    return rejectLayout(
      state,
      'MISSING_PANEL',
      `Panel '${parsed.data.panelId}' does not exist.`,
      { panelId: parsed.data.panelId }
    );
  }
  if (parsed.data.kind === 'shelved') {
    return rejectLayout(state, 'INVALID_PLACEMENT', 'Only visible placements may be placed directly.');
  }
  if (parsed.data.kind === 'docked' && context) {
    const docked = parsed.data;
    const panel = state.panels.find((candidate) => candidate.id === docked.panelId)!;
    const resolution = context.templates.resolve(panel);
    if (!resolution.ok) {
      return rejectLayout(state, 'UNKNOWN_TEMPLATE', resolution.message, { templateId: panel.templateId });
    }
    const region = resolution.template.regions.find((candidate) => candidate.id === docked.regionId);
    if (!region) {
      return rejectLayout(state, 'INVALID_PLACEMENT', `Region '${docked.regionId}' does not exist in Panel '${panel.id}'.`);
    }
    const shelf = state.shelves.find((candidate) => (
      candidate.panelId === panel.id
      && candidate.regionId === docked.regionId
      && candidate.id === docked.shelfId
    ));
    if (!shelf) return rejectLayout(state, 'MISSING_SHELF', `Shelf '${docked.shelfId}' does not exist in region '${docked.regionId}'.`);
    const catalog = instance ? context.manifestFor(instance)?.catalog : undefined;
    if (catalog && !region.acceptedShapes.includes(catalog.shape)) {
      return rejectLayout(state, 'INVALID_PLACEMENT', `Region '${region.id}' does not accept Widget shape '${catalog.shape}'.`);
    }
    if (catalog && resolution.template.family === 'columns') {
      const columns = resolution.template.regions.length;
      if (catalog.minColumns > columns) {
        return rejectLayout(state, 'INVALID_PLACEMENT', `Widget requires at least ${catalog.minColumns} columns.`);
      }
    }
  }
  return { ok: true, placement: parsed.data as VisibleWidgetPlacement };
}

function placeInRecord(
  placements: Readonly<Record<string, WidgetPlacement>>,
  instanceId: WidgetInstanceId,
  placement: VisibleWidgetPlacement
): Readonly<Record<string, WidgetPlacement>> {
  const withoutCurrent = { ...placements };
  delete withoutCurrent[instanceId];
  const normalized = normalizeTabGroups(normalizeDockOrders(withoutCurrent));

  if (placement.kind === 'floating') {
    return { ...normalized, [instanceId]: placement };
  }

  const siblings = Object.entries(normalized).filter(([, candidate]) => (
    candidate.kind === 'docked'
      && candidate.panelId === placement.panelId
      && placement.kind === 'docked'
      && candidate.regionId === placement.regionId
      && candidate.shelfId === placement.shelfId
  )).sort(([, left], [, right]) => (
    left.kind === 'docked' && right.kind === 'docked' ? left.order - right.order : 0
  ));
  const order = Math.min(placement.order, siblings.length);
  const shifted = { ...normalized };
  for (const [siblingId, candidate] of siblings) {
    if (candidate.kind === 'docked' && candidate.order >= order) {
      shifted[siblingId] = { ...candidate, order: candidate.order + 1 };
    }
  }
  return normalizeTabGroups(normalizeDockOrders({ ...shifted, [instanceId]: { ...placement, order } }));
}

export function resizePanelDock(
  state: WorkbenchState,
  panelId: PanelId,
  edge: 'left' | 'right',
  width: number
): LayoutResult {
  const index = state.panels.findIndex((panel) => panel.id === panelId);
  if (index < 0) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  if (!Number.isFinite(width) || width < 200 || width > 420) {
    return rejectLayout(state, 'INVALID_INDEX', 'Dock width must be between 200 and 420 CSS pixels.', { width });
  }
  const panel = state.panels[index]!;
  const currentWidths = panel.configuration?.dockWidths;
  const dockWidths = currentWidths !== null && typeof currentWidths === 'object' && !Array.isArray(currentWidths)
    ? currentWidths as JsonObject
    : {};
  const nextDockWidths: JsonObject = { ...dockWidths, [edge]: width };
  const panels = [...state.panels];
  panels[index] = { ...panel, configuration: { ...panel.configuration, dockWidths: nextDockWidths } };
  return acceptLayout({ ...state, revision: nextRevision(state), panels });
}

function dockedPlacement(state: WorkbenchState, instanceId: WidgetInstanceId): DockedPlacement | null {
  const placement = state.placements[instanceId];
  return placement?.kind === 'docked' ? placement : null;
}

export function mergeWidgetGroup(
  state: WorkbenchState,
  instanceId: WidgetInstanceId,
  targetInstanceId: WidgetInstanceId,
  groupId: string
): LayoutResult {
  if (instanceId === targetInstanceId) {
    return rejectLayout(state, 'INVALID_PLACEMENT', 'A Widget cannot be grouped with itself.');
  }
  const source = dockedPlacement(state, instanceId);
  const target = dockedPlacement(state, targetInstanceId);
  if (!state.widgets[instanceId] || !state.widgets[targetInstanceId]) {
    return rejectLayout(state, 'MISSING_WIDGET', 'Both grouped Widgets must exist.');
  }
  if (!source || !target || source.panelId !== target.panelId || source.subPanelId !== target.subPanelId) {
    return rejectLayout(state, 'INVALID_PLACEMENT', 'Grouped Widgets must be docked in the same Panel and sub-panel owner.');
  }
  if (!groupId || groupId.trim() !== groupId) {
    return rejectLayout(state, 'INVALID_PLACEMENT', 'Widget group identity is invalid.');
  }
  const targetGroupId = target.group?.id ?? groupId;
  if (target.group && target.group.id !== groupId) {
    return rejectLayout(state, 'INVALID_PLACEMENT', 'The target Widget already belongs to a different group.');
  }

  const moved = placeInRecord(state.placements, instanceId, {
    kind: 'docked',
    panelId: target.panelId,
    ...(target.subPanelId === undefined || target.lane === undefined
      ? {}
      : { subPanelId: target.subPanelId, lane: target.lane }),
    regionId: target.regionId,
    shelfId: target.shelfId,
    order: target.order + 1
  });
  const members = Object.entries(moved)
    .filter(([id, placement]) => id === targetInstanceId || id === instanceId
      || (placement.kind === 'docked' && placement.group?.id === targetGroupId))
    .sort(([leftId, left], [rightId, right]) => {
      const leftOrder = leftId === targetInstanceId ? -1 : left.kind === 'docked' ? (left.group?.order ?? left.order) : 0;
      const rightOrder = rightId === targetInstanceId ? -1 : right.kind === 'docked' ? (right.group?.order ?? right.order) : 0;
      return leftOrder - rightOrder || leftId.localeCompare(rightId);
    });
  const placements = { ...moved };
  members.forEach(([id, placement], order) => {
    if (placement.kind !== 'docked') return;
    placements[id] = {
      ...placement,
      group: { id: targetGroupId, order, active: id === instanceId }
    };
  });
  return acceptLayout({ ...state, revision: nextRevision(state), placements: normalizeTabGroups(placements) });
}

export function activateWidgetGroup(state: WorkbenchState, instanceId: WidgetInstanceId): LayoutResult {
  const selected = dockedPlacement(state, instanceId);
  if (!state.widgets[instanceId]) return rejectLayout(state, 'MISSING_WIDGET', `Widget instance '${instanceId}' does not exist.`);
  if (!selected?.group) return rejectLayout(state, 'INVALID_PLACEMENT', 'Widget is not in a tab group.');
  const placements = { ...state.placements };
  for (const [id, placement] of Object.entries(placements)) {
    const group = placement.kind === 'docked' ? placement.group : undefined;
    if (placement.kind === 'docked'
      && placement.panelId === selected.panelId
      && placement.subPanelId === selected.subPanelId
      && group?.id === selected.group.id) {
      placements[id] = { ...placement, group: { id: group.id, order: group.order, active: id === instanceId } };
    }
  }
  return acceptLayout({ ...state, revision: nextRevision(state), placements });
}

export function reorderWidgetGroup(
  state: WorkbenchState,
  instanceId: WidgetInstanceId,
  toIndex: number
): LayoutResult {
  const selected = dockedPlacement(state, instanceId);
  if (!state.widgets[instanceId]) return rejectLayout(state, 'MISSING_WIDGET', `Widget instance '${instanceId}' does not exist.`);
  if (!selected?.group) return rejectLayout(state, 'INVALID_PLACEMENT', 'Widget is not in a tab group.');
  const members = Object.entries(state.placements)
    .filter(([, placement]) => placement.kind === 'docked'
      && placement.panelId === selected.panelId
      && placement.subPanelId === selected.subPanelId
      && placement.group?.id === selected.group!.id)
    .sort(([, left], [, right]) => (
      left.kind === 'docked' && right.kind === 'docked'
        ? (left.group?.order ?? 0) - (right.group?.order ?? 0)
        : 0
    ));
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= members.length) {
    return rejectLayout(state, 'INVALID_INDEX', 'Widget group insertion index is outside the group.', { toIndex });
  }
  const fromIndex = members.findIndex(([id]) => id === instanceId);
  const [moved] = members.splice(fromIndex, 1);
  if (!moved) return rejectLayout(state, 'INTERNAL_ERROR', 'Widget group reorder could not isolate the member.', undefined, false);
  members.splice(toIndex, 0, moved);
  const placements = { ...state.placements };
  members.forEach(([id, placement], order) => {
    if (placement.kind === 'docked' && placement.group) {
      placements[id] = { ...placement, group: { ...placement.group, order } };
    }
  });
  return acceptLayout({ ...state, revision: nextRevision(state), placements });
}

export function createPanel(state: WorkbenchState, panel: PanelState): LayoutResult {
  const parsed = PanelStateSchema.safeParse(panel);
  if (!parsed.success) {
    return rejectLayout(state, 'INVALID_INDEX', 'Panel data or requested order is invalid.');
  }
  if (hasPanel(state, parsed.data.id)) {
    return rejectLayout(
      state,
      'DUPLICATE_ID',
      `Panel '${parsed.data.id}' already exists.`,
      { panelId: parsed.data.id }
    );
  }
  if (parsed.data.order > state.panels.length) {
    return rejectLayout(
      state,
      'INVALID_INDEX',
      `Panel insertion index ${parsed.data.order} is outside the current Panel sequence.`,
      { toIndex: parsed.data.order }
    );
  }

  const panels = [...state.panels];
  panels.splice(parsed.data.order, 0, parsed.data as PanelState);
  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    activePanelId: state.activePanelId ?? parsed.data.id,
    panels: normalizePanels(panels)
  });
}

export function activatePanel(state: WorkbenchState, panelId: PanelId): LayoutResult {
  if (!hasPanel(state, panelId)) {
    return rejectLayout(
      state,
      'MISSING_PANEL',
      `Panel '${panelId}' does not exist.`,
      { panelId }
    );
  }
  return acceptLayout({ ...state, revision: nextRevision(state), activePanelId: panelId });
}

export function reorderPanel(state: WorkbenchState, panelId: PanelId, toIndex: number): LayoutResult {
  const currentIndex = state.panels.findIndex((panel) => panel.id === panelId);
  if (currentIndex < 0) {
    return rejectLayout(
      state,
      'MISSING_PANEL',
      `Panel '${panelId}' does not exist.`,
      { panelId }
    );
  }
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= state.panels.length) {
    return rejectLayout(
      state,
      'INVALID_INDEX',
      `Panel destination index ${toIndex} is outside the current Panel sequence.`,
      { toIndex }
    );
  }

  const panels = [...state.panels];
  const [moved] = panels.splice(currentIndex, 1);
  if (!moved) {
    return rejectLayout(state, 'INTERNAL_ERROR', 'Panel reorder could not isolate the requested Panel.', undefined, false);
  }
  panels.splice(toIndex, 0, moved);
  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    panels: normalizePanels(panels)
  });
}

export function createWidget(
  state: WorkbenchState,
  instance: WidgetInstance,
  placement: VisibleWidgetPlacement,
  context?: PlacementContext
): LayoutResult {
  const parsedInstance = WidgetInstanceSchema.safeParse(instance);
  if (!parsedInstance.success) {
    return rejectLayout(state, 'INVALID_PLACEMENT', 'Widget instance data is structurally invalid.');
  }
  if (state.widgets[parsedInstance.data.id] || state.placements[parsedInstance.data.id]) {
    return rejectLayout(
      state,
      'DUPLICATE_ID',
      `Widget instance '${parsedInstance.data.id}' already exists.`,
      { instanceId: parsedInstance.data.id }
    );
  }
  const validatedPlacement = validatePlacement(state, placement, parsedInstance.data as WidgetInstance, context);
  if (!validatedPlacement.ok) return validatedPlacement;

  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    widgets: { ...state.widgets, [parsedInstance.data.id]: parsedInstance.data as WidgetInstance },
    placements: placeInRecord(
      state.placements,
      parsedInstance.data.id,
      validatedPlacement.placement
    )
  });
}

export function placeWidget(
  state: WorkbenchState,
  instanceId: WidgetInstanceId,
  placement: VisibleWidgetPlacement,
  context?: PlacementContext
): LayoutResult {
  if (!state.widgets[instanceId]) {
    return rejectLayout(
      state,
      'MISSING_WIDGET',
      `Widget instance '${instanceId}' does not exist.`,
      { instanceId }
    );
  }
  const validatedPlacement = validatePlacement(state, placement, state.widgets[instanceId], context);
  if (!validatedPlacement.ok) return validatedPlacement;

  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    placements: placeInRecord(state.placements, instanceId, validatedPlacement.placement)
  });
}

export function renamePanel(state: WorkbenchState, panelId: PanelId, name: string): LayoutResult {
  const index = state.panels.findIndex((panel) => panel.id === panelId);
  if (index < 0) return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`);
  if (!name || name.trim() !== name) return rejectLayout(state, 'INVALID_INDEX', 'Panel name is invalid.');
  const panels = [...state.panels];
  panels[index] = { ...panels[index]!, name };
  return acceptLayout({ ...state, revision: nextRevision(state), panels });
}

export interface PanelDuplicateIds {
  readonly panelId: PanelId;
  readonly shelfIds: Readonly<Record<string, string>>;
  readonly widgetIds: Readonly<Record<string, WidgetInstanceId>>;
  readonly groupIds: Readonly<Record<string, string>>;
}

function remapVisiblePlacement(
  placement: VisibleWidgetPlacement,
  panelId: PanelId,
  ids: PanelDuplicateIds
): VisibleWidgetPlacement | null {
  if (placement.kind === 'floating') return { ...placement, panelId };
  const shelfId = ids.shelfIds[placement.shelfId];
  if (!shelfId) return null;
  const group = placement.group
    ? ids.groupIds[placement.group.id]
      ? { ...placement.group, id: ids.groupIds[placement.group.id]! }
      : null
    : undefined;
  if (group === null) return null;
  return {
    ...placement,
    panelId,
    shelfId,
    ...(group ? { group } : {})
  };
}

export function duplicatePanel(
  state: WorkbenchState,
  sourcePanelId: PanelId,
  name: string,
  ids: PanelDuplicateIds
): LayoutResult {
  const sourceIndex = state.panels.findIndex((panel) => panel.id === sourcePanelId);
  const source = state.panels[sourceIndex];
  if (!source) return rejectLayout(state, 'MISSING_PANEL', `Panel '${sourcePanelId}' does not exist.`);
  if (hasPanel(state, ids.panelId)) return rejectLayout(state, 'DUPLICATE_ID', `Panel '${ids.panelId}' already exists.`);
  if (!name || name.trim() !== name) return rejectLayout(state, 'INVALID_INDEX', 'Panel name is invalid.');

  const sourceShelves = state.shelves.filter((shelf) => shelf.panelId === sourcePanelId);
  const duplicatedShelves: ShelfState[] = [];
  for (const shelf of sourceShelves) {
    const id = ids.shelfIds[shelf.id];
    if (!id) return rejectLayout(state, 'INVALID_PLACEMENT', `Missing duplicate id for shelf '${shelf.id}'.`);
    duplicatedShelves.push({ ...shelf, id, panelId: ids.panelId });
  }

  const widgets = { ...state.widgets };
  const placements = { ...state.placements };
  for (const [oldId, placement] of Object.entries(state.placements)) {
    if (placement.panelId !== sourcePanelId) continue;
    const newId = ids.widgetIds[oldId];
    const sourceWidget = state.widgets[oldId];
    if (!newId || !sourceWidget) return rejectLayout(state, 'INVALID_PLACEMENT', `Missing duplicate id for Widget '${oldId}'.`);
    if (widgets[newId]) return rejectLayout(state, 'DUPLICATE_ID', `Widget instance '${newId}' already exists.`);
    const visible = placement.kind === 'shelved'
      ? remapVisiblePlacement(placement.lastVisible, ids.panelId, ids)
      : remapVisiblePlacement(placement, ids.panelId, ids);
    if (!visible) return rejectLayout(state, 'INVALID_PLACEMENT', `Missing duplicate group or shelf identity for Widget '${oldId}'.`);
    widgets[newId] = { ...sourceWidget, id: newId };
    placements[newId] = placement.kind === 'shelved'
      ? { kind: 'shelved', panelId: ids.panelId, lastVisible: visible }
      : visible;
  }

  const panels = [...state.panels];
  panels.splice(sourceIndex + 1, 0, { ...source, id: ids.panelId, name, order: sourceIndex + 1 });
  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    panels: normalizePanels(panels),
    shelves: normalizeShelves([...state.shelves, ...duplicatedShelves]),
    widgets,
    placements: normalizeTabGroups(normalizeDockOrders(placements))
  });
}

export function clearPanel(state: WorkbenchState, panelId: PanelId): LayoutResult {
  if (!hasPanel(state, panelId)) return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`);
  const widgets = { ...state.widgets };
  const placements = { ...state.placements };
  for (const [instanceId, placement] of Object.entries(state.placements)) {
    if (placement.panelId !== panelId) continue;
    delete widgets[instanceId];
    delete placements[instanceId];
  }
  return acceptLayout({ ...state, revision: nextRevision(state), widgets, placements });
}

export function deletePanel(state: WorkbenchState, panelId: PanelId): LayoutResult {
  const index = state.panels.findIndex((panel) => panel.id === panelId);
  if (index < 0) return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`);
  const cleared = clearPanel(state, panelId);
  if (!cleared.ok) return cleared;
  const panels = state.panels.filter((panel) => panel.id !== panelId);
  const activePanelId = state.activePanelId === panelId
    ? panels[Math.min(index, panels.length - 1)]?.id ?? null
    : state.activePanelId;
  return acceptLayout({
    ...cleared.state,
    revision: nextRevision(state),
    activePanelId,
    panels: normalizePanels(panels),
    shelves: state.shelves.filter((shelf) => shelf.panelId !== panelId)
  });
}

export interface PanelResetPayload {
  readonly panel: PanelState;
  readonly shelves: readonly ShelfState[];
  readonly widgets: Readonly<Record<string, WidgetInstance>>;
  readonly placements: Readonly<Record<string, WidgetPlacement>>;
}

export function resetPanel(state: WorkbenchState, panelId: PanelId, payload: PanelResetPayload): LayoutResult {
  const index = state.panels.findIndex((panel) => panel.id === panelId);
  if (index < 0) return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`);
  if (payload.panel.id !== panelId) return rejectLayout(state, 'INVALID_PLACEMENT', 'Reset payload must preserve Panel identity.');
  const cleared = clearPanel(state, panelId);
  if (!cleared.ok) return cleared;
  const panels = [...cleared.state.panels];
  panels[index] = { ...payload.panel, order: index };
  const widgets = { ...cleared.state.widgets, ...payload.widgets };
  const placements = { ...cleared.state.placements, ...payload.placements };
  const candidate = {
    ...cleared.state,
    revision: nextRevision(state),
    panels,
    shelves: normalizeShelves([
      ...cleared.state.shelves.filter((shelf) => shelf.panelId !== panelId),
      ...payload.shelves
    ]),
    widgets,
    placements: normalizeTabGroups(normalizeDockOrders(placements))
  };
  return acceptLayout(candidate);
}

export function createShelf(
  state: WorkbenchState,
  shelf: ShelfState,
  templates: PanelTemplateRegistry
): LayoutResult {
  const panel = state.panels.find((candidate) => candidate.id === shelf.panelId);
  if (!panel) return rejectLayout(state, 'MISSING_PANEL', `Panel '${shelf.panelId}' does not exist.`);
  const resolution = templates.resolve(panel);
  if (!resolution.ok) return rejectLayout(state, 'UNKNOWN_TEMPLATE', resolution.message, { templateId: panel.templateId });
  if (!resolution.template.regions.some((region) => region.id === shelf.regionId)) {
    return rejectLayout(state, 'INVALID_PLACEMENT', `Region '${shelf.regionId}' does not exist in Panel '${panel.id}'.`);
  }
  const siblings = state.shelves.filter((candidate) => candidate.panelId === shelf.panelId && candidate.regionId === shelf.regionId);
  if (siblings.some((candidate) => candidate.id === shelf.id)) {
    return rejectLayout(state, 'DUPLICATE_ID', `Shelf '${shelf.id}' already exists in region '${shelf.regionId}'.`);
  }
  if (!Number.isInteger(shelf.order) || shelf.order < 0 || shelf.order > siblings.length) {
    return rejectLayout(state, 'INVALID_INDEX', 'Shelf insertion index is outside the region.');
  }
  const shifted = state.shelves.map((candidate) => (
    candidate.panelId === shelf.panelId && candidate.regionId === shelf.regionId && candidate.order >= shelf.order
      ? { ...candidate, order: candidate.order + 1 }
      : candidate
  ));
  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    shelves: normalizeShelves([...shifted, shelf])
  });
}

export function resizeShelf(state: WorkbenchState, key: ShelfKey, weight: number): LayoutResult {
  const siblings = state.shelves
    .filter((candidate) => candidate.panelId === key.panelId && candidate.regionId === key.regionId)
    .sort((left, right) => left.order - right.order);
  const selected = siblings.find((candidate) => candidate.id === key.shelfId);
  if (!selected) return rejectLayout(state, 'MISSING_SHELF', `Shelf '${key.shelfId}' does not exist.`);
  if (!Number.isFinite(weight)) return rejectLayout(state, 'INVALID_INDEX', 'Shelf weight must be finite.');
  const maximum = siblings.length === 1 ? 1 : 1 - 0.05 * (siblings.length - 1);
  const requested = Math.min(maximum, Math.max(siblings.length === 1 ? 1 : 0.05, weight));
  const others = siblings.filter((candidate) => candidate.id !== key.shelfId);
  const otherTotal = others.reduce((total, candidate) => total + candidate.weight, 0);
  const replacement = new Map<string, number>([[selected.id, requested]]);
  for (const candidate of others) {
    replacement.set(candidate.id, otherTotal > 0
      ? (candidate.weight / otherTotal) * (1 - requested)
      : (1 - requested) / others.length);
  }
  const shelves = state.shelves.map((candidate) => (
    candidate.panelId === key.panelId && candidate.regionId === key.regionId
      ? { ...candidate, weight: replacement.get(candidate.id) ?? candidate.weight }
      : candidate
  ));
  return acceptLayout({ ...state, revision: nextRevision(state), shelves: normalizeShelves(shelves) });
}

export function shelveWidget(state: WorkbenchState, instanceId: WidgetInstanceId): LayoutResult {
  if (!state.widgets[instanceId]) return rejectLayout(state, 'MISSING_WIDGET', `Widget instance '${instanceId}' does not exist.`);
  const current = state.placements[instanceId];
  if (!current || current.kind === 'shelved') {
    return rejectLayout(state, 'INVALID_PLACEMENT', 'Widget is not currently visible.');
  }
  const without = { ...state.placements };
  delete without[instanceId];
  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    placements: {
      ...normalizeTabGroups(normalizeDockOrders(without)),
      [instanceId]: { kind: 'shelved', panelId: current.panelId, lastVisible: current }
    }
  });
}

export function restoreWidget(
  state: WorkbenchState,
  instanceId: WidgetInstanceId,
  context: PlacementContext
): LayoutResult {
  const instance = state.widgets[instanceId];
  if (!instance) return rejectLayout(state, 'MISSING_WIDGET', `Widget instance '${instanceId}' does not exist.`);
  const current = state.placements[instanceId];
  if (!current || current.kind !== 'shelved') {
    return rejectLayout(state, 'INVALID_PLACEMENT', 'Widget is not on the Widget Shelf.');
  }
  const exact = validatePlacement(state, current.lastVisible, instance, context);
  if (exact.ok) {
    return acceptLayout({
      ...state,
      revision: nextRevision(state),
      placements: placeInRecord(state.placements, instanceId, exact.placement)
    });
  }
  const panel = state.panels.find((candidate) => candidate.id === current.panelId);
  const resolution = panel ? context.templates.resolve(panel) : null;
  if (!panel || !resolution?.ok) return exact;
  for (const region of resolution.template.regions) {
    const shelf = state.shelves
      .filter((candidate) => candidate.panelId === panel.id && candidate.regionId === region.id)
      .sort((left, right) => left.order - right.order)[0];
    if (!shelf) continue;
    const candidate: VisibleWidgetPlacement = {
      kind: 'docked', panelId: panel.id, regionId: region.id, shelfId: shelf.id, order: Number.MAX_SAFE_INTEGER
    };
    const validated = validatePlacement(state, candidate, instance, context);
    if (validated.ok) {
      return acceptLayout({
        ...state,
        revision: nextRevision(state),
        placements: placeInRecord(state.placements, instanceId, validated.placement)
      });
    }
  }
  return rejectLayout(state, 'INVALID_PLACEMENT', 'No compatible region is available for this Widget.');
}

export function separateWidgetGroup(
  state: WorkbenchState,
  instanceId: WidgetInstanceId,
  placement: VisibleWidgetPlacement,
  context: PlacementContext
): LayoutResult {
  const current = dockedPlacement(state, instanceId);
  if (!current?.group) return rejectLayout(state, 'INVALID_PLACEMENT', 'Widget is not in a tab group.');
  return placeWidget(state, instanceId, placement, context);
}

export function removeWidget(state: WorkbenchState, instanceId: WidgetInstanceId): LayoutResult {
  if (!state.widgets[instanceId]) {
    return rejectLayout(
      state,
      'MISSING_WIDGET',
      `Widget instance '${instanceId}' does not exist.`,
      { instanceId }
    );
  }

  const widgets = { ...state.widgets };
  const placements = { ...state.placements };
  delete widgets[instanceId];
  delete placements[instanceId];

  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    widgets,
    placements: normalizeTabGroups(normalizeDockOrders(placements))
  });
}
