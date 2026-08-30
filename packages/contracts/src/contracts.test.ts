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
    expect(typeof (contracts.ThemeTargetBundleSchema as { safeParse?: unknown } | undefined)?.safeParse).toBe('function');
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
        minColumns: 2,
        geometry: { minHeight: 320, idealHeight: 560, maxHeight: 720 },
        supportedStates: ['ready', 'ready']
      }
    });

    expect(parsed.success).toBe(false);
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

  it('parses every command in the first-slice protocol', () => {
    const commands = [
      { type: 'panel.create', panel: { id: asPanelId('library'), name: 'Library', templateId: 'standard', order: 1 } },
      { type: 'panel.activate', panelId },
      { type: 'panel.reorder', panelId, toIndex: 0 },
      { type: 'panel.resize-dock', panelId, edge: 'left', width: 320 },
      { type: 'widget.create', instance: state.widgets[widgetId]!, placement: { kind: 'docked', panelId, regionId: 'left', shelfId: 'primary', order: 0 } },
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
