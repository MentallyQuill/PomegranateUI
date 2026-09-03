import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WidgetManifest } from '@pomegranate-ui/contracts';
import { createCatalogManifests } from '../mockup/catalog.js';
import { createLabRuntime } from '../mockup/widgets.js';
import { createCatalogPlacementController } from './CatalogPlacementController.js';

const manifest = createCatalogManifests().find(({ type }) => type === 'story.transcript') as WidgetManifest;

function pointerEvent(
  type: string,
  init: MouseEventInit & { pointerId?: number; pointerType?: string } = {}
): PointerEvent {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
  Object.defineProperties(event, {
    pointerId: { configurable: true, value: init.pointerId ?? 1 },
    pointerType: { configurable: true, value: init.pointerType ?? 'mouse' }
  });
  return event as PointerEvent;
}

function placementSurface(): { root: HTMLElement; origin: HTMLElement; target: HTMLElement } {
  const root = document.body.appendChild(document.createElement('main'));
  root.dataset.pomegranatePanel = 'panel-story';
  const target = root.appendChild(document.createElement('section'));
  target.dataset.pomegranateRegionSurface = 'stage';
  target.dataset.pomegranateRegionRole = 'stage';
  target.dataset.subPanelLane = '0';
  target.setAttribute('aria-label', 'Stage region');
  Object.defineProperty(target, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(100, 100, 400, 300)
  });
  const origin = document.body.appendChild(document.createElement('article'));
  Object.defineProperty(origin, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(10, 10, 286, 360)
  });
  return { root, origin, target };
}

function appendTarget(root: HTMLElement, regionId: string, role: string, label: string): HTMLElement {
  const target = root.appendChild(document.createElement('section'));
  target.dataset.pomegranateRegionSurface = regionId;
  target.dataset.pomegranateRegionRole = role;
  target.dataset.subPanelLane = '1';
  target.setAttribute('aria-label', label);
  Object.defineProperty(target, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(520, 100, 280, 300)
  });
  return target;
}

function targetId(regionId: string, lane: number, subPanelId: string | null = null): string {
  return JSON.stringify(['panel-story', subPanelId, regionId, lane, 'primary']);
}

