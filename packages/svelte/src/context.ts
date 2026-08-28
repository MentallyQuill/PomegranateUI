import { getContext, setContext } from 'svelte';
import type { Readable } from 'svelte/store';

import type { WorkbenchState } from '@pomegranate-ui/contracts';
import type {
  CatalogController,
  CatalogState,
  WorkbenchStore
} from '@pomegranate-ui/core';

import type { WidgetRendererRegistry } from './renderer-registry.js';
import { toSvelteCatalogStore, toSvelteWorkbenchStore } from './store.js';

const WORKBENCH_CONTEXT = Symbol('pomegranate-ui-workbench');
const MISSING_CONTEXT = 'PomegranateUI Workbench context is not configured.';

export interface WorkbenchContextOptions<THostContext> {
  readonly store: WorkbenchStore;
  readonly rendererRegistry: WidgetRendererRegistry<THostContext>;
  readonly hostContext: THostContext;
  readonly catalog?: CatalogController;
}

export interface WorkbenchContextValue<THostContext> {
  readonly store: WorkbenchStore;
  readonly workbench: Readable<WorkbenchState>;
  readonly rendererRegistry: WidgetRendererRegistry<THostContext>;
  readonly hostContext: THostContext;
  readonly catalog?: CatalogController;
  readonly catalogState?: Readable<CatalogState>;
}

export function setWorkbenchContext<THostContext>(
  options: WorkbenchContextOptions<THostContext>
): WorkbenchContextValue<THostContext> {
  const common = {
    store: options.store,
    workbench: toSvelteWorkbenchStore(options.store),
    rendererRegistry: options.rendererRegistry,
    hostContext: options.hostContext
  };
  const value: WorkbenchContextValue<THostContext> = options.catalog
    ? {
        ...common,
        catalog: options.catalog,
        catalogState: toSvelteCatalogStore(options.catalog)
      }
    : common;
  setContext(WORKBENCH_CONTEXT, value);
  return value;
}

export function getWorkbenchContext<THostContext = unknown>(): WorkbenchContextValue<THostContext> {
  const value = getContext<WorkbenchContextValue<THostContext> | undefined>(WORKBENCH_CONTEXT);
  if (!value) throw new Error(MISSING_CONTEXT);
  return value;
}
