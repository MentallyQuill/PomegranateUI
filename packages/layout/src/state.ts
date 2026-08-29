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
    widgets: {},
    placements: {}
  };
}

export function normalizePanels(panels: readonly PanelState[]): readonly PanelState[] {
  return panels.map((panel, order) => ({ ...panel, order }));
}

function dockKey(placement: DockedPlacement): string {
  return `${placement.panelId}\u0000${placement.edge}\u0000${placement.shelfId}`;
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
    const key = `${placement.panelId}\u0000${placement.group.id}`;
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
