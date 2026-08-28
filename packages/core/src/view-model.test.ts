import { describe, expect, it } from 'vitest';

import {
  asPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import {
  createWidgetActions,
  createWidgetRegistry,
  createWorkbenchStore,
  selectPanelSurface,
  selectPanelTabs
} from './index.js';

const scenePanel = asPanelId('scene');
const libraryPanel = asPanelId('library');

function state(): WorkbenchState {
  return {
    schema: 'pomegranate.ui.state.v1',
    revision: 0,
    activePanelId: scenePanel,
    panels: [
      { id: scenePanel, name: 'Scene', templateId: 'story-stage.v1', order: 1 },
      { id: libraryPanel, name: 'Library', templateId: 'columns.v1', order: 0 }
    ],
    widgets: {},
    placements: {}
  };
}

describe('framework-neutral view projections', () => {
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

  it('projects deterministic docks, floating order, and missing-manifest titles', () => {
    const registry = createWidgetRegistry();
    registry.register({
      type: asWidgetType('story.summary'),
      version: '1.0.0',
      title: 'Story Summary',
      capabilities: [],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', edge: 'left', shelfId: 'primary' }
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
        [summaryId]: { kind: 'docked', panelId: scenePanel, edge: 'left', shelfId: 'primary', order: 1 },
        [notesId]: { kind: 'docked', panelId: scenePanel, edge: 'left', shelfId: 'primary', order: 0 },
        [missingId]: { kind: 'docked', panelId: scenePanel, edge: 'main', shelfId: 'primary', order: 0 },
        [floatingId]: { kind: 'floating', panelId: scenePanel, x: 24, y: 28, width: 360, height: 240, z: 2 }
      }
    }, registry);

    expect(surface?.docks.left.map((entry) => entry.instanceId)).toEqual([notesId, summaryId]);
    expect(surface?.docks.main[0]).toMatchObject({ instanceId: missingId, title: 'missing.renderer' });
    expect(surface?.docks.right).toEqual([]);
    expect(surface?.floating.map((entry) => entry.instanceId)).toEqual([floatingId]);
    expect(surface).toMatchObject({
      panelId: scenePanel,
      tabId: 'pomegranate-panel-tab-scene',
      surfaceId: 'pomegranate-panel-scene'
    });
    expect(Object.isFrozen(surface?.docks.left)).toBe(true);
  });

  it('appends a Widget to an occupied dock through the public store', () => {
    const registry = createWidgetRegistry();
    registry.register({
      type: asWidgetType('story.summary'),
      version: '1.0.0',
      title: 'Story Summary',
      capabilities: [],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', edge: 'left', shelfId: 'primary' }
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
          [firstId]: { kind: 'docked', panelId: scenePanel, edge: 'left', shelfId: 'primary', order: 0 },
          [targetId]: { kind: 'docked', panelId: scenePanel, edge: 'main', shelfId: 'primary', order: 0 }
        }
      }
    });

    const result = createWidgetActions(store, targetId).dock('left');
    expect(result.ok).toBe(true);
    expect(store.getState().placements[targetId]).toEqual({
      kind: 'docked', panelId: scenePanel, edge: 'left', shelfId: 'primary', order: 1
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
      defaultPlacement: { kind: 'docked', edge: 'left', shelfId: 'primary' }
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
          [targetId]: { kind: 'docked', panelId: scenePanel, edge: 'left', shelfId: 'primary', order: 0 },
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

  it('removes the owned Widget through the public store', () => {
    const registry = createWidgetRegistry();
    registry.register({
      type: asWidgetType('story.summary'),
      version: '1.0.0',
      title: 'Story Summary',
      capabilities: [],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', edge: 'left', shelfId: 'primary' }
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
          [targetId]: { kind: 'docked', panelId: scenePanel, edge: 'left', shelfId: 'primary', order: 0 }
        }
      }
    });

    const result = createWidgetActions(store, targetId).remove();
    expect(result.ok).toBe(true);
    expect(store.getState().widgets[targetId]).toBeUndefined();
    expect(store.getState().placements[targetId]).toBeUndefined();
  });
});
