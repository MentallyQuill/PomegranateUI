import { describe, expect, it } from 'vitest';

import { asWidgetType, type WidgetManifest } from '@pomegranate-ui/contracts';

import { createCatalogController, createWidgetRegistry } from './index.js';

function manifest(type: string, title: string, category: string): WidgetManifest {
  return {
    type: asWidgetType(type),
    version: '1.0.0',
    title,
    capabilities: [],
    defaultConfiguration: {},
    defaultPlacement: { kind: 'docked', edge: 'main', shelfId: 'primary' },
    catalog: {
      category,
      purpose: `Use ${title}.`,
      keywords: [category, title.toLowerCase()],
      iconKey: type,
      shape: 'medium',
      minColumns: 1,
      geometry: { minHeight: 160, idealHeight: 240, maxHeight: 480 },
      supportedStates: ['ready']
    }
  };
}

describe('Widget Catalog controller', () => {
  it('opens with title-sorted registered Widgets', () => {
    const registry = createWidgetRegistry();
    registry.register(manifest('story.zeta', 'Zeta', 'story'));
    registry.register(manifest('story.alpha', 'Alpha', 'story'));
    const catalog = createCatalogController(registry);

    expect(catalog.getState().open).toBe(false);
    catalog.open();

    expect(catalog.getState().open).toBe(true);
    expect(catalog.getState().results.map((entry) => entry.title)).toEqual(['Alpha', 'Zeta']);
    expect(Object.isFrozen(catalog.getState())).toBe(true);
    expect(Object.isFrozen(catalog.getState().results)).toBe(true);
  });

  it('resets transient discovery state when closed', () => {
    const registry = createWidgetRegistry();
    registry.register(manifest('story.alpha', 'Alpha', 'story'));
    const catalog = createCatalogController(registry);

    catalog.open('expanded');
    catalog.setResultMode('compact');
    catalog.setQuery('alpha');
    catalog.setCategory('story');
    catalog.close();

    expect(catalog.getState()).toMatchObject({
      open: false,
      presentation: 'drawer',
      resultMode: 'visual',
      query: '',
      category: null
    });
    expect(catalog.getState().results).toHaveLength(1);
  });

  it('filters by normalized discovery text and exact category', () => {
    const registry = createWidgetRegistry();
    registry.register(manifest('story.alpha', 'Alpha Signal', 'story'));
    registry.register(manifest('library.beta', 'Beta Archive', 'library'));
    const catalog = createCatalogController(registry);

    catalog.setQuery('  ALPHA  ');
    expect(catalog.getState().results.map((entry) => entry.type)).toEqual(['story.alpha']);

    catalog.setQuery('use beta archive');
    expect(catalog.getState().results.map((entry) => entry.type)).toEqual(['library.beta']);

    catalog.setQuery('');
    catalog.setCategory('story');
    expect(catalog.getState().results.map((entry) => entry.type)).toEqual(['story.alpha']);
    expect(catalog.getState().categories).toEqual(['library', 'story']);
    expect(Object.isFrozen(catalog.getState().categories)).toBe(true);
  });

  it('refreshes results after registry changes', () => {
    const registry = createWidgetRegistry();
    registry.register(manifest('story.alpha', 'Alpha', 'story'));
    const catalog = createCatalogController(registry);
    registry.register(manifest('library.beta', 'Beta', 'library'));

    expect(catalog.getState().results.map((entry) => entry.type)).toEqual(['story.alpha']);
    catalog.refresh();
    expect(catalog.getState().results.map((entry) => entry.type)).toEqual(['story.alpha', 'library.beta']);

    registry.unregister(asWidgetType('story.alpha'));
    catalog.refresh();
    expect(catalog.getState().results.map((entry) => entry.type)).toEqual(['library.beta']);
  });

  it('isolates subscribers and unsubscribes idempotently', () => {
    const registry = createWidgetRegistry();
    const catalog = createCatalogController(registry);
    const observed: boolean[] = [];
    catalog.subscribe(() => { throw new Error('adopter listener failed'); });
    const unsubscribe = catalog.subscribe((state) => observed.push(state.open));

    catalog.open();
    unsubscribe();
    unsubscribe();
    catalog.close();

    expect(observed).toEqual([true]);
  });

  it('switches between drawer and expanded presentations while open', () => {
    const catalog = createCatalogController(createWidgetRegistry());
    catalog.open();
    catalog.setPresentation('expanded');
    expect(catalog.getState()).toMatchObject({ open: true, presentation: 'expanded' });
    catalog.setPresentation('drawer');
    expect(catalog.getState()).toMatchObject({ open: true, presentation: 'drawer' });
  });
});
