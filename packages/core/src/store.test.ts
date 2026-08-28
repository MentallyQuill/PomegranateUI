import { describe, expect, it } from 'vitest';

import {
  asPanelId,
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

function summaryManifest(): WidgetManifest {
  return {
    type: asWidgetType('story.summary'),
    version: '1.0.0',
    title: 'Story summary',
    capabilities: ['story.read'],
    defaultConfiguration: {},
    defaultPlacement: { kind: 'docked', edge: 'left', shelfId: 'primary' }
  };
}

function initialState(): WorkbenchState {
  const empty = createInitialWorkbenchState();
  const scene = createPanel(empty, { id: sceneId, name: 'Scene', templateId: 'standard', order: 0 });
  if (!scene.ok) throw new Error(scene.error.message);
  const library = createPanel(scene.state, { id: libraryId, name: 'Library', templateId: 'standard', order: 1 });
  if (!library.ok) throw new Error(library.error.message);
  return { ...library.state, revision: 0 };
}

function fixtureStore() {
  const registry = createWidgetRegistry();
  registry.register(summaryManifest());
  return createWorkbenchStore({ initialState: initialState(), registry });
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
      placement: { kind: 'docked', panelId: sceneId, edge: 'left', shelfId: 'primary', order: 0 }
    }).state.revision).toBe(3);
  });

  it('rejects an unknown Widget type without mutation or notification', () => {
    const store = fixtureStore();
    const before = store.getState();
    let notifications = 0;
    store.subscribe(() => { notifications += 1; });
    const result = store.dispatch({
      type: 'widget.create',
      instance: instance('extension.unknown'),
      placement: { kind: 'docked', panelId: sceneId, edge: 'left', shelfId: 'primary', order: 0 }
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
        [summaryId]: { kind: 'docked', panelId: sceneId, edge: 'main', shelfId: 'primary', order: 0 }
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
      placement: { kind: 'docked', panelId: sceneId, edge: 'left', shelfId: 'primary', order: 0 }
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
});
