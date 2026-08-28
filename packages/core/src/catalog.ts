import type { WidgetManifest } from '@pomegranate-ui/contracts';

import type { WidgetRegistry } from './registry.js';

export interface CatalogState {
  readonly open: boolean;
  readonly presentation: 'drawer' | 'expanded';
  readonly resultMode: 'visual' | 'compact';
  readonly query: string;
  readonly category: string | null;
  readonly results: readonly WidgetManifest[];
}

export interface CatalogController {
  getState(): CatalogState;
  open(presentation?: CatalogState['presentation']): void;
  close(): void;
  setPresentation(value: CatalogState['presentation']): void;
  setResultMode(value: CatalogState['resultMode']): void;
  setQuery(value: string): void;
  setCategory(value: string | null): void;
  refresh(): void;
  subscribe(listener: (state: CatalogState) => void): () => void;
}

function snapshot(
  registry: WidgetRegistry,
  values: Omit<CatalogState, 'results'>
): CatalogState {
  const query = values.query.trim().toLocaleLowerCase();
  const results = Object.freeze(registry.list()
    .filter((manifest) => values.category === null || manifest.catalog?.category === values.category)
    .filter((manifest) => {
      if (!query) return true;
      const searchable = [
        manifest.title,
        manifest.type,
        manifest.catalog?.purpose ?? '',
        ...(manifest.catalog?.keywords ?? [])
      ].join(' ').toLocaleLowerCase();
      return searchable.includes(query);
    })
    .sort((left, right) => left.title.localeCompare(right.title) || left.type.localeCompare(right.type)));
  return Object.freeze({
    ...values,
    results
  });
}

const CLOSED_STATE: Omit<CatalogState, 'results'> = Object.freeze({
  open: false,
  presentation: 'drawer',
  resultMode: 'visual',
  query: '',
  category: null
});

export function createCatalogController(registry: WidgetRegistry): CatalogController {
  let state = snapshot(registry, CLOSED_STATE);
  const listeners = new Set<(state: CatalogState) => void>();
  const notify = () => {
    for (const listener of [...listeners]) {
      try {
        listener(state);
      } catch {
        // An adopter listener cannot block sibling Catalog subscribers.
      }
    }
  };
  const update = (values: Partial<Omit<CatalogState, 'results'>>) => {
    state = snapshot(registry, { ...state, ...values });
    notify();
  };
  return Object.freeze({
    getState(): CatalogState {
      return state;
    },
    open(presentation: CatalogState['presentation'] = 'drawer'): void {
      update({ open: true, presentation });
    },
    close(): void {
      state = snapshot(registry, CLOSED_STATE);
      notify();
    },
    setPresentation(value: CatalogState['presentation']): void {
      update({ presentation: value });
    },
    setResultMode(value: CatalogState['resultMode']): void {
      update({ resultMode: value });
    },
    setQuery(value: string): void {
      update({ query: value });
    },
    setCategory(value: string | null): void {
      update({ category: value });
    },
    refresh(): void {
      update({});
    },
    subscribe(listener: (state: CatalogState) => void): () => void {
      listeners.add(listener);
      let subscribed = true;
      return () => {
        if (!subscribed) return;
        subscribed = false;
        listeners.delete(listener);
      };
    }
  });
}
