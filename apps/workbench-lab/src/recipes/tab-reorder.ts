export interface TabGeometry {
  readonly id: string;
  readonly left: number;
  readonly right: number;
}

export type TabDragDecision = 'pending' | 'reorder' | 'tear-off' | 'cancelled';

export type DragActivationDecision = 'pending' | 'ready' | 'cancelled';

export function dragActivationDecision(input: {
  readonly dx: number;
  readonly dy: number;
  readonly pointerType: string;
  readonly elapsedMs: number;
  readonly threshold?: number;
  readonly touchHoldMs?: number;
}): DragActivationDecision {
  const distance = Math.hypot(input.dx, input.dy);
  const threshold = input.threshold ?? 4;
  if (input.pointerType === 'touch' && input.elapsedMs < (input.touchHoldMs ?? 180)) {
    return distance >= threshold ? 'cancelled' : 'pending';
  }
  return distance >= threshold ? 'ready' : 'pending';
}

export function reorderIndexAtPoint(originId: string, clientX: number, tabs: readonly TabGeometry[]): number {
  const destinations = tabs.filter((tab) => tab.id !== originId);
  const before = destinations.findIndex((tab) => clientX < (tab.left + tab.right) / 2);
  return before < 0 ? destinations.length : before;
}

export function tabDragDecision(input: {
  readonly dx: number;
  readonly dy: number;
  readonly pointerType: string;
  readonly elapsedMs: number;
  readonly allowTearOff?: boolean;
  readonly threshold?: number;
  readonly touchHoldMs?: number;
}): TabDragDecision {
  const threshold = input.threshold ?? 7;
  const horizontal = Math.abs(input.dx);
  const vertical = Math.abs(input.dy);
  if (input.pointerType === 'touch' && input.elapsedMs < (input.touchHoldMs ?? 180)) {
    return horizontal >= threshold || vertical >= threshold ? 'cancelled' : 'pending';
  }
  if (horizontal < threshold && vertical < threshold) return 'pending';
  if (input.allowTearOff && vertical > horizontal && vertical >= threshold) return 'tear-off';
  return horizontal >= vertical && horizontal >= threshold ? 'reorder' : 'pending';
}
