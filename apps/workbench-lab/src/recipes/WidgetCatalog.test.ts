// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { WidgetManifest } from '@pomegranate-ui/contracts';
import { createCatalogController, createWidgetRegistry } from '@pomegranate-ui/core';

import { createLabHostContext, type LabHostContext } from '../mockup/host-context.js';
import { createCatalogManifests } from '../mockup/catalog.js';
import { createLabThemeController } from '../themes/controller.js';
import { createLabRuntime } from '../mockup/widgets.js';
import CatalogWidgetPreview from './CatalogWidgetPreview.svelte';
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

describe('WidgetCatalog', () => {
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
