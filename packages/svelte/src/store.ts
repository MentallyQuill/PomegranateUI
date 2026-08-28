import { readable, type Readable } from 'svelte/store';

import type { WorkbenchState } from '@pomegranate-ui/contracts';
import type {
  CatalogController,
  CatalogState,
  WorkbenchStore
} from '@pomegranate-ui/core';

export function toSvelteWorkbenchStore(store: WorkbenchStore): Readable<WorkbenchState> {
  return readable(store.getState(), (set) => store.subscribe(set));
}

export function toSvelteCatalogStore(catalog: CatalogController): Readable<CatalogState> {
  return readable(catalog.getState(), (set) => catalog.subscribe(set));
}
