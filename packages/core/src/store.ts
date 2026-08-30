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
  activateWidgetGroup,
  createInitialWorkbenchState,
  createPanel,
  createWidget,
  decodeLayoutSnapshot,
  encodeLayoutSnapshot,
  placeWidget,
  mergeWidgetGroup,
  removeWidget,
  reorderPanel,
  reorderWidgetGroup,
  resizePanelDock,
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
    case 'panel.rename':
      return { type: 'panel.renamed', revision, panelId: command.panelId };
    case 'panel.duplicate':
      return { type: 'panel.duplicated', revision, panelId: command.ids.panelId };
    case 'panel.reset':
      return { type: 'panel.reset', revision, panelId: command.panelId };
    case 'panel.clear':
      return { type: 'panel.cleared', revision, panelId: command.panelId };
    case 'panel.delete':
      return { type: 'panel.deleted', revision, panelId: command.panelId };
    case 'panel.activate':
      return { type: 'panel.activated', revision, panelId: command.panelId };
    case 'panel.reorder':
      return { type: 'panel.reordered', revision, panelId: command.panelId };
    case 'panel.resize-dock':
      return { type: 'panel.dock-resized', revision, panelId: command.panelId, edge: command.edge };
    case 'shelf.create':
      return { type: 'shelf.created', revision, panelId: command.shelf.panelId, shelfId: command.shelf.id };
    case 'shelf.resize':
      return { type: 'shelf.resized', revision, panelId: command.panelId, shelfId: command.shelfId };
    case 'widget.create':
      return { type: 'widget.created', revision, instanceId: command.instance.id };
    case 'widget.place':
      return { type: 'widget.placed', revision, instanceId: command.instanceId };
    case 'widget.group':
      return { type: 'widget.grouped', revision, instanceId: command.instanceId };
    case 'widget.group.activate':
      return { type: 'widget.group-activated', revision, instanceId: command.instanceId };
    case 'widget.group.reorder':
      return { type: 'widget.group-reordered', revision, instanceId: command.instanceId };
    case 'widget.group.separate':
      return { type: 'widget.group-separated', revision, instanceId: command.instanceId };
    case 'widget.shelve':
      return { type: 'widget.shelved', revision, instanceId: command.instanceId };
    case 'widget.restore':
      return { type: 'widget.restored', revision, instanceId: command.instanceId };
    case 'widget.delete':
      return { type: 'widget.deleted', revision, instanceId: command.instanceId };
    case 'widget.remove':
      return { type: 'widget.removed', revision, instanceId: command.instanceId };
    case 'layout.hydrate':
      return { type: 'layout.hydrated', revision };
    case 'layout.undo':
      return { type: 'layout.undone', revision };
  }
}

function unsupported(state: WorkbenchState): LayoutResult {
  return {
    ok: false,
    state,
    error: {
      code: 'CAPABILITY_DENIED',
      message: 'This Workbench capability is not configured.',
      recoverable: true
    }
  };
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

        let transition: LayoutResult = unsupported(before);
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
          case 'panel.resize-dock':
            transition = resizePanelDock(before, command.panelId, command.edge, command.width);
            break;
          case 'widget.create':
            transition = createWidget(before, command.instance, command.placement);
            break;
          case 'widget.place':
            transition = placeWidget(before, command.instanceId, command.placement);
            break;
          case 'widget.group':
            transition = mergeWidgetGroup(before, command.instanceId, command.targetInstanceId, command.groupId);
            break;
          case 'widget.group.activate':
            transition = activateWidgetGroup(before, command.instanceId);
            break;
          case 'widget.group.reorder':
            transition = reorderWidgetGroup(before, command.instanceId, command.toIndex);
            break;
          case 'widget.remove':
            transition = removeWidget(before, command.instanceId);
            break;
          case 'layout.hydrate':
            transition = hydrateState(before, command.state);
            break;
          case 'panel.rename':
          case 'panel.duplicate':
          case 'panel.reset':
          case 'panel.clear':
          case 'panel.delete':
          case 'shelf.create':
          case 'shelf.resize':
          case 'widget.shelve':
          case 'widget.restore':
          case 'widget.delete':
          case 'widget.group.separate':
          case 'layout.undo':
            transition = unsupported(before);
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
