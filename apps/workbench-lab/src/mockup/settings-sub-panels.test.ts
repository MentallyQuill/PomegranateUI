import { describe, expect, it } from 'vitest';

import {
  asPanelId,
  asWidgetInstanceId,
  asWidgetType,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import { createLabState, LAB_PANEL_IDS } from './state.js';
import { upgradeFlatSettingsPanel, upgradeThemeAuthoringWidgets } from './settings-sub-panels.js';

const settingsId = asPanelId('settings');
const knownId = asWidgetInstanceId('known-theme');
const extensionId = asWidgetInstanceId('mythic-settings');
const unmatchedId = asWidgetInstanceId('future-settings');

function legacyFlatSettings(): WorkbenchState {
  return {
    schema: 'pomegranate.ui.state.v2',
    revision: 42,
    activePanelId: settingsId,
    panels: [{ id: settingsId, name: 'Settings', templateId: 'columns.v1', order: 0 }],
    shelves: [
      { id: 'primary', panelId: settingsId, regionId: 'column-1', order: 0, weight: 1 },
      { id: 'primary', panelId: settingsId, regionId: 'column-2', order: 0, weight: 1 },
      { id: 'primary', panelId: settingsId, regionId: 'column-3', order: 0, weight: 1 }
    ],
    widgets: {
      [knownId]: {
        id: knownId,
        type: asWidgetType('settings.theme'),
        manifestVersion: '1.0.0',
        configuration: { edited: true }
      },
      [extensionId]: {
        id: extensionId,
        type: asWidgetType('ext:mythic:settings'),
        manifestVersion: '3.0.0',
        configuration: { campaign: 'kept' }
      },
      [unmatchedId]: {
        id: unmatchedId,
        type: asWidgetType('settings.future-control'),
        manifestVersion: '2.0.0',
        configuration: { draft: 7 }
      }
    },
    placements: {
      [knownId]: { kind: 'docked', panelId: settingsId, regionId: 'column-1', shelfId: 'primary', order: 0 },
      [extensionId]: { kind: 'docked', panelId: settingsId, regionId: 'column-2', shelfId: 'primary', order: 0 },
      [unmatchedId]: { kind: 'docked', panelId: settingsId, regionId: 'column-3', shelfId: 'primary', order: 0 }
    }
  };
}

describe('shipped Settings sub-panel migration', () => {
  it('retains identities and configurations while routing known, extension, and unmatched Widgets', () => {
    const before = legacyFlatSettings();
    const migrated = upgradeFlatSettingsPanel(before);

    expect(migrated.revision).toBe(42);
    expect(migrated.widgets).toEqual(before.widgets);
    expect(migrated.placements[knownId]).toMatchObject({
      subPanelId: 'settings-appearance-accessibility',
      lane: 0,
      order: 0
    });
    expect(migrated.placements[extensionId]).toMatchObject({
      subPanelId: 'settings-data-extensions-maintenance',
      lane: 0,
      order: 1
    });
    expect(migrated.placements[unmatchedId]).toMatchObject({
      subPanelId: 'settings-advanced',
      lane: 0,
      order: 2
    });
    expect(upgradeFlatSettingsPanel(migrated)).toBe(migrated);
  });

  it('ships one shared Theme Materials Widget in Scene and all five authoring elements in Settings', () => {
    const state = createLabState();
    const typesIn = (panelId: string) => Object.entries(state.placements).flatMap(([id, placement]) => {
      const visible = placement.kind === 'shelved' ? placement.lastVisible : placement;
      return visible.panelId === panelId ? [state.widgets[id]?.type] : [];
    });

    expect(typesIn(LAB_PANEL_IDS.scene)).toContain('settings.theme-materials');
    expect(typesIn(LAB_PANEL_IDS.scene)).not.toContain('settings.custom-theme');
    expect(typesIn(LAB_PANEL_IDS.settings).filter((type) => [
      'settings.custom-theme',
      'settings.theme-colors',
      'settings.theme-materials',
      'settings.theme-canvas',
      'settings.theme-ambient'
    ].includes(type ?? ''))).toEqual(expect.arrayContaining([
      'settings.custom-theme',
      'settings.theme-colors',
      'settings.theme-materials',
      'settings.theme-canvas',
      'settings.theme-ambient'
    ]));
  });

  it('upgrades only the shipped Scene monolith, preserves user Custom Theme Widgets, and inserts Settings elements once', () => {
    const source = createLabState();
    const legacyId = asWidgetInstanceId('scene-theme-settings');
    const userId = asWidgetInstanceId('user-custom-theme');
    const legacy: WorkbenchState = {
      ...source,
      widgets: {
        ...source.widgets,
        [legacyId]: { id: legacyId, type: asWidgetType('settings.custom-theme'), manifestVersion: '1.0.0', configuration: { presentation: 'compact' } },
        [userId]: { id: userId, type: asWidgetType('settings.custom-theme'), manifestVersion: '1.0.0', configuration: { userOwned: true } }
      },
      placements: {
        ...source.placements,
        [legacyId]: { kind: 'docked', panelId: LAB_PANEL_IDS.scene, regionId: 'left', shelfId: 'primary', order: 1 },
        [userId]: { kind: 'docked', panelId: LAB_PANEL_IDS.scene, regionId: 'right', shelfId: 'primary', order: 9 }
      }
    };

    const migrated = upgradeThemeAuthoringWidgets(legacy);
    expect(migrated.widgets[legacyId]).toMatchObject({ type: 'settings.theme-materials', configuration: {} });
    expect(migrated.widgets[userId]).toEqual(legacy.widgets[userId]);
    for (const type of ['settings.theme-colors', 'settings.theme-materials', 'settings.theme-canvas', 'settings.theme-ambient']) {
      expect(Object.values(migrated.widgets).filter((widget) => widget.type === type && migrated.placements[widget.id]?.panelId === LAB_PANEL_IDS.settings)).toHaveLength(1);
    }
    expect(upgradeThemeAuthoringWidgets(migrated)).toBe(migrated);
  });
});
