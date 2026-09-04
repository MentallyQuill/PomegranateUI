import { describe, expect, it } from 'vitest';

import {
  LayoutSnapshotV1Schema,
  WidgetManifestSchema,
  WorkbenchCommandSchema,
  WorkbenchStateSchema,
  asPanelId,
  asWidgetInstanceId,
  asWidgetType,
  isJsonValue,
  type LayoutStorage,
  type WorkbenchCommand,
  type WorkbenchState
} from './index.js';

const panelId = asPanelId('scene');
const widgetId = asWidgetInstanceId('summary-1');
const widgetType = asWidgetType('story.summary');

const state: WorkbenchState = {
  schema: 'pomegranate.ui.state.v2',
  revision: 0,
  activePanelId: panelId,
  panels: [{ id: panelId, name: 'Scene', templateId: 'standard', order: 0 }],
  shelves: [{ id: 'primary', panelId, regionId: 'left', order: 0, weight: 1 }],
  widgets: {
    [widgetId]: {
      id: widgetId,
      type: widgetType,
      manifestVersion: '1.0.0',
      configuration: { density: 'compact' }
    }
  },
  placements: {
    [widgetId]: {
      kind: 'docked',
      panelId,
      regionId: 'left',
      shelfId: 'primary',
      order: 0
    }
  }
};

