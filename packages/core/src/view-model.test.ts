import { describe, expect, it } from 'vitest';

import {
  asPanelId,
  asSubPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import {
  createWidgetActions,
  createWidgetRegistry,
  createWorkbenchStore,
  selectPanelSurface,
  selectPanelTabs,
  selectSubPanelTabs
} from './index.js';

const scenePanel = asPanelId('scene');
const libraryPanel = asPanelId('library');
const overviewSubPanel = asSubPanelId('scene-overview');
const notesSubPanel = asSubPanelId('scene-notes');

function state(): WorkbenchState {
  return {
    schema: 'pomegranate.ui.state.v2',
    revision: 0,
    activePanelId: scenePanel,
    panels: [
      { id: scenePanel, name: 'Scene', templateId: 'story-stage.v1', order: 1 },
      { id: libraryPanel, name: 'Library', templateId: 'columns.v1', order: 0 }
    ],
    shelves: [
      { id: 'primary', panelId: scenePanel, regionId: 'left', order: 0, weight: 1 },
      { id: 'primary', panelId: scenePanel, regionId: 'stage', order: 0, weight: 1 }
    ],
    widgets: {},
    placements: {}
  };
}

describe('framework-neutral view projections', () => {
  it('projects sibling tabs and only the active sub-panel Widget owner', () => {
    const registry = createWidgetRegistry();
    const overviewWidget = asWidgetInstanceId('overview-widget');
    const notesWidget = asWidgetInstanceId('notes-widget');
    const overviewShelfWidget = asWidgetInstanceId('overview-shelf-widget');
    const withSubPanels: WorkbenchState = {
      ...state(),
      panels: state().panels.map((panel) => panel.id === scenePanel
        ? {
            ...panel,
            activeSubPanelId: overviewSubPanel,
            subPanels: [
              { id: overviewSubPanel, name: 'Overview', layoutId: 'single' as const, order: 1, scrollTop: 120 },
              { id: notesSubPanel, name: 'Notes', layoutId: 'two-equal' as const, order: 0, scrollTop: 20 }
            ]
          }
        : panel),
      widgets: Object.fromEntries([overviewWidget, notesWidget, overviewShelfWidget].map((id) => [id, {
        id,
        type: asWidgetType('story.summary'),
        manifestVersion: '1.0.0',
        configuration: {}
      }])),
      placements: {
        [overviewWidget]: {
          kind: 'docked', panelId: scenePanel, subPanelId: overviewSubPanel, lane: 0,
          regionId: 'left', shelfId: 'primary', order: 0
        },
        [notesWidget]: {
          kind: 'docked', panelId: scenePanel, subPanelId: notesSubPanel, lane: 0,
          regionId: 'left', shelfId: 'primary', order: 0
        },
        [overviewShelfWidget]: {
          kind: 'shelved',
          panelId: scenePanel,
          lastVisible: {
            kind: 'docked', panelId: scenePanel, subPanelId: overviewSubPanel, lane: 0,
            regionId: 'left', shelfId: 'primary', order: 1
          }
        }
      }
    };

    expect(selectSubPanelTabs(withSubPanels, scenePanel)).toEqual([
      expect.objectContaining({ subPanelId: notesSubPanel, name: 'Notes', selected: false }),
      expect.objectContaining({ subPanelId: overviewSubPanel, name: 'Overview', selected: true })
    ]);
    const surface = selectPanelSurface(withSubPanels, registry);
    expect(surface?.activeSubPanelId).toBe(overviewSubPanel);
    expect(surface?.regions[0]?.shelves[0]?.frames.map((frame) => frame.instanceId)).toEqual([overviewWidget]);
    expect(surface?.widgetShelf.map((frame) => frame.instanceId)).toEqual([overviewShelfWidget]);
    expect(surface?.floating).toEqual([]);
  });

  it('preserves the exact sub-panel owner through public dock and float actions', () => {
    const targetId = asWidgetInstanceId('sub-panel-target');
    const initial: WorkbenchState = {
      ...state(),
      panels: state().panels.map((panel) => panel.id === scenePanel
        ? {
            ...panel,
            activeSubPanelId: overviewSubPanel,
            subPanels: [
              { id: overviewSubPanel, name: 'Overview', layoutId: 'two-equal' as const, order: 0, scrollTop: 0 },
              { id: notesSubPanel, name: 'Notes', layoutId: 'single' as const, order: 1, scrollTop: 0 }
            ]
          }
        : panel),
      widgets: {
        [targetId]: { id: targetId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} }
      },
      placements: {
        [targetId]: {
          kind: 'docked', panelId: scenePanel, subPanelId: overviewSubPanel, lane: 1,
          regionId: 'stage', shelfId: 'primary', order: 0
        }
      }
    };
    const store = createWorkbenchStore({ initialState: initial });

    expect(createWidgetActions(store, targetId).dock('left').ok).toBe(true);
    expect(store.getState().placements[targetId]).toMatchObject({ subPanelId: overviewSubPanel, lane: 1 });
    expect(createWidgetActions(store, targetId).float().ok).toBe(true);
    expect(store.getState().placements[targetId]).toMatchObject({ kind: 'floating', subPanelId: overviewSubPanel });
  });

  it('maps dock actions to the active sub-panel lanes in a columns Panel', () => {
    const targetId = asWidgetInstanceId('settings-target');
    const settingsSubPanel = asSubPanelId('settings-account');
    const initial: WorkbenchState = {
      ...state(),
      activePanelId: libraryPanel,
      panels: state().panels.map((panel) => panel.id === libraryPanel
        ? {
            ...panel,
            activeSubPanelId: settingsSubPanel,
            subPanels: [
              { id: settingsSubPanel, name: 'Account', layoutId: 'two-equal' as const, order: 0, scrollTop: 0 }
            ]
          }
        : panel),
      shelves: [
        ...state().shelves,
        { id: 'primary', panelId: libraryPanel, regionId: 'column-1', order: 0, weight: 1 },
        { id: 'primary', panelId: libraryPanel, regionId: 'column-2', order: 0, weight: 1 }
      ],
      widgets: {
        [targetId]: { id: targetId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} }
      },
      placements: {
        [targetId]: {
          kind: 'docked', panelId: libraryPanel, subPanelId: settingsSubPanel, lane: 1,
          regionId: 'column-2', shelfId: 'primary', order: 0
        }
      }
    };
    const store = createWorkbenchStore({ initialState: initial });

    expect(createWidgetActions(store, targetId).dock('left').ok).toBe(true);
    expect(store.getState().placements[targetId]).toMatchObject({
      subPanelId: settingsSubPanel, lane: 0, regionId: 'column-1'
    });
    expect(createWidgetActions(store, targetId).dock('right').ok).toBe(true);
    expect(store.getState().placements[targetId]).toMatchObject({
      subPanelId: settingsSubPanel, lane: 1, regionId: 'column-2'
    });
  });

  it('projects sorted Panel tabs with stable relationships and reorder limits', () => {
    expect(selectPanelTabs(state())).toEqual([
      {
        panelId: libraryPanel,
        panelIdAttribute: 'library',
        name: 'Library',
        tabId: 'pomegranate-panel-tab-library',
        surfaceId: 'pomegranate-panel-library',
        selected: false,
        moveLeftDisabled: true,
        moveRightDisabled: false
      },
      {
        panelId: scenePanel,
        panelIdAttribute: 'scene',
        name: 'Scene',
        tabId: 'pomegranate-panel-tab-scene',
        surfaceId: 'pomegranate-panel-scene',
        selected: true,
        moveLeftDisabled: false,
        moveRightDisabled: true
      }
    ]);
  });

  it('encodes public Panel identities into stable relationship ids', () => {
    const unusualPanel = asPanelId('research/%');
    const projection = selectPanelTabs({
      ...state(),
      activePanelId: unusualPanel,
      panels: [{ id: unusualPanel, name: 'Research', templateId: 'columns.v1', order: 0 }]
    })[0];

    expect(projection).toMatchObject({
      panelIdAttribute: 'research/%',
      tabId: 'pomegranate-panel-tab-research_2F_25',
      surfaceId: 'pomegranate-panel-research_2F_25'
    });
  });

  it('keeps encoded Panel relationship ids injective when an id resembles an escape', () => {
    const slashPanel = asPanelId('a/b');
    const escapeLikePanel = asPanelId('a_2Fb');
    const projections = selectPanelTabs({
      ...state(),
      activePanelId: slashPanel,
      panels: [
        { id: slashPanel, name: 'Slash', templateId: 'columns.v1', order: 0 },
        { id: escapeLikePanel, name: 'Escape-like', templateId: 'columns.v1', order: 1 }
      ]
    });

    expect(projections.map((projection) => projection.tabId)).toEqual([
      'pomegranate-panel-tab-a_2Fb',
      'pomegranate-panel-tab-a_5F2Fb'
    ]);
    expect(new Set(projections.flatMap((projection) => [projection.tabId, projection.surfaceId])).size).toBe(4);
  });

  it('projects deterministic docks, floating order, and missing-manifest titles', () => {
    const registry = createWidgetRegistry();
    registry.register({
      type: asWidgetType('story.summary'),
      version: '1.0.0',
      title: 'Story Summary',
      capabilities: [],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' }
    });
    const summaryId = asWidgetInstanceId('summary');
    const notesId = asWidgetInstanceId('notes');
    const missingId = asWidgetInstanceId('missing');
    const floatingId = asWidgetInstanceId('floating');
    const surface = selectPanelSurface({
      ...state(),
      widgets: {
        [summaryId]: { id: summaryId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} },
        [notesId]: { id: notesId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} },
        [missingId]: { id: missingId, type: asWidgetType('missing.renderer'), manifestVersion: '1.0.0', configuration: {} },
        [floatingId]: { id: floatingId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} }
      },
      placements: {
        [summaryId]: { kind: 'docked', panelId: scenePanel, regionId: 'left', shelfId: 'primary', order: 1 },
        [notesId]: { kind: 'docked', panelId: scenePanel, regionId: 'left', shelfId: 'primary', order: 0 },
        [missingId]: { kind: 'docked', panelId: scenePanel, regionId: 'stage', shelfId: 'primary', order: 0 },
        [floatingId]: { kind: 'floating', panelId: scenePanel, x: 24, y: 28, width: 360, height: 240, z: 2 }
      }
    }, registry);

    expect(surface?.docks.left.map((entry) => entry.instanceId)).toEqual([notesId, summaryId]);
    expect(surface?.docks.main[0]).toMatchObject({ instanceId: missingId, title: 'missing.renderer' });
    expect(surface?.docks.right).toEqual([]);
    expect(surface?.floating.map((entry) => entry.instanceId)).toEqual([floatingId]);
    expect(surface?.regions.map((region) => region.region.id)).toEqual(['left', 'stage', 'composer', 'right']);
    expect(surface?.regions.find((region) => region.region.id === 'left')?.shelves[0]?.frames.map((frame) => frame.instanceId)).toEqual([notesId, summaryId]);
    expect(surface?.unavailableTemplateId).toBeNull();
    expect(surface).toMatchObject({
      panelId: scenePanel,
      tabId: 'pomegranate-panel-tab-scene',
      surfaceId: 'pomegranate-panel-scene'
    });
    expect(Object.isFrozen(surface?.docks.left)).toBe(true);
  });

  it('projects custom column weights with authored defaults kept for reset', () => {
    const surface = selectPanelSurface({
      ...state(),
      activePanelId: libraryPanel,
      panels: state().panels.map((panel) => panel.id === libraryPanel
        ? {
            ...panel,
            activeSubPanelId: notesSubPanel,
            subPanels: [{
              id: notesSubPanel,
              name: 'Appearance',
              layoutId: 'three-equal' as const,
              order: 0,
              scrollTop: 0,
              columnWeights: [0.2, 0.5, 0.3]
            }]
          }
        : panel)
    }, createWidgetRegistry());

    expect(surface?.columnWeights).toEqual([0.2, 0.5, 0.3]);
    expect(surface?.defaultColumnWeights).toEqual([1 / 3, 1 / 3, 1 / 3]);
    expect(surface?.regions.map(({ laneWeight }) => laneWeight)).toEqual([0.2, 0.5, 0.3]);
  });

  it('appends a Widget to an occupied dock through the public store', () => {
    const registry = createWidgetRegistry();
    registry.register({
      type: asWidgetType('story.summary'),
      version: '1.0.0',
      title: 'Story Summary',
      capabilities: [],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' }
    });
    const firstId = asWidgetInstanceId('first');
    const targetId = asWidgetInstanceId('target');
    const store = createWorkbenchStore({
      registry,
      initialState: {
        ...state(),
        widgets: {
          [firstId]: { id: firstId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} },
          [targetId]: { id: targetId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} }
        },
        placements: {
          [firstId]: { kind: 'docked', panelId: scenePanel, regionId: 'left', shelfId: 'primary', order: 0 },
          [targetId]: { kind: 'docked', panelId: scenePanel, regionId: 'stage', shelfId: 'primary', order: 0 }
        }
      }
    });

    const result = createWidgetActions(store, targetId).dock('left');
    expect(result.ok).toBe(true);
    expect(store.getState().placements[targetId]).toEqual({
      kind: 'docked', panelId: scenePanel, regionId: 'left', shelfId: 'primary', order: 1
    });
  });

  it('floats a docked Widget above the current floating stack', () => {
    const registry = createWidgetRegistry();
    registry.register({
      type: asWidgetType('story.summary'),
      version: '1.0.0',
      title: 'Story Summary',
      capabilities: [],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' }
    });
    const targetId = asWidgetInstanceId('target');
    const existingId = asWidgetInstanceId('existing-float');
    const store = createWorkbenchStore({
      registry,
      initialState: {
        ...state(),
        widgets: {
          [targetId]: { id: targetId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} },
          [existingId]: { id: existingId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} }
        },
        placements: {
          [targetId]: { kind: 'docked', panelId: scenePanel, regionId: 'left', shelfId: 'primary', order: 0 },
          [existingId]: { kind: 'floating', panelId: scenePanel, x: 10, y: 12, width: 300, height: 180, z: 4 }
        }
      }
    });

    const result = createWidgetActions(store, targetId).float();
    expect(result.ok).toBe(true);
    expect(store.getState().placements[targetId]).toEqual({
      kind: 'floating', panelId: scenePanel, x: 24, y: 24, width: 360, height: 240, z: 5
    });
  });

  it('groups a docked Widget with its previous shelf sibling', () => {
    const registry = createWidgetRegistry();
    registry.register({
      type: asWidgetType('story.summary'),
      version: '1.0.0',
      title: 'Story Summary',
      capabilities: [],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' }
    });
    const firstId = asWidgetInstanceId('first');
    const secondId = asWidgetInstanceId('second');
    const store = createWorkbenchStore({
      registry,
      initialState: {
        ...state(),
        widgets: {
          [firstId]: { id: firstId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} },
          [secondId]: { id: secondId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} }
        },
        placements: {
          [firstId]: { kind: 'docked', panelId: scenePanel, regionId: 'left', shelfId: 'primary', order: 0 },
          [secondId]: { kind: 'docked', panelId: scenePanel, regionId: 'left', shelfId: 'primary', order: 1 }
        }
      }
    });

    const result = createWidgetActions(store, secondId).groupWithPrevious();
    expect(result.ok).toBe(true);
    expect(store.getState().placements[firstId]).toMatchObject({ group: { id: 'group-first', order: 0, active: false } });
    expect(store.getState().placements[secondId]).toMatchObject({ group: { id: 'group-first', order: 1, active: true } });
  });

  it('removes the owned Widget through the public store', () => {
    const registry = createWidgetRegistry();
    registry.register({
      type: asWidgetType('story.summary'),
      version: '1.0.0',
      title: 'Story Summary',
      capabilities: [],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' }
    });
    const targetId = asWidgetInstanceId('target');
    const store = createWorkbenchStore({
      registry,
      initialState: {
        ...state(),
        widgets: {
          [targetId]: { id: targetId, type: asWidgetType('story.summary'), manifestVersion: '1.0.0', configuration: {} }
        },
        placements: {
          [targetId]: { kind: 'docked', panelId: scenePanel, regionId: 'left', shelfId: 'primary', order: 0 }
        }
      }
    });

    const result = createWidgetActions(store, targetId).remove();
    expect(result.ok).toBe(true);
    expect(store.getState().widgets[targetId]).toBeUndefined();
    expect(store.getState().placements[targetId]).toBeUndefined();
  });
});
