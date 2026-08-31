import { describe, expect, it } from 'vitest';

import {
  asPanelId,
  asSubPanelId,
  asWidgetInstanceId,
  asWidgetType,
  WorkbenchStateSchema,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import {
  activateSubPanel,
  changeSubPanelLayout,
  createSubPanel,
  deleteSubPanel,
  duplicateSubPanel,
  moveSubPanelWidgets,
  normalizeSubPanels,
  renameSubPanel,
  reorderSubPanel,
  setSubPanelScroll
} from './sub-panels.js';
import { normalizeDockOrders } from './state.js';
import { mergeWidgetGroup } from './operations.js';

const settingsId = asPanelId('settings');
const overviewId = asSubPanelId('settings-overview');
const notesId = asSubPanelId('settings-notes');
const advancedId = asSubPanelId('settings-advanced');
const themeId = asWidgetInstanceId('settings-theme');
const readingId = asWidgetInstanceId('settings-reading');
const accessibilityId = asWidgetInstanceId('settings-accessibility');
const copiedThemeId = asWidgetInstanceId('settings-theme-copy');
const copiedReadingId = asWidgetInstanceId('settings-reading-copy');
const copiedAccessibilityId = asWidgetInstanceId('settings-accessibility-copy');
const notesExistingId = asWidgetInstanceId('settings-notes-existing');

function flatSettings(): WorkbenchState {
  return {
    schema: 'pomegranate.ui.state.v2',
    revision: 4,
    activePanelId: settingsId,
    panels: [{ id: settingsId, name: 'Settings', templateId: 'columns.v1', order: 0 }],
    shelves: [
      { id: 'primary', panelId: settingsId, regionId: 'column-1', order: 0, weight: 1 },
      { id: 'primary', panelId: settingsId, regionId: 'column-2', order: 0, weight: 1 },
      { id: 'primary', panelId: settingsId, regionId: 'column-3', order: 0, weight: 1 }
    ],
    widgets: {
      [themeId]: { id: themeId, type: asWidgetType('settings.theme'), manifestVersion: '1.0.0', configuration: { edited: true } },
      [readingId]: { id: readingId, type: asWidgetType('settings.reading-layout'), manifestVersion: '1.0.0', configuration: {} },
      [accessibilityId]: { id: accessibilityId, type: asWidgetType('settings.accessibility'), manifestVersion: '1.0.0', configuration: {} }
    },
    placements: {
      [themeId]: {
        kind: 'docked',
        panelId: settingsId,
        regionId: 'column-1',
        shelfId: 'primary',
        order: 0,
        group: { id: 'settings-stack', order: 0, active: true }
      },
      [readingId]: {
        kind: 'docked',
        panelId: settingsId,
        regionId: 'column-2',
        shelfId: 'primary',
        order: 0
      },
      [accessibilityId]: {
        kind: 'docked',
        panelId: settingsId,
        regionId: 'column-3',
        shelfId: 'primary',
        order: 0
      }
    }
  };
}

describe('one-level sub-panel transitions', () => {
  it('converts a flat Panel losslessly into Overview plus the requested sibling', () => {
    const before = flatSettings();
    const result = createSubPanel(
      before,
      settingsId,
      {
        id: notesId,
        name: 'Notes',
        layoutId: 'two-equal',
        order: 1,
        scrollTop: 0
      },
      {
        id: overviewId,
        name: 'Overview',
        layoutId: 'three-equal',
        order: 0,
        scrollTop: 96
      }
    );

    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(5);
    expect(result.state.widgets).toEqual(before.widgets);
    expect(result.state.panels[0]).toMatchObject({
      activeSubPanelId: notesId,
      subPanels: [
        { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 },
        { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 }
      ]
    });
    expect(result.state.placements[themeId]).toEqual({
      ...before.placements[themeId],
      subPanelId: overviewId,
      lane: 0
    });
    expect(result.state.placements[accessibilityId]).toEqual({
      ...before.placements[accessibilityId],
      subPanelId: overviewId,
      lane: 2
    });
  });

  it('atomically captures outgoing scroll and activates the target sub-panel', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );

    const result = activateSubPanel(created.state, settingsId, overviewId, 240);

    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(6);
    expect(result.state.panels[0]).toMatchObject({
      activeSubPanelId: overviewId,
      subPanels: [
        { id: overviewId, scrollTop: 96 },
        { id: notesId, scrollTop: 240 }
      ]
    });
  });

  it('appends and activates a sibling when the Panel already has sub-panels', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );

    const result = createSubPanel(created.state, settingsId, {
      id: advancedId,
      name: 'Advanced',
      layoutId: 'single',
      order: 2,
      scrollTop: 0
    });

    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(6);
    expect(result.state.panels[0]).toMatchObject({
      activeSubPanelId: advancedId,
      subPanels: [
        { id: overviewId, order: 0 },
        { id: notesId, order: 1 },
        { id: advancedId, order: 2 }
      ]
    });
  });

  it('renames exactly one sibling without changing its identity or ownership', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );

    const result = renameSubPanel(created.state, settingsId, notesId, 'Reference Notes');

    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(6);
    expect(result.state.panels[0]?.subPanels?.[1]).toEqual({
      id: notesId,
      name: 'Reference Notes',
      layoutId: 'two-equal',
      order: 1,
      scrollTop: 0
    });
    expect(result.state.placements).toEqual(created.state.placements);
  });

  it('reorders siblings into contiguous slots while preserving the active identity', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );

    const result = reorderSubPanel(created.state, settingsId, overviewId, 1);

    expect(result.ok).toBe(true);
    expect(result.state.panels[0]).toMatchObject({
      activeSubPanelId: notesId,
      subPanels: [
        { id: notesId, order: 0 },
        { id: overviewId, order: 1 }
      ]
    });
  });

  it('stably appends removed lanes on shrink and never rebalances them on growth', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );

    const shrunk = changeSubPanelLayout(created.state, settingsId, overviewId, 'two-equal');

    expect(shrunk.ok).toBe(true);
    expect(shrunk.state.panels[0]?.subPanels?.[0]?.layoutId).toBe('two-equal');
    expect(shrunk.state.placements[themeId]).toMatchObject({ lane: 0, regionId: 'column-1', order: 0 });
    expect(shrunk.state.placements[readingId]).toMatchObject({ lane: 1, regionId: 'column-2', order: 0 });
    expect(shrunk.state.placements[accessibilityId]).toMatchObject({ lane: 1, regionId: 'column-2', order: 1 });

    const grown = changeSubPanelLayout(shrunk.state, settingsId, overviewId, 'three-equal');
    expect(grown.ok).toBe(true);
    expect(grown.state.placements[readingId]).toMatchObject({ lane: 1, order: 0 });
    expect(grown.state.placements[accessibilityId]).toMatchObject({ lane: 1, order: 1 });
  });

  it('retains an independent scroll position without changing the active sibling', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );

    const result = setSubPanelScroll(created.state, settingsId, overviewId, 480);

    expect(result.ok).toBe(true);
    expect(result.state.panels[0]).toMatchObject({
      activeSubPanelId: notesId,
      subPanels: [
        { id: overviewId, scrollTop: 480 },
        { id: notesId, scrollTop: 0 }
      ]
    });
  });

  it('duplicates layout, Widgets, configuration, placement, and group identity under supplied IDs', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );

    const result = duplicateSubPanel(
      created.state,
      settingsId,
      overviewId,
      { id: advancedId, name: 'Overview Copy', layoutId: 'three-equal', order: 2, scrollTop: 0 },
      {
        widgetIds: {
          [themeId]: copiedThemeId,
          [readingId]: copiedReadingId,
          [accessibilityId]: copiedAccessibilityId
        },
        groupIds: { 'settings-stack': 'settings-stack-copy' }
      }
    );

    expect(result.ok).toBe(true);
    expect(result.state.panels[0]).toMatchObject({
      activeSubPanelId: advancedId,
      subPanels: [
        { id: overviewId, order: 0 },
        { id: notesId, order: 1 },
        { id: advancedId, name: 'Overview Copy', layoutId: 'three-equal', order: 2 }
      ]
    });
    expect(result.state.widgets[copiedThemeId]).toEqual({
      ...created.state.widgets[themeId],
      id: copiedThemeId
    });
    expect(result.state.placements[copiedThemeId]).toEqual({
      ...created.state.placements[themeId],
      subPanelId: advancedId,
      group: { id: 'settings-stack-copy', order: 0, active: true }
    });
    expect(result.state.placements[copiedReadingId]).toEqual({
      ...created.state.placements[readingId],
      subPanelId: advancedId
    });
  });

  it('rejects duplicate target group identities instead of merging distinct source groups', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );
    const withDistinctGroups: WorkbenchState = {
      ...created.state,
      placements: {
        ...created.state.placements,
        [readingId]: {
          kind: 'docked',
          panelId: settingsId,
          subPanelId: overviewId,
          lane: 1,
          regionId: 'column-2',
          shelfId: 'primary',
          order: 0,
          group: { id: 'reading-stack', order: 0, active: true }
        }
      }
    };

    const result = duplicateSubPanel(
      withDistinctGroups,
      settingsId,
      overviewId,
      { id: advancedId, name: 'Overview Copy', layoutId: 'three-equal', order: 2, scrollTop: 0 },
      {
        widgetIds: {
          [themeId]: copiedThemeId,
          [readingId]: copiedReadingId,
          [accessibilityId]: copiedAccessibilityId
        },
        groupIds: {
          'settings-stack': 'shared-copy-group',
          'reading-stack': 'shared-copy-group'
        }
      }
    );

    expect(result).toMatchObject({
      ok: false,
      state: withDistinctGroups,
      error: { code: 'DUPLICATE_ID' }
    });
  });

  it('moves every Widget into the destination layout and appends stably without identity loss', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );
    const withDestination: WorkbenchState = {
      ...created.state,
      widgets: {
        ...created.state.widgets,
        [notesExistingId]: {
          id: notesExistingId,
          type: asWidgetType('settings.notes'),
          manifestVersion: '1.0.0',
          configuration: { retained: true }
        }
      },
      placements: {
        ...created.state.placements,
        [notesExistingId]: {
          kind: 'docked',
          panelId: settingsId,
          subPanelId: notesId,
          lane: 1,
          regionId: 'column-2',
          shelfId: 'primary',
          order: 0
        }
      }
    };

    const result = moveSubPanelWidgets(withDestination, settingsId, overviewId, notesId);

    expect(result.ok).toBe(true);
    expect(result.state.widgets).toEqual(withDestination.widgets);
    expect(result.state.placements[themeId]).toMatchObject({ subPanelId: notesId, lane: 0, order: 0 });
    expect(result.state.placements[readingId]).toMatchObject({ subPanelId: notesId, lane: 1, order: 1 });
    expect(result.state.placements[accessibilityId]).toMatchObject({ subPanelId: notesId, lane: 1, order: 2 });
    expect(Object.values(result.state.placements).some((placement) => (
      (placement.kind === 'shelved' ? placement.lastVisible : placement).subPanelId === overviewId
    ))).toBe(false);
  });

  it('deletes owned Widgets and selects the adjacent sibling when two or more remain', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );
    const withAdvanced = createSubPanel(created.state, settingsId, {
      id: advancedId,
      name: 'Advanced',
      layoutId: 'single',
      order: 2,
      scrollTop: 0
    });

    const result = deleteSubPanel(withAdvanced.state, settingsId, overviewId);

    expect(result.ok).toBe(true);
    expect(result.state.panels[0]).toMatchObject({
      activeSubPanelId: notesId,
      subPanels: [
        { id: notesId, order: 0 },
        { id: advancedId, order: 1 }
      ]
    });
    expect(result.state.widgets[themeId]).toBeUndefined();
    expect(result.state.widgets[readingId]).toBeUndefined();
    expect(result.state.widgets[accessibilityId]).toBeUndefined();
    expect(result.state.placements[themeId]).toBeUndefined();
  });

  it('deterministically flattens the last sibling and removes all sub-panel ownership', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );

    const result = deleteSubPanel(created.state, settingsId, notesId);

    expect(result.ok).toBe(true);
    expect(result.state.revision).toBe(6);
    expect(result.state.panels[0]).toEqual({
      id: settingsId,
      name: 'Settings',
      templateId: 'columns.v1',
      order: 0
    });
    expect(result.state.widgets).toEqual(created.state.widgets);
    expect(result.state.placements[themeId]).toEqual({
      ...flatSettings().placements[themeId],
      regionId: 'column-1'
    });
    expect(result.state.placements[accessibilityId]).toEqual({
      ...flatSettings().placements[accessibilityId],
      regionId: 'column-3'
    });
  });

  it('normalizes hostile persisted metadata and lanes without losing valid Widgets', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );
    const hostile = {
      ...created.state,
      panels: [{
        ...created.state.panels[0],
        activeSubPanelId: 'settings-missing',
        subPanels: [
          {
            id: overviewId,
            name: 'Overview',
            layoutId: 'unknown-layout',
            order: 9,
            scrollTop: -4,
            subPanels: []
          },
          { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 9, scrollTop: 0, hidden: true }
        ]
      }],
      placements: {
        ...created.state.placements,
        [themeId]: { ...created.state.placements[themeId], lane: 99 },
        [readingId]: {
          ...created.state.placements[readingId],
          subPanelId: 'settings-missing',
          lane: 8
        },
        [accessibilityId]: {
          ...created.state.placements[accessibilityId],
          lane: undefined
        }
      }
    } as unknown as WorkbenchState;

    const normalized = normalizeSubPanels(hostile);

    expect(() => WorkbenchStateSchema.parse(normalized)).not.toThrow();
    expect(normalized.revision).toBe(created.state.revision);
    expect(normalized.widgets).toEqual(created.state.widgets);
    expect(normalized.panels[0]).toMatchObject({
      activeSubPanelId: overviewId,
      subPanels: [
        { id: overviewId, layoutId: 'single', order: 0, scrollTop: 0 },
        { id: notesId, layoutId: 'two-equal', order: 1, scrollTop: 0, hidden: true }
      ]
    });
    expect(normalized.placements[themeId]).toMatchObject({ subPanelId: overviewId, lane: 0 });
    expect(normalized.placements[readingId]).toMatchObject({ subPanelId: overviewId, lane: 0 });
    expect(normalized.placements[accessibilityId]).toMatchObject({ subPanelId: overviewId, lane: 0 });
  });

  it('normalizes dock order independently for sibling owners sharing a legacy region and shelf', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );
    const placements = normalizeDockOrders({
      ...created.state.placements,
      [notesExistingId]: {
        kind: 'docked',
        panelId: settingsId,
        subPanelId: notesId,
        lane: 0,
        regionId: 'column-1',
        shelfId: 'primary',
        order: 0
      }
    });

    expect(placements[themeId]).toMatchObject({ subPanelId: overviewId, order: 0 });
    expect(placements[notesExistingId]).toMatchObject({ subPanelId: notesId, order: 0 });
  });

  it('rejects cross-sibling grouping even when Panel, region, and shelf match', () => {
    const created = createSubPanel(
      flatSettings(),
      settingsId,
      { id: notesId, name: 'Notes', layoutId: 'two-equal', order: 1, scrollTop: 0 },
      { id: overviewId, name: 'Overview', layoutId: 'three-equal', order: 0, scrollTop: 96 }
    );
    const withNotesWidget: WorkbenchState = {
      ...created.state,
      widgets: {
        ...created.state.widgets,
        [notesExistingId]: {
          id: notesExistingId,
          type: asWidgetType('settings.notes'),
          manifestVersion: '1.0.0',
          configuration: {}
        }
      },
      placements: {
        ...created.state.placements,
        [notesExistingId]: {
          kind: 'docked', panelId: settingsId, subPanelId: notesId, lane: 0,
          regionId: 'column-1', shelfId: 'primary', order: 0
        }
      }
    };

    const result = mergeWidgetGroup(withNotesWidget, themeId, notesExistingId, 'cross-owner');
    expect(result.ok).toBe(false);
    expect(result.state).toBe(withNotesWidget);
    expect(!result.ok && result.error.code).toBe('INVALID_PLACEMENT');
  });
});
