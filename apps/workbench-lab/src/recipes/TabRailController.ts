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
  consumeClick(event: MouseEvent): boolean;
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
  readonly id: string;
  readonly anchor: HTMLElement;
  readonly startX: number;
  readonly startY: number;
  readonly startScrollLeft: number;
  active: boolean;
  captured: boolean;
}

interface ContextDuplicate {
  readonly id: string;
  readonly anchor: HTMLElement;
  readonly until: number;
}

interface TouchContextBlock {
  readonly id: string;
  readonly anchor: HTMLElement;
  readonly until: number;
}

interface SecondaryContextCandidate {
  readonly pointerId: number;
  readonly id: string;
  readonly anchor: HTMLElement;
  releaseQueued: boolean;
}

interface SuppressedGesture {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly anchor: HTMLElement;
}

function anchorFor(event: Event): HTMLElement | null {
  return event.currentTarget instanceof HTMLElement ? event.currentTarget : null;
}

export function createTabRailController(options: TabRailControllerOptions): TabRailController {
  let candidate: Candidate | null = null;
  let suppressedGesture: SuppressedGesture | null = null;
  let contextDuplicate: ContextDuplicate | null = null;
  let touchContextBlock: TouchContextBlock | null = null;
  let secondaryContext: SecondaryContextCandidate | null = null;
  const handledContexts = new WeakSet<Event>();
  const resizeObserver = typeof ResizeObserver === 'undefined'
    ? null
    : new ResizeObserver(() => sync());

  function sync() {
    const overflow = tabRailOverflow(options.rail);
    options.rail.dataset.overflowBefore = String(overflow.before);
    options.rail.dataset.overflowAfter = String(overflow.after);
  }

  function setPanning(panning: boolean) {
    options.rail.dataset.panning = String(panning);
  }

  function suppressCandidate(current: Candidate) {
    suppressedGesture = {
      pointerId: current.pointerId,
      pointerType: current.pointerType,
      anchor: current.anchor
    };
  }

  function clearSecondaryContext(current: SecondaryContextCandidate | null = secondaryContext) {
    if (!current || secondaryContext !== current) return;
    secondaryContext = null;
    window.removeEventListener('pointerup', finishSecondaryContext);
    window.removeEventListener('pointercancel', cancelSecondaryContext);
    window.removeEventListener('blur', cancelSecondaryOnBlur);
  }

  function cancelSecondaryOnBlur() {
    clearSecondaryContext();
  }

  function finishSecondaryContext(event: PointerEvent) {
    const current = secondaryContext;
    if (!current || current.pointerId !== event.pointerId) return false;
    event.preventDefault();
    if (current.releaseQueued) return true;
    current.releaseQueued = true;
    queueMicrotask(() => {
      if (secondaryContext !== current) return;
      clearSecondaryContext(current);
      contextDuplicate = { id: current.id, anchor: current.anchor, until: performance.now() + 1000 };
      options.onContextRequest({ id: current.id, anchor: current.anchor, source: 'pointer' });
    });
    return true;
  }

  function cancelSecondaryContext(event: PointerEvent) {
    if (secondaryContext?.pointerId === event.pointerId) clearSecondaryContext();
  }

  function cleanup() {
    setPanning(false);
    if (!candidate) return;
    const current = candidate;
    if (current.captured) {
      try { options.rail.releasePointerCapture(current.pointerId); } catch { /* Capture can be lost before cleanup. */ }
    }
    candidate = null;
    window.removeEventListener('keydown', cancelOnEscape);
    window.removeEventListener('blur', cancelOnBlur);
    window.removeEventListener('pointerup', finishOnWindowPointerUp);
    window.removeEventListener('pointercancel', cancelOnWindowPointer);
    window.removeEventListener('pointerout', cancelOnWindowExit);
    window.removeEventListener('scroll', cancelOnScroll, true);
  }

  function cancelOnEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !candidate) return;
    event.preventDefault();
    suppressCandidate(candidate);
    cleanup();
  }

  function cancelOnBlur() {
    if (candidate) suppressCandidate(candidate);
    cleanup();
  }

  function finishOnWindowPointerUp(event: PointerEvent) {
    if (!candidate || candidate.pointerId !== event.pointerId) return;
    const current = candidate;
    if (current.active) suppressCandidate(current);
    if (current.pointerType === 'touch') {
      touchContextBlock = { id: current.id, anchor: current.anchor, until: performance.now() + 1000 };
    }
    cleanup();
  }

  function cancelOnWindowPointer(event: PointerEvent) {
    if (!candidate || candidate.pointerId !== event.pointerId) return;
    suppressCandidate(candidate);
    cleanup();
  }

  function cancelOnWindowExit(event: PointerEvent) {
    if (event.relatedTarget !== null) return;
    cancelOnWindowPointer(event);
  }

  function cancelOnScroll() {
    if (!candidate || candidate.active) return;
    suppressCandidate(candidate);
    cleanup();
  }

  function startCandidate(event: PointerEvent, id: string): Candidate {
    const current: Candidate = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      id,
      anchor: anchorFor(event) ?? options.rail,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: options.rail.scrollLeft,
      active: false,
      captured: false
    };
    if (event.pointerType === 'touch') {
      touchContextBlock = { id: current.id, anchor: current.anchor, until: performance.now() + 1000 };
    }
    return current;
  }

  resizeObserver?.observe(options.rail);
  options.rail.addEventListener('scroll', sync, { passive: true });
  setPanning(false);
  sync();

  return Object.freeze({
    pointerDown(event: PointerEvent, id: string) {
      if (event.pointerType !== 'touch') touchContextBlock = null;
      if (event.button === 2) {
        const anchor = anchorFor(event);
        if (!id || !anchor) return;
        clearSecondaryContext();
        secondaryContext = { pointerId: event.pointerId, id, anchor, releaseQueued: false };
        window.addEventListener('pointerup', finishSecondaryContext);
        window.addEventListener('pointercancel', cancelSecondaryContext);
        window.addEventListener('blur', cancelSecondaryOnBlur);
        event.preventDefault();
        return;
      }
      if (event.button !== 0 || !id || candidate) return;
      suppressedGesture = null;
      candidate = startCandidate(event, id);
      window.addEventListener('keydown', cancelOnEscape);
      window.addEventListener('blur', cancelOnBlur);
      window.addEventListener('pointerup', finishOnWindowPointerUp);
      window.addEventListener('pointercancel', cancelOnWindowPointer);
      window.addEventListener('pointerout', cancelOnWindowExit);
      window.addEventListener('scroll', cancelOnScroll, true);
    },

    pointerMove(event: PointerEvent) {
      if (!candidate || candidate.pointerId !== event.pointerId) return;
      const dx = event.clientX - candidate.startX;
      const dy = event.clientY - candidate.startY;
      if (candidate.pointerType === 'touch') {
        if (railPanDecision({ dx, dy }) !== 'pending') {
          suppressCandidate(candidate);
          cleanup();
        }
        return;
      }
      const decision = railPanDecision({ dx, dy });
      if (decision === 'cancelled') {
        suppressCandidate(candidate);
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
        setPanning(true);
      }
      suppressCandidate(candidate);
      event.preventDefault();
      options.rail.scrollLeft = candidate.startScrollLeft - dx;
      sync();
    },

    pointerUp(event: PointerEvent) {
      if (finishSecondaryContext(event)) return;
      finishOnWindowPointerUp(event);
    },

    pointerCancel(event: PointerEvent) {
      cancelOnWindowPointer(event);
    },

    contextMenu(event: MouseEvent, id: string) {
      const anchor = anchorFor(event);
      if (touchContextBlock && performance.now() > touchContextBlock.until && candidate?.pointerType !== 'touch') {
        touchContextBlock = null;
      }
      if (
        anchor
        && touchContextBlock
        && touchContextBlock.id === id
        && touchContextBlock.anchor === anchor
        && (performance.now() <= touchContextBlock.until || candidate?.pointerType === 'touch')
      ) {
        event.preventDefault();
        return;
      }
      if (contextDuplicate && performance.now() > contextDuplicate.until) contextDuplicate = null;
      if (contextDuplicate && contextDuplicate.id === id && contextDuplicate.anchor === anchor) {
        contextDuplicate = null;
        event.preventDefault();
        return;
      }
      if (!id || !anchor || handledContexts.has(event)) return;
      handledContexts.add(event);
      event.preventDefault();
      if (secondaryContext?.id === id && secondaryContext.anchor === anchor) return;
      options.onContextRequest({ id, anchor, source: 'pointer' });
    },

    keyboardContext(event: KeyboardEvent, id: string) {
      if (event.key !== 'ContextMenu' && !(event.key === 'F10' && event.shiftKey)) return;
      const anchor = anchorFor(event);
      if (!id || !anchor) return;
      event.preventDefault();
      options.onContextRequest({ id, anchor, source: 'keyboard' });
    },

    consumeClick(event: MouseEvent) {
      if (!suppressedGesture || event.detail === 0) return false;
      if (event instanceof PointerEvent && event.pointerId !== suppressedGesture.pointerId) return false;
      const anchor = anchorFor(event);
      if (anchor && anchor !== suppressedGesture.anchor) return false;
      suppressedGesture = null;
      return true;
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
      clearSecondaryContext();
      resizeObserver?.disconnect();
      options.rail.removeEventListener('scroll', sync);
      suppressedGesture = null;
      contextDuplicate = null;
      touchContextBlock = null;
    }
  });
}
