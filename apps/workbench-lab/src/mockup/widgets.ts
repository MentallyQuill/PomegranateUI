import { createCatalogController, createWidgetRegistry, createWorkbenchStore, type PanelCapabilityPolicy } from '@pomegranate-ui/core';
import { createWidgetRendererRegistry } from '@pomegranate-ui/svelte';

import { createCatalogManifests } from './catalog.js';
import type { LabHostContext } from './host-context.js';
import { IMPLEMENTED_SURFACES } from './implemented-surfaces.js';
import ImplementedWidget from './renderers/ImplementedWidget.svelte';
import { createLabState, LAB_PANEL_IDS } from './state.js';

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
  const initialState = createLabState();
  const shipped = new Set(Object.values(LAB_PANEL_IDS));
  const panelPolicy: PanelCapabilityPolicy = {
    allows(panel, capability) {
      if (capability === 'reset') return shipped.has(panel.id);
      if (capability === 'clear' || capability === 'delete') return !shipped.has(panel.id);
      return true;
    },
    resetState(panel) {
      const baseline = createLabState();
      const fixture = baseline.panels.find((candidate) => candidate.id === panel.id);
      if (!fixture) return null;
      const widgets = Object.fromEntries(Object.entries(baseline.widgets).filter(([instanceId]) => baseline.placements[instanceId]?.panelId === panel.id));
      const placements = Object.fromEntries(Object.entries(baseline.placements).filter(([, placement]) => placement.panelId === panel.id));
      return {
        panel: fixture,
        shelves: baseline.shelves.filter((shelf) => shelf.panelId === panel.id),
        widgets,
        placements
      };
    }
  };
  return Object.freeze({
    store: createWorkbenchStore({ initialState, registry, panelPolicy }),
    catalog: createCatalogController(registry),
    rendererRegistry
  });
}
