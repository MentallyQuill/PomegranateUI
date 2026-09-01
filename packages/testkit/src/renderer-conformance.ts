import {
  RENDERER_CONTRACT_IDS,
  type RendererContractId
} from './contract-ids.js';

export interface RendererTabSnapshot {
  readonly name: string;
  readonly id: string;
  readonly controls: string;
  readonly selected: boolean;
}

export interface RendererPanelOrderItemSnapshot {
  readonly id: string;
  readonly name: string;
  readonly active: boolean;
  readonly movePreviousDisabled: boolean;
  readonly moveNextDisabled: boolean;
}

export interface RendererPanelOrderSnapshot {
  readonly label: string;
  readonly items: readonly RendererPanelOrderItemSnapshot[];
}

export interface RendererPanelSnapshot {
  readonly id: string;
  readonly labelledBy: string;
}

export interface RendererWidgetSnapshot {
  readonly title: string;
  readonly instanceId: string;
  readonly placement: 'docked' | 'floating';
  readonly actionNames: readonly string[];
}

export interface RendererSnapshot {
  readonly tabListName: string | null;
  readonly tabs: readonly RendererTabSnapshot[];
  readonly panelOrder: RendererPanelOrderSnapshot | null;
  readonly panel: RendererPanelSnapshot | null;
  readonly docks: Readonly<Record<'left' | 'main' | 'right', readonly string[]>>;
  readonly floating: readonly string[];
  readonly widgets: readonly RendererWidgetSnapshot[];
  readonly statuses: readonly string[];
  readonly alerts: readonly string[];
  readonly activeElementName: string | null;
  readonly hostStoryId: string;
  readonly revision: number;
}

export type RendererOperation =
  | { readonly type: 'panel.activate'; readonly name: string }
  | { readonly type: 'panel.reorder'; readonly name: string; readonly direction: 'previous' | 'next' }
  | { readonly type: 'widget.place'; readonly title: string; readonly destination: 'left' | 'right' | 'floating' }
  | { readonly type: 'focus.next' }
  | { readonly type: 'renderer.fail'; readonly title: string };

export interface RendererHarness {
  reset(): Promise<void>;
  snapshot(): Promise<RendererSnapshot>;
  perform(operation: RendererOperation): Promise<void>;
}

export interface RendererConformanceResult {
  readonly contractId: RendererContractId;
  readonly passed: boolean;
  readonly diagnostic: string;
}

function result(
  contractId: RendererContractId,
  passed: boolean,
  diagnostic: string
): RendererConformanceResult {
  return Object.freeze({ contractId, passed, diagnostic });
}

function setupFailureResults(stage: 'reset' | 'initial snapshot', error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const diagnostic = `Renderer setup failed during ${stage}: ${message}`;
  return Object.freeze(Object.values(RENDERER_CONTRACT_IDS).map((contractId) => (
    result(contractId, false, diagnostic)
  )));
}

interface OperationSnapshot {
  readonly snapshot: RendererSnapshot | null;
  readonly error: string | null;
}

