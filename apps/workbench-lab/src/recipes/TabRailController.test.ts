import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTabRailController, type TabRailContextRequest } from './TabRailController.js';

function pointer(type: string, init: PointerEventInit): PointerEvent {
  return new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, ...init });
}

function configureRail(rail: HTMLElement, values: { clientWidth?: number; scrollWidth?: number } = {}) {
  Object.defineProperties(rail, {
    clientWidth: { configurable: true, value: values.clientWidth ?? 200 },
    scrollWidth: { configurable: true, value: values.scrollWidth ?? 500 }
  });
}

function tab(id: string): HTMLButtonElement {
  const element = document.createElement('button');
  element.dataset.tabId = id;
  return element;
}

describe('TabRailController', () => {
  const cleanup: HTMLElement[] = [];

  afterEach(() => {
    cleanup.splice(0).forEach((element) => element.remove());
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('pans after threshold, suppresses the click, and reflects edge state', () => {
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const onContextRequest = vi.fn<(request: TabRailContextRequest) => void>();
    const controller = createTabRailController({ rail, onContextRequest });
    const settings = tab('settings');
    rail.append(settings);

    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerType: 'mouse' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 80, pointerType: 'mouse' }));

    expect(rail.scrollLeft).toBe(20);
    expect(controller.consumeClick()).toBe(true);
    expect(rail.dataset.overflowBefore).toBe('true');
    controller.destroy();
  });

  it('does not capture before panning and releases a vertical mouse gesture to its owner', () => {
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });
    Object.defineProperty(rail, 'setPointerCapture', { configurable: true, value: () => {} });
    const capture = vi.spyOn(rail, 'setPointerCapture');

    controller.pointerDown(pointer('pointerdown', { clientX: 100, clientY: 100, pointerType: 'mouse' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 102, clientY: 112, pointerType: 'mouse' }));

    expect(capture).not.toHaveBeenCalled();
    expect(rail.scrollLeft).toBe(0);
    expect(controller.consumeClick()).toBe(false);
    controller.destroy();
  });

  it('leaves touch scrolling alone after touch movement cancels the hold candidate', () => {
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });

    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerType: 'touch' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 80, pointerType: 'touch' }));

    expect(rail.scrollLeft).toBe(0);
    expect(controller.consumeClick()).toBe(false);
    controller.destroy();
  });

  it('suppresses activation after a touch hold while a short touch remains an ordinary tap', () => {
    vi.useFakeTimers();
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });

    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerId: 1, pointerType: 'touch' }), 'settings');
    controller.pointerUp(pointer('pointerup', { clientX: 100, pointerId: 1, pointerType: 'touch' }));
    expect(controller.consumeClick()).toBe(false);
    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerId: 2, pointerType: 'touch' }), 'settings');
    vi.advanceTimersByTime(500);
    controller.pointerUp(pointer('pointerup', { clientX: 100, pointerId: 2, pointerType: 'touch' }));
    expect(controller.consumeClick()).toBe(true);
    controller.destroy();
  });

  it('suppresses a pan click when pointercancel, blur, or Escape ends the interaction', () => {
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });

    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerType: 'pen' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 80, pointerType: 'pen' }));
    controller.pointerCancel(pointer('pointercancel', { clientX: 80, pointerType: 'pen' }));
    expect(controller.consumeClick()).toBe(true);

    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerType: 'mouse' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 80, pointerType: 'mouse' }));
    window.dispatchEvent(new Event('blur'));
    expect(controller.consumeClick()).toBe(true);

    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerType: 'mouse' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 80, pointerType: 'mouse' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(controller.consumeClick()).toBe(true);
    controller.destroy();
  });

  it('forwards one native pointer context request and keyboard requests with the exact tab ID and anchor', () => {
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const onContextRequest = vi.fn<(request: TabRailContextRequest) => void>();
    const controller = createTabRailController({ rail, onContextRequest });
    const settings = tab('settings');
    rail.append(settings);
    const native = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 12, clientY: 34 });
    Object.defineProperty(native, 'currentTarget', { value: settings });

    controller.contextMenu(native, 'settings');
    controller.contextMenu(native, 'settings');
    const keyboard = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ContextMenu' });
    Object.defineProperty(keyboard, 'currentTarget', { value: settings });
    controller.keyboardContext(keyboard, 'settings');
    controller.contextMenu(new MouseEvent('contextmenu'), '');

    expect(onContextRequest).toHaveBeenCalledTimes(2);
    expect(onContextRequest).toHaveBeenNthCalledWith(1, { id: 'settings', anchor: settings, source: 'pointer' });
    expect(onContextRequest).toHaveBeenNthCalledWith(2, { id: 'settings', anchor: settings, source: 'keyboard' });
    expect(native.defaultPrevented).toBe(true);
    expect(keyboard.defaultPrevented).toBe(true);
    controller.destroy();
  });

  it('synchronizes overflow on scroll and resize, then reveals by rail-local geometry after document movement', () => {
    const resizeCallbacks: ResizeObserverCallback[] = [];
    const OriginalResizeObserver = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback: ResizeObserverCallback) { resizeCallbacks.push(callback); }
      disconnect() {}
      observe() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    Object.defineProperty(rail, 'getBoundingClientRect', { configurable: true, value: () => new DOMRect(500, 0, 200, 40) });
    const settings = tab('settings');
    rail.append(settings);
    Object.defineProperty(settings, 'getBoundingClientRect', { configurable: true, value: () => new DOMRect(750, 0, 80, 40) });
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });

    rail.scrollLeft = 300;
    rail.dispatchEvent(new Event('scroll'));
    expect(rail.dataset.overflowAfter).toBe('false');
    rail.scrollLeft = 0;
    resizeCallbacks[0]?.([], {} as ResizeObserver);
    expect(rail.dataset.overflowAfter).toBe('true');
    controller.reveal(settings);
    expect(rail.scrollLeft).toBe(130);
    controller.destroy();
    globalThis.ResizeObserver = OriginalResizeObserver;
  });
});
