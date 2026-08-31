import type {
  CommandResult,
  PanelEdge,
  PanelId,
  PanelRegionDefinition,
  ShelfState,
  SubPanelId,
  SubPanelLayoutId,
  WidgetInstance,
  WidgetInstanceId,
  WidgetManifest,
  WidgetPlacement,
  WorkbenchState
} from '@pomegranate-ui/contracts';

import type { WidgetRegistry } from './registry.js';
import type { WorkbenchStore } from './store.js';
import { createPanelTemplateRegistry, SUB_PANEL_LAYOUTS, type PanelTemplateRegistry } from '@pomegranate-ui/layout';

export interface PanelTabProjection {
  readonly panelId: PanelId;
  readonly panelIdAttribute: string;
  readonly name: string;
  readonly tabId: string;
  readonly surfaceId: string;
  readonly selected: boolean;
  readonly moveLeftDisabled: boolean;
  readonly moveRightDisabled: boolean;
}

export interface WidgetFrameProjection {
  readonly instanceId: WidgetInstanceId;
  readonly instanceIdAttribute: string;
  readonly title: string;
  readonly instance: WidgetInstance;
  readonly manifest: WidgetManifest | undefined;
  readonly placement: WidgetPlacement;
}

export interface SubPanelTabProjection {
  readonly panelId: PanelId;
  readonly subPanelId: SubPanelId;
  readonly subPanelIdAttribute: string;
  readonly name: string;
  readonly tabId: string;
  readonly surfaceId: string;
  readonly layoutId: SubPanelLayoutId;
  readonly scrollTop: number;
  readonly selected: boolean;
  readonly moveLeftDisabled: boolean;
  readonly moveRightDisabled: boolean;
}

export interface PanelSurfaceProjection {
  readonly panelId: PanelId;
  readonly activeSubPanelId: SubPanelId | null;
  readonly activeSubPanelLayoutId: SubPanelLayoutId | null;
  readonly activeSubPanelScrollTop: number;
  readonly tabId: string;
  readonly surfaceId: string;
  readonly docks: Readonly<Record<'left' | 'main' | 'right', readonly WidgetFrameProjection[]>>;
  readonly regions: readonly PanelRegionProjection[];
  readonly templateFamily: 'story-stage' | 'focus-support' | 'columns' | null;
  readonly unavailableTemplateId: string | null;
  readonly widgetShelf: readonly WidgetFrameProjection[];
  readonly floating: readonly WidgetFrameProjection[];
}

export interface PanelShelfProjection {
  readonly shelf: ShelfState;
  readonly frames: readonly WidgetFrameProjection[];
}

export interface PanelRegionProjection {
  readonly region: PanelRegionDefinition;
  readonly lane: number;
  readonly laneWeight: number;
  readonly shelves: readonly PanelShelfProjection[];
}

export interface WidgetActions {
  dock(edge: PanelEdge): CommandResult;
  float(): CommandResult;
  groupWithPrevious(): CommandResult;
  shelve(): CommandResult;
  remove(): CommandResult;
}

function panelDomSuffix(panelId: PanelId): string {
  return encodeURIComponent(panelId).replaceAll('_', '_5F').replaceAll('%', '_');
}

export function selectPanelTabs(state: WorkbenchState): readonly PanelTabProjection[] {
  const panels = [...state.panels].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  return Object.freeze(panels.map((panel, index) => {
    const suffix = panelDomSuffix(panel.id);
    return Object.freeze({
      panelId: panel.id,
      panelIdAttribute: panel.id,
      name: panel.name,
      tabId: `pomegranate-panel-tab-${suffix}`,
      surfaceId: `pomegranate-panel-${suffix}`,
      selected: panel.id === state.activePanelId,
      moveLeftDisabled: index === 0,
      moveRightDisabled: index === panels.length - 1
    });
  }));
}

export function selectSubPanelTabs(
  state: WorkbenchState,
  panelId: PanelId | null = state.activePanelId
): readonly SubPanelTabProjection[] {
  const panel = state.panels.find((candidate) => candidate.id === panelId);
  if (!panel?.subPanels || !panel.activeSubPanelId) return Object.freeze([]);
  const ordered = [...panel.subPanels]
    .filter((subPanel) => !subPanel.hidden)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  const panelSuffix = panelDomSuffix(panel.id);
  return Object.freeze(ordered.map((subPanel, index) => {
    const suffix = panelDomSuffix(subPanel.id as unknown as PanelId);
    return Object.freeze({
      panelId: panel.id,
      subPanelId: subPanel.id,
      subPanelIdAttribute: subPanel.id,
      name: subPanel.name,
      tabId: `pomegranate-sub-panel-tab-${panelSuffix}-${suffix}`,
      surfaceId: `pomegranate-sub-panel-${panelSuffix}-${suffix}`,
      layoutId: subPanel.layoutId,
      scrollTop: subPanel.scrollTop,
      selected: subPanel.id === panel.activeSubPanelId,
      moveLeftDisabled: index === 0,
      moveRightDisabled: index === ordered.length - 1
    });
  }));
}

