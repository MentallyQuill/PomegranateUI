import { describe, expect, it } from 'vitest';

import { nextWidgetGroupGestureOwner } from './widget-group-gesture.js';

const corridor = { top: 40, bottom: 72 };

describe('Widget group gesture arbitration', () => {
  it('keeps small movement pending and horizontal motion in the tab corridor reordering', () => {
    expect(nextWidgetGroupGestureOwner({
      owner: 'pending', dx: 3, dy: 2, y: 56, corridor, pointerType: 'mouse', elapsedMs: 20
    })).toBe('pending');
    expect(nextWidgetGroupGestureOwner({
      owner: 'pending', dx: 12, dy: 2, y: 56, corridor, pointerType: 'mouse', elapsedMs: 20
    })).toBe('reorder');
  });

  it('turns an established reorder into a sticky tear-off after leaving the tab corridor', () => {
    expect(nextWidgetGroupGestureOwner({
      owner: 'reorder', dx: 24, dy: 44, y: 100, corridor, pointerType: 'mouse', elapsedMs: 60
    })).toBe('tear-off');
    expect(nextWidgetGroupGestureOwner({
      owner: 'tear-off', dx: 28, dy: 2, y: 56, corridor, pointerType: 'mouse', elapsedMs: 80
    })).toBe('tear-off');
  });

  it('allows direct vertical tear-off and preserves deliberate touch cancellation', () => {
    expect(nextWidgetGroupGestureOwner({
      owner: 'pending', dx: 2, dy: 12, y: 84, corridor, pointerType: 'mouse', elapsedMs: 20
    })).toBe('tear-off');
    expect(nextWidgetGroupGestureOwner({
      owner: 'pending', dx: 12, dy: 2, y: 56, corridor, pointerType: 'touch', elapsedMs: 120
    })).toBe('cancelled');
  });

  it('uses the tab corridor as the authority once a mouse gesture activates', () => {
    expect(nextWidgetGroupGestureOwner({
      owner: 'pending', dx: 2, dy: 12, y: 61, corridor, pointerType: 'mouse', elapsedMs: 20
    })).toBe('reorder');
    expect(nextWidgetGroupGestureOwner({
      owner: 'pending', dx: 18, dy: 2, y: 88, corridor, pointerType: 'mouse', elapsedMs: 20
    })).toBe('tear-off');
  });

  it('does not mistake horizontal travel beyond the strip ends for a tear-off', () => {
    expect(nextWidgetGroupGestureOwner({
      owner: 'reorder', dx: 280, dy: 3, y: 59, corridor, pointerType: 'pen', elapsedMs: 40
    })).toBe('reorder');
  });
});
