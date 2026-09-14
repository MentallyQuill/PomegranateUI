import { describe, expect, it } from 'vitest';
import { asPanelId, asWidgetInstanceId, asWidgetType, type WidgetInstance, type WorkbenchState } from '@pomegranate-ui/contracts';
import { createInitialWorkbenchState } from '@pomegranate-ui/layout';
import { createWidgetRegistry, createWorkbenchStore } from './index.js';

const panelId = asPanelId('scene');
const widget = (id: string): WidgetInstance => ({ id: asWidgetInstanceId(id), type: asWidgetType('test.widget'), manifestVersion: '1.0.0', configuration: {} });
function fixture(group = false) {
  const registry = createWidgetRegistry();
  registry.register({ type: asWidgetType('test.widget'), version: '1.0.0', title: 'Widget', capabilities: [], defaultConfiguration: {}, defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' } });
  const initial: WorkbenchState = {
    ...createInitialWorkbenchState(), activePanelId: panelId,
    panels: [{ id: panelId, name: 'Scene', templateId: 'story-stage.v1', order: 0 }, { id: asPanelId('other'), name: 'Other', templateId: 'story-stage.v1', order: 1 }],
    shelves: [{ id: 'primary', panelId, regionId: 'left', order: 0, weight: 1 }, { id: 'inner', panelId, regionId: 'left', dockColumn: 1, order: 0, weight: 1 }],
    widgets: Object.fromEntries(['a', 'b', 'c', 'd'].map(id => [id, widget(id)])),
    placements: Object.fromEntries(['a', 'b', 'c', 'd'].map((id, order) => [id, {
      kind: 'docked' as const, panelId, regionId: 'left', shelfId: id === 'd' ? 'inner' : 'primary', order: id === 'd' ? 0 : order,
      ...(group && (id === 'b' || id === 'c') ? { group: { id: 'tabs', order: order - 1, active: id === 'c' } } : {})
    }]))
  };
  return createWorkbenchStore({ initialState: initial, registry });
}
function order(state: WorkbenchState) {
  return Object.entries(state.placements).filter(([, p]) => p.kind === 'docked' && p.shelfId === 'primary')
    .sort(([, a], [, b]) => a.kind === 'docked' && b.kind === 'docked' ? a.order - b.order : 0).map(([id]) => id);
}

describe('widget-relative placement', () => {
  it('creating a shelf only shifts siblings in its own dock column', () => {
    const store = fixture();
    expect(store.dispatch({ type: 'shelf.create', shelf: { id: 'zz-inner-last', panelId, regionId: 'left', dockColumn: 1, order: 1, weight: .5 } }).ok).toBe(true);
    const otherColumn = store.getState().shelves.filter(shelf => shelf.dockColumn === 1);
    expect(store.dispatch({ type: 'shelf.create', shelf: { id: 'new-outer', panelId, regionId: 'left', order: 1, weight: .5 } }).ok).toBe(true);
    expect(store.getState().shelves.filter(shelf => shelf.dockColumn === 1)).toEqual(otherColumn);
    expect(store.dispatch({ type: 'shelf.create', shelf: { id: 'out-of-range', panelId, regionId: 'left', order: 3, weight: .5 } }).ok).toBe(false);
  });

  it('resizing a shelf distributes weight only within its dock column', () => {
    const store = fixture();
    expect(store.dispatch({ type: 'shelf.create', shelf: { id: 'second', panelId, regionId: 'left', order: 1, weight: .5 } }).ok).toBe(true);
    const otherColumn = store.getState().shelves.filter(shelf => shelf.dockColumn === 1);
    expect(store.dispatch({ type: 'shelf.resize', panelId, regionId: 'left', shelfId: 'primary', weight: .7 }).ok).toBe(true);
    expect(store.getState().shelves.find(shelf => shelf.id === 'primary')!.weight).toBeCloseTo(.7);
    expect(store.getState().shelves.filter(shelf => shelf.dockColumn === 1)).toEqual(otherColumn);
  });

  it.each([
    ['a', 'b', 'after', ['b', 'a', 'c']],
    ['c', 'b', 'before', ['a', 'c', 'b']],
    ['d', 'b', 'before', ['a', 'd', 'b', 'c']],
    ['d', 'b', 'after', ['a', 'b', 'd', 'c']]
  ] as const)('places %s %s %s without creating a shelf', (source, target, relation, expected) => {
    const store = fixture();
    const before = store.getState();
    const result = store.dispatch({ type: 'widget.place-relative', instanceId: source, targetInstanceId: target, relation });
    expect(result.ok, JSON.stringify(result)).toBe(true);
    expect(order(store.getState())).toEqual(expected);
    expect(store.getState().shelves).toEqual(before.shelves);
    expect(store.dispatch({ type: 'layout.undo' }).ok).toBe(true);
    expect(store.getState()).toEqual({ ...before, revision: before.revision + 2 });
  });

  it.each(['before', 'after'] as const)('places beside the entire target group: %s', relation => {
    const store = fixture(true);
    const result = store.dispatch({ type: 'widget.place-relative', instanceId: 'd', targetInstanceId: 'c', relation });
    expect(result.ok, JSON.stringify(result)).toBe(true);
    expect(order(store.getState())).toEqual(relation === 'before' ? ['a', 'd', 'b', 'c'] : ['a', 'b', 'c', 'd']);
    expect(store.getState().placements.d).not.toHaveProperty('group');
    expect(store.getState().placements.c).toMatchObject({ group: { id: 'tabs', active: true } });
  });

  it('creates a Catalog widget at the indicated neighbour in one notification and undo', () => {
    const store = fixture();
    const before = store.getState();
    const seen: number[] = [];
    store.subscribe(state => seen.push(state.revision));
    const result = store.dispatch({ type: 'widget.place-relative', instanceId: 'new', instance: widget('new'), targetInstanceId: 'b', relation: 'before' });
    expect(result.ok, JSON.stringify(result)).toBe(true);
    expect(order(store.getState())).toEqual(['a', 'new', 'b', 'c']);
    expect(seen).toEqual([before.revision + 1]);
    expect(store.dispatch({ type: 'layout.undo' }).ok).toBe(true);
    expect(store.getState()).toEqual({ ...before, revision: before.revision + 2 });
  });

  it('leaves identically named groups on another panel untouched', () => {
    const base = fixture(true);
    const initial = base.getState();
    const otherPanel = asPanelId('other');
    const otherPlacements = Object.fromEntries(['e', 'f'].map((id, order) => [id, {
      kind: 'docked' as const, panelId: otherPanel, regionId: 'left', shelfId: 'primary', order,
      group: { id: 'tabs', order, active: order === 0 }, height: 360
    }]));
    const store = createWorkbenchStore({ registry: base.registry, initialState: {
      ...initial,
      shelves: [...initial.shelves, { id: 'primary', panelId: otherPanel, regionId: 'left', order: 0, weight: 1 }],
      widgets: { ...initial.widgets, e: widget('e'), f: widget('f') },
      placements: { ...initial.placements, ...otherPlacements }
    } });
    expect(store.dispatch({ type: 'widget.place-relative', instanceId: 'd', targetInstanceId: 'b', relation: 'tab' }).ok).toBe(true);
    expect(store.getState().placements.e).toEqual(otherPlacements.e);
    expect(store.getState().placements.f).toEqual(otherPlacements.f);
  });

  it('moves a floating widget from another panel into a group atomically', () => {
    const store = fixture();
    expect(store.dispatch({ type: 'widget.place', instanceId: 'd', placement: { kind: 'floating', panelId: 'other', x: 30, y: 30, width: 300, height: 240, z: 1 } }).ok).toBe(true);
    const before = store.getState();
    const result = store.dispatch({ type: 'widget.place-relative', instanceId: 'd', targetInstanceId: 'b', relation: 'tab' });
    expect(result.ok, JSON.stringify(result)).toBe(true);
    expect(store.getState().placements.d).toMatchObject({ kind: 'docked', panelId, group: { id: 'group-b', active: true } });
    expect(store.getState().revision).toBe(before.revision + 1);
    expect(store.dispatch({ type: 'layout.undo' }).ok).toBe(true);
    expect(store.getState()).toEqual({ ...before, revision: before.revision + 2 });
  });

  it.each([
    { instanceId: 'a', targetInstanceId: 'a', relation: 'before' },
    { instanceId: 'new', instance: widget('new'), targetInstanceId: 'missing', relation: 'before' },
    { instanceId: 'new', instance: widget('wrong'), targetInstanceId: 'a', relation: 'before' },
    { instanceId: 'new', instance: { ...widget('new'), type: 'unregistered' }, targetInstanceId: 'a', relation: 'tab' },
    { instanceId: 'a', targetInstanceId: 'b', relation: 'diagonal' }
  ])('rejects invalid placement without state or history changes: %j', command => {
    const store = fixture();
    const before = store.getState();
    expect(store.dispatch({ type: 'widget.place-relative', ...command }).ok).toBe(false);
    expect(store.getState()).toBe(before);
    expect(store.canUndo()).toBe(false);
  });
});