export function selectPanelSurface(
  state: WorkbenchState,
  registry: WidgetRegistry,
  templates: PanelTemplateRegistry = createPanelTemplateRegistry()
): PanelSurfaceProjection | null {
  const activePanel = state.panels.find((panel) => panel.id === state.activePanelId);
  if (!activePanel) return null;
  const activeSubPanel = activePanel.subPanels?.find((subPanel) => subPanel.id === activePanel.activeSubPanelId);

  const allFrames = Object.entries(state.placements)
    .filter(([, placement]) => placement.panelId === activePanel.id)
    .filter(([, placement]) => {
      const visible = placement.kind === 'shelved' ? placement.lastVisible : placement;
      return activeSubPanel
        ? visible.subPanelId === activeSubPanel.id
        : visible.subPanelId === undefined;
    })
    .flatMap(([instanceId, placement]) => {
      const instance = state.widgets[instanceId];
      if (!instance) return [];
      const manifest = registry.get(instance.type);
      return [Object.freeze({
        instanceId: instance.id,
        instanceIdAttribute: instance.id,
        title: manifest?.title ?? instance.type,
        instance,
        manifest,
        placement
      })];
    });
  const frames = allFrames.filter((frame) => frame.placement.kind !== 'shelved');
  const docked = (edge: 'left' | 'main' | 'right') => Object.freeze(frames
    .filter((frame) => frame.placement.kind === 'docked' && legacyDock(frame.placement.regionId) === edge)
    .sort((left, right) => {
      const leftOrder = left.placement.kind === 'docked' ? left.placement.order : 0;
      const rightOrder = right.placement.kind === 'docked' ? right.placement.order : 0;
      return leftOrder - rightOrder || left.instanceId.localeCompare(right.instanceId);
    }));
  const floating = Object.freeze(frames
    .filter((frame) => frame.placement.kind === 'floating')
    .sort((left, right) => {
      const leftZ = left.placement.kind === 'floating' ? left.placement.z : 0;
      const rightZ = right.placement.kind === 'floating' ? right.placement.z : 0;
      return leftZ - rightZ || left.instanceId.localeCompare(right.instanceId);
    }));
  const suffix = panelDomSuffix(activePanel.id);
  const template = templates.resolve(activePanel);
  const laneWeights = activeSubPanel ? SUB_PANEL_LAYOUTS[activeSubPanel.layoutId].columns : null;
  const projectedRegions = template.ok && laneWeights && template.template.family === 'columns'
    ? template.template.regions.slice(0, laneWeights.length)
    : template.ok
      ? template.template.regions
      : [];
  const regions = template.ok ? Object.freeze(projectedRegions.map((region, lane) => Object.freeze({
    region,
    lane,
    laneWeight: laneWeights?.[lane] ?? 1,
    shelves: Object.freeze(state.shelves
      .filter((shelf) => shelf.panelId === activePanel.id && shelf.regionId === region.id)
      .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
      .map((shelf) => Object.freeze({
        shelf,
        frames: Object.freeze(frames
          .filter((frame) => frame.placement.kind === 'docked'
            && frame.placement.regionId === region.id
            && frame.placement.shelfId === shelf.id)
          .sort((left, right) => {
            const leftOrder = left.placement.kind === 'docked' ? left.placement.order : 0;
            const rightOrder = right.placement.kind === 'docked' ? right.placement.order : 0;
            return leftOrder - rightOrder || left.instanceId.localeCompare(right.instanceId);
          }))
      })))
  }))) : Object.freeze([]);
  const widgetShelf = Object.freeze(allFrames
    .filter((frame) => frame.placement.kind === 'shelved')
    .sort((left, right) => left.title.localeCompare(right.title) || left.instanceId.localeCompare(right.instanceId)));

  return Object.freeze({
    panelId: activePanel.id,
    activeSubPanelId: activeSubPanel?.id ?? null,
    activeSubPanelLayoutId: activeSubPanel?.layoutId ?? null,
    activeSubPanelScrollTop: activeSubPanel?.scrollTop ?? 0,
    tabId: `pomegranate-panel-tab-${suffix}`,
    surfaceId: `pomegranate-panel-${suffix}`,
    docks: Object.freeze({ left: docked('left'), main: docked('main'), right: docked('right') }),
    regions,
    templateFamily: template.ok ? template.template.family : null,
    unavailableTemplateId: template.ok ? null : activePanel.templateId,
    widgetShelf,
    floating
  });
}