describe('CatalogPlacementController', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps duplicate semantic regions in separate lanes uniquely addressable', () => {
    const { root, origin, target: first } = placementSurface();
    const second = appendTarget(root, 'stage', 'stage', 'Second stage lane');
    const onCommit = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit
    });

    controller.keyDown(new KeyboardEvent('keydown', { key: ' ', cancelable: true }), manifest, origin);
    const [firstTarget, secondTarget] = controller.getState().targets;
    expect(firstTarget?.identity.id).not.toBe(secondTarget?.identity.id);

    controller.keyDown(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }), manifest, origin);
    controller.keyDown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }), manifest, origin);

    expect(onCommit).toHaveBeenCalledWith(manifest, expect.objectContaining({
      identity: expect.objectContaining({ regionId: 'stage', lane: 1 }),
      element: second
    }));
    expect(onCommit).not.toHaveBeenCalledWith(manifest, expect.objectContaining({ element: first }));
    controller.destroy();
  });

  it('encodes colon-containing target components without identity collisions', () => {
    const root = document.body.appendChild(document.createElement('main'));
    root.dataset.pomegranatePanel = 'panel:story';
    const firstScope = root.appendChild(document.createElement('div'));
    firstScope.dataset.subPanel = 'scope:a';
    const first = firstScope.appendChild(document.createElement('section'));
    first.dataset.pomegranateRegionSurface = 'b';
    first.dataset.pomegranateRegionRole = 'stage';
    first.dataset.subPanelLane = '0';
    first.setAttribute('aria-label', 'First adversarial region');
    const secondScope = root.appendChild(document.createElement('div'));
    secondScope.dataset.subPanel = 'scope';
    const second = secondScope.appendChild(document.createElement('section'));
    second.dataset.pomegranateRegionSurface = 'a:b';
    second.dataset.pomegranateRegionRole = 'stage';
    second.dataset.subPanelLane = '0';
    second.setAttribute('aria-label', 'Second adversarial region');
    for (const target of [first, second]) {
      Object.defineProperty(target, 'getBoundingClientRect', {
        configurable: true,
        value: () => new DOMRect(100, 100, 400, 300)
      });
    }
    const origin = document.body.appendChild(document.createElement('article'));
    Object.defineProperty(origin, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(10, 10, 286, 360)
    });
    const onCommit = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit
    });

    controller.keyDown(new KeyboardEvent('keydown', { key: ' ', cancelable: true }), manifest, origin);
    const [firstTarget, secondTarget] = controller.getState().targets;
    expect(firstTarget?.identity.id).not.toBe(secondTarget?.identity.id);
    controller.keyDown(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }), manifest, origin);
    controller.keyDown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }), manifest, origin);

    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCommit).toHaveBeenCalledWith(manifest, expect.objectContaining({
      identity: expect.objectContaining({ panelId: 'panel:story', subPanelId: 'scope', regionId: 'a:b', lane: 0 }),
      element: second
    }));
    controller.destroy();
  });

  it('interrupts a touch long-press after even one pixel of movement', () => {
    vi.useFakeTimers();
    const { root, origin } = placementSurface();
    const suspend = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend, resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn()
    });

    controller.pointerDown(pointerEvent('pointerdown', {
      clientX: 40,
      clientY: 50,
      pointerType: 'touch'
    }), manifest, origin);
    document.dispatchEvent(pointerEvent('pointermove', {
      clientX: 41,
      clientY: 50,
      pointerType: 'touch'
    }));
    vi.advanceTimersByTime(300);

    expect(controller.getState().phase).toBe('idle');
    expect(suspend).not.toHaveBeenCalled();
    controller.destroy();
  });

  it('expires stale click suppression and clears it at the next pointer sequence', () => {
    vi.useFakeTimers();
    const { root, origin } = placementSurface();
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => false,
      onCommit: vi.fn()
    });

    controller.pointerDown(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }), manifest, origin);
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 16, clientY: 10 }));
    controller.pointerDown(pointerEvent('pointerdown', { pointerId: 2, clientX: 10, clientY: 10 }), manifest, origin);
    expect(controller.consumeClick()).toBe(false);

    document.dispatchEvent(pointerEvent('pointerup', { pointerId: 2, clientX: 10, clientY: 10 }));
    controller.pointerDown(pointerEvent('pointerdown', { pointerId: 3, clientX: 10, clientY: 10 }), manifest, origin);
    document.dispatchEvent(pointerEvent('pointermove', { pointerId: 3, clientX: 16, clientY: 10 }));
    vi.advanceTimersByTime(500);
    expect(controller.consumeClick()).toBe(false);
    controller.destroy();
  });

  it('ignores repeated Enter while a keyboard placement is lifted', () => {
    const { root, origin } = placementSurface();
    const onCommit = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit
    });

    controller.keyDown(new KeyboardEvent('keydown', { key: ' ', cancelable: true }), manifest, origin);
    const repeatedEnter = new KeyboardEvent('keydown', { key: 'Enter', repeat: true, cancelable: true });
    expect(controller.keyDown(repeatedEnter, manifest, origin)).toBe(true);
    expect(repeatedEnter.defaultPrevented).toBe(true);
    expect(onCommit).not.toHaveBeenCalled();
    expect(controller.getState().phase).toBe('lifted');

    controller.keyDown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }), manifest, origin);
    expect(onCommit).toHaveBeenCalledOnce();
    controller.destroy();
  });

  it('captures the active pointer and cancels idempotently on capture loss or window blur', () => {
    const { root, origin, target } = placementSurface();
    const resume = vi.fn();
    const setPointerCapture = vi.fn();
    const releasePointerCapture = vi.fn();
    Object.defineProperties(origin, {
      setPointerCapture: { configurable: true, value: setPointerCapture },
      hasPointerCapture: { configurable: true, value: () => true },
      releasePointerCapture: { configurable: true, value: releasePointerCapture }
    });
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn()
    });

    controller.pointerDown(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }), manifest, origin);
    expect(setPointerCapture).toHaveBeenCalledWith(1);
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 16, clientY: 10 }));
    origin.dispatchEvent(pointerEvent('lostpointercapture', { clientX: 16, clientY: 10 }));
    window.dispatchEvent(new Event('blur'));

    expect(controller.getState().phase).toBe('idle');
    expect(resume).toHaveBeenCalledOnce();
    expect(releasePointerCapture).toHaveBeenCalledWith(1);
    expect(target).not.toHaveAttribute('data-catalog-placement-target');
    controller.destroy();
  });

  it('does not lift a mouse result until movement reaches six pixels', () => {
    const { root, origin } = placementSurface();
    const suspend = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend, resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn()
    });

    controller.pointerDown(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }), manifest, origin);
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 15, clientY: 10 }));

    expect(controller.getState().phase).toBe('pressing');
    expect(controller.getState().proxy).toBeNull();
    expect(suspend).not.toHaveBeenCalled();

    document.dispatchEvent(pointerEvent('pointermove', { clientX: 16, clientY: 10 }));

    expect(controller.getState().phase).toBe('lifted');
    expect(controller.getState().proxy).toMatchObject({
      input: 'pointer',
      manifestType: 'story.transcript',
      x: 16,
      y: 10,
      width: 280,
      height: 352
    });
    expect(suspend).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  it('lifts touch only after a 300ms long press', () => {
    vi.useFakeTimers();
    const { root, origin } = placementSurface();
    const suspend = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend, resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn()
    });

    controller.pointerDown(pointerEvent('pointerdown', {
      clientX: 40,
      clientY: 50,
      pointerType: 'touch'
    }), manifest, origin);
    vi.advanceTimersByTime(299);

    expect(controller.getState().phase).toBe('pressing');
    expect(suspend).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(controller.getState().phase).toBe('lifted');
    expect(controller.getState().proxy).toMatchObject({ input: 'pointer', x: 40, y: 50 });
    expect(suspend).toHaveBeenCalledTimes(1);
    controller.destroy();
    vi.useRealTimers();
  });

  it('cancels a touch hold on movement and suppresses its accidental click', () => {
    vi.useFakeTimers();
    const { root, origin } = placementSurface();
    const suspend = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend, resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn()
    });

    controller.pointerDown(pointerEvent('pointerdown', {
      clientX: 40,
      clientY: 50,
      pointerType: 'touch'
    }), manifest, origin);
    document.dispatchEvent(pointerEvent('pointermove', {
      clientX: 46,
      clientY: 50,
      pointerType: 'touch'
    }));
    vi.advanceTimersByTime(300);

    expect(controller.getState().phase).toBe('idle');
    expect(suspend).not.toHaveBeenCalled();
    expect(controller.consumeClick()).toBe(true);
    expect(controller.consumeClick()).toBe(false);
    controller.destroy();
    vi.useRealTimers();
  });

  it('cancels a touch hold when scrolling begins', () => {
    vi.useFakeTimers();
    const { root, origin } = placementSurface();
    const suspend = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend, resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn()
    });

    controller.pointerDown(pointerEvent('pointerdown', {
      clientX: 40,
      clientY: 50,
      pointerType: 'touch'
    }), manifest, origin);
    document.dispatchEvent(new Event('scroll', { bubbles: false }));
    vi.advanceTimersByTime(300);

    expect(controller.getState().phase).toBe('idle');
    expect(suspend).not.toHaveBeenCalled();
    controller.destroy();
    vi.useRealTimers();
  });

  it('cancels a lifted touch placement cleanly on pointercancel', () => {
    vi.useFakeTimers();
    const { root, origin, target } = placementSurface();
    const resume = vi.fn();
    const onCommit = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit
    });

    controller.pointerDown(pointerEvent('pointerdown', {
      clientX: 40,
      clientY: 50,
      pointerType: 'touch'
    }), manifest, origin);
    vi.advanceTimersByTime(300);
    document.dispatchEvent(pointerEvent('pointercancel', {
      clientX: 40,
      clientY: 50,
      pointerType: 'touch'
    }));

    expect(controller.getState().phase).toBe('idle');
    expect(resume).toHaveBeenCalledTimes(1);
    expect(onCommit).not.toHaveBeenCalled();
    expect(target).not.toHaveAttribute('data-catalog-placement-target');
    expect(target).not.toHaveClass('is-catalog-placement-target', 'is-catalog-target-active');
    controller.destroy();
    vi.useRealTimers();
  });

  it('refuses a placed singleton before catalog suspension', () => {
    const singleton = createCatalogManifests().find(({ catalog }) => catalog?.multiplicity === 'single')!;
    const { root, origin, target } = placementSurface();
    const suspend = vi.fn();
    const announce = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend, resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 1,
      isCompatibleTarget: () => true,
      onCommit: vi.fn(),
      onAnnounce: announce
    });

    controller.pointerDown(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }), singleton, origin);
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 16, clientY: 10 }));

    expect(controller.getState().phase).toBe('idle');
    expect(suspend).not.toHaveBeenCalled();
    expect(target).not.toHaveAttribute('data-catalog-placement-target');
    expect(announce).toHaveBeenCalledWith(`${singleton.title} is already on this Panel.`);
    controller.destroy();
  });

  it('lifts the whole result with Space and exposes keyboard proxy and target state', () => {
    const { root, origin, target } = placementSurface();
    const suspend = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend, resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn()
    });
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });

    expect(controller.keyDown(event, manifest, origin)).toBe(true);

    expect(event.defaultPrevented).toBe(true);
    expect(controller.getState()).toMatchObject({
      phase: 'lifted',
      input: 'keyboard',
      selectedTargetId: targetId('stage', 0),
      proxy: {
        input: 'keyboard',
        manifestType: 'story.transcript',
        x: 153,
        y: 190,
        width: 280,
        height: 352
      }
    });
    expect(target).toHaveAttribute('data-catalog-placement-target', targetId('stage', 0));
    expect(target).toHaveClass('is-catalog-placement-target', 'is-catalog-target-active');
    expect(target).toHaveAttribute('tabindex', '0');
    expect(target).toHaveAttribute('role', 'button');
    expect(target).toHaveAttribute('aria-label', `Place ${manifest.title} in Stage region`);
    expect(suspend).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  it('cycles compatible semantic targets deterministically with arrow keys', () => {
    const { root, origin, target: first } = placementSurface();
    const second = appendTarget(root, 'right', 'right-instruments', 'Right instruments region');
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn(),
      requestTargetFocus: (target) => target.focus({ preventScroll: true })
    });

    controller.keyDown(new KeyboardEvent('keydown', { key: ' ', cancelable: true }), manifest, origin);
    controller.keyDown(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }), manifest, origin);

    expect(controller.getState().selectedTargetId).toBe(targetId('right', 1));
    expect(first).not.toHaveClass('is-catalog-target-active');
    expect(first).toHaveAttribute('tabindex', '-1');
    expect(second).toHaveClass('is-catalog-target-active');
    expect(second).toHaveAttribute('tabindex', '0');
    expect(second).toHaveFocus();

    controller.keyDown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }), manifest, origin);
    expect(controller.getState().selectedTargetId).toBe(targetId('stage', 0));

    controller.keyDown(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }), manifest, origin);
    expect(controller.getState().selectedTargetId).toBe(targetId('right', 1));
    controller.destroy();
  });

  it('commits the selected keyboard target with Enter and clears placement state', () => {
    const { root, origin, target: first } = placementSurface();
    const second = appendTarget(root, 'right', 'right-instruments', 'Right instruments region');
    const resume = vi.fn();
    const onCommit = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit
    });

    controller.keyDown(new KeyboardEvent('keydown', { key: ' ', cancelable: true }), manifest, origin);
    controller.keyDown(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }), manifest, origin);
    const enter = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });

    expect(controller.keyDown(enter, manifest, origin)).toBe(true);

    expect(enter.defaultPrevented).toBe(true);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith(manifest, expect.objectContaining({
      identity: expect.objectContaining({ regionId: 'right', regionRole: 'right-instruments', lane: 1 }),
      rect: expect.objectContaining({ x: 520, y: 100, width: 280, height: 300 }),
      element: second
    }));
    expect(controller.getState().phase).toBe('idle');
    expect(resume).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveClass('is-catalog-placement-target');
    expect(second).not.toHaveClass('is-catalog-placement-target');
    controller.destroy();
  });

  it('Escape restores the exact catalog snapshot, scroll anchor, target attributes, and result focus', () => {
    const runtime = createLabRuntime();
    runtime.catalog.open('expanded');
    runtime.catalog.setResultMode('compact');
    runtime.catalog.setPreviewWidth(340);
    runtime.catalog.setQuery('story');
    runtime.catalog.setCategory('story');
    runtime.catalog.setUtility('fits-layout');
    const exactSnapshot = runtime.catalog.getState();
    const { root, origin, target } = placementSurface();
    target.tabIndex = 4;
    target.setAttribute('role', 'region');
    const anchor = Object.freeze({ key: 'story.transcript', offset: 27, scrollTop: 118 });
    const restoreScrollAnchor = vi.fn();
    const restoreOriginFocus = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: runtime.catalog,
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn(),
      captureScrollAnchor: () => anchor,
      restoreScrollAnchor,
      restoreOriginFocus
    });

    controller.keyDown(new KeyboardEvent('keydown', { key: ' ', cancelable: true }), manifest, origin);
    expect(runtime.catalog.getState()).toMatchObject({ suspended: true });
    runtime.catalog.setQuery('ignored while suspended');
    const escape = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });

    expect(controller.keyDown(escape, manifest, origin)).toBe(true);

    expect(escape.defaultPrevented).toBe(true);
    expect(runtime.catalog.getState()).toBe(exactSnapshot);
    expect(restoreScrollAnchor).toHaveBeenCalledOnce();
    expect(restoreScrollAnchor).toHaveBeenCalledWith(anchor);
    expect(restoreOriginFocus).toHaveBeenCalledWith(origin);
    expect(target).toHaveAttribute('tabindex', '4');
    expect(target).toHaveAttribute('role', 'region');
    expect(target).toHaveAttribute('aria-label', 'Stage region');
    expect(target).not.toHaveAttribute('data-catalog-placement-target');
    expect(controller.getState()).toEqual(expect.objectContaining({ phase: 'idle', proxy: null, targets: [] }));
    controller.destroy();
  });

  it('moves the pointer proxy, highlights the hit target, and commits it on pointerup', () => {
    const { root, origin, target: first } = placementSurface();
    const second = appendTarget(root, 'right', 'right-instruments', 'Right instruments region');
    const nestedHit = document.createElement('span');
    second.append(nestedHit);
    const onCommit = vi.fn();
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn((x: number) => x >= 500 ? nestedHit : first)
    });
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit
    });

    controller.pointerDown(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }), manifest, origin);
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 16, clientY: 10 }));
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 550, clientY: 150 }));

    expect(controller.getState().proxy).toMatchObject({ x: 550, y: 150 });
    expect(controller.getState().selectedTargetId).toBe(targetId('right', 1));
    expect(first).not.toHaveClass('is-catalog-target-active');
    expect(second).toHaveClass('is-catalog-target-active');

    document.dispatchEvent(pointerEvent('pointerup', { clientX: 550, clientY: 150 }));

    expect(onCommit).toHaveBeenCalledWith(manifest, expect.objectContaining({ element: second }));
    expect(controller.getState().phase).toBe('idle');
    expect(controller.consumeClick()).toBe(true);
    controller.destroy();
  });

  it('selects a target by its captured rectangle when a visual overlay owns the hit point', () => {
    const { root, origin, target: first } = placementSurface();
    const second = appendTarget(root, 'right', 'right-instruments', 'Right instruments region');
    const overlay = document.createElement('div');
    document.body.append(overlay);
    const onCommit = vi.fn();
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: vi.fn(() => overlay)
    });
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit
    });

    controller.pointerDown(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }), manifest, origin);
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 16, clientY: 10 }));
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 550, clientY: 150 }));

    expect(controller.getState().selectedTargetId).toBe(targetId('right', 1));
    expect(first).not.toHaveClass('is-catalog-target-active');
    expect(second).toHaveClass('is-catalog-target-active');
    controller.destroy();
    overlay.remove();
  });

  it('publishes deterministic proxy-state transitions and stops after unsubscribe', () => {
    const { root, origin } = placementSurface();
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit: vi.fn()
    });
    const phases: string[] = [];
    const unsubscribe = controller.subscribe((snapshot) => {
      phases.push(`${snapshot.phase}:${snapshot.proxy?.x ?? '-'}`);
    });

    controller.pointerDown(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }), manifest, origin);
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 16, clientY: 10 }));
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 20, clientY: 30 }));
    controller.cancel();
    unsubscribe();
    controller.pointerDown(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }), manifest, origin);

    expect(phases).toEqual(['idle:-', 'pressing:-', 'lifted:16', 'lifted:20', 'idle:-']);
    controller.destroy();
  });

  it('keeps keyboard placement active after the modal recedes by listening on the document', () => {
    const { root, origin } = placementSurface();
    const second = appendTarget(root, 'right', 'right-instruments', 'Right instruments region');
    const onCommit = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => true,
      onCommit
    });

    controller.keyDown(new KeyboardEvent('keydown', { key: ' ', cancelable: true }), manifest, origin);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));

    expect(onCommit).toHaveBeenCalledWith(manifest, expect.objectContaining({ element: second }));
    expect(controller.getState().phase).toBe('idle');
    controller.destroy();
  });

  it('refuses lift before suspension when no compatible target exists', () => {
    const { root, origin } = placementSurface();
    const suspend = vi.fn();
    const announce = vi.fn();
    const controller = createCatalogPlacementController({
      catalog: { suspend, resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => false,
      onCommit: vi.fn(),
      onAnnounce: announce
    });

    controller.keyDown(new KeyboardEvent('keydown', { key: ' ', cancelable: true }), manifest, origin);

    expect(controller.getState().phase).toBe('idle');
    expect(suspend).not.toHaveBeenCalled();
    expect(announce).toHaveBeenCalledWith(`No compatible target is available for ${manifest.title}.`);
    controller.destroy();
  });

  it('suppresses automatic click after a refused pointer drag crosses the lift threshold', () => {
    const { root, origin } = placementSurface();
    const controller = createCatalogPlacementController({
      catalog: { suspend: vi.fn(), resume: vi.fn() },
      getTargetRoot: () => root,
      getInstanceCount: () => 0,
      isCompatibleTarget: () => false,
      onCommit: vi.fn()
    });

    controller.pointerDown(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }), manifest, origin);
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 16, clientY: 10 }));

    expect(controller.getState().phase).toBe('idle');
    expect(controller.consumeClick()).toBe(true);
    controller.destroy();
  });
});
