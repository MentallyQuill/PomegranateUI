export type RailPanDecision = 'pending' | 'pan' | 'cancelled';

export interface TabRailOverflowInput {
  readonly scrollLeft: number;
  readonly clientWidth: number;
  readonly scrollWidth: number;
}

export interface TabRailRevealInput extends TabRailOverflowInput {
  readonly tabLeft: number;
  readonly tabRight: number;
}

export function railPanDecision(input: {
  readonly dx: number;
  readonly dy: number;
  readonly threshold?: number;
}): RailPanDecision {
  const threshold = input.threshold ?? 7;
  const horizontal = Math.abs(input.dx);
  const vertical = Math.abs(input.dy);
  if (horizontal < threshold && vertical < threshold) return 'pending';
  return horizontal >= vertical && horizontal >= threshold ? 'pan' : 'cancelled';
}

export function tabRailOverflow(input: TabRailOverflowInput): { before: boolean; after: boolean } {
  return {
    before: input.scrollLeft > 1,
    after: input.scrollLeft + input.clientWidth < input.scrollWidth - 1
  };
}

export function revealTabScrollLeft(input: TabRailRevealInput): number {
  const maxScrollLeft = Math.max(0, input.scrollWidth - input.clientWidth);
  if (input.tabLeft < input.scrollLeft) return Math.max(0, Math.min(input.tabLeft, maxScrollLeft));
  if (input.tabRight > input.scrollLeft + input.clientWidth) {
    return Math.max(0, Math.min(input.tabRight - input.clientWidth, maxScrollLeft));
  }
  return Math.max(0, Math.min(input.scrollLeft, maxScrollLeft));
}
