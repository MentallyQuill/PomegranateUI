import {
  SubPanelIdSchema,
  SubPanelStateSchema,
  type DockedPlacement,
  type PanelId,
  type SubPanelId,
  type SubPanelLayoutId,
  type SubPanelState,
  type VisibleWidgetPlacement,
  type WidgetInstanceId,
  type WidgetPlacement,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import { acceptLayout, rejectLayout, type LayoutResult } from './errors.js';
import { nextRevision } from './state.js';

export interface SubPanelLayoutDefinition {
  readonly id: SubPanelLayoutId;
  readonly label: string;
  readonly columns: readonly number[];
}

export const SUB_PANEL_LAYOUTS: Readonly<Record<SubPanelLayoutId, SubPanelLayoutDefinition>> = Object.freeze({
  single: Object.freeze({ id: 'single', label: 'Single column', columns: Object.freeze([1]) }),
  'two-equal': Object.freeze({ id: 'two-equal', label: 'Two equal columns', columns: Object.freeze([1, 1]) }),
  'three-equal': Object.freeze({ id: 'three-equal', label: 'Three equal columns', columns: Object.freeze([1, 1, 1]) }),
  'wide-left': Object.freeze({ id: 'wide-left', label: 'Wide left', columns: Object.freeze([2, 1]) }),
  'wide-right': Object.freeze({ id: 'wide-right', label: 'Wide right', columns: Object.freeze([1, 2]) })
});

function exactSubPanel(value: {
  readonly id: SubPanelId;
  readonly name: string;
  readonly layoutId: SubPanelLayoutId;
  readonly order: number;
  readonly scrollTop: number;
  readonly shipped?: boolean | undefined;
  readonly hidden?: boolean | undefined;
}): SubPanelState {
  const { shipped, hidden, ...required } = value;
  return {
    ...required,
    ...(shipped === undefined ? {} : { shipped }),
    ...(hidden === undefined ? {} : { hidden })
  };
}

export function normalizeSubPanels(state: WorkbenchState): WorkbenchState {
  const panelMetadata = new Map<PanelId, {
    readonly activeSubPanelId?: SubPanelId;
    readonly subPanels: readonly SubPanelState[];
  }>();
  const panels = state.panels.map((panel) => {
    const rawSubPanels = Array.isArray(panel.subPanels)
      ? (panel.subPanels as readonly unknown[])
      : [];
    const seen = new Set<string>();
    const candidates = rawSubPanels.flatMap((raw, index) => {
      if (!raw || typeof raw !== 'object') return [];
      const record = raw as Record<string, unknown>;
      const parsedId = SubPanelIdSchema.safeParse(record.id);
      if (!parsedId.success || seen.has(parsedId.data)) return [];
      seen.add(parsedId.data);
      const layoutId = typeof record.layoutId === 'string' && record.layoutId in SUB_PANEL_LAYOUTS
        ? record.layoutId as SubPanelLayoutId
        : 'single';
      const numericOrder = typeof record.order === 'number' && Number.isFinite(record.order) && record.order >= 0
        ? Math.floor(record.order)
        : Number.MAX_SAFE_INTEGER;
      const scrollTop = typeof record.scrollTop === 'number' && Number.isFinite(record.scrollTop) && record.scrollTop >= 0
        ? record.scrollTop
        : 0;
      const name = typeof record.name === 'string' && record.name.length > 0 && record.name.trim() === record.name
        ? record.name
        : 'Untitled';
      const candidate: SubPanelState & { readonly sourceIndex: number; readonly numericOrder: number } = {
        id: parsedId.data,
        name,
        layoutId,
        order: 0,
        scrollTop,
        ...(typeof record.shipped === 'boolean' ? { shipped: record.shipped } : {}),
        ...(typeof record.hidden === 'boolean' ? { hidden: record.hidden } : {}),
        sourceIndex: index,
        numericOrder
      };
      return [candidate];
    });

    if (candidates.length === 0) {
      const { activeSubPanelId: _activeSubPanelId, subPanels: _subPanels, ...flatPanel } = panel;
      panelMetadata.set(panel.id, { subPanels: [] });
      return flatPanel;
    }
    candidates.sort((left, right) => left.numericOrder - right.numericOrder || left.sourceIndex - right.sourceIndex);
    let subPanels = candidates.map(({ sourceIndex: _sourceIndex, numericOrder: _numericOrder, ...candidate }, order) => ({
      ...candidate,
      order
    }));
    if (!subPanels.some((candidate) => !candidate.hidden)) {
      subPanels = subPanels.map((candidate, index) => index === 0 ? { ...candidate, hidden: false } : candidate);
    }
    const requestedActive = panel.activeSubPanelId;
    const activeSubPanelId = subPanels.some((candidate) => candidate.id === requestedActive && !candidate.hidden)
      ? requestedActive!
      : subPanels.find((candidate) => !candidate.hidden)!.id;
    panelMetadata.set(panel.id, { activeSubPanelId, subPanels });
    return { ...panel, activeSubPanelId, subPanels };
  });

  const placements = Object.fromEntries(Object.entries(state.placements).map(([instanceId, placement]) => {
    const visible = visiblePlacement(placement);
    const metadata = panelMetadata.get(visible.panelId);
    if (!metadata || metadata.subPanels.length === 0 || !metadata.activeSubPanelId) {
      if (visible.kind === 'floating') {
        const { subPanelId: _subPanelId, ...flat } = visible;
        return [instanceId, replaceVisiblePlacement(placement, flat)];
      }
      const { subPanelId: _subPanelId, lane: _lane, ...flat } = visible;
      return [instanceId, replaceVisiblePlacement(placement, flat)];
    }
    const requestedOwner = visible.subPanelId;
    const owner = metadata.subPanels.some((candidate) => candidate.id === requestedOwner)
      ? requestedOwner!
      : metadata.activeSubPanelId;
    if (visible.kind === 'floating') {
      return [instanceId, replaceVisiblePlacement(placement, { ...visible, subPanelId: owner })];
    }
    const subPanel = metadata.subPanels.find((candidate) => candidate.id === owner)!;
    const laneCount = SUB_PANEL_LAYOUTS[subPanel.layoutId].columns.length;
    const requestedLane = typeof visible.lane === 'number' && Number.isFinite(visible.lane)
      ? Math.floor(visible.lane)
      : 0;
    const lane = Math.min(laneCount - 1, Math.max(0, requestedLane));
    const columnRegionId = `column-${lane + 1}`;
    const regionId = state.shelves.some((shelf) => (
      shelf.panelId === visible.panelId
      && shelf.regionId === columnRegionId
      && shelf.id === visible.shelfId
    ))
      ? columnRegionId
      : visible.regionId;
    return [instanceId, replaceVisiblePlacement(placement, {
      ...visible,
      subPanelId: owner,
      lane,
      regionId,
      order: Number.isInteger(visible.order) && visible.order >= 0 ? visible.order : 0
    })];
  }));

  return { ...state, panels, placements };
}

export function activateSubPanel(
  state: WorkbenchState,
  panelId: PanelId,
  subPanelId: SubPanelId,
  currentScrollTop: number
): LayoutResult {
  const panelIndex = state.panels.findIndex((candidate) => candidate.id === panelId);
  if (panelIndex < 0) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  const panel = state.panels[panelIndex]!;
  if (!panel.subPanels || !panel.activeSubPanelId) {
    return rejectLayout(state, 'INVALID_INDEX', `Panel '${panelId}' does not contain sub-panels.`, { panelId });
  }
  if (!Number.isFinite(currentScrollTop) || currentScrollTop < 0) {
    return rejectLayout(state, 'INVALID_INDEX', 'Sub-panel scroll position must be finite and nonnegative.');
  }
  if (!panel.subPanels.some((candidate) => candidate.id === subPanelId && !candidate.hidden)) {
    return rejectLayout(state, 'INVALID_INDEX', `Sub-panel '${subPanelId}' is not an available target.`, {
      panelId,
      subPanelId
    });
  }

  const panels = [...state.panels];
  panels[panelIndex] = {
    ...panel,
    activeSubPanelId: subPanelId,
    subPanels: panel.subPanels.map((candidate) => candidate.id === panel.activeSubPanelId
      ? { ...candidate, scrollTop: currentScrollTop }
      : candidate)
  };

  return acceptLayout({ ...state, revision: nextRevision(state), panels });
}

export function renameSubPanel(
  state: WorkbenchState,
  panelId: PanelId,
  subPanelId: SubPanelId,
  name: string
): LayoutResult {
  const panelIndex = state.panels.findIndex((candidate) => candidate.id === panelId);
  if (panelIndex < 0) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  const panel = state.panels[panelIndex]!;
  if (!panel.subPanels?.some((candidate) => candidate.id === subPanelId)) {
    return rejectLayout(state, 'INVALID_INDEX', `Sub-panel '${subPanelId}' does not exist.`, { panelId, subPanelId });
  }
  if (!name || name.trim() !== name || name.length > 48) {
    return rejectLayout(state, 'INVALID_INDEX', 'Sub-panel name must be 1 to 48 characters without surrounding whitespace.');
  }
  const panels = [...state.panels];
  panels[panelIndex] = {
    ...panel,
    subPanels: panel.subPanels.map((candidate) => candidate.id === subPanelId
      ? { ...candidate, name }
      : candidate)
  };
  return acceptLayout({ ...state, revision: nextRevision(state), panels });
}

export function setSubPanelScroll(
  state: WorkbenchState,
  panelId: PanelId,
  subPanelId: SubPanelId,
  scrollTop: number
): LayoutResult {
  const panelIndex = state.panels.findIndex((candidate) => candidate.id === panelId);
  if (panelIndex < 0) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  const panel = state.panels[panelIndex]!;
  if (!panel.subPanels?.some((candidate) => candidate.id === subPanelId)) {
    return rejectLayout(state, 'INVALID_INDEX', `Sub-panel '${subPanelId}' does not exist.`, { panelId, subPanelId });
  }
  if (!Number.isFinite(scrollTop) || scrollTop < 0) {
    return rejectLayout(state, 'INVALID_INDEX', 'Sub-panel scroll position must be finite and nonnegative.');
  }
  const panels = [...state.panels];
  panels[panelIndex] = {
    ...panel,
    subPanels: panel.subPanels.map((candidate) => candidate.id === subPanelId
      ? { ...candidate, scrollTop }
      : candidate)
  };
  return acceptLayout({ ...state, revision: nextRevision(state), panels });
}

export function reorderSubPanel(
  state: WorkbenchState,
  panelId: PanelId,
  subPanelId: SubPanelId,
  toIndex: number
): LayoutResult {
  const panelIndex = state.panels.findIndex((candidate) => candidate.id === panelId);
  if (panelIndex < 0) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  const panel = state.panels[panelIndex]!;
  const ordered = panel.subPanels
    ? [...panel.subPanels].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    : [];
  const fromIndex = ordered.findIndex((candidate) => candidate.id === subPanelId);
  if (fromIndex < 0) {
    return rejectLayout(state, 'INVALID_INDEX', `Sub-panel '${subPanelId}' does not exist.`, { panelId, subPanelId });
  }
  if (!Number.isInteger(toIndex) || toIndex < 0 || toIndex >= ordered.length) {
    return rejectLayout(state, 'INVALID_INDEX', 'Sub-panel insertion index is outside the Panel.', { toIndex });
  }
  const [moved] = ordered.splice(fromIndex, 1);
  ordered.splice(toIndex, 0, moved!);
  const panels = [...state.panels];
  panels[panelIndex] = { ...panel, subPanels: ordered.map((candidate, order) => ({ ...candidate, order })) };
  return acceptLayout({ ...state, revision: nextRevision(state), panels });
}

function visiblePlacement(placement: WidgetPlacement): VisibleWidgetPlacement {
  return placement.kind === 'shelved' ? placement.lastVisible : placement;
}

function replaceVisiblePlacement(
  placement: WidgetPlacement,
  visible: VisibleWidgetPlacement
): WidgetPlacement {
  return placement.kind === 'shelved' ? { ...placement, lastVisible: visible } : visible;
}

export function changeSubPanelLayout(
  state: WorkbenchState,
  panelId: PanelId,
  subPanelId: SubPanelId,
  layoutId: SubPanelLayoutId
): LayoutResult {
  const panelIndex = state.panels.findIndex((candidate) => candidate.id === panelId);
  if (panelIndex < 0) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  const panel = state.panels[panelIndex]!;
  const subPanel = panel.subPanels?.find((candidate) => candidate.id === subPanelId);
  if (!subPanel) {
    return rejectLayout(state, 'INVALID_INDEX', `Sub-panel '${subPanelId}' does not exist.`, { panelId, subPanelId });
  }
  const nextLayout = SUB_PANEL_LAYOUTS[layoutId];
  if (!nextLayout) {
    return rejectLayout(state, 'INVALID_INDEX', `Sub-panel layout '${layoutId}' does not exist.`);
  }

  const nextLaneCount = nextLayout.columns.length;
  const lastLane = nextLaneCount - 1;
  const entries = Object.entries(state.placements).map(([instanceId, placement], index) => ({
    instanceId,
    placement,
    visible: visiblePlacement(placement),
    index
  }));
  const ownedDocked = entries.filter(({ visible }) => (
    visible.kind === 'docked'
    && visible.panelId === panelId
    && visible.subPanelId === subPanelId
  ));
  const nextOrderByItem = new Map<string, number>();
  let nextOrder = ownedDocked
    .filter(({ visible }) => visible.kind === 'docked' && (visible.lane ?? 0) === lastLane)
    .reduce((maximum, { visible }) => visible.kind === 'docked' ? Math.max(maximum, visible.order + 1) : maximum, 0);

  ownedDocked
    .filter(({ visible }) => visible.kind === 'docked' && (visible.lane ?? 0) >= nextLaneCount)
    .sort((left, right) => {
      const leftPlacement = left.visible as DockedPlacement;
      const rightPlacement = right.visible as DockedPlacement;
      return (leftPlacement.lane ?? 0) - (rightPlacement.lane ?? 0)
        || leftPlacement.order - rightPlacement.order
        || (leftPlacement.group?.order ?? 0) - (rightPlacement.group?.order ?? 0)
        || left.index - right.index;
    })
    .forEach(({ instanceId, visible }) => {
      const docked = visible as DockedPlacement;
      const itemKey = docked.group ? `group:${docked.group.id}` : `widget:${instanceId}`;
      if (!nextOrderByItem.has(itemKey)) nextOrderByItem.set(itemKey, nextOrder++);
    });

  const placements = Object.fromEntries(entries.map(({ instanceId, placement, visible }) => {
    if (visible.kind !== 'docked'
      || visible.panelId !== panelId
      || visible.subPanelId !== subPanelId
      || (visible.lane ?? 0) < nextLaneCount) {
      return [instanceId, placement];
    }
    const itemKey = visible.group ? `group:${visible.group.id}` : `widget:${instanceId}`;
    return [instanceId, replaceVisiblePlacement(placement, {
      ...visible,
      lane: lastLane,
      regionId: `column-${lastLane + 1}`,
      order: nextOrderByItem.get(itemKey)!
    })];
  }));

  const panels = [...state.panels];
  panels[panelIndex] = {
    ...panel,
    subPanels: panel.subPanels!.map((candidate) => candidate.id === subPanelId
      ? { ...candidate, layoutId }
      : candidate)
  };
  return acceptLayout({ ...state, revision: nextRevision(state), panels, placements });
}

export interface SubPanelDuplicateIds {
  readonly widgetIds: Readonly<Record<string, WidgetInstanceId>>;
  readonly groupIds: Readonly<Record<string, string>>;
}

export function duplicateSubPanel(
  state: WorkbenchState,
  panelId: PanelId,
  sourceSubPanelId: SubPanelId,
  requestedSubPanel: SubPanelState,
  ids: SubPanelDuplicateIds
): LayoutResult {
  const panelIndex = state.panels.findIndex((candidate) => candidate.id === panelId);
  if (panelIndex < 0) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  const panel = state.panels[panelIndex]!;
  const source = panel.subPanels?.find((candidate) => candidate.id === sourceSubPanelId);
  if (!source) {
    return rejectLayout(state, 'INVALID_INDEX', `Sub-panel '${sourceSubPanelId}' does not exist.`, {
      panelId,
      subPanelId: sourceSubPanelId
    });
  }
  const parsedSubPanel = SubPanelStateSchema.safeParse(requestedSubPanel);
  if (!parsedSubPanel.success) {
    return rejectLayout(state, 'INVALID_INDEX', 'Duplicate sub-panel data is structurally invalid.');
  }
  if (panel.subPanels!.some((candidate) => candidate.id === parsedSubPanel.data.id)) {
    return rejectLayout(state, 'DUPLICATE_ID', `Sub-panel '${parsedSubPanel.data.id}' already exists.`);
  }

  const ownedEntries = Object.entries(state.placements).filter(([, placement]) => {
    const visible = visiblePlacement(placement);
    return visible.panelId === panelId && visible.subPanelId === sourceSubPanelId;
  });
  const requestedWidgetIds = ownedEntries.map(([instanceId]) => ids.widgetIds[instanceId]);
  if (requestedWidgetIds.some((instanceId) => instanceId === undefined)
    || new Set(requestedWidgetIds).size !== requestedWidgetIds.length
    || requestedWidgetIds.some((instanceId) => instanceId !== undefined && state.widgets[instanceId] !== undefined)) {
    return rejectLayout(state, 'DUPLICATE_ID', 'Every duplicated Widget requires one unused caller-supplied identity.');
  }

  const widgets = { ...state.widgets };
  const placements = { ...state.placements };
  for (const [sourceInstanceId, placement] of ownedEntries) {
    const targetInstanceId = ids.widgetIds[sourceInstanceId]!;
    const sourceWidget = state.widgets[sourceInstanceId];
    if (!sourceWidget) {
      return rejectLayout(state, 'MISSING_WIDGET', `Widget instance '${sourceInstanceId}' does not exist.`);
    }
    const visible = visiblePlacement(placement);
    const group = visible.kind === 'docked' && visible.group
      ? ids.groupIds[visible.group.id]
        ? { ...visible.group, id: ids.groupIds[visible.group.id]! }
        : null
      : undefined;
    if (group === null) {
      return rejectLayout(state, 'DUPLICATE_ID', `Widget group '${visible.kind === 'docked' ? visible.group?.id : ''}' requires a new identity.`);
    }
    const duplicatedVisible: VisibleWidgetPlacement = visible.kind === 'docked'
      ? { ...visible, subPanelId: parsedSubPanel.data.id, ...(group === undefined ? {} : { group }) }
      : { ...visible, subPanelId: parsedSubPanel.data.id };
    widgets[targetInstanceId] = { ...sourceWidget, id: targetInstanceId };
    placements[targetInstanceId] = replaceVisiblePlacement(placement, duplicatedVisible);
  }

  const duplicatedSubPanel: SubPanelState = {
    ...exactSubPanel(parsedSubPanel.data),
    layoutId: source.layoutId,
    order: panel.subPanels!.length,
    scrollTop: 0
  };
  const panels = [...state.panels];
  panels[panelIndex] = {
    ...panel,
    activeSubPanelId: duplicatedSubPanel.id,
    subPanels: [...panel.subPanels!, duplicatedSubPanel]
  };
  return acceptLayout({ ...state, revision: nextRevision(state), panels, widgets, placements });
}

export function moveSubPanelWidgets(
  state: WorkbenchState,
  panelId: PanelId,
  sourceSubPanelId: SubPanelId,
  targetSubPanelId: SubPanelId
): LayoutResult {
  const panel = state.panels.find((candidate) => candidate.id === panelId);
  if (!panel) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  if (sourceSubPanelId === targetSubPanelId) {
    return rejectLayout(state, 'INVALID_INDEX', 'Widget movement requires two distinct sub-panels.');
  }
  const source = panel.subPanels?.find((candidate) => candidate.id === sourceSubPanelId);
  const target = panel.subPanels?.find((candidate) => candidate.id === targetSubPanelId);
  if (!source || !target) {
    return rejectLayout(state, 'INVALID_INDEX', 'Both source and target sub-panels must exist.', {
      panelId,
      sourceSubPanelId,
      targetSubPanelId
    });
  }

  const entries = Object.entries(state.placements).map(([instanceId, placement], index) => ({
    instanceId,
    placement,
    visible: visiblePlacement(placement),
    index
  }));
  const sourceEntries = entries.filter(({ visible }) => (
    visible.panelId === panelId && visible.subPanelId === sourceSubPanelId
  ));
  if (sourceEntries.length === 0) {
    return rejectLayout(state, 'INVALID_INDEX', `Sub-panel '${sourceSubPanelId}' has no Widgets to move.`);
  }

  const laneCount = SUB_PANEL_LAYOUTS[target.layoutId].columns.length;
  const nextOrderByLane = Array.from({ length: laneCount }, (_, lane) => (
    entries
      .filter(({ visible }) => visible.kind === 'docked'
        && visible.panelId === panelId
        && visible.subPanelId === targetSubPanelId
        && visible.lane === lane)
      .reduce((maximum, { visible }) => visible.kind === 'docked' ? Math.max(maximum, visible.order + 1) : maximum, 0)
  ));
  const projectedByInstance = new Map<string, VisibleWidgetPlacement>();
  const orderByItem = new Map<string, number>();
  sourceEntries
    .sort((left, right) => {
      const leftLane = left.visible.kind === 'docked' ? (left.visible.lane ?? 0) : Number.MAX_SAFE_INTEGER;
      const rightLane = right.visible.kind === 'docked' ? (right.visible.lane ?? 0) : Number.MAX_SAFE_INTEGER;
      const leftOrder = left.visible.kind === 'docked' ? left.visible.order : left.visible.z;
      const rightOrder = right.visible.kind === 'docked' ? right.visible.order : right.visible.z;
      return leftLane - rightLane || leftOrder - rightOrder || left.index - right.index;
    })
    .forEach(({ instanceId, visible }) => {
      if (visible.kind === 'floating') {
        projectedByInstance.set(instanceId, { ...visible, subPanelId: targetSubPanelId });
        return;
      }
      const lane = Math.min(laneCount - 1, Math.max(0, visible.lane ?? 0));
      const itemKey = visible.group ? `group:${visible.group.id}` : `widget:${instanceId}`;
      const laneItemKey = `${lane}:${itemKey}`;
      if (!orderByItem.has(laneItemKey)) {
        orderByItem.set(laneItemKey, nextOrderByLane[lane]!);
        nextOrderByLane[lane]! += 1;
      }
      projectedByInstance.set(instanceId, {
        ...visible,
        subPanelId: targetSubPanelId,
        lane,
        regionId: `column-${lane + 1}`,
        order: orderByItem.get(laneItemKey)!
      });
    });

  const placements = Object.fromEntries(entries.map(({ instanceId, placement }) => [
    instanceId,
    projectedByInstance.has(instanceId)
      ? replaceVisiblePlacement(placement, projectedByInstance.get(instanceId)!)
      : placement
  ]));
  return acceptLayout({ ...state, revision: nextRevision(state), placements });
}

function flattenPlacement(placement: WidgetPlacement, subPanelId: SubPanelId): WidgetPlacement {
  const visible = visiblePlacement(placement);
  if (visible.subPanelId !== subPanelId) return placement;
  if (visible.kind === 'floating') {
    const { subPanelId: _subPanelId, ...flattened } = visible;
    return replaceVisiblePlacement(placement, flattened);
  }
  const { subPanelId: _subPanelId, lane: _lane, ...flattened } = visible;
  return replaceVisiblePlacement(placement, {
    ...flattened,
    regionId: `column-${(visible.lane ?? 0) + 1}`
  });
}

export function deleteSubPanel(
  state: WorkbenchState,
  panelId: PanelId,
  subPanelId: SubPanelId
): LayoutResult {
  const panelIndex = state.panels.findIndex((candidate) => candidate.id === panelId);
  if (panelIndex < 0) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  const panel = state.panels[panelIndex]!;
  const ordered = panel.subPanels
    ? [...panel.subPanels].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    : [];
  const removedIndex = ordered.findIndex((candidate) => candidate.id === subPanelId);
  if (removedIndex < 0) {
    return rejectLayout(state, 'INVALID_INDEX', `Sub-panel '${subPanelId}' does not exist.`, { panelId, subPanelId });
  }

  if (ordered.length === 1) {
    const { activeSubPanelId: _activeSubPanelId, subPanels: _subPanels, ...flatPanel } = panel;
    const panels = [...state.panels];
    panels[panelIndex] = flatPanel;
    const placements = Object.fromEntries(Object.entries(state.placements).map(([instanceId, placement]) => [
      instanceId,
      flattenPlacement(placement, subPanelId)
    ]));
    return acceptLayout({ ...state, revision: nextRevision(state), panels, placements });
  }

  ordered.splice(removedIndex, 1);
  const widgets = { ...state.widgets };
  const placements = { ...state.placements };
  for (const [instanceId, placement] of Object.entries(state.placements)) {
    const visible = visiblePlacement(placement);
    if (visible.panelId === panelId && visible.subPanelId === subPanelId) {
      delete widgets[instanceId];
      delete placements[instanceId];
    }
  }

  const panels = [...state.panels];
  if (ordered.length === 1) {
    const remaining = ordered[0]!;
    const { activeSubPanelId: _activeSubPanelId, subPanels: _subPanels, ...flatPanel } = panel;
    panels[panelIndex] = flatPanel;
    for (const [instanceId, placement] of Object.entries(placements)) {
      placements[instanceId] = flattenPlacement(placement, remaining.id);
    }
  } else {
    const normalized = ordered.map((candidate, order) => ({ ...candidate, order }));
    const adjacent = normalized[Math.min(removedIndex, normalized.length - 1)]!;
    panels[panelIndex] = {
      ...panel,
      activeSubPanelId: adjacent.hidden
        ? normalized.find((candidate) => !candidate.hidden)?.id ?? adjacent.id
        : adjacent.id,
      subPanels: normalized
    };
  }
  return acceptLayout({ ...state, revision: nextRevision(state), panels, widgets, placements });
}

function laneFor(placement: DockedPlacement, layoutId: SubPanelLayoutId): number {
  const match = /^column-(\d+)$/.exec(placement.regionId);
  const requested = match ? Number(match[1]) - 1 : 0;
  return Math.min(SUB_PANEL_LAYOUTS[layoutId].columns.length - 1, Math.max(0, requested));
}

function assignOwner(
  placement: VisibleWidgetPlacement,
  subPanelId: SubPanelId,
  layoutId: SubPanelLayoutId
): VisibleWidgetPlacement {
  return placement.kind === 'docked'
    ? { ...placement, subPanelId, lane: laneFor(placement, layoutId) }
    : { ...placement, subPanelId };
}

function assignPlacementOwner(
  placement: WidgetPlacement,
  subPanelId: SubPanelId,
  layoutId: SubPanelLayoutId
): WidgetPlacement {
  return placement.kind === 'shelved'
    ? { ...placement, lastVisible: assignOwner(placement.lastVisible, subPanelId, layoutId) }
    : assignOwner(placement, subPanelId, layoutId);
}

export function createSubPanel(
  state: WorkbenchState,
  panelId: PanelId,
  subPanel: SubPanelState,
  overview?: SubPanelState
): LayoutResult {
  const panelIndex = state.panels.findIndex((candidate) => candidate.id === panelId);
  if (panelIndex < 0) {
    return rejectLayout(state, 'MISSING_PANEL', `Panel '${panelId}' does not exist.`, { panelId });
  }
  const parsedSubPanel = SubPanelStateSchema.safeParse(subPanel);
  const parsedOverview = overview === undefined ? null : SubPanelStateSchema.safeParse(overview);
  if (!parsedSubPanel.success || (parsedOverview && !parsedOverview.success)) {
    return rejectLayout(state, 'INVALID_INDEX', 'Sub-panel data is structurally invalid.');
  }
  const panel = state.panels[panelIndex]!;
  if (panel.subPanels) {
    if (overview !== undefined) {
      return rejectLayout(state, 'INVALID_INDEX', 'Overview is only valid during first sub-panel creation.');
    }
    if (panel.subPanels.some((candidate) => candidate.id === parsedSubPanel.data.id)) {
      return rejectLayout(state, 'DUPLICATE_ID', `Sub-panel '${parsedSubPanel.data.id}' already exists.`);
    }
    const panels = [...state.panels];
    panels[panelIndex] = {
      ...panel,
      activeSubPanelId: parsedSubPanel.data.id,
      subPanels: [
        ...panel.subPanels.map((candidate, order) => ({ ...candidate, order })),
        { ...exactSubPanel(parsedSubPanel.data), order: panel.subPanels.length }
      ]
    };
    return acceptLayout({ ...state, revision: nextRevision(state), panels });
  }
  if (!parsedOverview?.success) {
    return rejectLayout(state, 'INVALID_INDEX', 'First sub-panel creation requires a lossless Overview definition.');
  }
  if (parsedOverview.data.id === parsedSubPanel.data.id) {
    return rejectLayout(state, 'DUPLICATE_ID', `Sub-panel '${parsedSubPanel.data.id}' already exists.`);
  }

  const panels = [...state.panels];
  panels[panelIndex] = {
    ...panel,
    activeSubPanelId: parsedSubPanel.data.id,
    subPanels: [exactSubPanel(parsedOverview.data), exactSubPanel(parsedSubPanel.data)]
  };
  const placements = Object.fromEntries(Object.entries(state.placements).map(([instanceId, placement]) => [
    instanceId,
    placement.panelId === panelId
      ? assignPlacementOwner(placement, parsedOverview.data.id, parsedOverview.data.layoutId)
      : placement
  ]));

  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    panels,
    placements
  });
}
