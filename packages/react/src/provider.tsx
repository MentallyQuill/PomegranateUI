import {
  createContext,
  useContext,
  useSyncExternalStore,
  type PropsWithChildren
} from 'react';

import type { CommandResult, WorkbenchCommand, WorkbenchState } from '@pomegranate-ui/contracts';
import type { WorkbenchStore } from '@pomegranate-ui/core';

import type { WidgetRendererRegistry } from './renderer-registry.js';

interface BindingContextValue {
  readonly store: WorkbenchStore;
  readonly rendererRegistry: WidgetRendererRegistry<unknown>;
  readonly hostContext: unknown;
}

const BindingContext = createContext<BindingContextValue | null>(null);

export interface WorkbenchProviderProps<THostContext> {
  readonly store: WorkbenchStore;
  readonly rendererRegistry: WidgetRendererRegistry<THostContext>;
  readonly hostContext: THostContext;
}

export function WorkbenchProvider<THostContext>({
  store,
  rendererRegistry,
  hostContext,
  children
}: PropsWithChildren<WorkbenchProviderProps<THostContext>>) {
  const value: BindingContextValue = {
    store,
    rendererRegistry: rendererRegistry as WidgetRendererRegistry<unknown>,
    hostContext
  };
  return <BindingContext.Provider value={value}>{children}</BindingContext.Provider>;
}

export function useWorkbenchBinding<THostContext = unknown>(): {
  readonly store: WorkbenchStore;
  readonly rendererRegistry: WidgetRendererRegistry<THostContext>;
  readonly hostContext: THostContext;
} {
  const value = useContext(BindingContext);
  if (!value) throw new Error('PomegranateUI hooks require a WorkbenchProvider.');
  return value as {
    readonly store: WorkbenchStore;
    readonly rendererRegistry: WidgetRendererRegistry<THostContext>;
    readonly hostContext: THostContext;
  };
}

export function useWorkbenchState(): WorkbenchState {
  const { store } = useWorkbenchBinding();
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

export function useWorkbenchDispatch(): (command: WorkbenchCommand) => CommandResult {
  const { store } = useWorkbenchBinding();
  return store.dispatch;
}
