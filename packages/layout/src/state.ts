import {
  WORKBENCH_STATE_SCHEMA,
  type DockedPlacement,
  type PanelState,
  type WidgetPlacement,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

export function createInitialWorkbenchState(): WorkbenchState {
  return {
    schema: WORKBENCH_STATE_SCHEMA,
    revision: 0,
    activePanelId: null,
    panels: [],
    shelves: [],
    widgets: {},
    placements: {}
  };
}

export function normalizePanels(panels: readonly PanelState[]): readonly PanelState[] {
  return panels.map((panel, order) => ({ ...panel, order }));
}

export function normalizeColumnWeights(weights: readonly number[]): readonly number[] | null {
  if (weights.length < 1 || weights.length > 6 || weights.some((weight) => !Number.isFinite(weight) || weight <= 0)) {
    return null;
  }
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!Number.isFinite(total) || total <= 0) return null;
  const normalized = weights.map((weight) => weight / total);
  if (normalized.some((weight) => weight < 0.05)) return null;
  return Object.freeze(normalized);
}

function dockKey(placement: DockedPlacement): string {
  return `${placement.panelId}\u0000${placement.subPanelId ?? ''}\u0000${placement.lane ?? ''}\u0000${placement.regionId}\u0000${placement.shelfId}`;
}

export function normalizeShelves(shelves: readonly import('@pomegranate-ui/contracts').ShelfState[]): readonly import('@pomegranate-ui/contracts').ShelfState[] {
  const byRegion = new Map<string, import('@pomegranate-ui/contracts').ShelfState[]>();
  for (const shelf of shelves) {
    const key = `${shelf.panelId}\u0000${shelf.regionId}`;
    const group = byRegion.get(key) ?? [];
    group.push(shelf);
    byRegion.set(key, group);
  }
  const normalized: import('@pomegranate-ui/contracts').ShelfState[] = [];
  for (const group of byRegion.values()) {
    group.sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
    const sum = group.reduce((total, shelf) => total + shelf.weight, 0);
    group.forEach((shelf, order) => normalized.push({
      ...shelf,
      order,
      weight: sum > 0 ? shelf.weight / sum : 1 / group.length
    }));
  }
  return normalized.sort((left, right) => (
    left.panelId.localeCompare(right.panelId)
    || left.regionId.localeCompare(right.regionId)
    || left.order - right.order
  ));
}

export function normalizeDockOrders(
  placements: Readonly<Record<string, WidgetPlacement>>
): Readonly<Record<string, WidgetPlacement>> {
  const dockedGroups = new Map<string, Array<{ instanceId: string; placement: DockedPlacement; index: number }>>();
  const entries = Object.entries(placements);

  entries.forEach(([instanceId, placement], index) => {
    if (placement.kind !== 'docked') return;
    const key = dockKey(placement);
    const group = dockedGroups.get(key) ?? [];
    group.push({ instanceId, placement, index });
    dockedGroups.set(key, group);
  });

  const normalizedDocked = new Map<string, DockedPlacement>();
  for (const group of dockedGroups.values()) {
    group.sort((left, right) => left.placement.order - right.placement.order || left.index - right.index);
    group.forEach(({ instanceId, placement }, order) => {
      normalizedDocked.set(instanceId, { ...placement, order });
    });
  }

  return Object.fromEntries(entries.map(([instanceId, placement]) => [
    instanceId,
    normalizedDocked.get(instanceId) ?? placement
  ]));
}

export function normalizeTabGroups(
  placements: Readonly<Record<string, WidgetPlacement>>
): Readonly<Record<string, WidgetPlacement>> {
  const normalized = { ...placements };
  const groups = new Map<string, Array<{ instanceId: string; placement: DockedPlacement }>>();
  for (const [instanceId, placement] of Object.entries(placements)) {
    if (placement.kind !== 'docked' || !placement.group) continue;
    const key = `${placement.panelId}\u0000${placement.subPanelId ?? ''}\u0000${placement.group.id}`;
    const members = groups.get(key) ?? [];
    members.push({ instanceId, placement });
    groups.set(key, members);
  }

  for (const members of groups.values()) {
    if (members.length < 2) {
      const member = members[0];
      if (member) {
        const { group: _group, ...placement } = member.placement;
        normalized[member.instanceId] = placement;
      }
      continue;
    }
    members.sort((left, right) => (
      (left.placement.group?.order ?? 0) - (right.placement.group?.order ?? 0)
      || left.placement.order - right.placement.order
      || left.instanceId.localeCompare(right.instanceId)
    ));
    const activeId = members.find((member) => member.placement.group?.active)?.instanceId ?? members[0]!.instanceId;
    members.forEach(({ instanceId, placement }, order) => {
      normalized[instanceId] = {
        ...placement,
        group: { id: placement.group!.id, order, active: instanceId === activeId }
      };
    });
  }
  return normalized;
}

export function nextRevision(state: WorkbenchState): number {
  return state.revision + 1;
}
