import { createCatalogController, createWidgetRegistry, createWorkbenchStore } from '@pomegranate-ui/core';
import { createWidgetRendererRegistry } from '@pomegranate-ui/svelte';

import { createCatalogManifests } from './catalog.js';
import type { LabHostContext } from './host-context.js';
import { IMPLEMENTED_SURFACES } from './implemented-surfaces.js';
import ImplementedWidget from './renderers/ImplementedWidget.svelte';
import { createLabState, LAB_WIDGET_TYPES } from './state.js';

export function createLabRuntime() {
  const registry = createWidgetRegistry();
  for (const manifest of createCatalogManifests()) {
    const registered = registry.register(manifest);
    if (!registered.ok) throw new Error(registered.error.message);
  }
  const rendererRegistry = createWidgetRendererRegistry<LabHostContext>();
  for (const { type } of IMPLEMENTED_SURFACES) {
    const registered = rendererRegistry.register(type, ImplementedWidget);
    if (!registered.ok) throw new Error(registered.error.message);
  }
  return Object.freeze({
    store: createWorkbenchStore({ initialState: createLabState(), registry }),
    catalog: createCatalogController(registry),
    rendererRegistry
  });
}
