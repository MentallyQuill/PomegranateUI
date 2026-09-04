import { describe, expect, it } from 'vitest';

import { resolveDockIntent, stabilizeDockIntent, type DockIntent } from './widget-docking.js';
import { collectDockTargets, createDockPreviewController } from './widget-docking-dom.js';

function rect(x: number, y: number, width: number, height: number) {
  return () => new DOMRect(x, y, width, height);
}

function addWidget(region: HTMLElement, instanceId: string) {
  const shelf = document.createElement('div');
  shelf.className = 'dock-shelf';
  shelf.dataset.pomegranateShelf = 'primary';
  shelf.dataset.pomegranateShelfOrder = '0';
  Object.defineProperty(shelf, 'getBoundingClientRect', { configurable: true, value: rect(0, 0, 300, 240) });
  const wrapper = document.createElement('div');
  wrapper.dataset.widgetType = 'story.summary';
  wrapper.dataset.pomegranateShelf = 'primary';
  const article = document.createElement('article');
  article.dataset.pomegranateWidget = instanceId;
  Object.defineProperty(article, 'getBoundingClientRect', { configurable: true, value: rect(0, 0, 300, 200) });
  wrapper.append(article);
  shelf.append(wrapper);
  region.append(shelf);
}

describe('docking DOM targets', () => {
  it('collects and previews duplicate toolbar regions by exact column owner', () => {
    const panel = document.body.appendChild(document.createElement('div'));
    panel.dataset.pomegranatePanel = 'scene';
    const outer = panel.appendChild(document.createElement('section'));
    outer.dataset.pomegranateRegionSurface = 'left';
    outer.dataset.dockColumn = '0';
    Object.defineProperty(outer, 'getBoundingClientRect', { configurable: true, value: rect(0, 0, 200, 400) });
    const inner = panel.appendChild(document.createElement('section'));
    inner.dataset.pomegranateRegionSurface = 'left';
    inner.dataset.dockColumn = '1';
    Object.defineProperty(inner, 'getBoundingClientRect', { configurable: true, value: rect(200, 0, 200, 400) });

    const targets = collectDockTargets(panel, {
      ownerForRegion: (region) => ({
        panelId: 'scene',
        regionId: 'left',
        dockColumn: Number(region.dataset.dockColumn)
      })
    });
    const columnTargets = targets.filter((target) => target.kind === 'region');
    expect(columnTargets.map(({ dockColumn }) => dockColumn)).toEqual([0, 1]);
    expect(new Set(columnTargets.map(({ id }) => id)).size).toBe(2);

    const preview = createDockPreviewController(panel);
    const target = columnTargets[1]!;
    const intent = resolveDockIntent({ x: 250, y: 200 }, [target]);
    preview.sync(columnTargets, intent);
    expect(inner.querySelector('[data-pom-part="widget.dock-slot"]')).not.toBeNull();
    expect(outer.querySelector('[data-pom-part="widget.dock-slot"]')).toBeNull();
    expect(document.querySelector<HTMLElement>('[data-pom-part="widget.snap-preview"]')?.dataset.dropColumn).toBe('1');
    preview.destroy();
  });

  it('keeps populated nested-region Widgets scoped to their exact owner', () => {
    const root = document.createElement('div');
    const outer = document.createElement('section');
    outer.dataset.pomegranateRegionSurface = 'stage';
    outer.dataset.owner = 'outer';
    Object.defineProperty(outer, 'getBoundingClientRect', { configurable: true, value: rect(0, 0, 900, 700) });
    const inner = document.createElement('section');
    inner.dataset.pomegranateRegionSurface = 'right';
    inner.dataset.subPanelLane = '0';
    inner.dataset.owner = 'inner';
    Object.defineProperty(inner, 'getBoundingClientRect', { configurable: true, value: rect(600, 0, 300, 700) });
    addWidget(inner, 'nested-widget');
    outer.append(inner);
    root.append(outer);

    const targets = collectDockTargets(root, {
      ownerForRegion: (region) => region.dataset.owner === 'inner'
        ? { panelId: 'scene', lane: 0, regionId: 'right' }
        : { panelId: 'scene', regionId: 'stage' }
    });

    const nestedWidget = targets.find((target) => target.targetInstanceId === 'nested-widget');
    expect(nestedWidget).toMatchObject({ panelId: 'scene', lane: 0, regionId: 'right' });
    expect(targets.filter((target) => target.targetInstanceId === 'nested-widget')).toHaveLength(1);
    expect(targets.some((target) => target.kind === 'region' && target.regionId === 'stage')).toBe(true);
    expect(new Set(targets.map((target) => target.id)).size).toBe(targets.length);
  });

  it('mounts a preview slot only in the region with an exact owner match', () => {
    const panel = document.createElement('div');
    panel.dataset.pomegranatePanel = 'scene';
    const subPanel = document.createElement('section');
    subPanel.dataset.subPanel = 'nested';
    const nested = document.createElement('section');
    nested.dataset.pomegranateRegionSurface = 'right';
    nested.dataset.subPanelLane = '0';
    subPanel.append(nested);
    const direct = document.createElement('section');
    direct.dataset.pomegranateRegionSurface = 'right';
    panel.append(subPanel, direct);
    document.body.append(panel);
    const preview = createDockPreviewController(panel);
    const intent: DockIntent = {
      key: 'region:scene:::right',
      kind: 'region',
      targetId: 'region:scene:::right',
      panelId: 'scene',
      regionId: 'right',
      targetRect: { x: 0, y: 0, width: 300, height: 300 },
      previewRect: { x: 0, y: 0, width: 300, height: 300 },
      label: 'Dock in right'
    };

    preview.sync([], intent);

    expect(direct.querySelector('[data-pom-part="widget.dock-slot"]')).not.toBeNull();
    expect(nested.querySelector('[data-pom-part="widget.dock-slot"]')).toBeNull();
    preview.destroy();
  });

  it('resolves an overlapping point only against the deepest region owner', () => {
    const root = document.createElement('div');
    const outer = document.createElement('section');
    outer.dataset.pomegranateRegionSurface = 'stage';
    outer.dataset.owner = 'outer';
    Object.defineProperty(outer, 'getBoundingClientRect', { configurable: true, value: rect(0, 0, 900, 700) });
    addWidget(outer, 'outer-widget');
    const outerWidget = outer.querySelector<HTMLElement>('[data-pomegranate-widget="outer-widget"]')!;
    Object.defineProperty(outerWidget, 'getBoundingClientRect', { configurable: true, value: rect(0, 0, 900, 700) });
    const inner = document.createElement('section');
    inner.dataset.pomegranateRegionSurface = 'right';
    inner.dataset.owner = 'inner';
    Object.defineProperty(inner, 'getBoundingClientRect', { configurable: true, value: rect(600, 0, 300, 700) });
    outer.append(inner);
    root.append(outer);

    const targets = collectDockTargets(root, {
      ownerForRegion: (region) => ({ panelId: 'scene', regionId: region.dataset.pomegranateRegionSurface! })
    });
    const outerIntent = resolveDockIntent({ x: 300, y: 350 }, targets);
    const innerPoint = { x: 650, y: 350 };
    const intent = stabilizeDockIntent(
      innerPoint,
      outerIntent,
      resolveDockIntent(innerPoint, targets),
      10
    );

    expect(intent).toMatchObject({ kind: 'region', panelId: 'scene', regionId: 'right' });
  });
});
