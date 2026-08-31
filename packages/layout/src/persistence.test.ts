import { describe, expect, it } from 'vitest';

import {
  asPanelId,
  asSubPanelId,
  asWidgetInstanceId,
  asWidgetType,
  WorkbenchStateSchema,
  type LayoutStorage,
  type WorkbenchState
} from '@pomegranate-ui/contracts';

import {
  decodeLayoutSnapshot,
  encodeLayoutSnapshot,
  loadLayout,
  saveLayout
} from './index.js';

const sceneId = asPanelId('scene');
const libraryId = asPanelId('library');
const summaryId = asWidgetInstanceId('summary');
const missingRendererId = asWidgetInstanceId('extension-widget');
const overviewId = asSubPanelId('scene-overview');
const notesId = asSubPanelId('scene-notes');

function populatedState(): WorkbenchState {
  return {
    schema: 'pomegranate.ui.state.v2',
    revision: 12,
    activePanelId: sceneId,
    panels: [
      { id: sceneId, name: 'Scene', templateId: 'standard', order: 0, configuration: { z: 1, a: 2 } },
      { id: libraryId, name: 'Library', templateId: 'library', order: 1 }
    ],
    shelves: [{ id: 'primary', panelId: sceneId, regionId: 'left', order: 0, weight: 1 }],
    widgets: {
      [missingRendererId]: {
        id: missingRendererId,
        type: asWidgetType('extension.not-installed'),
        manifestVersion: '4.2.0',
        configuration: { enabled: true }
      },
      [summaryId]: {
        id: summaryId,
        type: asWidgetType('story.summary'),
        manifestVersion: '1.0.0',
        configuration: { nested: { z: 1, a: 2 }, density: 'compact' }
      }
    },
    placements: {
      [missingRendererId]: {
        kind: 'floating',
        panelId: libraryId,
        x: -10.5,
        y: 20.25,
        width: 420,
        height: 240,
        z: 3
      },
      [summaryId]: {
        kind: 'docked',
        panelId: sceneId,
        regionId: 'left',
        shelfId: 'primary',
        order: 0
      }
    }
  };
}

function expectEncoded(state: WorkbenchState): string {
  const encoded = encodeLayoutSnapshot(state);
  if (!encoded.ok) throw new Error(encoded.error.message);
  expect(encoded.ok).toBe(true);
  return encoded.value;
}

function populatedSubPanelState(): WorkbenchState {
  const base = populatedState();
  return {
    ...base,
    panels: base.panels.map((panel) => panel.id === sceneId
      ? {
          ...panel,
          activeSubPanelId: notesId,
          subPanels: [
            { id: overviewId, name: 'Overview', layoutId: 'single' as const, order: 0, scrollTop: 144 },
            { id: notesId, name: 'Notes', layoutId: 'two-equal' as const, order: 1, scrollTop: 28 }
          ]
        }
      : panel),
    placements: {
      ...base.placements,
      [summaryId]: {
        kind: 'docked',
        panelId: sceneId,
        subPanelId: overviewId,
        lane: 0,
        regionId: 'left',
        shelfId: 'primary',
        order: 0
      }
    }
  };
}

