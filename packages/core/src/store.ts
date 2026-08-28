import {
  WorkbenchCommandSchema,
  type CommandError,
  type CommandResult,
  type WorkbenchCommand,
  type WorkbenchEvent,
  type WorkbenchState
} from '@pomegranate-ui/contracts';
import {
  activatePanel,
  createInitialWorkbenchState,
  createPanel,
  createWidget,
  decodeLayoutSnapshot,
  encodeLayoutSnapshot,
  placeWidget,
  removeWidget,
  reorderPanel,
  type LayoutResult
} from '@pomegranate-ui/layout';

import { createWidgetRegistry, type WidgetRegistry } from './registry.js';

export type WorkbenchListener = (state: WorkbenchState) => void;

export interface WorkbenchStore {
  readonly registry: WidgetRegistry;
  getState(): WorkbenchState;
  dispatch(command: unknown): CommandResult;
  subscribe(listener: WorkbenchListener): () => void;
}

export interface WorkbenchStoreOptions {
  readonly initialState?: WorkbenchState;
  readonly registry?: WidgetRegistry;
}

function rejected(state: WorkbenchState, error: CommandError): CommandResult {
  return Object.freeze({
    ok: false,
    state,
    events: Object.freeze([]) as readonly [],
    error: Object.freeze(error)
  });
}

function malformedCommand(state: WorkbenchState): CommandResult {
  return rejected(state, {
    code: 'INVALID_SNAPSHOT',
    message: 'Command does not match the versioned Workbench command schema.',
    recoverable: true
  });
}

function eventFor(command: WorkbenchCommand, revision: number): WorkbenchEvent {
  switch (command.type) {
    case 'panel.create':
      return { type: 'panel.created', revision, panelId: command.panel.id };
    case 'panel.activate':
      return { type: 'panel.activated', revision, panelId: command.panelId };
    case 'panel.reorder':
      return { type: 'panel.reordered', revision, panelId: command.panelId };
    case 'widget.create':
      return { type: 'widget.created', revision, instanceId: command.instance.id };
    case 'widget.place':
      return { type: 'widget.placed', revision, instanceId: command.instanceId };
    case 'widget.remove':
      return { type: 'widget.removed', revision, instanceId: command.instanceId };
    case 'layout.hydrate':
      return { type: 'layout.hydrated', revision };
  }
}

function hydrateState(current: WorkbenchState, requested: WorkbenchState): LayoutResult {
  const encoded = encodeLayoutSnapshot(requested);
  if (!encoded.ok) {
    return {
      ok: false,
      state: current,
      error: {
        code: 'INVALID_SNAPSHOT',
        message: encoded.error.message,
        recoverable: true
      }
    };
  }
  const decoded = decodeLayoutSnapshot(encoded.value, current);
  if (!decoded.ok) return decoded;
  return {
    ok: true,
    state: { ...decoded.state, revision: current.revision + 1 }
  };
}

export function createWorkbenchStore(options: WorkbenchStoreOptions = {}): WorkbenchStore {
  let state = options.initialState ?? createInitialWorkbenchState();
  const registry = options.registry ?? createWidgetRegistry();
  const listeners = new Set<WorkbenchListener>();

  return Object.freeze({
    registry,

    getState(): WorkbenchState {
      return state;
    },

    dispatch(rawCommand: unknown): CommandResult {
      const before = state;
      try {
        const parsed = WorkbenchCommandSchema.safeParse(rawCommand);
        if (!parsed.success) return malformedCommand(before);
        const command = parsed.data as WorkbenchCommand;

        if (command.type === 'widget.create' && !registry.has(command.instance.type)) {
          return rejected(before, {
            code: 'UNKNOWN_WIDGET_TYPE',
            message: `Widget type '${command.instance.type}' is not registered.`,
            recoverable: true,
            details: { widgetType: command.instance.type }
          });
        }

        let transition: LayoutResult;
        switch (command.type) {
          case 'panel.create':
            transition = createPanel(before, command.panel);
            break;
          case 'panel.activate':
            transition = activatePanel(before, command.panelId);
            break;
          case 'panel.reorder':
            transition = reorderPanel(before, command.panelId, command.toIndex);
            break;
          case 'widget.create':
            transition = createWidget(before, command.instance, command.placement);
            break;
          case 'widget.place':
            transition = placeWidget(before, command.instanceId, command.placement);
            break;
          case 'widget.remove':
            transition = removeWidget(before, command.instanceId);
            break;
          case 'layout.hydrate':
            transition = hydrateState(before, command.state);
            break;
        }

        if (!transition.ok) return rejected(before, transition.error);
        state = transition.state;
        const event = Object.freeze(eventFor(command, state.revision));
        const events = Object.freeze([event]);
        for (const listener of [...listeners]) {
          try {
            listener(state);
          } catch {
            // An adopter listener cannot roll back an accepted transition or prevent sibling notifications.
          }
        }
        return Object.freeze({ ok: true, state, events });
      } catch {
        return rejected(before, {
          code: 'INTERNAL_ERROR',
          message: 'Workbench command dispatch failed unexpectedly.',
          recoverable: false
        });
      }
    },

    subscribe(listener: WorkbenchListener): () => void {
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
