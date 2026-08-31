import { asWidgetInstanceId } from '@pomegranate-ui/contracts';
import type { WidgetFrameProjection, WorkbenchStore } from '@pomegranate-ui/core';

interface DragCandidate {
  readonly pointerId: number;
  readonly handle: HTMLElement;
  readonly root: HTMLElement;
  readonly surface: HTMLElement;
  readonly startX: number;
  readonly startY: number;
  readonly grabX: number;
  readonly grabY: number;
  readonly origin: WidgetFrameProjection['placement'];
  active: boolean;
  ghost: HTMLElement | null;
}

export interface WidgetDragController {
  pointerDown(event: PointerEvent): void;
  pointerMove(event: PointerEvent): void;
  pointerUp(event: PointerEvent): void;
  pointerCancel(event: PointerEvent): void;
}

interface WidgetDragControllerOptions {
  readonly getFrame: () => WidgetFrameProjection;
  readonly getStore: () => WorkbenchStore;
  readonly setDragging: (dragging: boolean) => void;
}

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

export function createWidgetDragController(options: WidgetDragControllerOptions): WidgetDragController {
  let candidate: DragCandidate | null = null;

  function createGhost(current: DragCandidate) {
    const box = current.root.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.className = 'widget-drag-ghost';
    ghost.textContent = options.getFrame().title;
    ghost.style.width = `${Math.min(box.width, 360)}px`;
    document.body.append(ghost);
    current.ghost = ghost;
    current.root.classList.add('is-widget-dragging');
    document.body.classList.add('pom-widget-drag-active');
    options.setDragging(true);
  }

  function updateGhost(current: DragCandidate, event: PointerEvent) {
    if (!current.ghost) return;
    current.ghost.style.left = `${event.clientX + 12}px`;
    current.ghost.style.top = `${event.clientY + 12}px`;
  }

  function cleanup() {
    if (!candidate) return;
    candidate.root.classList.remove('is-widget-dragging');
    candidate.ghost?.remove();
    document.body.classList.remove('pom-widget-drag-active');
    window.removeEventListener('keydown', escapeCancel);
    options.setDragging(false);
    candidate = null;
  }

  function escapeCancel(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    cleanup();
  }

  function floatAt(current: DragCandidate, event: PointerEvent) {
    const frame = options.getFrame();
    const store = options.getStore();
    const state = store.getState();
    const surfaceBox = current.surface.getBoundingClientRect();
    const rootBox = current.root.getBoundingClientRect();
    const width = frame.placement.kind === 'floating' ? frame.placement.width : Math.min(420, Math.max(320, rootBox.width));
    const height = frame.placement.kind === 'floating' ? frame.placement.height : Math.min(520, Math.max(240, rootBox.height));
    const maxX = Math.max(8, surfaceBox.width - width - 8);
    const maxY = Math.max(8, surfaceBox.height - height - 8);
    const x = clamp(event.clientX - surfaceBox.left - current.grabX, 8, maxX);
    const y = clamp(event.clientY - surfaceBox.top - current.grabY, 8, maxY);
    const z = Math.max(0, ...Object.values(state.placements).map((placement) => (
      placement.kind === 'floating' ? placement.z : 0
    ))) + 1;
    store.dispatch({
      type: 'widget.place',
      instanceId: frame.instanceId,
      placement: {
        kind: 'floating',
        panelId: frame.placement.panelId,
        x,
        y,
        width,
        height,
        z
      }
    });
  }

  function acceptDrop(current: DragCandidate, event: PointerEvent) {
    const frame = options.getFrame();
    const store = options.getStore();
    const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    if (!target || !current.surface.contains(target)) return;

    const targetWidget = target.closest<HTMLElement>('[data-pomegranate-widget]');
    const targetIdText = targetWidget?.dataset.pomegranateWidget;
    if (targetIdText && targetIdText !== frame.instanceId && frame.placement.kind === 'docked') {
      const targetId = asWidgetInstanceId(targetIdText);
      const targetPlacement = store.getState().placements[targetId];
      const groupId = targetPlacement?.kind === 'docked' && targetPlacement.group
        ? targetPlacement.group.id
        : `group-${targetId}`;
      const grouped = store.dispatch({
        type: 'widget.group',
        instanceId: frame.instanceId,
        targetInstanceId: targetId,
        groupId
      });
      if (grouped.ok) return;
    }

    const seam = target.closest<HTMLElement>('[data-shelf-insertion]');
    if (seam?.dataset.shelfInsertion === 'left' || seam?.dataset.shelfInsertion === 'right') {
      const regionId = seam.dataset.shelfInsertion;
      const state = store.getState();
      const shelfId = `${regionId}-shelf-${state.revision + 1}`;
      const regionShelves = state.shelves.filter((shelf) => (
        shelf.panelId === frame.placement.panelId && shelf.regionId === regionId
      ));
      const created = store.dispatch({
        type: 'shelf.create',
        shelf: {
          id: shelfId,
          panelId: frame.placement.panelId,
          regionId,
          order: regionShelves.length,
          weight: 1
        }
      });
      if (!created.ok) return;
      store.dispatch({
        type: 'widget.place',
        instanceId: frame.instanceId,
        placement: {
          kind: 'docked',
          panelId: frame.placement.panelId,
          regionId,
          shelfId,
          order: Number.MAX_SAFE_INTEGER
        }
      });
      return;
    }

    const dock = target.closest<HTMLElement>('[data-pomegranate-dock]');
    const edge = dock?.dataset.pomegranateDock;
    if (edge === 'left' || edge === 'right') {
      store.dispatch({
        type: 'widget.place',
        instanceId: frame.instanceId,
        placement: {
          kind: 'docked',
          panelId: frame.placement.panelId,
          regionId: edge,
          shelfId: 'primary',
          order: Number.MAX_SAFE_INTEGER
        }
      });
      return;
    }

    floatAt(current, event);
  }

  return Object.freeze({
    pointerDown(event: PointerEvent) {
      if (event.button !== 0 || candidate) return;
      const handle = event.currentTarget as HTMLElement;
      const root = handle.closest<HTMLElement>('[data-widget-drag-root], [data-widget-type]');
      const surface = handle.closest<HTMLElement>('[data-pomegranate-panel]');
      if (!root || !surface) return;
      const box = root.getBoundingClientRect();
      candidate = {
        pointerId: event.pointerId,
        handle,
        root,
        surface,
        startX: event.clientX,
        startY: event.clientY,
        grabX: event.clientX - box.left,
        grabY: event.clientY - box.top,
        origin: options.getFrame().placement,
        active: false,
        ghost: null
      };
      try { handle.setPointerCapture(event.pointerId); } catch { /* Synthetic pointers need no capture. */ }
      window.addEventListener('keydown', escapeCancel);
      event.preventDefault();
    },

    pointerMove(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      if (!candidate.active && Math.hypot(event.clientX - candidate.startX, event.clientY - candidate.startY) >= 4) {
        candidate.active = true;
        createGhost(candidate);
      }
      if (candidate.active) updateGhost(candidate, event);
    },

    pointerUp(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      const current = candidate;
      if (current.active) acceptDrop(current, event);
      cleanup();
    },

    pointerCancel(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      cleanup();
    }
  });
}
