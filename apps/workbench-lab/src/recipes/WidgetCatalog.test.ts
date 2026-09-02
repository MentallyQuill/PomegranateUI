// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WidgetManifest } from '@pomegranate-ui/contracts';
import { createCatalogController, createWidgetRegistry, type CatalogController, type CatalogState } from '@pomegranate-ui/core';

import { createLabHostContext, type LabHostContext } from '../mockup/host-context.js';
import { createCatalogManifests } from '../mockup/catalog.js';
import { createLabThemeController } from '../themes/controller.js';
import { createLabRuntime } from '../mockup/widgets.js';
import CatalogWidgetPreview from './CatalogWidgetPreview.svelte';
import type { CatalogPlacementTarget } from './CatalogPlacementController.js';
import WidgetCatalog from './WidgetCatalog.svelte';

const EXPECTED_CATALOG_ICON_SYMBOLS: Readonly<Record<string, string>> = Object.freeze({
  'category.story': 'mi-512482',
  'category.library': 'mi-511528',
  'category.systems': 'mi-511777',
  'category.settings': 'mi-512616',
  'category.extensions': 'mi-511722',
  'cast.profile': 'mi-512690',
  'model.routing': 'mi-511724',
  'theme.contrast': 'mi-511741',
  'provider.connection': 'mi-511728',
  'status.sound': 'mi-513035',
  'backdrop.image': 'mi-512362',
  'background.queue': 'mi-512524',
  'status.info': 'mi-511836'
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value() {
        this.setAttribute('open', '');
      }
    },
    close: {
      configurable: true,
      value() {
        this.removeAttribute('open');
      }
    }
  });
});

function previewHostContext(): LabHostContext {
  const controller = createLabThemeController({ initialId: 'deep-current' });
  const snapshot = controller.getSnapshot();
  return createLabHostContext({
    activeId: 'deep-current',
    presets: [],
    inspector: {
      colors: snapshot.compiled.theme.colors,
      typography: [],
      geometry: 'faceted · 4px',
      density: 'compact',
      iconPackId: snapshot.compiled.theme.iconPackId
    },
    materialControls: snapshot.materialControls,
    authoring: controller.getAuthoringSnapshot(),
    activate: () => undefined,
    setMaterialControl: () => undefined,
    resetMaterialControls: () => undefined,
    openSettings: () => undefined,
    editDraft: (next) => controller.editDraft(next),
    resetDraft: () => controller.resetDraft(),
    saveDraft: () => controller.saveDraft()
  });
}

function renderCatalog(options: {
  instanceCounts?: Readonly<Record<string, number>>;
  oncreate?: (manifest: WidgetManifest) => void;
  onplace?: (manifest: WidgetManifest, result: HTMLElement) => void;
} = {}) {
  const runtime = createLabRuntime();
  runtime.catalog.open('expanded');
  const oncreate = options.oncreate ?? vi.fn<(manifest: WidgetManifest) => void>();
  const rendered = render(WidgetCatalog, {
    catalog: runtime.catalog,
    rendererRegistry: runtime.rendererRegistry,
    hostContext: previewHostContext(),
    instanceCounts: options.instanceCounts ?? {},
    oncreate,
    ...(options.onplace ? { onplace: options.onplace } : {})
  });
  return { ...runtime, ...rendered, oncreate, onplace: options.onplace };
}

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

function renderPlacementCatalog() {
  const runtime = createLabRuntime();
  runtime.catalog.open('expanded');
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
  const placementBoundary = vi.fn();
  const rendered = render(WidgetCatalog, {
    catalog: runtime.catalog,
    rendererRegistry: runtime.rendererRegistry,
    hostContext: previewHostContext(),
    instanceCounts: {},
    oncreate: (manifest: WidgetManifest) => placementBoundary(manifest),
    ontargetplace: (manifest: WidgetManifest, placementTarget: CatalogPlacementTarget) => placementBoundary(manifest, placementTarget),
    getPlacementTargetRoot: () => root,
    isPlacementTargetCompatible: () => true
  });
  return { ...runtime, ...rendered, root, target, placementBoundary };
}

function trackCatalogSubscriptions(catalog: CatalogController) {
  const active = new Set<() => void>();
  const tracked = Object.create(catalog) as CatalogController;
  Object.defineProperty(tracked, 'subscribe', {
    value(listener: (state: ReturnType<CatalogController['getState']>) => void) {
      const unsubscribe = catalog.subscribe(listener);
      const trackedUnsubscribe = () => {
        if (!active.delete(trackedUnsubscribe)) return;
        unsubscribe();
      };
      active.add(trackedUnsubscribe);
      return trackedUnsubscribe;
    }
  });
  Object.freeze(tracked);
  return { catalog: tracked, active };
}

