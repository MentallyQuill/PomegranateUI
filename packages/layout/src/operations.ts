import {
  PanelStateSchema,
  WidgetInstanceSchema,
  WidgetPlacementSchema,
  type PanelId,
  type PanelState,
  type WidgetInstance,
  type WidgetInstanceId,
  type WidgetPlacement,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import { acceptLayout, rejectLayout, type LayoutFailure, type LayoutResult } from './errors.js';
import { nextRevision, normalizeDockOrders, normalizePanels } from './state.js';

function hasPanel(state: WorkbenchState, panelId: PanelId): boolean {
  return state.panels.some((panel) => panel.id === panelId);
}

function validatePlacement(
  state: WorkbenchState,
  placement: WidgetPlacement
): { readonly ok: true; readonly placement: WidgetPlacement } | LayoutFailure {
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
  return { ok: true, placement: parsed.data as WidgetPlacement };
}

function placeInRecord(
  placements: Readonly<Record<string, WidgetPlacement>>,
  instanceId: WidgetInstanceId,
  placement: WidgetPlacement
): Readonly<Record<string, WidgetPlacement>> {
  const withoutCurrent = { ...placements };
  delete withoutCurrent[instanceId];
  const normalized = normalizeDockOrders(withoutCurrent);

  if (placement.kind === 'floating') {
    return { ...normalized, [instanceId]: placement };
  }

  const order = Object.values(normalized).filter((candidate) => (
    candidate.kind === 'docked'
      && candidate.panelId === placement.panelId
      && candidate.edge === placement.edge
      && candidate.shelfId === placement.shelfId
  )).length;
  return {
    ...normalized,
    [instanceId]: { ...placement, order }
  };
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
  placement: WidgetPlacement
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
  const validatedPlacement = validatePlacement(state, placement);
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
  placement: WidgetPlacement
): LayoutResult {
  if (!state.widgets[instanceId]) {
    return rejectLayout(
      state,
      'MISSING_WIDGET',
      `Widget instance '${instanceId}' does not exist.`,
      { instanceId }
    );
  }
  const validatedPlacement = validatePlacement(state, placement);
  if (!validatedPlacement.ok) return validatedPlacement;

  return acceptLayout({
    ...state,
    revision: nextRevision(state),
    placements: placeInRecord(state.placements, instanceId, validatedPlacement.placement)
  });
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
    placements: normalizeDockOrders(placements)
  });
}