async function performAndSnapshot(
  harness: RendererHarness,
  operation: RendererOperation
): Promise<OperationSnapshot> {
  try {
    await harness.perform(operation);
    return { snapshot: await harness.snapshot(), error: null };
  } catch (error) {
    return {
      snapshot: null,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function runRendererConformance(
  harness: RendererHarness
): Promise<readonly RendererConformanceResult[]> {
  try {
    await harness.reset();
  } catch (error) {
    return setupFailureResults('reset', error);
  }
  let current: RendererSnapshot;
  try {
    current = await harness.snapshot();
  } catch (error) {
    return setupFailureResults('initial snapshot', error);
  }
  const tabIds = current.tabs.map((tab) => tab.id);
  const passed = current.tabListName === 'Panels'
    && current.tabs.length > 0
    && current.tabs.every((tab) => Boolean(tab.name && tab.id))
    && new Set(tabIds).size === tabIds.length;
  const selectedTab = current.tabs.find((tab) => tab.selected);
  const relationshipsPassed = Boolean(
    selectedTab
    && current.panel
    && selectedTab.controls === current.panel.id
    && current.panel.labelledBy === selectedTab.id
  );
  const initialHostStoryId = current.hostStoryId;
  const unavailableHasLayoutIdentity = Object.values(current.docks)
    .some((titles) => titles.includes('Missing Widget'))
    || current.floating.includes('Missing Widget');
  const unavailablePassed = unavailableHasLayoutIdentity
    && current.widgets.some((widget) => widget.title === 'Missing Widget')
    && current.statuses.includes('Renderer unavailable for Missing Widget.');
  const activation = await performAndSnapshot(harness, { type: 'panel.activate', name: 'Library' });
  const activationPassed = Boolean(
    activation.snapshot?.tabs.some((tab) => tab.name === 'Library' && tab.selected)
    && activation.snapshot.hostStoryId === initialHostStoryId
  );
  const reorder = await performAndSnapshot(harness, {
    type: 'panel.reorder', name: 'Library', direction: 'previous'
  });
  const preReorderTabs = activation.snapshot?.tabs;
  const preReorderIds = preReorderTabs?.map((tab) => tab.id);
  const libraryIndex = preReorderTabs?.findIndex((tab) => tab.name === 'Library') ?? -1;
  const expectedReorderIds = preReorderIds ? [...preReorderIds] : [];
  if (libraryIndex > 0) {
    const [libraryId] = expectedReorderIds.splice(libraryIndex, 1);
    if (libraryId) expectedReorderIds.splice(libraryIndex - 1, 0, libraryId);
  }
  const reorderedTabIds = reorder.snapshot?.tabs.map((tab) => tab.id);
  const movedExactlyOnePrevious = libraryIndex > 0
    && reorderedTabIds?.length === expectedReorderIds.length
    && expectedReorderIds.every((id, index) => reorderedTabIds[index] === id);
  const revisionAdvanced = Boolean(
    activation.snapshot
    && reorder.snapshot
    && reorder.snapshot.revision > activation.snapshot.revision
  );
  const orderItems = reorder.snapshot?.panelOrder?.items;
  const orderItemIds = orderItems?.map((item) => item.id);
  const orderMatchesTabs = Boolean(
    orderItemIds
    && reorderedTabIds
    && orderItemIds.length === reorderedTabIds.length
    && reorderedTabIds.every((id, index) => orderItemIds[index] === id)
  );
  const orderEdgesTruthful = Boolean(orderItems?.every((item, index) => (
    item.movePreviousDisabled === (index === 0)
    && item.moveNextDisabled === (index === orderItems.length - 1)
  )));
  const reorderedSelectedTabs = reorder.snapshot?.tabs.filter((tab) => tab.selected) ?? [];
  const reorderedSelectedTab = reorderedSelectedTabs.length === 1 ? reorderedSelectedTabs[0] : undefined;
  const activeOrderItems = orderItems?.filter((item) => item.active) ?? [];
  const activeOrderMatchesSelectedTab = Boolean(
    reorderedSelectedTab
    && activeOrderItems.length === 1
    && activeOrderItems[0]?.id === reorderedSelectedTab.id
  );
  const reorderedRelationshipsPassed = Boolean(
    reorderedSelectedTab
    && reorder.snapshot?.panel
    && reorderedSelectedTab.controls === reorder.snapshot.panel.id
    && reorder.snapshot.panel.labelledBy === reorderedSelectedTab.id
  );
  const reorderPassed = Boolean(
    movedExactlyOnePrevious
    && revisionAdvanced
    && reorder.snapshot?.panelOrder?.label === 'Reorder Panels'
    && orderMatchesTabs
    && orderEdgesTruthful
    && activeOrderMatchesSelectedTab
    && reorderedRelationshipsPassed
  );
  const placement = await performAndSnapshot(harness, {
    type: 'widget.place', title: 'System Status', destination: 'left'
  });
  const placementPassed = placement.snapshot?.docks.left.join('|') === 'Story Summary|System Status';
  const failure = await performAndSnapshot(harness, { type: 'renderer.fail', title: 'Story Summary' });
  const siblingAfterFailure = await performAndSnapshot(harness, {
    type: 'widget.place', title: 'System Status', destination: 'right'
  });
  const failurePassed = Boolean(
    failure.snapshot?.alerts.includes('Story Summary failed to render.')
    && failure.snapshot.docks.left.includes('Story Summary')
    && failure.snapshot.widgets.some((widget) => (
      widget.title === 'System Status' && widget.actionNames.includes('Dock right')
    ))
    && failure.snapshot.revision === placement.snapshot?.revision
    && siblingAfterFailure.snapshot?.docks.right.includes('System Status')
    && siblingAfterFailure.snapshot.revision > failure.snapshot.revision
  );
  const focus = await performAndSnapshot(harness, { type: 'focus.next' });
  const focusPassed = focus.snapshot?.activeElementName === 'Library';
  return Object.freeze([
    result(
      RENDERER_CONTRACT_IDS.panelTabs,
      passed,
      passed
        ? 'The renderer exposed one named Panels tablist with stable tab identities.'
        : 'Expected one named Panels tablist with at least one uniquely identified tab.'
    ),
    result(
      RENDERER_CONTRACT_IDS.panelRelationships,
      relationshipsPassed,
      relationshipsPassed
        ? 'The selected Panel tab and active panel exposed reciprocal ARIA relationships.'
        : 'Expected the selected Panel tab and active panel to reference each other.'
    ),
    result(
      RENDERER_CONTRACT_IDS.panelActivation,
      activationPassed,
      activation.error
        ? `Panel activation conformance failed: ${activation.error}`
        : activationPassed
        ? 'Panel activation selected Library while host story identity remained external and unchanged.'
        : 'Expected Panel activation to select Library without changing host story identity.'
    ),
    result(
      RENDERER_CONTRACT_IDS.panelReorder,
      reorderPassed,
      reorder.error
        ? `Panel reorder conformance failed: ${reorder.error}`
        : reorderPassed
        ? 'Panel reorder opened an explicit ordering surface, moved Library exactly one position previous, advanced revision, retained active relationships, and exposed truthful edge controls.'
        : 'Expected an explicit Panel ordering surface to move Library exactly one position previous, advance revision, retain one reciprocal active identity, and disable controls only at sequence edges.'
    ),
    result(
      RENDERER_CONTRACT_IDS.widgetPlacement,
      placementPassed,
      placement.error
        ? `Widget placement conformance failed: ${placement.error}`
        : placementPassed
        ? 'Widget placement appended System Status after Story Summary in the occupied left dock.'
        : 'Expected Widget placement to append System Status after Story Summary in the occupied left dock.'
    ),
    result(
      RENDERER_CONTRACT_IDS.unavailableRenderer,
      unavailablePassed,
      unavailablePassed
        ? 'The unresolved Widget remained in layout and exposed its named renderer-unavailable status.'
        : 'Expected Missing Widget to remain in layout with a named renderer-unavailable status.'
    ),
    result(
      RENDERER_CONTRACT_IDS.rendererFailure,
      failurePassed,
      failure.error
        ? `Renderer failure conformance failed: ${failure.error}`
        : siblingAfterFailure.error
        ? `Renderer sibling action after failure failed: ${siblingAfterFailure.error}`
        : failurePassed
        ? 'Story Summary failure remained represented while System Status accepted a subsequent placement.'
        : 'Expected Story Summary failure containment with retained layout identity and a usable System Status action.'
    ),
    result(
      RENDERER_CONTRACT_IDS.keyboardFocus,
      focusPassed,
      focus.error
        ? `Keyboard focus conformance failed: ${focus.error}`
        : focusPassed
        ? 'The renderer moved focus to the named Library control through its semantic focus operation.'
        : 'Expected the semantic focus operation to move focus to the named Library control.'
    )
  ]);
}

export async function assertRendererConformance(
  harness: RendererHarness
): Promise<readonly RendererConformanceResult[]> {
  const results = await runRendererConformance(harness);
  const failures = results.filter((entry) => !entry.passed);
  if (failures.length > 0) {
    throw new Error(failures.map((entry) => `${entry.contractId}: ${entry.diagnostic}`).join('\n'));
  }
  return results;
}