describe('public contracts', () => {
  it('exports exact version discriminants for separated theme targets', async () => {
    const contracts = await import('./index.js') as Record<string, unknown>;
    expect(contracts.THEME_SCHEMA_VERSION_V3).toBe('pomegranate.ui.theme.v3');
    expect(contracts.CANVAS_SCHEMA_VERSION).toBe('pomegranate.ui.canvas.v1');
    expect(contracts.AMBIENT_SCHEMA_VERSION).toBe('pomegranate.ui.ambient.v1');
    expect(contracts.THEME_TARGET_SCHEMA_VERSION).toBe('pomegranate.ui.theme-target.v1');
    expect(contracts.THEME_DRAFT_SCHEMA_VERSION).toBe('pomegranate.ui.theme-draft.v2');
    expect(contracts.PERSISTED_THEME_DRAFT_SCHEMA_VERSION).toBe('pomegranate.ui.persisted-theme-draft.v2');
    expect(typeof (contracts.ThemeTargetBundleSchema as { safeParse?: unknown } | undefined)?.safeParse).toBe('function');
    expect(typeof (contracts.PersistedThemeDraftSchema as { safeParse?: unknown } | undefined)?.safeParse).toBe('function');
  });

  it('rejects blank or padded public ids without trimming them', () => {
    expect(() => asPanelId('  ')).toThrow(/PanelId/);
    expect(() => asWidgetInstanceId('summary-1 ')).toThrow(/WidgetInstanceId/);
    expect(asWidgetType('story.summary')).toBe('story.summary');
  });

  it('admits only JSON-safe values', () => {
    expect(isJsonValue({ safe: ['yes', 1, true, null] })).toBe(true);
    expect(isJsonValue({ unsafe: new Date() })).toBe(false);
    expect(isJsonValue({ unsafe: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isJsonValue({ unsafe: undefined })).toBe(false);
    expect(isJsonValue(Object.create(null))).toBe(true);
  });

  it('validates manifests and their JSON-safe defaults', () => {
    const parsed = WidgetManifestSchema.parse({
      type: widgetType,
      version: '1.0.0',
      title: 'Story summary',
      capabilities: ['story.read'],
      defaultConfiguration: { density: 'compact' },
      defaultPlacement: { kind: 'docked', regionRole: 'left-instruments', shelfId: 'primary' }
    });
    expect(parsed.type).toBe(widgetType);
    expect(() => WidgetManifestSchema.parse({ ...parsed, defaultConfiguration: { unsafe: 1n } })).toThrow();
  });

  it('validates optional Widget Catalog metadata', () => {
    const parsed = WidgetManifestSchema.parse({
      type: widgetType,
      version: '1.0.0',
      title: 'Story transcript',
      capabilities: ['story.read'],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'stage', shelfId: 'primary' },
      catalog: {
        category: 'story',
        purpose: 'Read the current story transcript.',
        keywords: ['story', 'transcript'],
        iconKey: 'story.transcript',
        shape: 'stage',
        multiplicity: 'single',
        minColumns: 2,
        geometry: { minHeight: 320, idealHeight: 560, maxHeight: 720 },
        supportedStates: ['ready', 'loading', 'failure']
      }
    });

    expect(parsed.catalog).toEqual({
      category: 'story',
      purpose: 'Read the current story transcript.',
      keywords: ['story', 'transcript'],
      iconKey: 'story.transcript',
      shape: 'stage',
      multiplicity: 'single',
      minColumns: 2,
      geometry: { minHeight: 320, idealHeight: 560, maxHeight: 720 },
      supportedStates: ['ready', 'loading', 'failure']
    });
  });

  it('rejects duplicate Widget Catalog keywords', () => {
    const parsed = WidgetManifestSchema.safeParse({
      type: widgetType,
      version: '1.0.0',
      title: 'Story transcript',
      capabilities: ['story.read'],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'stage', shelfId: 'primary' },
      catalog: {
        category: 'story',
        purpose: 'Read the current story transcript.',
        keywords: ['story', 'story'],
        iconKey: 'story.transcript',
        shape: 'stage',
        multiplicity: 'single',
        minColumns: 2,
        geometry: { minHeight: 320, idealHeight: 560, maxHeight: 720 },
        supportedStates: ['ready']
      }
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects inverted Widget Catalog geometry', () => {
    const parsed = WidgetManifestSchema.safeParse({
      type: widgetType,
      version: '1.0.0',
      title: 'Story transcript',
      capabilities: ['story.read'],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'stage', shelfId: 'primary' },
      catalog: {
        category: 'story',
        purpose: 'Read the current story transcript.',
        keywords: ['story'],
        iconKey: 'story.transcript',
        shape: 'stage',
        multiplicity: 'single',
        minColumns: 2,
        geometry: { minHeight: 720, idealHeight: 560, maxHeight: 320 },
        supportedStates: ['ready']
      }
    });

    expect(parsed.success).toBe(false);
  });

  it('rejects duplicate Widget Catalog states', () => {
    const parsed = WidgetManifestSchema.safeParse({
      type: widgetType,
      version: '1.0.0',
      title: 'Story transcript',
      capabilities: ['story.read'],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'stage', shelfId: 'primary' },
      catalog: {
        category: 'story',
        purpose: 'Read the current story transcript.',
        keywords: ['story'],
        iconKey: 'story.transcript',
        shape: 'stage',
        multiplicity: 'single',
        minColumns: 2,
        geometry: { minHeight: 320, idealHeight: 560, maxHeight: 720 },
        supportedStates: ['ready', 'ready']
      }
    });

    expect(parsed.success).toBe(false);
  });

  it('requires a valid Widget Catalog multiplicity', () => {
    const metadata = {
      category: 'story',
      purpose: 'Read the current story transcript.',
      keywords: ['story', 'transcript'],
      iconKey: 'story.transcript',
      shape: 'stage',
      multiplicity: 'single',
      minColumns: 2,
      geometry: { minHeight: 320, idealHeight: 560, maxHeight: 720 },
      supportedStates: ['ready']
    } as const;
    const manifest = {
      type: widgetType,
      version: '1.0.0',
      title: 'Story transcript',
      capabilities: ['story.read'],
      defaultConfiguration: {},
      defaultPlacement: { kind: 'docked', regionRole: 'stage', shelfId: 'primary' }
    } as const;

    expect(WidgetManifestSchema.parse({ ...manifest, catalog: metadata }).catalog?.multiplicity).toBe('single');
    expect(WidgetManifestSchema.safeParse({ ...manifest, catalog: { ...metadata, multiplicity: 'many' } }).success).toBe(false);
    const { multiplicity: _multiplicity, ...withoutMultiplicity } = metadata;
    expect(WidgetManifestSchema.safeParse({ ...manifest, catalog: withoutMultiplicity }).success).toBe(false);
  });

  it('uses exact state and snapshot schema discriminants', () => {
    expect(WorkbenchStateSchema.parse(state).schema).toBe('pomegranate.ui.state.v2');
    expect(LayoutSnapshotV1Schema.parse({
      schema: 'pomegranate.ui.layout.v1',
      revision: state.revision,
      activePanelId: state.activePanelId,
      panels: state.panels,
      widgets: state.widgets,
      placements: {
        [widgetId]: { kind: 'docked', panelId, edge: 'left', shelfId: 'primary', order: 0 }
      }
    }).schema).toBe('pomegranate.ui.layout.v1');
    expect(LayoutSnapshotV1Schema.safeParse({ schema: 'future.v9' }).success).toBe(false);
  });

  it('parses one-level Panel sub-panels with an exact active owner and Widget lane', () => {
    const settingsId = asPanelId('settings');
    const parsed = WorkbenchStateSchema.parse({
      ...state,
      activePanelId: settingsId,
      panels: [{
        id: settingsId,
        name: 'Settings',
        templateId: 'columns.v1',
        order: 0,
        activeSubPanelId: 'settings-account-access',
        subPanels: [
          {
            id: 'settings-account-access',
            name: 'Account and Access',
            layoutId: 'two-equal',
            order: 0,
            scrollTop: 18,
            shipped: true
          },
          {
            id: 'settings-ai-models',
            name: 'AI and Models',
            layoutId: 'two-equal',
            order: 1,
            scrollTop: 0
          }
        ]
      }],
      shelves: [{ id: 'primary', panelId: settingsId, regionId: 'column-1', order: 0, weight: 1 }],
      placements: {
        [widgetId]: {
          kind: 'docked',
          panelId: settingsId,
          subPanelId: 'settings-account-access',
          lane: 1,
          regionId: 'column-1',
          shelfId: 'primary',
          order: 0
        }
      }
    });

    expect(parsed.panels[0]).toMatchObject({
      activeSubPanelId: 'settings-account-access',
      subPanels: [
        { id: 'settings-account-access', layoutId: 'two-equal', order: 0, scrollTop: 18 },
        { id: 'settings-ai-models', layoutId: 'two-equal', order: 1, scrollTop: 0 }
      ]
    });
    expect(parsed.placements[widgetId]).toMatchObject({
      subPanelId: 'settings-account-access',
      lane: 1
    });
  });

  it('rejects incomplete or unknown active sub-panel ownership', () => {
    const base = {
      id: asPanelId('settings'),
      name: 'Settings',
      templateId: 'columns.v1',
      order: 0
    };
    const sibling = {
      id: 'settings-account-access',
      name: 'Account and Access',
      layoutId: 'two-equal',
      order: 0,
      scrollTop: 0
    };

    expect(WorkbenchStateSchema.safeParse({
      ...state,
      panels: [{ ...base, activeSubPanelId: 'settings-account-access' }]
    }).success).toBe(false);
    expect(WorkbenchStateSchema.safeParse({
      ...state,
      panels: [{ ...base, subPanels: [sibling] }]
    }).success).toBe(false);
    expect(WorkbenchStateSchema.safeParse({
      ...state,
      panels: [{ ...base, activeSubPanelId: 'settings-missing', subPanels: [sibling] }]
    }).success).toBe(false);
  });

  it('rejects duplicate sub-panel identities or order slots', () => {
    const settingsId = asPanelId('settings');
    const sibling = {
      id: 'settings-account-access',
      name: 'Account and Access',
      layoutId: 'two-equal',
      order: 0,
      scrollTop: 0
    };
    const panel = {
      id: settingsId,
      name: 'Settings',
      templateId: 'columns.v1',
      order: 0,
      activeSubPanelId: sibling.id
    };

    expect(WorkbenchStateSchema.safeParse({
      ...state,
      panels: [{ ...panel, subPanels: [sibling, { ...sibling, name: 'Duplicate identity', order: 1 }] }]
    }).success).toBe(false);
    expect(WorkbenchStateSchema.safeParse({
      ...state,
      panels: [{ ...panel, subPanels: [sibling, { ...sibling, id: 'settings-ai-models', name: 'AI and Models' }] }]
    }).success).toBe(false);
  });

  it('requires docked sub-panel ownership and lane to travel together', () => {
    const placement = {
      kind: 'docked',
      panelId: asPanelId('settings'),
      regionId: 'column-1',
      shelfId: 'primary',
      order: 0
    };

    expect(WorkbenchCommandSchema.safeParse({
      type: 'widget.place',
      instanceId: widgetId,
      placement: { ...placement, subPanelId: 'settings-account-access' }
    }).success).toBe(false);
    expect(WorkbenchCommandSchema.safeParse({
      type: 'widget.place',
      instanceId: widgetId,
      placement: { ...placement, lane: 0 }
    }).success).toBe(false);
  });

  it('parses persistent column weights and bounded docked row heights', () => {
    const parsed = WorkbenchStateSchema.parse({
      ...state,
      panels: [{
        ...state.panels[0],
        columnWeights: [0.65, 0.35],
        activeSubPanelId: 'settings-appearance',
        subPanels: [{
          id: 'settings-appearance', name: 'Appearance', layoutId: 'three-equal', order: 0, scrollTop: 0,
          columnWeights: [0.2, 0.5, 0.3]
        }]
      }],
      placements: {
        [widgetId]: { ...state.placements[widgetId], subPanelId: 'settings-appearance', lane: 0, height: 284 }
      }
    });

    expect(parsed.panels[0]).toMatchObject({
      columnWeights: [0.65, 0.35],
      subPanels: [{ columnWeights: [0.2, 0.5, 0.3] }]
    });
    expect(parsed.placements[widgetId]).toMatchObject({ height: 284 });
    expect(WorkbenchStateSchema.safeParse({
      ...state,
      panels: [{ ...state.panels[0], columnWeights: [1, 0] }]
    }).success).toBe(false);
  });

  it('parses column and Widget row resize commands with strict bounds', () => {
    const commands = [
      { type: 'panel.resize-columns', panelId, weights: [0.6, 0.4] },
      { type: 'sub-panel.resize-columns', panelId, subPanelId: 'settings-appearance', weights: [0.2, 0.5, 0.3] },
      { type: 'widget.resize-row', instanceId: widgetId, height: 260 },
      { type: 'widget.resize-row', instanceId: widgetId, height: null }
    ];
    expect(commands.map((command) => WorkbenchCommandSchema.parse(command).type)).toEqual([
      'panel.resize-columns', 'sub-panel.resize-columns', 'widget.resize-row', 'widget.resize-row'
    ]);
    expect(WorkbenchCommandSchema.safeParse({
      type: 'widget.resize-row', instanceId: widgetId, height: 63
    }).success).toBe(false);
  });

  it('preserves sub-panel ownership when a Widget floats or is shelved', () => {
    const settingsId = asPanelId('settings');
    const floating = {
      kind: 'floating',
      panelId: settingsId,
      subPanelId: 'settings-advanced',
      x: 10,
      y: 20,
      width: 320,
      height: 180,
      z: 2
    } as const;

    expect(WorkbenchCommandSchema.parse({
      type: 'widget.place',
      instanceId: widgetId,
      placement: floating
    })).toMatchObject({ placement: { subPanelId: 'settings-advanced' } });
    expect(WorkbenchStateSchema.parse({
      ...state,
      placements: {
        [widgetId]: { kind: 'shelved', panelId: settingsId, lastVisible: floating }
      }
    }).placements[widgetId]).toMatchObject({
      lastVisible: { subPanelId: 'settings-advanced' }
    });
  });

  it('parses explicit sub-panel activation commands', () => {
    expect(WorkbenchCommandSchema.parse({
      type: 'sub-panel.activate',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced',
      currentScrollTop: 72
    }).type).toBe('sub-panel.activate');
  });

  it('requires activation to capture the outgoing sub-panel scroll position', () => {
    expect(WorkbenchCommandSchema.safeParse({
      type: 'sub-panel.activate',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced'
    }).success).toBe(false);
  });

  it('parses deterministic sub-panel creation with a lossless Overview identity', () => {
    expect(WorkbenchCommandSchema.parse({
      type: 'sub-panel.create',
      panelId: asPanelId('settings'),
      overview: {
        id: 'settings-overview',
        name: 'Overview',
        layoutId: 'three-equal',
        order: 0,
        scrollTop: 24
      },
      subPanel: {
        id: 'settings-notes',
        name: 'Notes',
        layoutId: 'two-equal',
        order: 1,
        scrollTop: 0
      }
    })).toMatchObject({
      type: 'sub-panel.create',
      overview: { id: 'settings-overview' },
      subPanel: { id: 'settings-notes' }
    });
  });

  it('parses bounded sub-panel rename commands', () => {
    expect(WorkbenchCommandSchema.parse({
      type: 'sub-panel.rename',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced',
      name: 'Advanced tools'
    })).toMatchObject({ type: 'sub-panel.rename', name: 'Advanced tools' });
    expect(WorkbenchCommandSchema.safeParse({
      type: 'sub-panel.rename',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced',
      name: '  '
    }).success).toBe(false);
  });

  it('parses indexed sub-panel reorder commands', () => {
    expect(WorkbenchCommandSchema.parse({
      type: 'sub-panel.reorder',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced',
      toIndex: 2
    })).toMatchObject({ type: 'sub-panel.reorder', toIndex: 2 });
    expect(WorkbenchCommandSchema.safeParse({
      type: 'sub-panel.reorder',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced',
      toIndex: -1
    }).success).toBe(false);
  });

  it('parses only the five authoritative sub-panel layout choices', () => {
    expect(WorkbenchCommandSchema.parse({
      type: 'sub-panel.change-layout',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-appearance-accessibility',
      layoutId: 'wide-left'
    })).toMatchObject({ type: 'sub-panel.change-layout', layoutId: 'wide-left' });
    expect(WorkbenchCommandSchema.safeParse({
      type: 'sub-panel.change-layout',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-appearance-accessibility',
      layoutId: 'four-equal'
    }).success).toBe(false);
  });

  it('parses finite nonnegative sub-panel scroll retention', () => {
    expect(WorkbenchCommandSchema.parse({
      type: 'sub-panel.set-scroll',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced',
      scrollTop: 612.5
    })).toMatchObject({ type: 'sub-panel.set-scroll', scrollTop: 612.5 });
    expect(WorkbenchCommandSchema.safeParse({
      type: 'sub-panel.set-scroll',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced',
      scrollTop: -1
    }).success).toBe(false);
  });

  it('parses movement between two distinct sub-panel owners', () => {
    expect(WorkbenchCommandSchema.parse({
      type: 'sub-panel.move-widgets',
      panelId: asPanelId('settings'),
      sourceSubPanelId: 'settings-advanced',
      targetSubPanelId: 'settings-data-maintenance'
    })).toMatchObject({
      type: 'sub-panel.move-widgets',
      sourceSubPanelId: 'settings-advanced',
      targetSubPanelId: 'settings-data-maintenance'
    });
    expect(WorkbenchCommandSchema.safeParse({
      type: 'sub-panel.move-widgets',
      panelId: asPanelId('settings'),
      sourceSubPanelId: 'settings-advanced',
      targetSubPanelId: 'settings-advanced'
    }).success).toBe(false);
  });

  it('parses explicit sub-panel deletion commands', () => {
    expect(WorkbenchCommandSchema.parse({
      type: 'sub-panel.delete',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced'
    }).type).toBe('sub-panel.delete');
  });

  it('requires caller-supplied Widget and group identities for sub-panel duplication', () => {
    expect(WorkbenchCommandSchema.parse({
      type: 'sub-panel.duplicate',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced',
      subPanel: {
        id: 'settings-advanced-copy',
        name: 'Advanced Copy',
        layoutId: 'single',
        order: 6,
        scrollTop: 0
      },
      ids: {
        widgetIds: { 'settings-prompts': 'settings-prompts-copy' },
        groupIds: { 'advanced-stack': 'advanced-stack-copy' }
      }
    })).toMatchObject({
      type: 'sub-panel.duplicate',
      subPanel: { id: 'settings-advanced-copy' },
      ids: { widgetIds: { 'settings-prompts': 'settings-prompts-copy' } }
    });
    expect(WorkbenchCommandSchema.safeParse({
      type: 'sub-panel.duplicate',
      panelId: asPanelId('settings'),
      subPanelId: 'settings-advanced',
      subPanel: {
        id: 'settings-advanced-copy',
        name: 'Advanced Copy',
        layoutId: 'single',
        order: 6,
        scrollTop: 0
      }
    }).success).toBe(false);
  });

  it('preserves docked and floating placement discriminants', () => {
    const docked = WorkbenchCommandSchema.parse({
      type: 'widget.place',
      instanceId: widgetId,
      placement: state.placements[widgetId]
    });
    const floating = WorkbenchCommandSchema.parse({
      type: 'widget.place',
      instanceId: widgetId,
      placement: {
        kind: 'floating', panelId, x: 10, y: 20, width: 320, height: 180, z: 2
      }
    });
    expect(docked.type === 'widget.place' && docked.placement.kind).toBe('docked');
    expect(floating.type === 'widget.place' && floating.placement.kind).toBe('floating');
    expect(WorkbenchCommandSchema.safeParse({
      type: 'widget.place',
      instanceId: widgetId,
      placement: { kind: 'floating', panelId, x: 0, y: 0, width: 0, height: 10, z: 0 }
    }).success).toBe(false);

    const grouped = WorkbenchCommandSchema.parse({
      type: 'widget.place',
      instanceId: widgetId,
      placement: {
        ...state.placements[widgetId],
        group: { id: 'reading-stack', order: 0, active: true }
      }
    });
    expect(grouped.type === 'widget.place' && grouped.placement.kind === 'docked'
      ? grouped.placement.group
      : null).toEqual({ id: 'reading-stack', order: 0, active: true });
  });

  it('binds atomic shelf creation to the Widget placement it owns', () => {
    const parsed = WorkbenchCommandSchema.parse({
      type: 'shelf.create-and-place',
      shelf: { id: 'secondary', panelId, regionId: 'left', order: 1, weight: 0.5 },
      instanceId: widgetId,
      placement: { kind: 'docked', panelId, regionId: 'left', shelfId: 'secondary', order: 0 }
    });
    expect(parsed.type).toBe('shelf.create-and-place');
    if (parsed.type !== 'shelf.create-and-place') throw new Error('Expected atomic shelf command.');
    expect(WorkbenchCommandSchema.safeParse({
      ...parsed,
      placement: { ...parsed.placement, shelfId: 'another-shelf' }
    }).success).toBe(false);

    const catalogInstance = state.widgets[widgetId]!;
    const catalogPlacement = WorkbenchCommandSchema.parse({
      ...parsed,
      instance: catalogInstance
    });
    expect(catalogPlacement).toMatchObject({
      type: 'shelf.create-and-place',
      instanceId: widgetId,
      instance: catalogInstance
    });
  });

  it('parses atomic Catalog Widget creation and grouping', () => {
    const catalogInstance = {
      ...state.widgets[widgetId]!,
      id: asWidgetInstanceId('catalog-widget')
    };
    const parsed = WorkbenchCommandSchema.parse({
      type: 'widget.create-and-group',
      instance: catalogInstance,
      placement: { kind: 'docked', panelId, regionId: 'left', shelfId: 'primary', order: 1 },
      targetInstanceId: widgetId,
      groupId: 'catalog-group'
    });

    expect(parsed).toMatchObject({
      type: 'widget.create-and-group',
      instance: catalogInstance,
      targetInstanceId: widgetId,
      groupId: 'catalog-group'
    });
  });

  it('parses every command in the first-slice protocol', () => {
    const commands = [
      { type: 'panel.create', panel: { id: asPanelId('library'), name: 'Library', templateId: 'standard', order: 1 } },
      { type: 'panel.activate', panelId },
      { type: 'panel.reorder', panelId, toIndex: 0 },
      { type: 'panel.resize-dock', panelId, edge: 'left', width: 320 },
      { type: 'widget.create', instance: state.widgets[widgetId]!, placement: { kind: 'docked', panelId, regionId: 'left', shelfId: 'primary', order: 0 } },
      { type: 'widget.create-and-group', instance: { ...state.widgets[widgetId]!, id: asWidgetInstanceId('catalog-widget') }, placement: { kind: 'docked', panelId, regionId: 'left', shelfId: 'primary', order: 1 }, targetInstanceId: widgetId, groupId: 'catalog-group' },
      { type: 'shelf.create-and-place', shelf: { id: 'secondary', panelId, regionId: 'left', order: 1, weight: 0.5 }, instanceId: widgetId, placement: { kind: 'docked', panelId, regionId: 'left', shelfId: 'secondary', order: 0 } },
      { type: 'widget.place', instanceId: widgetId, placement: { kind: 'docked', panelId, regionId: 'left', shelfId: 'primary', order: 0 } },
      { type: 'widget.group', instanceId: widgetId, targetInstanceId: widgetId, groupId: 'reading-stack' },
      { type: 'widget.group.activate', instanceId: widgetId },
      { type: 'widget.group.reorder', instanceId: widgetId, toIndex: 0 },
      { type: 'widget.remove', instanceId: widgetId },
      { type: 'layout.hydrate', state }
    ] satisfies readonly WorkbenchCommand[];

    expect(commands.map((command) => WorkbenchCommandSchema.parse(command).type)).toEqual([
      'panel.create',
      'panel.activate',
      'panel.reorder',
      'panel.resize-dock',
      'widget.create',
      'widget.create-and-group',
      'shelf.create-and-place',
      'widget.place',
      'widget.group',
      'widget.group.activate',
      'widget.group.reorder',
      'widget.remove',
      'layout.hydrate'
    ]);
  });

  it('rejects dock widths outside the preserved 200 to 420 pixel contract', () => {
    expect(WorkbenchCommandSchema.safeParse({
      type: 'panel.resize-dock', panelId, edge: 'left', width: 200
    }).success).toBe(true);
    expect(WorkbenchCommandSchema.safeParse({
      type: 'panel.resize-dock', panelId, edge: 'right', width: 420
    }).success).toBe(true);
    expect(WorkbenchCommandSchema.safeParse({
      type: 'panel.resize-dock', panelId, edge: 'main', width: 300
    }).success).toBe(false);
    expect(WorkbenchCommandSchema.safeParse({
      type: 'panel.resize-dock', panelId, edge: 'left', width: 199
    }).success).toBe(false);
    expect(WorkbenchCommandSchema.safeParse({
      type: 'panel.resize-dock', panelId, edge: 'right', width: 421
    }).success).toBe(false);
  });

  it('supports asynchronous adopter-owned storage round trips', async () => {
    const values = new Map<string, string>();
    const storage: LayoutStorage = {
      async load(key) { return values.get(key) ?? null; },
      async save(key, value) { values.set(key, value); },
      async remove(key) { values.delete(key); }
    };

    await storage.save('layout', '{"schema":"pomegranate.ui.layout.v1"}');
    expect(await storage.load('layout')).toContain('pomegranate.ui.layout.v1');
    await storage.remove?.('layout');
    expect(await storage.load('layout')).toBeNull();
  });
});