function createStructuralCatalog(catalog: CatalogController) {
  const listeners = new Set<(state: CatalogState) => void>();
  let state = catalog.getState();
  let optionalPreflightReads = 0;
  const emitting = {
    ...catalog,
    getState: () => state,
    subscribe(listener: (next: CatalogState) => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    }
  } satisfies CatalogController;
  Object.defineProperty(emitting, 'registerCatalogSnapshotPreflight', {
    get() {
      optionalPreflightReads += 1;
      return undefined;
    }
  });
  return {
    catalog: Object.freeze(emitting),
    emit(next: CatalogState) {
      state = next;
      for (const listener of listeners) listener(next);
    },
    listeners,
    optionalPreflightReads: () => optionalPreflightReads
  };
}

function trackCatalogRenderLifecycle() {
  let nextFrame = 0;
  const activeFrames = new Set<number>();
  const requestFrame = vi.fn((_callback: FrameRequestCallback) => {
    nextFrame += 1;
    activeFrames.add(nextFrame);
    return nextFrame;
  });
  const cancelFrame = vi.fn((frame: number) => { activeFrames.delete(frame); });
  vi.stubGlobal('requestAnimationFrame', requestFrame);
  vi.stubGlobal('cancelAnimationFrame', cancelFrame);

  const mutationObservers = new Set<object>();
  const resizeObservers = new Set<object>();
  const mutationDisconnect = vi.fn();
  const resizeDisconnect = vi.fn();
  class InstrumentedMutationObserver {
    constructor(_callback: MutationCallback) {
      mutationObservers.add(this);
    }
    disconnect = () => {
      mutationDisconnect();
      mutationObservers.delete(this);
    };
    observe = vi.fn();
    takeRecords = vi.fn(() => []);
  }
  class InstrumentedResizeObserver {
    constructor(_callback: ResizeObserverCallback) {
      resizeObservers.add(this);
    }
    disconnect = () => {
      resizeDisconnect();
      resizeObservers.delete(this);
    };
    observe = vi.fn();
    unobserve = vi.fn();
  }
  vi.stubGlobal('MutationObserver', InstrumentedMutationObserver);
  vi.stubGlobal('ResizeObserver', InstrumentedResizeObserver);

  const listeners = new Map<EventTarget, Map<string, Set<EventListenerOrEventListenerObject>>>();
  const originalAdd = EventTarget.prototype.addEventListener;
  const originalRemove = EventTarget.prototype.removeEventListener;
  let renderBoundaryActive = false;
  const isCatalogTarget = (target: EventTarget) => target === window
    || target === document
    || target instanceof HTMLDialogElement;
  const listenerKey = (type: string, options?: boolean | AddEventListenerOptions) => `${type}:${typeof options === 'boolean' ? options : options?.capture === true}`;
  // Svelte's document delegates are intentionally process-scoped. Keep raw dialog
  // registrations distinct from listeners that still have a production-reachable
  // target; this harness itself is the only strong owner of detached dialog targets.
  const listenerCountFor = (target: EventTarget) => [...listeners.get(target)?.values() ?? []]
    .reduce((total, registered) => total + registered.size, 0);
  const dialogListenerCount = (predicate: (dialog: HTMLDialogElement) => boolean) => [...listeners.entries()]
    .filter(([target]) => target instanceof HTMLDialogElement && predicate(target))
    .reduce((total, [target]) => total + listenerCountFor(target), 0);
  const addSpy = vi.spyOn(EventTarget.prototype, 'addEventListener').mockImplementation(function (
    this: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ) {
    originalAdd.call(this, type, listener, options);
    if (!renderBoundaryActive || !listener || !isCatalogTarget(this)) return;
    const byType = listeners.get(this) ?? new Map<string, Set<EventListenerOrEventListenerObject>>();
    const registered = byType.get(listenerKey(type, options)) ?? new Set<EventListenerOrEventListenerObject>();
    registered.add(listener);
    byType.set(listenerKey(type, options), registered);
    listeners.set(this, byType);
  });
  const removeSpy = vi.spyOn(EventTarget.prototype, 'removeEventListener').mockImplementation(function (
    this: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ) {
    originalRemove.call(this, type, listener, options);
    const registered = listeners.get(this)?.get(listenerKey(type, options));
    if (!listener || !registered) return;
    registered.delete(listener);
  });

  return {
    beginRenderBoundary: () => { renderBoundaryActive = true; },
    endRenderBoundary: () => { renderBoundaryActive = false; },
    snapshot: (subscriptions = 0) => ({
      subscriptions,
      frames: activeFrames.size,
      mutationObservers: mutationObservers.size,
      resizeObservers: resizeObservers.size,
      listeners: {
        frameworkDocumentDelegates: listenerCountFor(document),
        componentWindowRegistrations: listenerCountFor(window),
        rawUnmatchedDialogRegistrations: dialogListenerCount(() => true),
        activeComponentOwnedListeners: listenerCountFor(window) + dialogListenerCount((dialog) => dialog.isConnected)
      },
      dialogs: document.querySelectorAll('dialog[aria-label="Widget Catalog"]').length,
      results: document.querySelectorAll('[data-catalog-result]').length,
      previews: document.querySelectorAll('[data-catalog-preview]').length
    }),
    requestFrame,
    cancelFrame,
    mutationDisconnect,
    resizeDisconnect,
    restore() {
      addSpy.mockRestore();
      removeSpy.mockRestore();
      vi.unstubAllGlobals();
    }
  };
}

