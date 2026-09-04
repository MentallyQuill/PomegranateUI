import { describe, expect, it } from 'vitest';

import {
  buildShelfRails,
  clampHeldRect,
  dockTargetKey,
  dockRevealSide,
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
  it('keeps same-region toolbar columns uniquely addressable', () => {
    const outer = { panelId: 'scene', regionId: 'left', dockColumn: 0 };
    const inner = { panelId: 'scene', regionId: 'left', dockColumn: 1 };

    expect(dockTargetKey(outer, 'region')).not.toBe(dockTargetKey(inner, 'region'));

    const previous: DockIntent = {
      key: dockTargetKey(outer, 'region'),
      kind: 'region',
      targetId: 'outer',
      panelId: 'scene',
      regionId: 'left',
      dockColumn: 0,
      targetRect: { x: 0, y: 0, width: 200, height: 400 },
      previewRect: { x: 0, y: 0, width: 200, height: 400 },
      label: 'Outer left column'
    };
    const next: DockIntent = {
      ...previous,
      key: dockTargetKey(inner, 'region'),
      targetId: 'inner',
      dockColumn: 1,
      targetRect: { x: 200, y: 0, width: 200, height: 400 },
      previewRect: { x: 200, y: 0, width: 200, height: 400 },
      label: 'Inner left column'
    };
    expect(stabilizeDockIntent({ x: 220, y: 100 }, previous, next, 10)).toBe(next);
  });

  it('keeps rail target identities unique when owner ids contain separators', () => {
    const region = { x: 0, y: 0, width: 300, height: 500 };
    const shelves = [{ id: 'primary', order: 0, rect: { x: 0, y: 0, width: 300, height: 500 } }];
    const first = buildShelfRails(region, shelves, { panelId: 'panel:scope', subPanelId: 'a', regionId: 'b' });
    const second = buildShelfRails(region, shelves, { panelId: 'panel', subPanelId: 'scope:a', regionId: 'b' });

    expect(first[0]?.id).not.toBe(second[0]?.id);
  });

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
    expect(rails.every((rail) => rail.rect.width === 300 && rail.rect.height >= 12 && rail.rect.height <= 18)).toBe(true);
    expect(rails.every((rail) => rail.previewRect?.width === 300)).toBe(true);
    expect(rails.every((rail) => (rail.previewRect?.height ?? 0) >= 72 && (rail.previewRect?.height ?? 0) <= 112)).toBe(true);
  });

  it('discovers collapsed edge docks without stealing the center canvas', () => {
    const surface = { x: 10, y: 40, width: 1180, height: 720 };
    expect(dockRevealSide({ x: 25, y: 300 }, surface, 34)).toBe('left');
    expect(dockRevealSide({ x: 1175, y: 300 }, surface, 34)).toBe('right');
    expect(dockRevealSide({ x: 600, y: 300 }, surface, 34)).toBeNull();
    expect(dockRevealSide({ x: 25, y: 20 }, surface, 34)).toBeNull();
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
      regionRect: { x: 0, y: 0, width: 320, height: 320 },
      regionDepth: 0,
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

  it('keeps hysteresis local to each 25/50/25 body zone', () => {
    const before = resolveDockIntent({ x: 120, y: 90 }, [widget])!;
    const center = resolveDockIntent({ x: 120, y: 170 }, [widget])!;
    const after = resolveDockIntent({ x: 120, y: 265 }, [widget])!;
    expect(stabilizeDockIntent({ x: 120, y: 128 }, before, center, 10)).toBe(before);
    expect(stabilizeDockIntent({ x: 120, y: 170 }, before, center, 10)).toBe(center);
    expect(stabilizeDockIntent({ x: 120, y: 265 }, center, after, 10)).toBe(after);
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
