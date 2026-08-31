import { describe, expect, it } from 'vitest';

import {
  buildShelfRails,
  clampHeldRect,
  resolveDockIntent,
  stabilizeDockIntent,
  type DockIntent,
  type DockTarget
} from './widget-docking.js';

const widget: DockTarget = {
  id: 'widget:notes',
  kind: 'widget',
  rect: { x: 20, y: 40, width: 280, height: 240 },
  headerRect: { x: 20, y: 40, width: 280, height: 32 },
  bodyRect: { x: 20, y: 72, width: 280, height: 208 },
  panelId: 'scene',
  regionId: 'left',
  shelfId: 'primary',
  order: 2,
  targetInstanceId: 'notes'
};

describe('Atmospheric docking intent', () => {
  it('uses a hard header target and 25/50/25 body zones', () => {
    expect(resolveDockIntent({ x: 120, y: 52 }, [widget])?.kind).toBe('tab');
    expect(resolveDockIntent({ x: 120, y: 90 }, [widget])?.kind).toBe('insert-before');
    expect(resolveDockIntent({ x: 120, y: 170 }, [widget])?.kind).toBe('tab');
    expect(resolveDockIntent({ x: 120, y: 265 }, [widget])?.kind).toBe('insert-after');
  });

  it('prefers hard group-tab targets over overlapping Widget bodies', () => {
    const group: DockTarget = {
      ...widget,
      id: 'group:research',
      kind: 'group-header',
      rect: { x: 20, y: 40, width: 280, height: 38 },
      groupId: 'research'
    };
    expect(resolveDockIntent({ x: 120, y: 52 }, [widget, group])).toMatchObject({
      kind: 'tab',
      targetId: 'group:research',
      groupId: 'research'
    });
  });

  it('builds deterministic before, between, after, and append rails', () => {
    const rails = buildShelfRails(
      { x: 0, y: 0, width: 300, height: 500 },
      [
        { id: 'primary', order: 0, rect: { x: 0, y: 20, width: 300, height: 120 } },
        { id: 'secondary', order: 1, rect: { x: 0, y: 180, width: 300, height: 100 } }
      ],
      { panelId: 'scene', regionId: 'left' }
    );
    expect(rails.map((rail) => [rail.railKind, rail.insertOrder])).toEqual([
      ['before', 0],
      ['between', 1],
      ['after', 2],
      ['append', 2]
    ]);
    expect(rails.every((rail) => rail.rect.width === 300 && rail.rect.height >= 12)).toBe(true);
  });

  it('uses a full region target when empty and otherwise falls back to float', () => {
    const region: DockTarget = {
      id: 'region:right',
      kind: 'region',
      rect: { x: 500, y: 20, width: 260, height: 620 },
      panelId: 'scene',
      regionId: 'right',
      empty: true
    };
    expect(resolveDockIntent({ x: 600, y: 300 }, [region])?.kind).toBe('region');
    expect(resolveDockIntent({ x: 900, y: 700 }, [region])).toBeNull();
  });

  it('keeps the previous target inside a ten-pixel hysteresis envelope', () => {
    const previous: DockIntent = {
      key: 'widget:notes:before',
      kind: 'insert-before',
      targetId: widget.id,
      targetRect: widget.bodyRect!,
      previewRect: { x: 20, y: 72, width: 280, height: 52 },
      panelId: 'scene',
      regionId: 'left',
      shelfId: 'primary',
      order: 2,
      targetInstanceId: 'notes',
      label: 'Insert before Notes'
    };
    expect(stabilizeDockIntent({ x: 16, y: 100 }, previous, null, 10)).toBe(previous);
    expect(stabilizeDockIntent({ x: 5, y: 100 }, previous, null, 10)).toBeNull();
  });

  it('preserves the grab offset while clamping a held card to the viewport', () => {
    expect(clampHeldRect(
      { x: 1180, y: 760 },
      { x: 120, y: 24 },
      { width: 340, height: 300 },
      { x: 0, y: 0, width: 1280, height: 800 },
      8
    )).toEqual({ x: 932, y: 492, width: 340, height: 300 });
  });
});
