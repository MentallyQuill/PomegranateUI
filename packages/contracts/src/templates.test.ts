import { describe, expect, it } from 'vitest';

import * as contracts from './index.js';

describe('shared Panel layout contracts', () => {
  it('parses named template regions and bounded normalized shelves', () => {
    expect(contracts.PanelTemplateDefinitionSchema).toBeDefined();
    expect(contracts.ShelfStateSchema).toBeDefined();
    const template = {
      id: 'story-stage.v1',
      label: 'Story stage',
      family: 'story-stage',
      regions: [
        { id: 'left', label: 'Left instruments', role: 'left-instruments', order: 0, acceptedShapes: ['narrow'], minimumWidth: 220, minimumHeight: 120 },
        { id: 'stage', label: 'Stage', role: 'stage', order: 1, acceptedShapes: ['stage', 'wide'], minimumWidth: 320, minimumHeight: 240 },
        { id: 'composer', label: 'Composer', role: 'composer', order: 2, acceptedShapes: ['strip'], minimumWidth: 320, minimumHeight: 56 },
        { id: 'right', label: 'Right instruments', role: 'right-instruments', order: 3, acceptedShapes: ['narrow'], minimumWidth: 220, minimumHeight: 120 }
      ],
      options: {}
    };
    expect(contracts.PanelTemplateDefinitionSchema.safeParse(template).success).toBe(true);
    expect(contracts.ShelfStateSchema.safeParse({
      id: 'primary', panelId: 'scene', regionId: 'left', order: 0, weight: 0.5
    }).success).toBe(true);
    expect(contracts.ShelfStateSchema.safeParse({
      id: 'primary', panelId: 'scene', regionId: 'left', order: 0, weight: 0.01
    }).success).toBe(false);
  });

  it('rejects duplicate template regions and invalid Columns contracts', () => {
    const region = {
      id: 'column-1', label: 'Column 1', role: 'column', order: 0,
      acceptedShapes: ['narrow'], minimumWidth: 160, minimumHeight: 120
    };
    expect(contracts.PanelTemplateDefinitionSchema.safeParse({
      id: 'columns.v1', label: 'Columns', family: 'columns',
      regions: [region, { ...region, order: 1 }],
      options: { columns: { minimum: 2, maximum: 6, default: 3 } }
    }).success).toBe(false);
    expect(contracts.PanelTemplateDefinitionSchema.safeParse({
      id: 'columns.v1', label: 'Columns', family: 'columns',
      regions: [region],
      options: { columns: { minimum: 2, maximum: 6, default: 2.5 } }
    }).success).toBe(false);
  });

  it('parses docked, floating, and one-level retained placements', () => {
    expect(contracts.WidgetPlacementSchema.safeParse({
      kind: 'docked', panelId: 'scene', regionId: 'stage', shelfId: 'primary', order: 0
    }).success).toBe(true);
    expect(contracts.WidgetPlacementSchema.safeParse({
      kind: 'shelved', panelId: 'scene',
      lastVisible: { kind: 'docked', panelId: 'scene', regionId: 'left', shelfId: 'primary', order: 0 }
    }).success).toBe(true);
    expect(contracts.WidgetPlacementSchema.safeParse({
      kind: 'shelved', panelId: 'scene',
      lastVisible: {
        kind: 'shelved', panelId: 'scene',
        lastVisible: { kind: 'docked', panelId: 'scene', regionId: 'left', shelfId: 'primary', order: 0 }
      }
    }).success).toBe(false);
  });

  it('accepts the complete Panel, shelf, retained Widget, and undo command vocabulary', () => {
    const commands = [
      { type: 'panel.rename', panelId: 'scene', name: 'Chronicle' },
      { type: 'panel.reset', panelId: 'scene' },
      { type: 'panel.clear', panelId: 'scene' },
      { type: 'panel.delete', panelId: 'scene' },
      { type: 'shelf.create', shelf: { id: 'secondary', panelId: 'scene', regionId: 'left', order: 1, weight: 0.5 } },
      { type: 'shelf.resize', panelId: 'scene', regionId: 'left', shelfId: 'primary', weight: 0.6 },
      { type: 'widget.shelve', instanceId: 'characters' },
      { type: 'widget.restore', instanceId: 'characters' },
      { type: 'widget.delete', instanceId: 'characters' },
      { type: 'layout.undo' }
    ];
    for (const command of commands) {
      expect(contracts.WorkbenchCommandSchema.safeParse(command).success, command.type).toBe(true);
    }
  });
});