export function createWidgetActions(
  store: WorkbenchStore,
  instanceId: WidgetInstanceId
): WidgetActions {
  return Object.freeze({
    dock(edge: PanelEdge): CommandResult {
      const state = store.getState();
      const instance = state.widgets[instanceId];
      const current = state.placements[instanceId];
      const panelId = current?.panelId ?? state.activePanelId;
      if (!instance || !panelId) {
        return store.dispatch({ type: 'widget.place', instanceId, placement: null });
      }
      const manifest = store.registry.get(instance.type);
      const currentVisible = current?.kind === 'shelved' ? current.lastVisible : current;
      const panel = state.panels.find((candidate) => candidate.id === panelId);
      const subPanelId = currentVisible?.subPanelId ?? panel?.activeSubPanelId;
      const activeSubPanel = panel?.subPanels?.find((candidate) => candidate.id === subPanelId);
      const resolvedTemplate = panel ? store.templates.resolve(panel) : null;
      let lane = currentVisible?.kind === 'docked' ? currentVisible.lane ?? 0 : 0;
      let regionId = edge === 'main' ? 'stage' : edge;
      if (activeSubPanel && resolvedTemplate?.ok && resolvedTemplate.template.family === 'columns') {
        const laneCount = SUB_PANEL_LAYOUTS[activeSubPanel.layoutId].columns.length;
        lane = edge === 'left' ? 0 : edge === 'right' ? laneCount - 1 : Math.min(1, laneCount - 1);
        regionId = `column-${lane + 1}`;
      }
      const preferredShelfId = currentVisible?.kind === 'docked'
        ? currentVisible.shelfId
        : manifest?.defaultPlacement.kind === 'docked'
          ? manifest.defaultPlacement.shelfId
          : 'primary';
      const shelfId = state.shelves.find((shelf) => (
        shelf.panelId === panelId && shelf.regionId === regionId && shelf.id === preferredShelfId
      ))?.id ?? state.shelves.find((shelf) => (
        shelf.panelId === panelId && shelf.regionId === regionId
      ))?.id ?? preferredShelfId;
      return store.dispatch({
        type: 'widget.place',
        instanceId,
        placement: {
          kind: 'docked',
          panelId,
          ...(subPanelId === undefined ? {} : { subPanelId, lane }),
          regionId,
          shelfId,
          order: Number.MAX_SAFE_INTEGER
        }
      });
    },
    float(): CommandResult {
      const state = store.getState();
      const instance = state.widgets[instanceId];
      const current = state.placements[instanceId];
      const panelId = current?.panelId ?? state.activePanelId;
      if (!instance || !panelId) {
        return store.dispatch({ type: 'widget.place', instanceId, placement: null });
      }
      if (current?.kind === 'floating') {
        return store.dispatch({ type: 'widget.place', instanceId, placement: current });
      }
      const nextZ = Math.max(0, ...Object.values(state.placements).map((placement) => (
        placement.kind === 'floating' ? placement.z : 0
      ))) + 1;
      const manifest = store.registry.get(instance.type);
      const currentVisible = current?.kind === 'shelved' ? current.lastVisible : current;
      const panel = state.panels.find((candidate) => candidate.id === panelId);
      const subPanelId = currentVisible?.subPanelId ?? panel?.activeSubPanelId;
      const defaults = manifest?.defaultPlacement.kind === 'floating'
        ? manifest.defaultPlacement
        : { width: 360, height: 240 };
      return store.dispatch({
        type: 'widget.place',
        instanceId,
        placement: {
          kind: 'floating',
          panelId,
          ...(subPanelId === undefined ? {} : { subPanelId }),
          x: 24,
          y: 24,
          width: defaults.width,
          height: defaults.height,
          z: nextZ
        }
      });
    },
    groupWithPrevious(): CommandResult {
      const state = store.getState();
      const current = state.placements[instanceId];
      if (current?.kind !== 'docked') {
        return store.dispatch({ type: 'widget.group', instanceId, targetInstanceId: instanceId, groupId: '' });
      }
      const previous = Object.entries(state.placements)
        .filter(([id, placement]) => id !== instanceId
          && placement.kind === 'docked'
          && placement.panelId === current.panelId
          && placement.subPanelId === current.subPanelId
          && placement.lane === current.lane
          && placement.regionId === current.regionId
          && placement.shelfId === current.shelfId
          && placement.order < current.order)
        .sort(([, left], [, right]) => (
          left.kind === 'docked' && right.kind === 'docked' ? right.order - left.order : 0
        ))[0];
      const target = previous ? state.widgets[previous[0]] : undefined;
      if (!target) {
        return store.dispatch({ type: 'widget.group', instanceId, targetInstanceId: instanceId, groupId: '' });
      }
      const targetPlacement = state.placements[target.id];
      const groupId = targetPlacement?.kind === 'docked' && targetPlacement.group
        ? targetPlacement.group.id
        : `group-${target.id}`;
      return store.dispatch({
        type: 'widget.group',
        instanceId,
        targetInstanceId: target.id,
        groupId
      });
    },
    shelve(): CommandResult {
      return store.dispatch({ type: 'widget.shelve', instanceId });
    },
    remove(): CommandResult {
      return store.dispatch({ type: 'widget.remove', instanceId });
    }
  });
}

function legacyDock(regionId: string): 'left' | 'main' | 'right' {
  if (regionId === 'left' || regionId === 'focus' || regionId === 'column-1') return 'left';
  if (regionId === 'right' || regionId === 'support' || regionId === 'column-6') return 'right';
  return 'main';
}
