import { describe, expect, it } from 'vitest';

import {
  asPanelId,
  asSubPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type WidgetInstance,
  type WidgetManifest,
  type WorkbenchState
} from '@pomegranate-ui/contracts';
import { createInitialWorkbenchState, createPanel } from '@pomegranate-ui/layout';

import { createWidgetRegistry, createWorkbenchStore } from './index.js';

const sceneId = asPanelId('scene');
const libraryId = asPanelId('library');
const summaryId = asWidgetInstanceId('summary');
const summaryCopyId = asWidgetInstanceId('summary-copy');
const overviewId = asSubPanelId('scene-overview');
const notesId = asSubPanelId('scene-notes');
const advancedId = asSubPanelId('scene-advanced');
const notesCopyId = asSubPanelId('scene-notes-copy');

function summaryManifest(): WidgetManifest {
  return {
    type: asWidgetType('story.summary'),
    version: '1.0.0',
    title: 'Story summary',
    capabilities: ['story.read'],
    defaultConfiguration: {},
    defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' }
  };
}

function initialState(): WorkbenchState {
  const empty = createInitialWorkbenchState();
  const scene = createPanel(empty, { id: sceneId, name: 'Scene', templateId: 'story-stage.v1', order: 0 });
  if (!scene.ok) throw new Error(scene.error.message);
  const library = createPanel(scene.state, { id: libraryId, name: 'Library', templateId: 'story-stage.v1', order: 1 });
  if (!library.ok) throw new Error(library.error.message);
  return {
    ...library.state,
    revision: 0,
    shelves: [
      { id: 'primary', panelId: sceneId, regionId: 'left', order: 0, weight: 1 },
      { id: 'primary', panelId: sceneId, regionId: 'stage', order: 0, weight: 1 }
    ]
  };
}

function fixtureStore() {
  const registry = createWidgetRegistry();
  registry.register(summaryManifest());
  return createWorkbenchStore({ initialState: initialState(), registry });
}

function subPanelStore() {
  const initial = initialState();
  return createWorkbenchStore({
    initialState: {
      ...initial,
      panels: initial.panels.map((panel) => panel.id === sceneId
        ? {
            ...panel,
            activeSubPanelId: notesId,
            subPanels: [
              { id: overviewId, name: 'Overview', layoutId: 'single' as const, order: 0, scrollTop: 96 },
              { id: notesId, name: 'Notes', layoutId: 'two-equal' as const, order: 1, scrollTop: 0 }
            ]
          }
        : panel),
      widgets: { [summaryId]: instance() },
      placements: {
        [summaryId]: {
          kind: 'docked',
          panelId: sceneId,
          subPanelId: notesId,
          lane: 0,
          regionId: 'column-1',
          shelfId: 'primary',
          order: 0
        }
      }
    }
  });
}

function instance(type = 'story.summary'): WidgetInstance {
  return {
    id: summaryId,
    type: asWidgetType(type),
    manifestVersion: '1.0.0',
    configuration: {}
  };
}

