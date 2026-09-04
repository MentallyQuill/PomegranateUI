import { describe, expect, it } from 'vitest';

import {
  asPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type PanelId,
  type DockedPlacement,
  type WidgetInstance,
  type WidgetInstanceId,
  type VisibleWidgetPlacement,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import {
  activatePanel,
  activateWidgetGroup,
  addToolbarColumn,
  createAndGroupWidget,
  createInitialWorkbenchState,
  createPanel,
  createPanelTemplateRegistry,
  createShelf,
  createShelfWithWidget,
  createWidget,
  deletePanel,
  duplicatePanel,
  mergeWidgetGroup,
  placeWidget,
  renamePanel,
  removeWidget,
  removeToolbarColumn,
  resizeShelf,
  restoreWidget,
  reorderWidgetGroup,
  reorderPanel,
  resizePanelColumns,
  resizePanelDock,
  resizeWidgetRow,
  setStoryMeasure,
  shelveWidget
} from './index.js';

const sceneId = asPanelId('scene');
const libraryId = asPanelId('library');
const summaryId = asWidgetInstanceId('summary');
const notesId = asWidgetInstanceId('notes');

function dock(
  instancePanelId: PanelId,
  regionId: 'left' | 'stage' | 'right',
  order: number,
  shelfId = 'primary'
): VisibleWidgetPlacement {
  return { kind: 'docked', panelId: instancePanelId, regionId, shelfId, order };
}

function instance(id: WidgetInstanceId, type: string): WidgetInstance {
  return {
    id,
    type: asWidgetType(type),
    manifestVersion: '1.0.0',
    configuration: {}
  };
}

function populatedState(): WorkbenchState {
  return {
    schema: 'pomegranate.ui.state.v2',
    revision: 0,
    activePanelId: sceneId,
    panels: [
      { id: sceneId, name: 'Scene', templateId: 'story-stage.v1', order: 0 },
      { id: libraryId, name: 'Library', templateId: 'story-stage.v1', order: 1 }
    ],
    shelves: [
      { id: 'primary', panelId: sceneId, regionId: 'left', order: 0, weight: 1 },
      { id: 'primary', panelId: sceneId, regionId: 'stage', order: 0, weight: 1 },
      { id: 'primary', panelId: sceneId, regionId: 'right', order: 0, weight: 1 },
      { id: 'primary', panelId: libraryId, regionId: 'left', order: 0, weight: 1 },
      { id: 'primary', panelId: libraryId, regionId: 'stage', order: 0, weight: 1 },
      { id: 'primary', panelId: libraryId, regionId: 'right', order: 0, weight: 1 }
    ],
    widgets: {
      [summaryId]: instance(summaryId, 'story.summary'),
      [notesId]: instance(notesId, 'story.notes')
    },
    placements: {
      [summaryId]: dock(sceneId, 'left', 0),
      [notesId]: dock(sceneId, 'right', 0)
    }
  };
}

describe('atomic layout operations', () => {
  it('creates a valid empty state and activates the first Panel', () => {
    const empty = createInitialWorkbenchState();
    expect(empty).toEqual({
      schema: 'pomegranate.ui.state.v2',
      revision: 0,
      activePanelId: null,
      panels: [],
      shelves: [],
      widgets: {},
      placements: {}
    });

    const created = createPanel(empty, {
      id: sceneId,
      name: 'Scene',
      templateId: 'story-stage.v1',
      order: 0
    });
    expect(created.ok).toBe(true);
    expect(created.state.activePanelId).toBe(sceneId);
    expect(created.state.revision).toBe(1);
  });

  it('rejects duplicate ids without changing state identity', () => {
    const before = populatedState();
    const result = createPanel(before, before.panels[0]!);
    expect(result.ok).toBe(false);
    expect(result.state).toBe(before);
    expect(!result.ok && result.error.code).toBe('DUPLICATE_ID');
  });

  it('activates an existing Panel and rejects a missing one atomically', () => {
    const before = populatedState();
    const activated = activatePanel(before, libraryId);
    expect(activated.ok && activated.state.activePanelId).toBe(libraryId);
    expect(activated.state.revision).toBe(1);

    const rejected = activatePanel(activated.state, asPanelId('missing'));
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(activated.state);
  });

  it('reorders Panels with contiguous persisted order values', () => {
    const result = reorderPanel(populatedState(), libraryId, 0);
    expect(result.ok).toBe(true);
    expect(result.state.panels.map((panel) => [panel.id, panel.order])).toEqual([
      [libraryId, 0],
      [sceneId, 1]
    ]);
  });

  it('creates exactly one placement for a Widget and rejects duplicate instances', () => {
    const before = populatedState();
    const timelineId = asWidgetInstanceId('timeline');
    const created = createWidget(
      before,
      instance(timelineId, 'story.timeline'),
      dock(sceneId, 'stage', 99)
    );
    expect(created.ok).toBe(true);
    expect(Object.keys(created.state.widgets)).toContain(timelineId);
    expect(Object.keys(created.state.placements).filter((id) => id === timelineId)).toHaveLength(1);

    const duplicate = createWidget(created.state, instance(timelineId, 'story.timeline'), dock(sceneId, 'stage', 0));
    expect(duplicate.ok).toBe(false);
    expect(duplicate.state).toBe(created.state);
  });

  it('appends a dock shelf in a populated destination and normalizes the old shelf', () => {
    const result = placeWidget(populatedState(), notesId, dock(sceneId, 'left', 99));
    expect(result.ok).toBe(true);
    expect(result.state.placements[summaryId]).toMatchObject({ regionId: 'left', order: 0 });
    expect(result.state.placements[notesId]).toMatchObject({ regionId: 'left', order: 1 });
  });

  it('inserts at a requested shelf order and keeps orders contiguous', () => {
    const thirdId = asWidgetInstanceId('third');
    const withThird = createWidget(
      populatedState(),
      instance(thirdId, 'story.third'),
      dock(sceneId, 'left', 1)
    );
    expect(withThird.ok).toBe(true);

    const inserted = placeWidget(withThird.state, notesId, dock(sceneId, 'left', 1));
    expect(inserted.ok).toBe(true);
    expect([summaryId, notesId, thirdId].map((id) => inserted.state.placements[id])).toMatchObject([
      { order: 0 }, { order: 1 }, { order: 2 }
    ]);
  });

  it('resizes one Panel dock within the preserved bounds', () => {
    const before = populatedState();
    const resized = resizePanelDock(before, sceneId, 'left', 320);
    expect(resized.ok).toBe(true);
    expect(resized.state.panels[0]?.configuration).toEqual({ dockWidths: { left: 320 } });

    const rejected = resizePanelDock(resized.state, sceneId, 'right', 421);
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(resized.state);
  });

  it('changes only a Story Panel preferred measure', () => {
    const before = populatedState();
    const result = setStoryMeasure(before, sceneId, 920);

    expect(result.ok).toBe(true);
    expect(result.state.panels[0]).toMatchObject({
      storyLayout: { preferredMeasure: 920, toolbarColumns: { left: 1, right: 1 } }
    });
    expect(result.state.panels[1]).toBe(before.panels[1]);
    expect(setStoryMeasure(before, sceneId, 419).state).toBe(before);
  });

  it('adds an empty innermost toolbar column and expands its requested width', () => {
    const before = populatedState();
    const added = addToolbarColumn(before, sceneId, 'left');

    expect(added.ok).toBe(true);
    expect(added.state.panels[0]).toMatchObject({
      storyLayout: { preferredMeasure: 800, toolbarColumns: { left: 2, right: 1 } },
      configuration: { dockWidths: { left: 572 } }
    });
    expect(added.state.shelves).toContainEqual({
      id: 'column-1-primary',
      panelId: sceneId,
      regionId: 'left',
      dockColumn: 1,
      order: 0,
      weight: 1
    });
  });

  it('removes an empty innermost column but never the permanent outer column', () => {
    const added = addToolbarColumn(populatedState(), sceneId, 'right');
    if (!added.ok) throw new Error(added.error.message);
    const removed = removeToolbarColumn(added.state, sceneId, 'right', []);

    expect(removed.ok).toBe(true);
    expect(removed.state.panels[0]).toMatchObject({
      storyLayout: { toolbarColumns: { left: 1, right: 1 } },
      configuration: { dockWidths: { right: 286 } }
    });
    expect(removed.state.shelves.some((shelf) => shelf.dockColumn === 1)).toBe(false);

    const rejected = removeToolbarColumn(removed.state, sceneId, 'right', []);
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(removed.state);
  });

  it('guards populated removal against stale Widget identities', () => {
    const added = addToolbarColumn(populatedState(), sceneId, 'left');
    if (!added.ok) throw new Error(added.error.message);
    const moved = placeWidget(added.state, summaryId, dock(sceneId, 'left', 0, 'column-1-primary'));
    if (!moved.ok) throw new Error(moved.error.message);

    const stale = removeToolbarColumn(moved.state, sceneId, 'left', []);
    expect(stale.ok).toBe(false);
    expect(stale.state).toBe(moved.state);
    expect(!stale.ok && stale.error.code).toBe('STALE_LAYOUT');
  });

  it('atomically deletes visible column Widgets and preserves shelved Widgets', () => {
    const added = addToolbarColumn(populatedState(), sceneId, 'left');
    if (!added.ok) throw new Error(added.error.message);
    const summaryMoved = placeWidget(added.state, summaryId, dock(sceneId, 'left', 0, 'column-1-primary'));
    if (!summaryMoved.ok) throw new Error(summaryMoved.error.message);
    const notesMoved = placeWidget(summaryMoved.state, notesId, dock(sceneId, 'left', 1, 'column-1-primary'));
    if (!notesMoved.ok) throw new Error(notesMoved.error.message);
    const notesShelved = shelveWidget(notesMoved.state, notesId);
    if (!notesShelved.ok) throw new Error(notesShelved.error.message);

    const removed = removeToolbarColumn(notesShelved.state, sceneId, 'left', [summaryId]);

    expect(removed.ok).toBe(true);
    expect(removed.state.widgets[summaryId]).toBeUndefined();
    expect(removed.state.placements[summaryId]).toBeUndefined();
    expect(removed.state.widgets[notesId]).toEqual(notesShelved.state.widgets[notesId]);
    expect(removed.state.placements[notesId]).toMatchObject({
      kind: 'shelved',
      lastVisible: { kind: 'docked', regionId: 'left', shelfId: 'primary' }
    });
    expect(removed.state.shelves.some((shelf) => shelf.id === 'column-1-primary')).toBe(false);
  });

  it('validates dock resize bounds against the Story column count', () => {
    const before = populatedState();
    const twoColumns = addToolbarColumn(before, sceneId, 'left');
    if (!twoColumns.ok) throw new Error(twoColumns.error.message);

    expect(resizePanelDock(twoColumns.state, sceneId, 'left', 400).ok).toBe(true);
    expect(resizePanelDock(twoColumns.state, sceneId, 'left', 840).ok).toBe(true);
    expect(resizePanelDock(twoColumns.state, sceneId, 'left', 399).ok).toBe(false);
    expect(resizePanelDock(twoColumns.state, sceneId, 'left', 841).ok).toBe(false);

    const nonStory: WorkbenchState = {
      ...before,
      panels: before.panels.map((panel) => panel.id === sceneId
        ? { ...panel, templateId: 'focus-support.v1' }
        : panel)
    };
    expect(resizePanelDock(nonStory, sceneId, 'left', 421).ok).toBe(false);
  });

  it('persists normalized column weights on a flat Panel', () => {
    const before: WorkbenchState = {
      ...populatedState(),
      panels: [{ id: sceneId, name: 'Columns', templateId: 'columns.v1', order: 0, configuration: { columns: 3 } }],
      activePanelId: sceneId
    };
    const resized = resizePanelColumns(before, sceneId, [2, 1, 1]);
    expect(resized.ok).toBe(true);
    expect(resized.state.panels[0]?.columnWeights).toEqual([0.5, 0.25, 0.25]);
    expect(resizePanelColumns(resized.state, sceneId, [1, 0, 1]).ok).toBe(false);
  });

  it('resizes one docked Widget row and keeps a tab group synchronized', () => {
    const single = resizeWidgetRow(populatedState(), summaryId, 284);
    expect(single.ok).toBe(true);
    expect(single.state.placements[summaryId]).toMatchObject({ height: 284 });

    const grouped = mergeWidgetGroup(single.state, notesId, summaryId, 'reading-stack');
    expect(grouped.ok).toBe(true);
    const resized = resizeWidgetRow(grouped.state, notesId, 320);
    expect(resized.ok).toBe(true);
    expect(resized.state.placements[summaryId]).toMatchObject({ height: 320 });
    expect(resized.state.placements[notesId]).toMatchObject({ height: 320 });

    const reset = resizeWidgetRow(resized.state, summaryId, null);
    expect(reset.ok).toBe(true);
    expect(reset.state.placements[summaryId]).not.toHaveProperty('height');
    expect(reset.state.placements[notesId]).not.toHaveProperty('height');
  });

  it('merges, activates, and reorders a same-Panel Widget tab group', () => {
    const grouped = mergeWidgetGroup(populatedState(), notesId, summaryId, 'reading-stack');
    expect(grouped.ok).toBe(true);
    expect(grouped.state.placements[summaryId]).toMatchObject({
      regionId: 'left', shelfId: 'primary', group: { id: 'reading-stack', order: 0, active: false }
    });
    expect(grouped.state.placements[notesId]).toMatchObject({
      regionId: 'left', shelfId: 'primary', group: { id: 'reading-stack', order: 1, active: true }
    });

    const activated = activateWidgetGroup(grouped.state, summaryId);
    expect(activated.ok).toBe(true);
    expect(activated.state.placements[summaryId]).toMatchObject({ group: { active: true } });
    expect(activated.state.placements[notesId]).toMatchObject({ group: { active: false } });

    const reordered = reorderWidgetGroup(activated.state, notesId, 0);
    expect(reordered.ok).toBe(true);
    expect(reordered.state.placements[notesId]).toMatchObject({ group: { order: 0 } });
    expect(reordered.state.placements[summaryId]).toMatchObject({ group: { order: 1 } });
  });

  it('creates and groups a new Widget as one atomic revision', () => {
    const before = populatedState();
    const catalogId = asWidgetInstanceId('catalog-library');
    const catalogInstance = instance(catalogId, 'story.summary');
    const placement = dock(sceneId, 'left', 1) as DockedPlacement;
    const context = { templates: createPanelTemplateRegistry(), manifestFor: () => undefined };

    const result = createAndGroupWidget(before, catalogInstance, placement, summaryId, 'catalog-group', context);

    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(before.revision + 1);
    expect(result.state.widgets[catalogId]).toEqual(catalogInstance);
    expect(result.state.placements[summaryId]).toMatchObject({ group: { id: 'catalog-group', active: false } });
    expect(result.state.placements[catalogId]).toMatchObject({ group: { id: 'catalog-group', active: true } });

    const rejected = createAndGroupWidget(
      before,
      catalogInstance,
      placement,
      asWidgetInstanceId('missing'),
      'catalog-group',
      context
    );
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(before);
    expect(rejected.state.widgets[catalogId]).toBeUndefined();
  });

  it('rejects invalid grouping without changing state identity', () => {
    const before = populatedState();
    const crossPanel = placeWidget(before, notesId, dock(libraryId, 'right', 0));
    expect(crossPanel.ok).toBe(true);

    const rejected = mergeWidgetGroup(crossPanel.state, notesId, summaryId, 'reading-stack');
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(crossPanel.state);
  });

  it('retains accepted floating geometry exactly', () => {
    const placement: VisibleWidgetPlacement = {
      kind: 'floating',
      panelId: libraryId,
      x: -12.5,
      y: 42.25,
      width: 480.5,
      height: 260.75,
      z: 7
    };
    const result = placeWidget(populatedState(), notesId, placement);
    expect(result.ok).toBe(true);
    expect(result.state.placements[notesId]).toEqual(placement);
  });

  it('removes the Widget and its sole placement', () => {
    const result = removeWidget(populatedState(), summaryId);
    expect(result.ok).toBe(true);
    expect(result.state.widgets[summaryId]).toBeUndefined();
    expect(result.state.placements[summaryId]).toBeUndefined();
  });

  it('dissolves a tab group when removal leaves one member', () => {
    const grouped = mergeWidgetGroup(populatedState(), notesId, summaryId, 'reading-stack');
    expect(grouped.ok).toBe(true);
    const removed = removeWidget(grouped.state, notesId);
    expect(removed.ok).toBe(true);
    expect(removed.state.placements[summaryId]).toMatchObject({ kind: 'docked', regionId: 'left' });
    expect(removed.state.placements[summaryId]).not.toHaveProperty('group');
  });

  it('dissolves the origin group when a member is placed elsewhere', () => {
    const grouped = mergeWidgetGroup(populatedState(), notesId, summaryId, 'reading-stack');
    expect(grouped.ok).toBe(true);
    const moved = placeWidget(grouped.state, notesId, dock(sceneId, 'right', 0));
    expect(moved.ok).toBe(true);
    expect(moved.state.placements[summaryId]).not.toHaveProperty('group');
    expect(moved.state.placements[notesId]).not.toHaveProperty('group');
  });

  it('rejects an invalid move without changing state identity', () => {
    const before = populatedState();
    const result = placeWidget(before, asWidgetInstanceId('missing'), dock(sceneId, 'left', 1));
    expect(result.ok).toBe(false);
    expect(result.state).toBe(before);
    expect(!result.ok && result.error.code).toBe('MISSING_WIDGET');
  });

  it('rejects invalid placement geometry and missing Panel references', () => {
    const before = populatedState();
    const invalidGeometry = placeWidget(before, notesId, {
      kind: 'floating', panelId: sceneId, x: 0, y: 0, width: 0, height: 10, z: 0
    });
    expect(invalidGeometry.ok).toBe(false);
    expect(invalidGeometry.state).toBe(before);

    const missingPanel = placeWidget(before, notesId, dock(asPanelId('missing'), 'left', 0));
    expect(missingPanel.ok).toBe(false);
    expect(!missingPanel.ok && missingPanel.error.code).toBe('MISSING_PANEL');
  });

  it('creates and resizes normalized region shelves', () => {
    const registry = createPanelTemplateRegistry();
    const created = createShelf(populatedState(), {
      id: 'secondary', panelId: sceneId, regionId: 'left', order: 1, weight: 0.5
    }, registry);
    expect(created.ok).toBe(true);
    expect(created.state.shelves.filter((shelf) => shelf.panelId === sceneId && shelf.regionId === 'left')).toMatchObject([
      { id: 'primary', order: 0, weight: 2 / 3 },
      { id: 'secondary', order: 1, weight: 1 / 3 }
    ]);
    const resized = resizeShelf(created.state, {
      panelId: sceneId, regionId: 'left', shelfId: 'secondary'
    }, 0.6);
    expect(resized.ok).toBe(true);
    expect(resized.state.shelves.filter((shelf) => shelf.panelId === sceneId && shelf.regionId === 'left')).toMatchObject([
      { id: 'primary', weight: 0.4 },
      { id: 'secondary', weight: 0.6 }
    ]);
  });

  it('creates a Shelf and places its Widget as one atomic revision', () => {
    const before = populatedState();
    const shelf = { id: 'secondary', panelId: sceneId, regionId: 'left', order: 1, weight: 0.5 };
    const placement = dock(sceneId, 'left', 0, shelf.id) as DockedPlacement;
    const context = { templates: createPanelTemplateRegistry(), manifestFor: () => undefined };

    const result = createShelfWithWidget(before, shelf, notesId, placement, context);
    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(1);
    expect(result.state.shelves).toContainEqual(expect.objectContaining({ id: shelf.id, panelId: sceneId }));
    expect(result.state.placements[notesId]).toMatchObject({ shelfId: shelf.id, order: 0 });

    const rejected = createShelfWithWidget(before, shelf, asWidgetInstanceId('missing'), placement, context);
    expect(rejected.ok).toBe(false);
    expect(rejected.state).toBe(before);
    expect(rejected.state.shelves.some((candidate) => candidate.id === shelf.id)).toBe(false);
  });

  it('creates a new Widget with its new Shelf as one atomic revision', () => {
    const before = populatedState();
    const catalogId = asWidgetInstanceId('catalog-library');
    const catalogInstance = instance(catalogId, 'story.summary');
    const shelf = { id: 'catalog-shelf', panelId: sceneId, regionId: 'left', order: 1, weight: 0.5 };
    const placement = dock(sceneId, 'left', 0, shelf.id) as DockedPlacement;
    const context = { templates: createPanelTemplateRegistry(), manifestFor: () => undefined };

    const result = createShelfWithWidget(before, shelf, catalogId, placement, context, catalogInstance);

    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(1);
    expect(result.state.widgets[catalogId]).toEqual(catalogInstance);
    expect(result.state.shelves).toContainEqual(expect.objectContaining({ id: shelf.id, panelId: sceneId }));
    expect(result.state.placements[catalogId]).toMatchObject({ shelfId: shelf.id, order: 0 });
  });

  it('shelves a Widget without deleting it and restores its exact origin', () => {
    const before = populatedState();
    const shelved = shelveWidget(before, summaryId);
    expect(shelved.ok).toBe(true);
    expect(shelved.state.widgets[summaryId]).toBe(before.widgets[summaryId]);
    expect(shelved.state.placements[summaryId]).toEqual({
      kind: 'shelved', panelId: sceneId, lastVisible: before.placements[summaryId]
    });
    const restored = restoreWidget(shelved.state, summaryId, {
      templates: createPanelTemplateRegistry(),
      manifestFor: () => undefined
    });
    expect(restored.ok).toBe(true);
    expect(restored.state.placements[summaryId]).toEqual(before.placements[summaryId]);
  });

  it('renames, deeply duplicates, and deletes Panels while selecting the nearest survivor', () => {
    const renamed = renamePanel(populatedState(), sceneId, 'Chronicle');
    expect(renamed.ok).toBe(true);
    const duplicated = duplicatePanel(renamed.state, sceneId, 'Chronicle Copy', {
      panelId: asPanelId('copy'),
      shelfIds: { primary: 'primary-copy' },
      widgetIds: {
        [summaryId]: asWidgetInstanceId('summary-copy'),
        [notesId]: asWidgetInstanceId('notes-copy')
      },
      groupIds: {}
    });
    expect(duplicated.ok).toBe(true);
    expect(duplicated.state.panels.map((panel) => panel.name)).toEqual(['Chronicle', 'Chronicle Copy', 'Library']);
    expect(duplicated.state.placements['summary-copy']).toMatchObject({
      panelId: 'copy', regionId: 'left', shelfId: 'primary-copy'
    });
    const deleted = deletePanel(duplicated.state, sceneId);
    expect(deleted.ok).toBe(true);
    expect(deleted.state.activePanelId).toBe('copy');
    expect(deleted.state.widgets[summaryId]).toBeUndefined();
  });
});
