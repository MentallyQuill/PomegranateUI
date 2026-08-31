import { describe, expect, it } from 'vitest';
import { asWidgetType } from '@pomegranate-ui/contracts';

import { IMPLEMENTED_SURFACE_TOTALS, IMPLEMENTED_SURFACES } from './implemented-surfaces.js';
import { SURFACE_FIXTURES } from './surface-fixtures.js';
import { createLabState, LAB_PANEL_IDS } from './state.js';
import { createLabRuntime } from './widgets.js';

describe('implemented Deep Current surface boundary', () => {
  it('ships the authoritative six Settings sub-panels with exact Widget membership and lanes', () => {
    const state = createLabState();
    const settings = state.panels.find((panel) => panel.id === LAB_PANEL_IDS.settings);
    expect(settings).toMatchObject({
      activeSubPanelId: 'settings-account-access',
      subPanels: [
        { id: 'settings-account-access', name: 'Account and Access', layoutId: 'two-equal', order: 0 },
        { id: 'settings-ai-models', name: 'AI and Models', layoutId: 'two-equal', order: 1 },
        { id: 'settings-appearance-accessibility', name: 'Appearance and Accessibility', layoutId: 'three-equal', order: 2 },
        { id: 'settings-story-content', name: 'Story Defaults and Content', layoutId: 'two-equal', order: 3 },
        { id: 'settings-data-extensions-maintenance', name: 'Data, Extensions, and Maintenance', layoutId: 'wide-left', order: 4 },
        { id: 'settings-advanced', name: 'Advanced', layoutId: 'single', order: 5 }
      ]
    });

    const actual = Object.entries(state.placements)
      .flatMap(([instanceId, placement]) => {
        const visible = placement.kind === 'shelved' ? placement.lastVisible : placement;
        const widget = state.widgets[instanceId];
        return visible.panelId === LAB_PANEL_IDS.settings && widget
          ? [`${visible.subPanelId}|${visible.kind === 'docked' ? visible.lane : '-'}|${visible.kind === 'docked' ? visible.order : '-'}|${widget.type}`]
          : [];
      })
      .sort();
    expect(actual).toEqual([
      'settings-account-access|0|0|settings.provider-credentials',
      'settings-account-access|1|0|settings.connections',
      'settings-advanced|0|0|settings.prompt-editor',
      'settings-advanced|0|1|settings.raw-story-data',
      'settings-ai-models|0|0|settings.model-assignments',
      'settings-ai-models|1|0|settings.default-model',
      'settings-ai-models|1|1|settings.memory-search-model',
      'settings-appearance-accessibility|0|0|settings.theme',
      'settings-appearance-accessibility|0|1|settings.custom-theme',
      'settings-appearance-accessibility|1|0|settings.reading-layout',
      'settings-appearance-accessibility|1|1|settings.sound-motion',
      'settings-appearance-accessibility|2|0|settings.accessibility',
      'settings-data-extensions-maintenance|0|0|settings.add-ons',
      'settings-data-extensions-maintenance|1|0|settings.maintenance',
      'settings-story-content|0|0|settings.content',
      'settings-story-content|1|0|settings.narrator-voice',
      'settings-story-content|1|1|settings.living-world-controls'
    ].sort());
  });

  it('freezes the exact 52 reviewed Widget identities and family totals', () => {
    expect(IMPLEMENTED_SURFACES).toHaveLength(52);
    expect(new Set(IMPLEMENTED_SURFACES.map(({ type }) => type)).size).toBe(52);
    expect(IMPLEMENTED_SURFACE_TOTALS).toEqual({ settings: 8, story: 12, library: 19, systems: 13 });
    expect(Object.isFrozen(IMPLEMENTED_SURFACES)).toBe(true);
    expect(IMPLEMENTED_SURFACES.every(Object.isFrozen)).toBe(true);
  });

  it('keeps exact manifest title parity at both ends of every reviewed family', () => {
    expect(IMPLEMENTED_SURFACES.map(({ type, title }) => `${type}|${title}`)).toEqual(expect.arrayContaining([
      'settings.provider-credentials|Provider Credentials',
      'settings.prompt-editor|Prompt Editor',
      'story.transcript|Transcript',
      'runtime.background-work|Background Work',
      'library.workspace|Library',
      'library.lived-location-builder|Lived-in Location Builder',
      'systems.cast|Cast',
      'systems.character-relationships|Character Relationships'
    ]));
  });

  it('gives every reviewed identity one state-aware fixture and specialized renderer', () => {
    const runtime = createLabRuntime();
    expect(SURFACE_FIXTURES.size).toBe(52);
    for (const surface of IMPLEMENTED_SURFACES) {
      const fixture = SURFACE_FIXTURES.get(surface.type);
      expect(fixture?.states).toContain('ready');
      expect(fixture?.states).toContain('failure');
      expect(runtime.rendererRegistry.get(surface.type)).toBeDefined();
    }
  });

  it('keeps an explicit unavailable fallback for a non-implemented Catalog identity', () => {
    const runtime = createLabRuntime();
    expect(runtime.rendererRegistry.get(asWidgetType('systems.temporal-ledger'))).toBeUndefined();
  });
});
