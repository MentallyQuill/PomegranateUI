import { tabDragDecision } from './tab-reorder.js';

export type WidgetGroupGestureOwner = 'pending' | 'reorder' | 'tear-off' | 'cancelled';

export interface WidgetGroupGestureCorridor {
  readonly top: number;
  readonly bottom: number;
}

export function nextWidgetGroupGestureOwner(input: {
  readonly owner: WidgetGroupGestureOwner;
  readonly dx: number;
  readonly dy: number;
  readonly y: number;
  readonly corridor: WidgetGroupGestureCorridor;
  readonly pointerType: string;
  readonly elapsedMs: number;
  readonly departureMargin?: number;
}): WidgetGroupGestureOwner {
  if (input.owner === 'tear-off' || input.owner === 'cancelled') return input.owner;

  const departureMargin = input.departureMargin ?? 8;
  const leftCorridor = input.y < input.corridor.top - departureMargin
    || input.y > input.corridor.bottom + departureMargin;
  if (input.owner === 'reorder') return leftCorridor ? 'tear-off' : 'reorder';

  return tabDragDecision({
    dx: input.dx,
    dy: input.dy,
    pointerType: input.pointerType,
    elapsedMs: input.elapsedMs,
    allowTearOff: true
  });
}