describe('WidgetCatalog', () => {
  it('recovers a failed unknown-icon render without residual catalog lifecycle state', async () => {
    const lifecycle = trackCatalogRenderLifecycle();
    try {
    const invalidManifest = createCatalogManifests().find(({ type }) => type === 'settings.group.account-access')!;
    const invalidRegistry = createWidgetRegistry();
    expect(invalidRegistry.register({
      ...invalidManifest,
      catalog: { ...invalidManifest.catalog!, iconKey: 'unknown.catalog-icon' }
    } satisfies WidgetManifest).ok).toBe(true);
    const invalidCatalog = createCatalogController(invalidRegistry);
    invalidCatalog.open('expanded');
    const failed = trackCatalogSubscriptions(invalidCatalog);

    lifecycle.beginRenderBoundary();
    expect(() => render(WidgetCatalog, {
      catalog: failed.catalog,
      rendererRegistry: createLabRuntime().rendererRegistry,
      hostContext: previewHostContext(),
      instanceCounts: {},
      oncreate: vi.fn()
    })).toThrow('Missing authoritative catalog icon for unknown.catalog-icon.');
    lifecycle.endRenderBoundary();
    await tick();
    await tick();

    expect(lifecycle.snapshot(failed.active.size)).toEqual({
      subscriptions: 0,
      frames: 0,
      mutationObservers: 0,
      resizeObservers: 0,
      listeners: {
        frameworkDocumentDelegates: 0,
        componentWindowRegistrations: 0,
        rawUnmatchedDialogRegistrations: 0,
        activeComponentOwnedListeners: 0
      },
      dialogs: 0,
      results: 0,
      previews: 0
    });

    const runtime = createLabRuntime();
    runtime.catalog.open('expanded');
    const recovered = trackCatalogSubscriptions(runtime.catalog);
    lifecycle.beginRenderBoundary();
    const rendered = render(WidgetCatalog, {
      catalog: recovered.catalog,
      rendererRegistry: runtime.rendererRegistry,
      hostContext: previewHostContext(),
      instanceCounts: {},
      oncreate: vi.fn()
    });
    lifecycle.endRenderBoundary();
    await tick();
    await tick();

    const results = [...rendered.container.querySelectorAll<HTMLElement>('[data-catalog-result]')];
    expect(results).toHaveLength(94);
    const iconUses = rendered.container.querySelectorAll('svg[data-catalog-icon] use');
    expect(iconUses).toHaveLength(94);
    for (const manifest of createCatalogManifests()) {
      const iconKey = manifest.catalog!.iconKey;
      const result = rendered.container.querySelector<HTMLElement>(`[data-widget-type="${manifest.type}"]`)!;
      expect(result.querySelectorAll('svg[data-catalog-icon] use')).toHaveLength(1);
      expect(result.querySelector(`svg[data-catalog-icon="${iconKey}"] use`)).toHaveAttribute('href', `#${EXPECTED_CATALOG_ICON_SYMBOLS[iconKey]}`);
    }
    expect(lifecycle.snapshot(recovered.active.size)).toEqual({
      subscriptions: 1,
      frames: 1,
      mutationObservers: 94,
      resizeObservers: 1,
      listeners: {
        frameworkDocumentDelegates: 7,
        componentWindowRegistrations: 0,
        rawUnmatchedDialogRegistrations: 1,
        activeComponentOwnedListeners: 1
      },
      dialogs: 1,
      results: 94,
      previews: 94
    });

    rendered.unmount();
    expect(lifecycle.snapshot(recovered.active.size)).toEqual({
      subscriptions: 0,
      frames: 0,
      mutationObservers: 0,
      resizeObservers: 0,
      listeners: {
        frameworkDocumentDelegates: 1,
        componentWindowRegistrations: 0,
        rawUnmatchedDialogRegistrations: 1,
        activeComponentOwnedListeners: 0
      },
      dialogs: 0,
      results: 0,
      previews: 0
    });
    expect(lifecycle.requestFrame).toHaveBeenCalledTimes(1);
    expect(lifecycle.cancelFrame).toHaveBeenCalledTimes(1);
    expect(lifecycle.mutationDisconnect).toHaveBeenCalledTimes(94);
    expect(lifecycle.resizeDisconnect).toHaveBeenCalledTimes(1);
    } finally {
      lifecycle.restore();
    }
  });

  it('isolates later invalid structural snapshots without registering a precommit owner', async () => {
    const lifecycle = trackCatalogRenderLifecycle();
    try {
    const runtime = createLabRuntime();
    runtime.catalog.open('expanded');
    const emitting = createStructuralCatalog(runtime.catalog);
    const tracked = trackCatalogSubscriptions(emitting.catalog);
    const invariantErrors = vi.fn(() => { throw new Error('observer failed'); });
    lifecycle.beginRenderBoundary();
    const rendered = render(WidgetCatalog, {
      catalog: tracked.catalog,
      rendererRegistry: runtime.rendererRegistry,
      hostContext: previewHostContext(),
      instanceCounts: {},
      oncreate: vi.fn(),
      onCatalogInvariantError: invariantErrors
    });
    lifecycle.endRenderBoundary();
    await tick();
    await tick();
    const before = lifecycle.snapshot(tracked.active.size);
    expect(before.subscriptions).toBe(1);
    expect(before.frames).toBe(1);
    expect(before.mutationObservers).toBe(94);
    expect(before.resizeObservers).toBe(1);
    expect(before.listeners.componentWindowRegistrations).toBe(0);
    expect(before.listeners.rawUnmatchedDialogRegistrations).toBe(1);
    expect(before.listeners.activeComponentOwnedListeners).toBe(1);
    expect(before.dialogs).toBe(1);
    expect(before.results).toBe(94);
    expect(before.previews).toBe(94);
    expect({
      optionalPreflightReads: emitting.optionalPreflightReads()
    }).toEqual({
      optionalPreflightReads: 0
    });
    const downstream = vi.fn();
    emitting.catalog.subscribe(downstream);
    const validState = runtime.catalog.getState();
    const first = validState.results[0]!;
    const invalidState = Object.freeze({
      ...validState,
      results: Object.freeze([{
        ...first,
        catalog: { ...first.catalog!, iconKey: 'unknown.catalog-icon' }
      } satisfies WidgetManifest, ...validState.results.slice(1)])
    });

    let invalidError: unknown;
    try {
      emitting.emit(invalidState);
    } catch (error) {
      invalidError = error;
    }
    expect({
      error: invalidError instanceof Error ? invalidError.message : invalidError,
      externalStateCommitted: emitting.catalog.getState() === invalidState,
      downstreamCalls: downstream.mock.calls.length
    }).toEqual({
      error: undefined,
      externalStateCommitted: true,
      downstreamCalls: 1
    });
    expect(downstream).toHaveBeenLastCalledWith(invalidState);
    expect(invariantErrors).toHaveBeenCalledWith(expect.objectContaining({ message: 'Missing authoritative catalog icon for unknown.catalog-icon.' }));
    await tick();
    await tick();
    expect(emitting.optionalPreflightReads()).toBe(0);
    expect(invariantErrors).toHaveBeenCalledTimes(1);

    expect(rendered.container.querySelectorAll('[data-catalog-result]')).toHaveLength(94);
    expect(rendered.container.querySelectorAll('svg[data-catalog-icon] use')).toHaveLength(94);
    expect(lifecycle.snapshot(tracked.active.size)).toEqual(before);

    const subsequentValidState = Object.freeze({ ...validState, previewWidth: 300 });
    emitting.emit(subsequentValidState);
    expect(emitting.catalog.getState()).toBe(subsequentValidState);
    expect(downstream).toHaveBeenCalledTimes(2);
    expect(downstream).toHaveBeenLastCalledWith(subsequentValidState);
    await tick();
    await tick();
    expect(emitting.optionalPreflightReads()).toBe(0);
    expect(invariantErrors).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('slider', { name: 'Preview size' })).toHaveValue('300');
    expect(rendered.container.querySelectorAll('[data-catalog-result]')).toHaveLength(94);
    expect(lifecycle.snapshot(tracked.active.size)).toEqual(before);

    rendered.unmount();
    const unmounted = lifecycle.snapshot(tracked.active.size);
    expect({
      subscriptions: unmounted.subscriptions,
      frames: unmounted.frames,
      mutationObservers: unmounted.mutationObservers,
      resizeObservers: unmounted.resizeObservers,
      componentWindowRegistrations: unmounted.listeners.componentWindowRegistrations,
      rawUnmatchedDialogRegistrations: unmounted.listeners.rawUnmatchedDialogRegistrations,
      activeComponentOwnedListeners: unmounted.listeners.activeComponentOwnedListeners,
      dialogs: unmounted.dialogs,
      results: unmounted.results,
      previews: unmounted.previews
    }).toEqual({
      subscriptions: 0,
      frames: 0,
      mutationObservers: 0,
      resizeObservers: 0,
      componentWindowRegistrations: 0,
      rawUnmatchedDialogRegistrations: 1,
      activeComponentOwnedListeners: 0,
      dialogs: 0,
      results: 0,
      previews: 0
    });
    expect(unmounted.listeners.frameworkDocumentDelegates).toBeGreaterThanOrEqual(0);
    expect(emitting.optionalPreflightReads()).toBe(0);
    expect(invariantErrors).toHaveBeenCalledTimes(1);
    } finally {
      lifecycle.restore();
    }
  });

  it('fails closed when a known Widget manifest carries an unmapped icon key', () => {
    const manifest = createCatalogManifests().find(({ type }) => type === 'settings.group.account-access')!;
    const invalidIconManifest = {
      ...manifest,
      catalog: { ...manifest.catalog!, iconKey: 'unknown.catalog-icon' }
    } satisfies WidgetManifest;
    const registry = createWidgetRegistry();
    expect(registry.register(invalidIconManifest).ok).toBe(true);
    const catalog = createCatalogController(registry);
    catalog.open('expanded');
    const runtime = createLabRuntime();

    expect(() => render(WidgetCatalog, {
      catalog,
      rendererRegistry: runtime.rendererRegistry,
      hostContext: previewHostContext(),
      instanceCounts: {},
      oncreate: vi.fn()
    })).toThrow('Missing authoritative catalog icon for unknown.catalog-icon.');
  });

  it('resolves all 94 manifests to the expected 13 source symbols in Visual and Compact modes', async () => {
    const user = userEvent.setup();
    const manifests = createCatalogManifests();
    const { container } = renderCatalog();
    const iconKeys = new Set(manifests.map((manifest) => manifest.catalog!.iconKey));

    expect(manifests).toHaveLength(94);
    expect(iconKeys).toEqual(new Set(Object.keys(EXPECTED_CATALOG_ICON_SYMBOLS)));

    const assertModeIcons = () => {
      const results = [...container.querySelectorAll<HTMLElement>('[data-catalog-result]')];
      expect(results).toHaveLength(94);
      for (const manifest of manifests) {
        const iconKey = manifest.catalog!.iconKey;
        const expectedSymbol = EXPECTED_CATALOG_ICON_SYMBOLS[iconKey];
        expect(expectedSymbol, `${manifest.type} must use an authoritative icon key`).toBeDefined();
        const result = container.querySelector<HTMLElement>(`[data-widget-type="${manifest.type}"]`)!;
        expect(result.querySelector(`svg[data-catalog-icon="${iconKey}"] use`), `${manifest.type} icon`).toHaveAttribute('href', `#${expectedSymbol}`);
      }
    };

    assertModeIcons();
    await user.click(screen.getByRole('button', { name: 'Compact' }));
    assertModeIcons();
  });

  it('renders the fixed source controls and all 94 whole-result shared previews', async () => {
    const { container } = renderCatalog();
    const dialog = screen.getByRole('dialog', { name: 'Widget Catalog' });

    expect(within(dialog).getByRole('heading', { name: 'Widget Catalog' })).toBeVisible();
    expect(within(dialog).getByText('Build this Panel')).toBeVisible();
    expect(within(dialog).getByRole('button', { name: 'Close Widget Catalog' })).toBeVisible();
    expect(within(dialog).getByRole('searchbox', { name: 'Search Widgets' })).toHaveAttribute('placeholder', 'Search widgets…');

    const slider = within(dialog).getByRole('slider', { name: 'Preview size' });
    expect(slider).toHaveAttribute('min', '200');
    expect(slider).toHaveAttribute('max', '420');
    expect(slider).toHaveValue('286');
    expect(slider).toHaveAttribute('aria-valuetext', 'Medium preview, 286 pixels');
    expect(within(dialog).getByText('Medium · 286 px')).toBeVisible();
    expect([...dialog.querySelectorAll('datalist option')].map((option) => [option.getAttribute('value'), option.getAttribute('label')])).toEqual([
      ['200', 'Small'],
      ['286', 'Medium'],
      ['420', 'Large']
    ]);

    expect(within(within(dialog).getByRole('navigation', { name: 'Widget categories' })).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'All', 'Story', 'Library', 'Systems', 'Settings', 'Extensions'
    ]);
    expect(within(within(dialog).getByRole('group', { name: 'Catalog filters' })).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Favorites', 'Recent', 'On this Panel', 'Fits this layout'
    ]);
    expect(within(within(dialog).getByRole('group', { name: 'Catalog view' })).getAllByRole('button').map((button) => button.textContent)).toEqual(['Visual', 'Compact']);
    expect(within(dialog).getByText('94 widgets')).toBeVisible();
    expect(within(dialog).getByText('Strictly active story')).toBeVisible();

    const results = container.querySelectorAll<HTMLElement>('[data-catalog-result]');
    expect(results).toHaveLength(94);
    expect([...results].every((result) => result.getAttribute('role') === 'button' && result.tabIndex === 0)).toBe(true);
    const previews = container.querySelectorAll<HTMLElement>('[data-catalog-preview]');
    expect(previews).toHaveLength(94);
    expect([...previews].every((preview) => preview.hasAttribute('inert') && preview.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(container.querySelectorAll('[data-surface-type]')).toHaveLength(94);
    expect(screen.queryByText(/Renderer unavailable/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Add / })).not.toBeInTheDocument();

    await waitFor(() => {
      const ids = [...container.querySelectorAll('[id]')].map((element) => element.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('activates enabled whole results with click, Enter, and Space while refusing disabled singletons', async () => {
    const user = userEvent.setup();
    const clicked = renderCatalog();
    const clickResult = clicked.container.querySelector<HTMLElement>('[data-catalog-result]')!;

    await user.click(clickResult);
    expect(clicked.oncreate).toHaveBeenCalledTimes(1);
    expect(clicked.oncreate).toHaveBeenCalledWith(expect.objectContaining({ type: clickResult.dataset.widgetType }));
    await fireEvent.keyDown(clickResult, { key: 'Enter', repeat: true });
    expect(clicked.oncreate).toHaveBeenCalledTimes(1);

    cleanup();
    const onplace = vi.fn();
    const keyboard = renderCatalog({ onplace });
    const keyboardResult = keyboard.container.querySelector<HTMLElement>('[data-catalog-result]')!;
    const enterAllowed = await fireEvent.keyDown(keyboardResult, { key: 'Enter' });
    const spaceAllowed = await fireEvent.keyDown(keyboardResult, { key: ' ' });
    expect(enterAllowed).toBe(true);
    expect(spaceAllowed).toBe(false);
    expect(onplace).toHaveBeenCalledTimes(2);
    expect(onplace.mock.calls.map(([manifest, result]) => [manifest.type, result])).toEqual([
      [keyboardResult.dataset.widgetType, keyboardResult],
      [keyboardResult.dataset.widgetType, keyboardResult]
    ]);

    cleanup();
    const disabledCreate = vi.fn();
    const disabledPlace = vi.fn();
    const disabled = renderCatalog({
      instanceCounts: { 'settings.accessibility': 1 },
      oncreate: disabledCreate,
      onplace: disabledPlace
    });
    const disabledResult = disabled.container.querySelector<HTMLElement>('[data-widget-type="settings.accessibility"]')!;
    expect(disabledResult).toHaveAttribute('aria-disabled', 'true');
    await fireEvent.click(disabledResult);
    await fireEvent.keyDown(disabledResult, { key: 'Enter' });
    const disabledSpaceAllowed = await fireEvent.keyDown(disabledResult, { key: ' ' });
    expect(disabledSpaceAllowed).toBe(false);
    expect(disabledCreate).not.toHaveBeenCalled();
    expect(disabledPlace).not.toHaveBeenCalled();
  });

  it('mounts production placement wiring through one boundary with modal recede, focus, suppression, and cleanup', async () => {
    const rendered = renderPlacementCatalog();
    const result = rendered.container.querySelector<HTMLElement>('[data-widget-type="story.transcript"]')!;
    const dialog = screen.getByRole('dialog', { name: 'Widget Catalog' });
    Object.defineProperty(result, 'getBoundingClientRect', {
      configurable: true,
      value: () => new DOMRect(10, 10, 286, 360)
    });
    Object.defineProperty(document, 'elementFromPoint', {
      configurable: true,
      value: () => rendered.target
    });

    await fireEvent.keyDown(result, { key: 'Enter', repeat: true });
    expect(rendered.placementBoundary).not.toHaveBeenCalled();
    await fireEvent.keyDown(result, { key: 'Enter' });
    expect(rendered.placementBoundary).toHaveBeenCalledTimes(1);
    expect(rendered.placementBoundary.mock.calls[0]).toEqual([expect.objectContaining({ type: 'story.transcript' })]);

    result.focus();
    await fireEvent.keyDown(result, { key: ' ' });
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    await waitFor(() => expect(rendered.target).toHaveFocus());
    expect(rendered.catalog.getState().suspended).toBe(true);
    expect(rendered.target).toHaveClass('is-catalog-placement-target', 'is-catalog-target-active');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true, cancelable: true }));
    expect(rendered.placementBoundary).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
    await waitFor(() => expect(result).toHaveFocus());
    expect(rendered.placementBoundary).toHaveBeenCalledTimes(2);
    expect(rendered.placementBoundary.mock.calls[1]).toEqual([
      expect.objectContaining({ type: 'story.transcript' }),
      expect.objectContaining({ identity: expect.objectContaining({ regionId: 'stage', lane: 0 }) })
    ]);

    result.dispatchEvent(pointerEvent('pointerdown', { clientX: 10, clientY: 10 }));
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 16, clientY: 10 }));
    document.dispatchEvent(pointerEvent('pointermove', { clientX: 150, clientY: 150 }));
    await tick();
    const proxy = rendered.container.querySelector<HTMLElement>('[data-catalog-placement-proxy]')!;
    expect(proxy).not.toBeNull();
    expect(proxy.closest('dialog')).toBeNull();
    expect(proxy).toHaveAttribute('data-widget-type', 'story.transcript');
    expect(proxy).toHaveAttribute('data-placement-phase', 'lifted');
    expect(proxy).toHaveAttribute('data-placement-input', 'pointer');
    expect(proxy).toHaveAttribute('data-placement-x', '150');
    expect(proxy).toHaveAttribute('data-placement-y', '150');
    expect(proxy.querySelector('.catalog-placement-proxy-title')).toHaveTextContent('Transcript');
    expect(rendered.container.querySelector('.catalog-placement-status')).toHaveTextContent('Transcript lifted. Drag to a highlighted Panel target.');
    expect(dialog).not.toContainElement(proxy);
    document.dispatchEvent(pointerEvent('pointerup', { clientX: 150, clientY: 150 }));
    await waitFor(() => expect(dialog).toHaveAttribute('open'));
    expect(rendered.placementBoundary).toHaveBeenCalledTimes(3);
    expect(rendered.container.querySelector('[data-catalog-placement-proxy]')).toBeNull();
    await fireEvent.click(result);
    expect(rendered.placementBoundary).toHaveBeenCalledTimes(3);
    await fireEvent.click(result);
    expect(rendered.placementBoundary).toHaveBeenCalledTimes(4);

    await fireEvent.keyDown(result, { key: ' ' });
    await waitFor(() => expect(rendered.catalog.getState().suspended).toBe(true));
    rendered.unmount();
    expect(rendered.catalog.getState().suspended).toBe(false);
    expect(rendered.target).not.toHaveAttribute('data-catalog-placement-target');
    expect(rendered.target).not.toHaveClass('is-catalog-placement-target', 'is-catalog-target-active');
    rendered.root.remove();
  });

  it('measures intrinsic content and lets only the newest rapid restack restore its anchor', async () => {
    let nextFrame = 0;
    const callbacks = new Map<number, FrameRequestCallback>();
    const pendingFrames = new Set<number>();
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      nextFrame += 1;
      callbacks.set(nextFrame, callback);
      pendingFrames.add(nextFrame);
      return nextFrame;
    });
    const cancelFrame = vi.fn((id: number) => { pendingFrames.delete(id); });
    const executeFrame = (id: number) => {
      pendingFrames.delete(id);
      callbacks.get(id)?.(0);
    };
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    const user = userEvent.setup();
    const { container } = renderCatalog();
    const results = container.querySelector<HTMLElement>('[data-catalog-results]')!;
    Object.defineProperty(results, 'clientWidth', { configurable: true, value: 600 });
    let resultTop = 20;
    vi.spyOn(results, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, top: 0, right: 600, bottom: 500, left: 0, width: 600, height: 500, toJSON: () => ({})
    });
    const firstResult = results.querySelector<HTMLElement>('[data-catalog-result]')!;
    const firstContent = firstResult.querySelector<HTMLElement>('[data-catalog-result-content]')!;
    vi.spyOn(firstResult, 'getBoundingClientRect').mockImplementation(() => ({
      x: 0, y: resultTop, top: resultTop, right: 286, bottom: resultTop + 100, left: 0, width: 286, height: 100, toJSON: () => ({})
    }));
    vi.spyOn(firstContent, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, top: 0, right: 286, bottom: 160, left: 0, width: 286, height: 160, toJSON: () => ({})
    });

    await tick();
    await tick();
    for (const id of [...pendingFrames]) executeFrame(id);

    const slider = screen.getByRole('slider', { name: 'Preview size' });
    await fireEvent.input(slider, { target: { value: '300' } });
    await tick();
    await tick();
    expect(pendingFrames.size).toBe(1);
    const firstFrame = [...pendingFrames][0]!;

    resultTop = 70;
    await fireEvent.input(slider, { target: { value: '320' } });
    await tick();
    await tick();
    const secondFrame = [...pendingFrames][0]!;
    expect(secondFrame).not.toBe(firstFrame);
    expect(cancelFrame).toHaveBeenCalledWith(firstFrame);

    executeFrame(firstFrame);
    expect(results.scrollTop).toBe(0);

    resultTop = 90;
    await fireEvent.input(slider, { target: { value: '340' } });
    await tick();
    await tick();
    expect(cancelFrame).toHaveBeenCalledWith(secondFrame);
    expect(pendingFrames.size).toBe(1);
    const newestFrame = [...pendingFrames][0]!;

    resultTop = 120;
    executeFrame(secondFrame);
    expect(results.scrollTop).toBe(0);
    executeFrame(newestFrame);
    expect(results.scrollTop).toBe(30);
    expect(pendingFrames.size).toBe(0);

    const search = screen.getByRole('searchbox', { name: 'Search Widgets' });
    await fireEvent.input(search, { target: { value: 'access' } });
    await tick();
    await tick();
    await user.click(screen.getByRole('button', { name: 'Settings' }));
    await tick();
    await tick();

    expect(pendingFrames.size).toBe(1);
    executeFrame([...pendingFrames][0]!);
    expect(pendingFrames.size).toBe(0);
    expect(results.style.getPropertyValue('--pom-catalog-preview-width')).toBe('340px');
    expect(results.style.getPropertyValue('--pom-catalog-columns')).toBe('1');
    expect(firstResult.style.gridRowEnd).toBe('span 11');
  });

  it('does not sync or enqueue restoration after destruction wins the pending tick', async () => {
    const requestFrame = vi.fn((_callback: FrameRequestCallback) => 1);
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const rendered = renderCatalog();
    rendered.unmount();
    await tick();
    await tick();

    expect(requestFrame).not.toHaveBeenCalled();
  });

  it('uses Compact as the same one-column result tree without previews or preview sizing', async () => {
    const user = userEvent.setup();
    const { container } = renderCatalog();

    await user.click(screen.getByRole('button', { name: 'Compact' }));

    expect(screen.queryByRole('slider', { name: 'Preview size' })).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-catalog-preview]')).toHaveLength(0);
    expect(container.querySelector('[data-catalog-results]')).toHaveAttribute('data-catalog-view', 'compact');
    expect(container.querySelectorAll('[data-catalog-result]')).toHaveLength(94);
    const first = container.querySelector<HTMLElement>('[data-catalog-result]')!;
    expect(within(first).getByText('Drag')).toBeVisible();
    expect(first.querySelector('.catalog-compact-copy span')).toHaveTextContent(/^settings · global device · medium$/i);

    const accountAccess = container.querySelector<HTMLElement>('[data-widget-type="settings.group.account-access"]')!;
    const stories = container.querySelector<HTMLElement>('[data-widget-type="library.stories"]')!;
    const newStory = container.querySelector<HTMLElement>('[data-widget-type="library.new-story"]')!;
    const cast = container.querySelector<HTMLElement>('[data-widget-type="systems.cast"]')!;
    expect(accountAccess.querySelector('svg[data-catalog-icon="category.settings"] use')).toHaveAttribute('href', '#mi-512616');
    expect(stories.querySelector('.catalog-compact-copy span')).toHaveTextContent('library · global · medium');
    expect(newStory.querySelector('.catalog-compact-copy span')).toHaveTextContent('library · global workflow · wide');
    expect(cast.querySelector('.catalog-compact-copy span')).toHaveTextContent('systems · active story present frame · medium');
    expect(stories.querySelector('svg[data-catalog-icon="category.library"] use')).toHaveAttribute('href', '#mi-511528');
    expect(cast.querySelector('svg[data-catalog-icon="category.systems"] use')).toHaveAttribute('href', '#mi-511777');
  });

  it('uses the authoritative visual identity and drag copy', () => {
    const { container } = renderCatalog();
    const first = container.querySelector<HTMLElement>('[data-catalog-result]')!;
    const accountAccess = container.querySelector<HTMLElement>('[data-widget-type="settings.group.account-access"]')!;

    expect(first).toHaveAccessibleName(/drag to place on this Panel\. Press Space for keyboard placement\.$/i);
    expect(accountAccess.querySelector('[data-catalog-widget-identity] svg[data-catalog-icon="category.settings"] use')).toHaveAttribute('href', '#mi-512616');
    expect(within(first).getByText('Drag to Panel')).toBeVisible();
  });

  it('strips IDs from late preview mutations and disconnects observers when unmounted before setup', async () => {
    const runtime = createLabRuntime();
    const manifest = createCatalogManifests().find(({ type }) => type === 'story.composer')!;
    const rendered = render(CatalogWidgetPreview, {
      manifest,
      rendererRegistry: runtime.rendererRegistry,
      hostContext: previewHostContext()
    });
    const host = rendered.container.querySelector<HTMLElement>('[data-catalog-preview]')!;
    await waitFor(() => expect(host.querySelector('[id]')).toBeNull());
    const late = document.createElement('span');
    late.id = 'late-preview-id';
    host.append(late);
    await waitFor(() => expect(late).not.toHaveAttribute('id'));
    rendered.unmount();

    const observers: { disconnect: ReturnType<typeof vi.fn> }[] = [];
    class InstrumentedObserver {
      disconnect = vi.fn();
      observe = vi.fn();
      unobserve = vi.fn();
      takeRecords = vi.fn(() => []);
      constructor(_callback: MutationCallback) {
        observers.push(this);
      }
    }
    vi.stubGlobal('MutationObserver', InstrumentedObserver);
    const churned = render(CatalogWidgetPreview, {
      manifest,
      rendererRegistry: runtime.rendererRegistry,
      hostContext: previewHostContext()
    });
    churned.unmount();
    await tick();
    await tick();
    expect(observers).toHaveLength(0);

    const mounted = render(CatalogWidgetPreview, {
      manifest,
      rendererRegistry: runtime.rendererRegistry,
      hostContext: previewHostContext()
    });
    await tick();
    await tick();
    expect(observers).toHaveLength(1);
    mounted.unmount();
    expect(observers[0]?.disconnect).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape and restores focus to the launcher', async () => {
    const runtime = createLabRuntime();
    const launcher = document.createElement('button');
    launcher.textContent = 'Widgets';
    document.body.append(launcher);
    launcher.focus();
    render(WidgetCatalog, {
      catalog: runtime.catalog,
      rendererRegistry: runtime.rendererRegistry,
      hostContext: previewHostContext(),
      instanceCounts: {},
      oncreate: vi.fn()
    });
    runtime.catalog.open('expanded');

    const search = await screen.findByRole('searchbox', { name: 'Search Widgets' });
    await waitFor(() => expect(search).toHaveFocus());
    await fireEvent.keyDown(search, { key: 'Escape' });

    expect(runtime.catalog.getState().open).toBe(false);
    await waitFor(() => expect(launcher).toHaveFocus());
    launcher.remove();
  });
});
