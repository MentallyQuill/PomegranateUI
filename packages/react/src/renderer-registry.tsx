import type { ComponentType } from 'react';

import type {
  WidgetInstance,
  WidgetType,
  WorkbenchCommand,
  CommandResult
} from '@pomegranate-ui/contracts';

export interface WidgetRendererProps<THostContext> {
  readonly instance: WidgetInstance;
  readonly hostContext: THostContext;
  readonly capabilities: readonly string[];
  readonly dispatch: (command: WorkbenchCommand) => CommandResult;
}

export interface RendererRegistryError {
  readonly code: 'DUPLICATE_RENDERER';
  readonly message: string;
}

export type RendererRegistrationResult<THostContext> =
  | {
      readonly ok: true;
      readonly type: WidgetType;
      readonly renderer: ComponentType<WidgetRendererProps<THostContext>>;
    }
  | { readonly ok: false; readonly error: RendererRegistryError };

export interface WidgetRendererRegistry<THostContext> {
  register(
    type: WidgetType,
    renderer: ComponentType<WidgetRendererProps<THostContext>>
  ): RendererRegistrationResult<THostContext>;
  unregister(type: WidgetType): boolean;
  get(type: WidgetType): ComponentType<WidgetRendererProps<THostContext>> | undefined;
  has(type: WidgetType): boolean;
  list(): readonly WidgetType[];
}

export function createWidgetRendererRegistry<THostContext>(): WidgetRendererRegistry<THostContext> {
  const renderers = new Map<WidgetType, ComponentType<WidgetRendererProps<THostContext>>>();

  return Object.freeze({
    register(
      type: WidgetType,
      renderer: ComponentType<WidgetRendererProps<THostContext>>
    ): RendererRegistrationResult<THostContext> {
      if (renderers.has(type)) {
        return {
          ok: false,
          error: {
            code: 'DUPLICATE_RENDERER',
            message: `Renderer for Widget type '${type}' is already registered.`
          }
        };
      }
      renderers.set(type, renderer);
      return { ok: true, type, renderer };
    },

    unregister(type: WidgetType): boolean {
      return renderers.delete(type);
    },

    get(type: WidgetType) {
      return renderers.get(type);
    },

    has(type: WidgetType): boolean {
      return renderers.has(type);
    },

    list(): readonly WidgetType[] {
      return Object.freeze([...renderers.keys()].sort((left, right) => left.localeCompare(right)));
    }
  });
}
