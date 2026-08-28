import { createCatalogController, createWidgetRegistry, createWorkbenchStore } from '@pomegranate-ui/core';
import { createWidgetRendererRegistry } from '@pomegranate-ui/svelte';

import { createCatalogManifests } from './catalog.js';
import type { LabHostContext } from './host-context.js';
import AmbienceWidget from './renderers/AmbienceWidget.svelte';
import CharactersWidget from './renderers/CharactersWidget.svelte';
import ComposerWidget from './renderers/ComposerWidget.svelte';
import PromiseLedgerWidget from './renderers/PromiseLedgerWidget.svelte';
import SettingsWidget from './renderers/SettingsWidget.svelte';
import TranscriptWidget from './renderers/TranscriptWidget.svelte';
import WorldStateWidget from './renderers/WorldStateWidget.svelte';
import { createLabState, LAB_WIDGET_TYPES } from './state.js';

export function createLabRuntime() {
  const registry = createWidgetRegistry();
  for (const manifest of createCatalogManifests()) {
    const registered = registry.register(manifest);
    if (!registered.ok) throw new Error(registered.error.message);
  }
  const rendererRegistry = createWidgetRendererRegistry<LabHostContext>();
  for (const [type, renderer] of [
    [LAB_WIDGET_TYPES.characters, CharactersWidget],
    [LAB_WIDGET_TYPES.transcript, TranscriptWidget],
    [LAB_WIDGET_TYPES.composer, ComposerWidget],
    [LAB_WIDGET_TYPES.worldState, WorldStateWidget],
    [LAB_WIDGET_TYPES.ambience, AmbienceWidget],
    [LAB_WIDGET_TYPES.promiseLedger, PromiseLedgerWidget],
    [LAB_WIDGET_TYPES.characterCard, SettingsWidget],
    [LAB_WIDGET_TYPES.themeLibrary, SettingsWidget],
    [LAB_WIDGET_TYPES.themeSettings, SettingsWidget],
    [LAB_WIDGET_TYPES.readingLayout, SettingsWidget]
  ] as const) {
    const registered = rendererRegistry.register(type, renderer);
    if (!registered.ok) throw new Error(registered.error.message);
  }
  return Object.freeze({
    store: createWorkbenchStore({ initialState: createLabState(), registry }),
    catalog: createCatalogController(registry),
    rendererRegistry
  });
}
