export type RailPanDecision = 'pending' | 'pan' | 'cancelled';

export interface TabRailOverflowInput {
  readonly scrollLeft: number;
  readonly clientWidth: number;
  readonly scrollWidth: number;
  readonly tolerance?: number;
}

export interface TabRailRevealInput extends TabRailOverflowInput {
  readonly tabLeft: number;
  readonly tabRight: number;
  readonly padding?: number;
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
  const tolerance = input.tolerance ?? 1;
  return {
    before: input.scrollLeft > tolerance,
    after: input.scrollLeft + input.clientWidth < input.scrollWidth - tolerance
  };
}

export function revealTabScrollLeft(input: TabRailRevealInput): number {
  const padding = input.padding ?? 0;
  const maxScrollLeft = Math.max(0, input.scrollWidth - input.clientWidth);
  if (input.tabLeft - padding < input.scrollLeft) {
    return Math.max(0, Math.min(input.tabLeft - padding, maxScrollLeft));
  }
  if (input.tabRight + padding > input.scrollLeft + input.clientWidth) {
    return Math.max(0, Math.min(input.tabRight + padding - input.clientWidth, maxScrollLeft));
  }
  return Math.max(0, Math.min(input.scrollLeft, maxScrollLeft));
}
