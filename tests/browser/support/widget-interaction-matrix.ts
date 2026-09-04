export const ORIGINS = ['docked-singleton', 'grouped-active', 'grouped-inactive', 'floating'] as const;
export const INTENTS = ['reorder', 'group', 'insert-before', 'insert-after', 'create-shelf', 'empty-region', 'float'] as const;
export const DESTINATIONS = [
  'same-shelf',
  'other-shelf',
  'occupied-widget',
  'existing-group',
  'empty-region',
  'open-canvas',
  'collapsed-dock',
  'invalid-space'
] as const;
export const COMPLETIONS = ['commit', 'escape', 'pointercancel', 'blur', 'unmount', 'undo', 'save-reload'] as const;

export type OriginKind = typeof ORIGINS[number];
export type IntentKind = typeof INTENTS[number];
export type DestinationKind = typeof DESTINATIONS[number];
export type CompletionKind = typeof COMPLETIONS[number];

export interface InteractionCase {
  readonly id: string;
  readonly origin: OriginKind;
  readonly intent: IntentKind;
  readonly destination: DestinationKind;
  readonly completion: CompletionKind;
}

type AxisName = Exclude<keyof InteractionCase, 'id'>;

interface RequiredPairSide {
  readonly axis: AxisName;
  readonly value: string;
}

interface RequiredPair {
  readonly left: RequiredPairSide;
  readonly right: RequiredPairSide;
}

export const CURATED_REQUIRED_PAIRS_DESCRIPTION =
  'Curated required pairs cover known high-risk journeys; this is not exhaustive pairwise coverage.';

const CURATED_REQUIRED_PAIRS: readonly RequiredPair[] = Object.freeze([
  { left: { axis: 'origin', value: 'grouped-inactive' }, right: { axis: 'destination', value: 'open-canvas' } },
  { left: { axis: 'origin', value: 'grouped-inactive' }, right: { axis: 'intent', value: 'float' } },
  { left: { axis: 'origin', value: 'grouped-active' }, right: { axis: 'intent', value: 'reorder' } },
  { left: { axis: 'origin', value: 'floating' }, right: { axis: 'destination', value: 'empty-region' } },
  { left: { axis: 'intent', value: 'create-shelf' }, right: { axis: 'destination', value: 'collapsed-dock' } },
  { left: { axis: 'intent', value: 'group' }, right: { axis: 'destination', value: 'occupied-widget' } },
  { left: { axis: 'intent', value: 'group' }, right: { axis: 'destination', value: 'existing-group' } },
  { left: { axis: 'intent', value: 'insert-before' }, right: { axis: 'completion', value: 'undo' } },
  { left: { axis: 'intent', value: 'insert-after' }, right: { axis: 'completion', value: 'unmount' } },
  { left: { axis: 'intent', value: 'empty-region' }, right: { axis: 'completion', value: 'pointercancel' } },
  { left: { axis: 'intent', value: 'float' }, right: { axis: 'completion', value: 'escape' } },
  { left: { axis: 'destination', value: 'existing-group' }, right: { axis: 'completion', value: 'blur' } },
  { left: { axis: 'destination', value: 'open-canvas' }, right: { axis: 'completion', value: 'commit' } },
  { left: { axis: 'destination', value: 'occupied-widget' }, right: { axis: 'completion', value: 'save-reload' } }
]);

const AXES: Readonly<Record<AxisName, readonly string[]>> = Object.freeze({
  origin: ORIGINS,
  intent: INTENTS,
  destination: DESTINATIONS,
  completion: COMPLETIONS
});

export const INTERACTION_CASES: readonly InteractionCase[] = Object.freeze([
  { id: 'collapsed-dock-reveal-commit', origin: 'docked-singleton', intent: 'create-shelf', destination: 'collapsed-dock', completion: 'commit' },
  { id: 'floating-invalid-cancel', origin: 'floating', intent: 'float', destination: 'invalid-space', completion: 'escape' },
  { id: 'floating-to-empty-pointercancel', origin: 'floating', intent: 'empty-region', destination: 'empty-region', completion: 'pointercancel' },
  { id: 'grouped-active-reorder-commit', origin: 'grouped-active', intent: 'reorder', destination: 'same-shelf', completion: 'commit' },
  { id: 'grouped-active-to-existing-group-blur', origin: 'grouped-active', intent: 'group', destination: 'existing-group', completion: 'blur' },
  { id: 'grouped-inactive-direct-float', origin: 'grouped-inactive', intent: 'float', destination: 'open-canvas', completion: 'commit' },
  { id: 'grouped-inactive-insert-after-unmount', origin: 'grouped-inactive', intent: 'insert-after', destination: 'other-shelf', completion: 'unmount' },
  { id: 'singleton-group-existing', origin: 'docked-singleton', intent: 'group', destination: 'occupied-widget', completion: 'save-reload' },
  { id: 'singleton-insert-before-undo', origin: 'docked-singleton', intent: 'insert-before', destination: 'other-shelf', completion: 'undo' }
]);

export function curatedInteractionCoverageGaps(cases: readonly InteractionCase[]): readonly string[] {
  const gaps: string[] = [];
  for (const [axis, values] of Object.entries(AXES) as [AxisName, readonly string[]][]) {
    for (const value of values) {
      if (!cases.some((entry) => entry[axis] === value)) gaps.push(`${axis}:${value}`);
    }
  }
  for (const required of CURATED_REQUIRED_PAIRS) {
    if (!cases.some((entry) => (
      entry[required.left.axis] === required.left.value
      && entry[required.right.axis] === required.right.value
    ))) {
      gaps.push(`${required.left.axis}:${required.left.value}+${required.right.axis}:${required.right.value}`);
    }
  }
  return gaps.sort();
}
