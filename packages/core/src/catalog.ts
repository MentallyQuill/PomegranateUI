import type { WidgetManifest } from '@pomegranate-ui/contracts';

import type { WidgetRegistry } from './registry.js';

export interface CatalogState {
  readonly open: boolean;
  readonly presentation: 'drawer' | 'expanded';
  readonly resultMode: 'visual' | 'compact';
  readonly previewWidth: number;
  readonly query: string;
  readonly category: string | null;
  readonly utility: CatalogUtility | null;
  readonly suspended: boolean;
  readonly categories: readonly string[];
  readonly results: readonly WidgetManifest[];
}

type CatalogValues = Omit<CatalogState, 'categories' | 'results'>;

export type CatalogUtility = 'favorites' | 'recent' | 'on-panel' | 'fits-layout';

export interface CatalogHostAdapter {
  matchesUtility(manifest: WidgetManifest, utility: CatalogUtility): boolean;
}

export interface CatalogController {
  getState(): CatalogState;
  open(presentation?: CatalogState['presentation']): void;
  close(): void;
  setPresentation(value: CatalogState['presentation']): void;
  setResultMode(value: CatalogState['resultMode']): void;
  setPreviewWidth(value: number): void;
  setQuery(value: string): void;
  setCategory(value: string | null): void;
  setUtility(value: CatalogUtility | null): void;
  suspend(): void;
  resume(): void;
  refresh(): void;
  subscribe(listener: (state: CatalogState) => void): () => void;
}

function snapshot(
  registry: WidgetRegistry,
  values: CatalogValues,
  adapter?: CatalogHostAdapter
): CatalogState {
  const query = values.query.trim().toLocaleLowerCase();
  const registered = registry.list();
  const categories = Object.freeze([...new Set(registered
    .map((manifest) => manifest.catalog?.category)
    .filter((category): category is string => typeof category === 'string'))]
    .sort((left, right) => left.localeCompare(right)));
  const results = Object.freeze(registered
    .filter((manifest) => values.category === null || manifest.catalog?.category === values.category)
    .filter((manifest) => {
      if (values.utility === null) return true;
      try {
        return adapter?.matchesUtility(manifest, values.utility) ?? false;
      } catch {
        return false;
      }
    })
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
    categories,
    results
  });
}

const CLOSED_STATE: CatalogValues = Object.freeze({
  open: false,
  presentation: 'drawer',
  resultMode: 'visual',
  previewWidth: 286,
  query: '',
  category: null,
  utility: null,
  suspended: false
});

export function normalizeCatalogPreviewWidth(value: number): number {
  if (!Number.isFinite(value)) return 286;
  return Math.max(200, Math.min(420, Math.round(value)));
}

export function createCatalogController(registry: WidgetRegistry, adapter?: CatalogHostAdapter): CatalogController {
  let state = snapshot(registry, CLOSED_STATE, adapter);
  let suspendedState: CatalogState | null = null;
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
  const update = (values: Partial<CatalogValues>) => {
    if (state.suspended) return;
    state = snapshot(registry, {
      open: values.open ?? state.open,
      presentation: values.presentation ?? state.presentation,
      resultMode: values.resultMode ?? state.resultMode,
      previewWidth: values.previewWidth ?? state.previewWidth,
      query: values.query ?? state.query,
      category: values.category === undefined ? state.category : values.category,
      utility: values.utility === undefined ? state.utility : values.utility,
      suspended: false
    }, adapter);
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
      update({ open: false, query: '' });
    },
    setPresentation(value: CatalogState['presentation']): void {
      update({ presentation: value });
    },
    setResultMode(value: CatalogState['resultMode']): void {
      update({ resultMode: value });
    },
    setPreviewWidth(value: number): void {
      update({ previewWidth: normalizeCatalogPreviewWidth(value) });
    },
    setQuery(value: string): void {
      update({ query: value });
    },
    setCategory(value: string | null): void {
      update({ category: value });
    },
    setUtility(value: CatalogUtility | null): void {
      update({ utility: value });
    },
    suspend(): void {
      if (state.suspended) return;
      suspendedState = state;
      state = Object.freeze({ ...state, suspended: true });
      notify();
    },
    resume(): void {
      if (suspendedState === null) return;
      state = suspendedState;
      suspendedState = null;
      notify();
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
