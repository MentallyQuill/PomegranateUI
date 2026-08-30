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
  clearPanel,
  createInitialWorkbenchState,
  createPanel,
  createPanelTemplateRegistry,
  createShelf,
  createWidget,
  deletePanel,
  decodeLayoutSnapshot,
  encodeLayoutSnapshot,
  placeWidget,
  duplicatePanel,
  mergeWidgetGroup,
  removeWidget,
  renamePanel,
  reorderPanel,
  reorderWidgetGroup,
  resetPanel,
  resizeShelf,
  resizePanelDock,
  restoreWidget,
  separateWidgetGroup,
  shelveWidget,
  type PanelTemplateRegistry,
  type LayoutResult
} from '@pomegranate-ui/layout';

import { createOneStepLayoutHistory } from './history.js';
import {
  ALLOW_PANEL_CAPABILITIES,
  type PanelCapability,
  type PanelCapabilityPolicy
} from './panel-policy.js';
import { createWidgetRegistry, type WidgetRegistry } from './registry.js';

export type WorkbenchListener = (state: WorkbenchState) => void;

export interface WorkbenchStore {
  readonly registry: WidgetRegistry;
  readonly templates: PanelTemplateRegistry;
  getState(): WorkbenchState;
  canUndo(): boolean;
  dispatch(command: unknown): CommandResult;
  subscribe(listener: WorkbenchListener): () => void;
}

export interface WorkbenchStoreOptions {
  readonly initialState?: WorkbenchState;
  readonly registry?: WidgetRegistry;
  readonly templates?: PanelTemplateRegistry;
  readonly panelPolicy?: PanelCapabilityPolicy;
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

function requestedPanelCapability(command: WorkbenchCommand): {
  readonly panelId: import('@pomegranate-ui/contracts').PanelId;
  readonly capability: PanelCapability;
} | null {
  switch (command.type) {
    case 'panel.rename': return { panelId: command.panelId, capability: 'rename' };
    case 'panel.duplicate': return { panelId: command.panelId, capability: 'duplicate' };
    case 'panel.reset': return { panelId: command.panelId, capability: 'reset' };
    case 'panel.clear': return { panelId: command.panelId, capability: 'clear' };
    case 'panel.delete': return { panelId: command.panelId, capability: 'delete' };
    default: return null;
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
  const templates = options.templates ?? createPanelTemplateRegistry();
  const panelPolicy = options.panelPolicy ?? ALLOW_PANEL_CAPABILITIES;
  const history = createOneStepLayoutHistory();
  const listeners = new Set<WorkbenchListener>();
  const placementContext = {
    templates,
    manifestFor: (instance: import('@pomegranate-ui/contracts').WidgetInstance) => registry.get(instance.type)
  };

  const authorize = (
    before: WorkbenchState,
    panelId: import('@pomegranate-ui/contracts').PanelId,
    capability: PanelCapability
  ): CommandResult | null => {
    const panel = before.panels.find((candidate) => candidate.id === panelId);
    if (!panel || panelPolicy.allows(panel, capability)) return null;
    return rejected(before, {
      code: 'CAPABILITY_DENIED',
      message: `Panel '${panel.name}' does not allow ${capability}.`,
      recoverable: true,
      details: { panelId, capability }
    });
  };

  return Object.freeze({
    registry,
    templates,

    getState(): WorkbenchState {
      return state;
    },

    canUndo(): boolean {
      return history.canUndo();
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

        const capabilityRequest = requestedPanelCapability(command);
        if (capabilityRequest) {
          const denied = authorize(before, capabilityRequest.panelId, capabilityRequest.capability);
          if (denied) return denied;
        }

        let transition: LayoutResult = unsupported(before);
        switch (command.type) {
          case 'panel.create': {
            const resolution = templates.resolve(command.panel);
            transition = resolution.ok
              ? createPanel(before, command.panel)
              : { ok: false, state: before, error: { code: 'UNKNOWN_TEMPLATE', message: resolution.message, recoverable: true } };
            break;
          }
          case 'panel.rename':
            transition = renamePanel(before, command.panelId, command.name);
            break;
          case 'panel.duplicate':
            transition = duplicatePanel(before, command.panelId, command.name, command.ids);
            break;
          case 'panel.reset': {
            const panel = before.panels.find((candidate) => candidate.id === command.panelId);
            const payload = panel ? panelPolicy.resetState?.(panel) : null;
            transition = panel && payload
              ? resetPanel(before, command.panelId, payload)
              : unsupported(before);
            break;
          }
          case 'panel.clear':
            transition = clearPanel(before, command.panelId);
            break;
          case 'panel.delete':
            transition = deletePanel(before, command.panelId);
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
          case 'shelf.create':
            transition = createShelf(before, command.shelf, templates);
            break;
          case 'shelf.resize':
            transition = resizeShelf(before, command, command.weight);
            break;
          case 'widget.create':
            transition = createWidget(before, command.instance, command.placement, placementContext);
            break;
          case 'widget.place':
            transition = placeWidget(before, command.instanceId, command.placement, placementContext);
            break;
          case 'widget.shelve':
            transition = shelveWidget(before, command.instanceId);
            break;
          case 'widget.restore':
            transition = restoreWidget(before, command.instanceId, placementContext);
            break;
          case 'widget.delete':
            transition = removeWidget(before, command.instanceId);
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
          case 'widget.group.separate':
            transition = separateWidgetGroup(before, command.instanceId, command.placement, placementContext);
            break;
          case 'widget.remove':
            transition = removeWidget(before, command.instanceId);
            break;
          case 'layout.hydrate':
            transition = hydrateState(before, command.state);
            break;
          case 'layout.undo': {
            const record = history.consume();
            transition = record
              ? { ok: true, state: { ...record.before, revision: before.revision + 1 } }
              : unsupported(before);
            break;
          }
        }

        if (!transition.ok) return rejected(before, transition.error);
        state = transition.state;
        if (command.type === 'layout.hydrate') history.clear();
        else if (command.type !== 'layout.undo') history.record(before, command.type);
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
