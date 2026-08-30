// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import type { Component } from 'svelte';

import { asPanelId, asWidgetType, type WidgetManifest } from '@pomegranate-ui/contracts';
import {
  createCatalogController,
  createWidgetRegistry,
  createWorkbenchStore
} from '@pomegranate-ui/core';

import BindingFixture from './fixtures/BindingFixture.svelte';
import {
  createWidgetRendererRegistry,
  focusOnMount,
  toSvelteCatalogStore,
  toSvelteWorkbenchStore,
  type WidgetRendererProps
} from './index.js';

afterEach(cleanup);

function catalogManifest(type: string, title: string): WidgetManifest {
  return {
    type: asWidgetType(type),
    version: '1.0.0',
    title,
    capabilities: [],
    defaultConfiguration: {},
    defaultPlacement: { kind: 'docked', regionRole: 'stage', shelfId: 'primary' },
    catalog: {
      category: 'Story',
      purpose: `${title} purpose`,
      keywords: [title.toLowerCase()],
      iconKey: 'book',
      shape: 'wide',
      minColumns: 1,
      geometry: { minHeight: 180, idealHeight: 260, maxHeight: 480 },
      supportedStates: ['default']
    }
  };
}

describe('Svelte Workbench bindings', () => {
  it('adapts the authoritative Workbench store as an immediate read-only Svelte store', () => {
    const store = createWorkbenchStore();
    const readable = toSvelteWorkbenchStore(store);
    const revisions: number[] = [];
    const unsubscribe = readable.subscribe((state) => revisions.push(state.revision));

    expect(get(readable)).toBe(store.getState());
    expect(store.dispatch({ type: 'panel.activate', panelId: asPanelId('missing') }).ok).toBe(false);
    expect(revisions).toEqual([0]);
    expect(store.dispatch({
      type: 'panel.create',
      panel: { id: asPanelId('scene'), name: 'Scene', templateId: 'standard', order: 0 }
    }).ok).toBe(true);
    expect(revisions).toEqual([0, 1]);

    unsubscribe();
    unsubscribe();
  });

  it('adapts Catalog subscriptions without writable state', () => {
    const registry = createWidgetRegistry();
    registry.register(catalogManifest('story.summary', 'Story Summary'));
    const catalog = createCatalogController(registry);
    const readable = toSvelteCatalogStore(catalog);
    const seen: string[] = [];
    const unsubscribe = readable.subscribe((state) => seen.push(`${state.open}:${state.query}`));
    catalog.open();
    catalog.setQuery('summary');
    expect(seen).toEqual(['false:', 'true:', 'true:summary']);
    unsubscribe();
  });

  it('rejects duplicate renderers and preserves deterministic lookup', () => {
    interface HostContext { readonly storyId: string }
    const registry = createWidgetRendererRegistry<HostContext>();
    const type = asWidgetType('story.summary');
    const missing = asWidgetType('story.missing');
    const First = (() => undefined) as unknown as Component<WidgetRendererProps<HostContext>>;
    const Second = (() => undefined) as unknown as Component<WidgetRendererProps<HostContext>>;
    expect(registry.register(type, First)).toEqual({ ok: true, type, renderer: First });
    expect(registry.register(type, Second)).toEqual({
      ok: false,
      error: {
        code: 'DUPLICATE_RENDERER',
        message: "Renderer for Widget type 'story.summary' is already registered."
      }
    });
    expect(registry.get(type)).toBe(First);
    expect(registry.get(missing)).toBeUndefined();
    expect(registry.list()).toEqual([type]);
  });

  it('provides stable context, host identity, and Catalog state to Svelte descendants', () => {
    const store = createWorkbenchStore();
    const renderers = createWidgetRendererRegistry<{ readonly storyId: string }>();
    const catalog = createCatalogController(createWidgetRegistry());
    render(BindingFixture, {
      props: { store, rendererRegistry: renderers, hostContext: { storyId: 'story-7' }, catalog }
    });
    expect(screen.getByLabelText('Host story')).toHaveTextContent('story-7');
    expect(screen.getByLabelText('Workbench revision')).toHaveTextContent('0');
    expect(screen.getByLabelText('Catalog mode')).toHaveTextContent('drawer');
  });

  it('throws the stable setup error when context is absent', () => {
    render(BindingFixture, { props: { configured: false } });
    expect(screen.getByRole('alert')).toHaveTextContent(
      'PomegranateUI Workbench context is not configured.'
    );
  });

  it('focuses only the current enabled node and cancels stale work', async () => {
    const node = document.createElement('button');
    const focus = vi.spyOn(node, 'focus');
    const action = focusOnMount(node, true);
    action.update(false);
    await Promise.resolve();
    expect(focus).not.toHaveBeenCalled();
    action.update(true);
    await Promise.resolve();
    expect(focus).toHaveBeenCalledOnce();
    action.destroy();
    action.update(true);
    await Promise.resolve();
    expect(focus).toHaveBeenCalledOnce();
  });
});
