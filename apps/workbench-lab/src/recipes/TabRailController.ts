import { railPanDecision, revealTabScrollLeft, tabRailOverflow } from './tab-rail.js';

export interface TabRailContextRequest {
  readonly id: string;
  readonly anchor: HTMLElement;
  readonly source: 'pointer' | 'keyboard';
}

export interface TabRailController {
  pointerDown(event: PointerEvent, id: string): void;
  pointerMove(event: PointerEvent): void;
  pointerUp(event: PointerEvent): void;
  pointerCancel(event: PointerEvent): void;
  contextMenu(event: MouseEvent, id: string): void;
  keyboardContext(event: KeyboardEvent, id: string): void;
  consumeClick(): boolean;
  reveal(tab: HTMLElement): void;
  sync(): void;
  destroy(): void;
}

interface TabRailControllerOptions {
  readonly rail: HTMLElement;
  readonly onContextRequest: (request: TabRailContextRequest) => void;
}

interface Candidate {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly startX: number;
  readonly startY: number;
  readonly startScrollLeft: number;
  active: boolean;
  captured: boolean;
  touchHeld: boolean;
  touchHoldTimer: ReturnType<typeof setTimeout> | null;
}

function anchorFor(event: Event): HTMLElement | null {
  return event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
}

export function createTabRailController(options: TabRailControllerOptions): TabRailController {
  let candidate: Candidate | null = null;
  let suppressClick = false;
  const handledContexts = new WeakSet<Event>();
  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => sync());

  function sync() {
    const overflow = tabRailOverflow(options.rail);
    options.rail.dataset.overflowBefore = String(overflow.before);
    options.rail.dataset.overflowAfter = String(overflow.after);
  }

  function cleanup() {
    if (!candidate) return;
    const current = candidate;
    if (current.touchHoldTimer !== null) clearTimeout(current.touchHoldTimer);
    if (current.captured) {
      try { options.rail.releasePointerCapture(current.pointerId); } catch { /* Capture can be lost before cleanup. */ }
    }
    candidate = null;
    window.removeEventListener('keydown', cancelOnEscape);
    window.removeEventListener('blur', cancelOnBlur);
  }

  function cancelOnEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !candidate) return;
    event.preventDefault();
    if (candidate.active) suppressClick = true;
    cleanup();
  }

  function cancelOnBlur() {
    if (candidate?.active) suppressClick = true;
    cleanup();
  }

  function startCandidate(event: PointerEvent): Candidate {
    const current: Candidate = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: options.rail.scrollLeft,
      active: false,
      captured: false,
      touchHeld: false,
      touchHoldTimer: null
    };
    if (event.pointerType === 'touch') {
      current.touchHoldTimer = setTimeout(() => {
        if (candidate === current) current.touchHeld = true;
      }, 500);
    }
    return current;
  }

  resizeObserver?.observe(options.rail);
  options.rail.addEventListener('scroll', sync, { passive: true });
  sync();

  return Object.freeze({
    pointerDown(event: PointerEvent, id: string) {
      if (event.button !== 0 || !id || candidate) return;
      candidate = startCandidate(event);
      window.addEventListener('keydown', cancelOnEscape);
      window.addEventListener('blur', cancelOnBlur);
    },

    pointerMove(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      const dx = event.clientX - candidate.startX;
      const dy = event.clientY - candidate.startY;
      if (candidate.pointerType === 'touch') {
        if (railPanDecision({ dx, dy }) !== 'pending') cleanup();
        return;
      }
      const decision = railPanDecision({ dx, dy });
      if (decision === 'cancelled') {
        cleanup();
        return;
      }
      if (decision !== 'pan') return;
      if (!candidate.active) {
        try {
          options.rail.setPointerCapture(candidate.pointerId);
          candidate.captured = true;
        } catch { /* Synthetic or detached rails can pan without capture. */ }
        candidate.active = true;
      }
      suppressClick = true;
      event.preventDefault();
      options.rail.scrollLeft = candidate.startScrollLeft - dx;
      sync();
    },

    pointerUp(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      if (candidate.active || candidate.touchHeld) suppressClick = true;
      cleanup();
    },

    pointerCancel(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      if (candidate.active) suppressClick = true;
      cleanup();
    },

    contextMenu(event: MouseEvent, id: string) {
      const anchor = anchorFor(event);
      if (!id || !anchor || handledContexts.has(event)) return;
      handledContexts.add(event);
      event.preventDefault();
      options.onContextRequest({ id, anchor, source: 'pointer' });
    },

    keyboardContext(event: KeyboardEvent, id: string) {
      if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
      const anchor = anchorFor(event);
      if (!id || !anchor) return;
      event.preventDefault();
      options.onContextRequest({ id, anchor, source: 'keyboard' });
    },

    consumeClick() {
      const value = suppressClick;
      suppressClick = false;
      return value;
    },

    reveal(tab: HTMLElement) {
      const railRect = options.rail.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      options.rail.scrollLeft = revealTabScrollLeft({
        scrollLeft: options.rail.scrollLeft,
        clientWidth: options.rail.clientWidth,
        scrollWidth: options.rail.scrollWidth,
        tabLeft: tabRect.left - railRect.left + options.rail.scrollLeft,
        tabRight: tabRect.right - railRect.left + options.rail.scrollLeft
      });
      sync();
    },

    sync,

    destroy() {
      cleanup();
      resizeObserver?.disconnect();
      options.rail.removeEventListener('scroll', sync);
      suppressClick = false;
    }
  });
}
