import { afterEach, describe, expect, it, vi } from 'vitest';

import { createTabRailController, type TabRailContextRequest } from './TabRailController.js';

function pointer(type: string, init: PointerEventInit): PointerEvent {
  return new PointerEvent(type, { bubbles: true, button: 0, pointerId: 1, ...init });
}

function withCurrentTarget<EventType extends Event>(event: EventType, currentTarget: HTMLElement): EventType {
  Object.defineProperty(event, 'currentTarget', { value: currentTarget });
  return event;
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
    vi.unstubAllGlobals();
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

  it('reflects data-panning only while a mouse or pen rail pan is active', () => {
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });

    controller.pointerDown(pointer('pointerdown', { clientX: 100, clientY: 100, pointerType: 'mouse' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 96, clientY: 100, pointerType: 'mouse' }));
    expect(rail.dataset.panning).toBe('false');
    controller.pointerMove(pointer('pointermove', { clientX: 102, clientY: 112, pointerType: 'mouse' }));
    expect(rail.dataset.panning).toBe('false');

    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerId: 2, pointerType: 'pen' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 80, pointerId: 2, pointerType: 'pen' }));
    expect(rail.dataset.panning).toBe('true');
    controller.pointerUp(pointer('pointerup', { clientX: 80, pointerId: 2, pointerType: 'pen' }));
    expect(rail.dataset.panning).toBe('false');

    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerId: 3, pointerType: 'touch' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 80, pointerId: 3, pointerType: 'touch' }));
    expect(rail.dataset.panning).toBe('false');
    controller.destroy();
  });

  it('clears data-panning after pointer cancellation, blur, Escape, and destroy', () => {
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });
    const beginPan = (pointerId: number) => {
      controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerId, pointerType: 'mouse' }), 'settings');
      controller.pointerMove(pointer('pointermove', { clientX: 80, pointerId, pointerType: 'mouse' }));
      expect(rail.dataset.panning).toBe('true');
    };

    beginPan(1);
    controller.pointerCancel(pointer('pointercancel', { clientX: 80, pointerId: 1, pointerType: 'mouse' }));
    expect(rail.dataset.panning).toBe('false');
    beginPan(2);
    window.dispatchEvent(new Event('blur'));
    expect(rail.dataset.panning).toBe('false');
    beginPan(3);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(rail.dataset.panning).toBe('false');
    beginPan(4);
    controller.destroy();
    expect(rail.dataset.panning).toBe('false');
  });

  it('captures only after horizontal panning begins and releases capture on pointer up', () => {
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });
    Object.defineProperty(rail, 'setPointerCapture', { configurable: true, value: () => {} });
    Object.defineProperty(rail, 'releasePointerCapture', { configurable: true, value: () => {} });
    const capture = vi.spyOn(rail, 'setPointerCapture');
    const release = vi.spyOn(rail, 'releasePointerCapture');

    controller.pointerDown(pointer('pointerdown', { clientX: 100, clientY: 100, pointerType: 'mouse' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 96, clientY: 100, pointerType: 'mouse' }));
    expect(capture).not.toHaveBeenCalled();
    controller.pointerMove(pointer('pointermove', { clientX: 80, clientY: 100, pointerType: 'mouse' }));
    controller.pointerUp(pointer('pointerup', { clientX: 80, clientY: 100, pointerType: 'mouse' }));

    expect(capture).toHaveBeenCalledWith(1);
    expect(release).toHaveBeenCalledWith(1);
    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerId: 2, pointerType: 'mouse' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 80, pointerId: 2, pointerType: 'mouse' }));
    controller.pointerCancel(pointer('pointercancel', { clientX: 80, pointerId: 2, pointerType: 'mouse' }));
    expect(capture).toHaveBeenCalledWith(2);
    expect(release).toHaveBeenCalledWith(2);
    controller.destroy();
  });

  it('does not capture or release for a vertical mouse cancellation', () => {
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });
    Object.defineProperty(rail, 'setPointerCapture', { configurable: true, value: () => {} });
    Object.defineProperty(rail, 'releasePointerCapture', { configurable: true, value: () => {} });
    const capture = vi.spyOn(rail, 'setPointerCapture');
    const release = vi.spyOn(rail, 'releasePointerCapture');

    controller.pointerDown(pointer('pointerdown', { clientX: 100, clientY: 100, pointerType: 'mouse' }), 'settings');
    controller.pointerMove(pointer('pointermove', { clientX: 102, clientY: 112, pointerType: 'mouse' }));

    expect(capture).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
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

  it('emits one touch context request after a stationary hold and suppresses its native duplicate', () => {
    vi.useFakeTimers();
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const settings = tab('settings');
    const library = tab('library');
    rail.append(settings, library);
    const onContextRequest = vi.fn<(request: TabRailContextRequest) => void>();
    const controller = createTabRailController({ rail, onContextRequest });

    controller.pointerDown(withCurrentTarget(pointer('pointerdown', { clientX: 100, pointerId: 2, pointerType: 'touch' }), settings), 'settings');
    vi.advanceTimersByTime(500);

    expect(onContextRequest).toHaveBeenCalledTimes(1);
    expect(onContextRequest).toHaveBeenLastCalledWith({ id: 'settings', anchor: settings, source: 'touch' });
    expect(controller.consumeClick()).toBe(true);
    const native = withCurrentTarget(new MouseEvent('contextmenu', { cancelable: true }), settings);
    controller.contextMenu(native, 'settings');
    const independent = withCurrentTarget(new MouseEvent('contextmenu', { cancelable: true }), library);
    controller.contextMenu(independent, 'library');
    expect(onContextRequest).toHaveBeenCalledTimes(2);
    expect(native.defaultPrevented).toBe(true);
    expect(independent.defaultPrevented).toBe(true);
    controller.destroy();
  });

  it('cancels pending touch holds on movement, early completion, cancellation, blur, Escape, and destroy', () => {
    vi.useFakeTimers();
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const settings = tab('settings');
    rail.append(settings);
    const onContextRequest = vi.fn<(request: TabRailContextRequest) => void>();
    const controller = createTabRailController({ rail, onContextRequest });
    const down = (pointerId: number) => controller.pointerDown(
      withCurrentTarget(pointer('pointerdown', { clientX: 100, pointerId, pointerType: 'touch' }), settings),
      'settings'
    );

    down(1);
    controller.pointerMove(pointer('pointermove', { clientX: 80, pointerId: 1, pointerType: 'touch' }));
    down(2);
    controller.pointerUp(pointer('pointerup', { clientX: 100, pointerId: 2, pointerType: 'touch' }));
    down(3);
    controller.pointerCancel(pointer('pointercancel', { clientX: 100, pointerId: 3, pointerType: 'touch' }));
    down(4);
    window.dispatchEvent(new Event('blur'));
    down(5);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    vi.advanceTimersByTime(500);
    expect(onContextRequest).not.toHaveBeenCalled();
    controller.destroy();

    const destroyed = createTabRailController({ rail, onContextRequest });
    destroyed.pointerDown(withCurrentTarget(pointer('pointerdown', { clientX: 100, pointerType: 'touch' }), settings), 'settings');
    destroyed.destroy();
    vi.advanceTimersByTime(500);
    expect(onContextRequest).not.toHaveBeenCalled();
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
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) { resizeCallbacks.push(callback); }
      disconnect() {}
      observe() {}
      unobserve() {}
    });
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
  });

  it('disconnects observation, removes scroll synchronization, and cancels a pending touch hold on destroy', () => {
    vi.useFakeTimers();
    const disconnect = vi.fn();
    vi.stubGlobal('ResizeObserver', class {
      disconnect = disconnect;
      observe() {}
      unobserve() {}
    });
    const rail = document.body.appendChild(document.createElement('div'));
    cleanup.push(rail);
    configureRail(rail);
    const controller = createTabRailController({ rail, onContextRequest: vi.fn() });

    controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerType: 'touch' }), 'settings');
    controller.destroy();
    rail.dataset.overflowAfter = 'unchanged';
    rail.dispatchEvent(new Event('scroll'));
    vi.advanceTimersByTime(500);

    expect(disconnect).toHaveBeenCalledOnce();
    expect(rail.dataset.overflowAfter).toBe('unchanged');
    expect(vi.getTimerCount()).toBe(0);
  });
});