describe('Workbench store', () => {
  it('dispatches atomic sub-panel activation and publishes its typed event', () => {
    const store = subPanelStore();

    const result = store.dispatch({
      type: 'sub-panel.activate',
      panelId: sceneId,
      subPanelId: overviewId,
      currentScrollTop: 72
    });

    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(1);
    expect(result.state.panels[0]).toMatchObject({
      activeSubPanelId: overviewId,
      subPanels: [
        { id: overviewId, scrollTop: 96 },
        { id: notesId, scrollTop: 72 }
      ]
    });
    expect(result.events).toEqual([{
      type: 'sub-panel.activated',
      revision: 1,
      panelId: sceneId,
      subPanelId: overviewId
    }]);
  });

  it('routes every sub-panel mutation through history and exact typed events', () => {
    const store = subPanelStore();

    const results = [
      store.dispatch({
        type: 'sub-panel.create',
        panelId: sceneId,
        subPanel: { id: advancedId, name: 'Advanced', layoutId: 'single', order: 2, scrollTop: 0 }
      }),
      store.dispatch({ type: 'sub-panel.rename', panelId: sceneId, subPanelId: advancedId, name: 'Expert' }),
      store.dispatch({
        type: 'sub-panel.duplicate',
        panelId: sceneId,
        subPanelId: notesId,
        subPanel: { id: notesCopyId, name: 'Notes Copy', layoutId: 'two-equal', order: 3, scrollTop: 0 },
        ids: { widgetIds: { [summaryId]: summaryCopyId }, groupIds: {} }
      }),
      store.dispatch({ type: 'sub-panel.reorder', panelId: sceneId, subPanelId: notesCopyId, toIndex: 0 }),
      store.dispatch({ type: 'sub-panel.change-layout', panelId: sceneId, subPanelId: overviewId, layoutId: 'two-equal' }),
      store.dispatch({ type: 'sub-panel.set-scroll', panelId: sceneId, subPanelId: overviewId, scrollTop: 320 }),
      store.dispatch({
        type: 'sub-panel.move-widgets',
        panelId: sceneId,
        sourceSubPanelId: notesId,
        targetSubPanelId: overviewId
      })
    ];

    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.map((result) => result.events[0]?.type)).toEqual([
      'sub-panel.created',
      'sub-panel.renamed',
      'sub-panel.duplicated',
      'sub-panel.reordered',
      'sub-panel.layout-changed',
      'sub-panel.scroll-retained',
      'sub-panel.widgets-moved'
    ]);
    expect(store.getState().placements[summaryId]).toMatchObject({ subPanelId: overviewId });
    expect(store.getState().placements[summaryCopyId]).toMatchObject({ subPanelId: notesCopyId });

    const beforeDelete = store.getState();
    const deleted = store.dispatch({ type: 'sub-panel.delete', panelId: sceneId, subPanelId: advancedId });
    expect(deleted.ok).toBe(true);
    expect(deleted.events[0]?.type).toBe('sub-panel.deleted');
    expect(store.dispatch({ type: 'layout.undo' }).ok).toBe(true);
    expect(store.getState()).toEqual({ ...beforeDelete, revision: beforeDelete.revision + 2 });
  });

  it('routes persistent column and Widget row sizing through events and undo', () => {
    const store = subPanelStore();
    const columns = store.dispatch({
      type: 'sub-panel.resize-columns',
      panelId: sceneId,
      subPanelId: notesId,
      weights: [0.7, 0.3]
    });
    expect(columns).toMatchObject({
      ok: true,
      events: [{ type: 'sub-panel.columns-resized', panelId: sceneId, subPanelId: notesId }]
    });
    expect(columns.state.panels[0]?.subPanels?.find(({ id }) => id === notesId)?.columnWeights).toEqual([0.7, 0.3]);

    const row = store.dispatch({ type: 'widget.resize-row', instanceId: summaryId, height: 284 });
    expect(row).toMatchObject({ ok: true, events: [{ type: 'widget.row-resized', instanceId: summaryId }] });
    expect(row.state.placements[summaryId]).toMatchObject({ height: 284 });
    expect(store.dispatch({ type: 'layout.undo' }).ok).toBe(true);
    expect(store.getState().placements[summaryId]).not.toHaveProperty('height');
  });

  it('publishes one frozen event after an accepted command', () => {
    const store = fixtureStore();
    const seen: number[] = [];
    store.subscribe((state) => seen.push(state.revision));
    const result = store.dispatch({ type: 'panel.activate', panelId: libraryId });
    expect(result.ok).toBe(true);
    expect(seen).toEqual([1]);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.type).toBe('panel.activated');
    expect(Object.isFrozen(result.events[0])).toBe(true);
    expect(Object.isFrozen(result.events)).toBe(true);
    expect(store.getState()).toBe(result.state);
  });

  it('increments one revision for each accepted command', () => {
    const store = fixtureStore();
    expect(store.dispatch({ type: 'panel.activate', panelId: libraryId }).state.revision).toBe(1);
    expect(store.dispatch({ type: 'panel.reorder', panelId: libraryId, toIndex: 0 }).state.revision).toBe(2);
    expect(store.dispatch({
      type: 'widget.create',
      instance: instance(),
      placement: { kind: 'docked', panelId: sceneId, regionId: 'left', shelfId: 'primary', order: 0 }
    }).state.revision).toBe(3);
  });

  it('creates a Panel with one primary Shelf in every resolved region atomically', () => {
    const store = fixtureStore();
    const panelId = asPanelId('research');
    const seen: number[] = [];
    store.subscribe((state) => seen.push(state.revision));

    const result = store.dispatch({
      type: 'panel.create',
      panel: { id: panelId, name: 'Research', templateId: 'focus-support.v1', order: 2 }
    });

    expect(result).toMatchObject({ ok: true, state: { revision: 1 } });
    expect(result.state.shelves.filter((shelf) => shelf.panelId === panelId)).toEqual([
      { id: 'primary', panelId, regionId: 'focus', order: 0, weight: 1 },
      { id: 'primary', panelId, regionId: 'support', order: 0, weight: 1 }
    ]);
    expect(result.events).toMatchObject([{ type: 'panel.created', revision: 1, panelId }]);
    expect(seen).toEqual([1]);
  });

  it('creates and places a Shelf in one event, notification, and undo step', () => {
    const store = fixtureStore();
    expect(store.dispatch({
      type: 'widget.create',
      instance: instance(),
      placement: { kind: 'docked', panelId: sceneId, regionId: 'left', shelfId: 'primary', order: 0 }
    }).ok).toBe(true);
    const before = store.getState();
    const seen: number[] = [];
    store.subscribe((snapshot) => seen.push(snapshot.revision));

    const result = store.dispatch({
      type: 'shelf.create-and-place',
      shelf: { id: 'secondary', panelId: sceneId, regionId: 'left', order: 1, weight: 0.5 },
      instanceId: summaryId,
      placement: { kind: 'docked', panelId: sceneId, regionId: 'left', shelfId: 'secondary', order: 0 }
    });

    expect(result.ok, JSON.stringify(result)).toBe(true);
    expect(result).toMatchObject({
      ok: true,
      events: [{ type: 'shelf.created-with-widget', panelId: sceneId, shelfId: 'secondary', instanceId: summaryId }]
    });
    expect(result.state.revision).toBe(before.revision + 1);
    expect(result.state.placements[summaryId]).toMatchObject({ shelfId: 'secondary' });
    expect(seen).toEqual([before.revision + 1]);

    expect(store.dispatch({ type: 'layout.undo' }).ok).toBe(true);
    expect(store.getState()).toEqual({ ...before, revision: before.revision + 2 });
  });

  it('rejects an unknown Widget type without mutation or notification', () => {
    const store = fixtureStore();
    const before = store.getState();
    let notifications = 0;
    store.subscribe(() => { notifications += 1; });
    const result = store.dispatch({
      type: 'widget.create',
      instance: instance('extension.unknown'),
      placement: { kind: 'docked', panelId: sceneId, regionId: 'left', shelfId: 'primary', order: 0 }
    });
    expect(result.ok).toBe(false);
    expect(result.state).toBe(before);
    expect(result.events).toEqual([]);
    expect(!result.ok && result.error.code).toBe('UNKNOWN_WIDGET_TYPE');
    expect(notifications).toBe(0);
  });

  it('retains unresolved hydrated instances and advances the local revision once', () => {
    const store = fixtureStore();
    const hydrated: WorkbenchState = {
      ...store.getState(),
      revision: 40,
      widgets: { [summaryId]: instance('extension.not-installed') },
      placements: {
        [summaryId]: { kind: 'docked', panelId: sceneId, regionId: 'stage', shelfId: 'primary', order: 0 }
      }
    };
    const result = store.dispatch({ type: 'layout.hydrate', state: hydrated });
    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(1);
    expect(result.state.widgets[summaryId]?.type).toBe('extension.not-installed');
    expect(result.events[0]?.type).toBe('layout.hydrated');
  });

  it('keeps existing instances when their manifest is unregistered', () => {
    const store = fixtureStore();
    const created = store.dispatch({
      type: 'widget.create',
      instance: instance(),
      placement: { kind: 'docked', panelId: sceneId, regionId: 'left', shelfId: 'primary', order: 0 }
    });
    expect(created.ok).toBe(true);
    store.registry.unregister(asWidgetType('story.summary'));
    expect(store.getState().widgets[summaryId]).toBeDefined();
  });

  it('notifies a listener snapshot in registration order', () => {
    const store = fixtureStore();
    const calls: string[] = [];
    let removeSecond = () => {};
    store.subscribe(() => {
      calls.push('first');
      removeSecond();
    });
    removeSecond = store.subscribe(() => calls.push('second'));
    const removeThird = store.subscribe(() => calls.push('third'));

    store.dispatch({ type: 'panel.activate', panelId: libraryId });
    removeThird();
    removeThird();
    store.dispatch({ type: 'panel.activate', panelId: sceneId });
    expect(calls).toEqual(['first', 'second', 'third', 'first']);
  });

  it('parses raw commands and never throws through dispatch', () => {
    const store = fixtureStore();
    const before = store.getState();
    const malformed = store.dispatch({ type: 'panel.reorder', panelId: sceneId, toIndex: -1 });
    expect(malformed.ok).toBe(false);
    expect(malformed.state).toBe(before);

    const hostile = {} as Record<string, unknown>;
    Object.defineProperty(hostile, 'type', { get() { throw new Error('hostile getter'); } });
    const unexpected = store.dispatch(hostile);
    expect(unexpected.ok).toBe(false);
    expect(!unexpected.ok && unexpected.error).toMatchObject({
      code: 'INTERNAL_ERROR',
      recoverable: false
    });
    expect(unexpected.state).toBe(before);
  });

  it('applies adopter Panel capability policy and one-step undo', () => {
    const registry = createWidgetRegistry();
    registry.register(summaryManifest());
    const store = createWorkbenchStore({
      initialState: initialState(),
      registry,
      panelPolicy: {
        allows: (panel, capability) => !(panel.id === sceneId && capability === 'delete')
      }
    });
    const renamed = store.dispatch({ type: 'panel.rename', panelId: sceneId, name: 'Chronicle' });
    expect(renamed).toMatchObject({ ok: true });
    expect(store.canUndo()).toBe(true);
    expect(store.getState().panels[0]?.name).toBe('Chronicle');
    const undone = store.dispatch({ type: 'layout.undo' });
    expect(undone.ok).toBe(true);
    expect(store.getState().panels[0]?.name).toBe('Scene');
    expect(store.getState().revision).toBe(2);
    expect(store.canUndo()).toBe(false);
    const denied = store.dispatch({ type: 'panel.delete', panelId: sceneId });
    expect(denied.ok).toBe(false);
    expect(!denied.ok && denied.error.code).toBe('CAPABILITY_DENIED');
  });

  it('shelves and restores a Widget through the shared store path', () => {
    const store = fixtureStore();
    expect(store.dispatch({
      type: 'widget.create',
      instance: instance(),
      placement: { kind: 'docked', panelId: sceneId, regionId: 'left', shelfId: 'primary', order: 0 }
    }).ok).toBe(true);
    expect(store.dispatch({ type: 'widget.shelve', instanceId: summaryId }).ok).toBe(true);
    expect(store.getState().placements[summaryId]?.kind).toBe('shelved');
    expect(store.dispatch({ type: 'widget.restore', instanceId: summaryId }).ok).toBe(true);
    expect(store.getState().placements[summaryId]).toMatchObject({ kind: 'docked', regionId: 'left' });
  });
});