describe('layout persistence', () => {
  it('round-trips sub-panel metadata and placement ownership through the versioned snapshot', () => {
    const state = populatedSubPanelState();

    expect(WorkbenchStateSchema.safeParse(state).success).toBe(true);
    const encoded = expectEncoded(state);
    expect(JSON.parse(encoded).schema).toBe('pomegranate.ui.layout.v3');
    const decoded = decodeLayoutSnapshot(encoded, populatedState());

    expect(decoded.ok).toBe(true);
    expect(decoded.state.panels[0]).toMatchObject({
      activeSubPanelId: notesId,
      subPanels: [
        { id: overviewId, layoutId: 'single', scrollTop: 144 },
        { id: notesId, layoutId: 'two-equal', scrollTop: 28 }
      ]
    });
    expect(decoded.state.placements[summaryId]).toMatchObject({ subPanelId: overviewId, lane: 0 });
    expect(expectEncoded(decoded.state)).toBe(encoded);
  });

  it('normalizes recoverable sub-panel corruption without discarding valid Widgets', () => {
    const state = populatedSubPanelState();
    const hostile = JSON.parse(expectEncoded(state));
    hostile.panels[0].activeSubPanelId = 'scene-missing';
    hostile.panels[0].subPanels[0].layoutId = 'unknown-layout';
    hostile.panels[0].subPanels[0].scrollTop = -50;
    hostile.panels[0].subPanels[0].subPanels = [];
    hostile.placements[summaryId].subPanelId = 'scene-missing';
    hostile.placements[summaryId].lane = 99;

    const decoded = decodeLayoutSnapshot(JSON.stringify(hostile), populatedState());

    if (!decoded.ok) throw new Error(decoded.error.message);
    expect(decoded.ok).toBe(true);
    expect(decoded.state.widgets).toEqual(state.widgets);
    expect(decoded.state.panels[0]).toMatchObject({
      activeSubPanelId: overviewId,
      subPanels: [
        { id: overviewId, layoutId: 'single', order: 0, scrollTop: 0 },
        { id: notesId, layoutId: 'two-equal', order: 1, scrollTop: 28 }
      ]
    });
    expect(decoded.state.placements[summaryId]).toMatchObject({ subPanelId: overviewId, lane: 0 });
  });

  it('encodes deterministically across record and JSON object insertion order', () => {
    const first = populatedState();
    const second: WorkbenchState = {
      ...first,
      panels: [
        { ...first.panels[0]!, configuration: { a: 2, z: 1 } },
        first.panels[1]!
      ],
      widgets: {
        [summaryId]: {
          ...first.widgets[summaryId]!,
          configuration: { density: 'compact', nested: { a: 2, z: 1 } }
        },
        [missingRendererId]: first.widgets[missingRendererId]!
      },
      placements: {
        [summaryId]: first.placements[summaryId]!,
        [missingRendererId]: first.placements[missingRendererId]!
      }
    };
    expect(expectEncoded(second)).toBe(expectEncoded(first));
  });

  it('keeps encode/decode/encode byte-stable and builds null-prototype records', () => {
    const encoded = expectEncoded(populatedState());
    const decoded = decodeLayoutSnapshot(encoded, populatedState());
    expect(decoded.ok).toBe(true);
    if (!decoded.ok) return;
    expect(Object.getPrototypeOf(decoded.state.widgets)).toBeNull();
    expect(Object.getPrototypeOf(decoded.state.placements)).toBeNull();
    expect(expectEncoded(decoded.state)).toBe(encoded);
  });

  it('retains unresolved Widget types without requiring a renderer registry', () => {
    const decoded = decodeLayoutSnapshot(expectEncoded(populatedState()), populatedState());
    expect(decoded.ok).toBe(true);
    expect(decoded.state.widgets[missingRendererId]?.type).toBe('extension.not-installed');
  });

  it('normalizes Panel and dock order during hydration', () => {
    const source = JSON.parse(expectEncoded(populatedState()));
    source.panels.reverse();
    source.panels[0].order = 8;
    source.panels[1].order = 4;
    source.placements[summaryId].order = 19;
    const decoded = decodeLayoutSnapshot(JSON.stringify(source), populatedState());
    expect(decoded.ok).toBe(true);
    expect(decoded.state.panels.map((panel) => panel.order)).toEqual([0, 1]);
    expect(decoded.state.placements[summaryId]).toMatchObject({ order: 0 });
  });

  it('keeps the last good state when hydration is invalid', () => {
    const before = populatedState();
    for (const raw of [
      '{"schema":"future.v9"}',
      JSON.stringify({
        ...JSON.parse(expectEncoded(before)),
        placements: {
          [summaryId]: { ...before.placements[summaryId], panelId: 'missing' },
          [missingRendererId]: before.placements[missingRendererId]
        }
      }),
      JSON.stringify({
        ...JSON.parse(expectEncoded(before)),
        placements: {
          ...before.placements,
          [missingRendererId]: {
            kind: 'floating', panelId: libraryId, x: 0, y: 0, width: Infinity, height: 20, z: 0
          }
        }
      })
    ]) {
      const decoded = decodeLayoutSnapshot(raw, before);
      expect(decoded.ok).toBe(false);
      expect(decoded.state).toBe(before);
      expect(!decoded.ok && decoded.error.code).toBe('INVALID_SNAPSHOT');
    }
  });

  it('saves and loads only through asynchronous adopter storage', async () => {
    const values = new Map<string, string>();
    const storage: LayoutStorage = {
      async load(key) { return values.get(key) ?? null; },
      async save(key, value) { values.set(key, value); }
    };
    const state = populatedState();
    const saved = await saveLayout(storage, 'primary', state);
    expect(saved.ok).toBe(true);
    expect(values.get('primary')).toBe(expectEncoded(state));

    const loaded = await loadLayout(storage, 'primary', { ...state, revision: 99 });
    expect(loaded.ok).toBe(true);
    expect(loaded.state.revision).toBe(12);
  });

  it('returns named results rather than throwing on storage failure', async () => {
    const storage: LayoutStorage = {
      async load() { throw new Error('offline'); },
      async save() { throw new Error('offline'); }
    };
    const before = populatedState();
    const loaded = await loadLayout(storage, 'primary', before);
    const saved = await saveLayout(storage, 'primary', before);
    expect(loaded.ok).toBe(false);
    expect(saved.ok).toBe(false);
    expect(!loaded.ok && loaded.error.code).toBe('INTERNAL_ERROR');
    expect(!saved.ok && saved.error.code).toBe('INTERNAL_ERROR');
    expect(loaded.state).toBe(before);
    expect(saved.state).toBe(before);
  });
});
