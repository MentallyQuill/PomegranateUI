# Shared Panel and Layout Capabilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Panel templates, named regions, proportioned shelves, retained Widget shelving, complete docking, Panel management, migration, accessibility, and one-step layout undo shared toolkit capabilities across all four themes.

**Architecture:** Generalize `edge` placement into stable template `regionId` placement while keeping Panels as top-level persisted workspaces. A framework-neutral template registry resolves named regions; normalized shelf records own order and size weight; visible or shelved placement owns each Widget's location. Pure layout transitions remain under `@pomegranate-ui/layout`, the core store applies adopter capability policy and session-only undo, and source-owned Svelte recipes project those public contracts without theme branches.

**Tech Stack:** TypeScript, Zod, `@pomegranate-ui/contracts`, `@pomegranate-ui/layout`, `@pomegranate-ui/core`, `@pomegranate-ui/svelte`, Svelte 5 recipes, Vitest, Testing Library, Playwright, deterministic JSON persistence and conformance evidence.

**Spec:** `docs/superpowers/specs/2026-08-29-deep-fidelity-shared-workbench-ash-amber-design.md`

## Global Constraints

- A Panel is a top-level tab and persistence boundary. Do not add recursive Panels or `parentPanelId`.
- Regions and shelves are framework-neutral data; no Svelte component, DOM selector, CSS value, or Sonder domain term enters package contracts.
- Built-in templates are exactly `story-stage.v1`, `focus-support.v1`, and `columns.v1`; Columns accepts integer counts two through six.
- Existing V1 snapshots migrate deterministically and preserve Panel/Widget identity, order, group activity, dock widths, floating bounds, and active Panel.
- `widget.shelve` retains the instance and exact last visible placement. Destructive deletion is a distinct capability-gated command.
- Drop rails, snap ghosts, carets, pointer sessions, dialog state, and undo history are transient and never serialized.
- Shipped Panel protection comes from an adopter policy callback, never hard-coded Panel IDs.
- Every pointer operation has a keyboard equivalent; coarse-pointer targets remain at least `44x44` CSS pixels.
- Every theme exercises the identical command, template, shelf, docking, Panel, and undo path. Do not branch on theme IDs.
- Preserve the immutable `95/95` Atmospheric and `212/212` Widget Overhaul oracles.

---

### Task 1: Define template, region, shelf, and retained-placement contracts

**Files:**

- Create: `packages/contracts/src/templates.ts`
- Modify: `packages/contracts/src/model.ts`
- Modify: `packages/contracts/src/commands.ts`
- Modify: `packages/contracts/src/events.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/src/contracts.test.ts`
- Modify: `packages/contracts/README.md`

**Interfaces:**

```ts
export type WidgetShape = WidgetCatalogMetadata['shape'];

export const PANEL_REGION_ROLES = [
  'left-instruments',
  'stage',
  'composer',
  'right-instruments',
  'focus',
  'support',
  'column'
] as const;

export type PanelRegionDefinition = {
  readonly id: string;
  readonly label: string;
  readonly role: PanelRegionRole;
  readonly order: number;
  readonly acceptedShapes: readonly WidgetShape[];
  readonly minimumWidth: number;
  readonly minimumHeight: number;
  readonly enabledWhen?: { readonly option: 'columns'; readonly minimum: number };
};

export type PanelTemplateDefinition = {
  readonly id: string;
  readonly label: string;
  readonly family: 'story-stage' | 'focus-support' | 'columns';
  readonly regions: readonly PanelRegionDefinition[];
  readonly options: {
    readonly columns?: { readonly minimum: 2; readonly maximum: 6; readonly default: number };
  };
};

export type ShelfState = {
  readonly id: string;
  readonly panelId: PanelId;
  readonly regionId: string;
  readonly order: number;
  readonly weight: number;
};

export type DockedPlacement = {
  readonly kind: 'docked';
  readonly panelId: PanelId;
  readonly regionId: string;
  readonly shelfId: string;
  readonly order: number;
  readonly group?: WidgetGroupPlacement;
};

export type ShelvedPlacement = {
  readonly kind: 'shelved';
  readonly panelId: PanelId;
  readonly lastVisible: DockedPlacement | FloatingPlacement;
};

export type WidgetPlacement = DockedPlacement | FloatingPlacement | ShelvedPlacement;
```

`ShelfState.weight` is finite and bounded `0.05..1`; weights are normalized per region after mutation. `WorkbenchState` gains `shelves: readonly ShelfState[]`. `WidgetPlacementHint` becomes a backend-neutral preferred `regionRole` plus shelf ID; retain the old V1 edge schema only inside migration code, not the new public state.
Export `WidgetShape` from `model.ts` as the single alias for the existing strict
catalog shape union; template schemas must reuse that owner rather than defining
a second enum.

The command vocabulary becomes:

```ts
type WorkbenchCommand =
  | { type: 'panel.create'; panel: PanelState }
  | { type: 'panel.rename'; panelId: PanelId; name: string }
  | {
      type: 'panel.duplicate';
      panelId: PanelId;
      name: string;
      ids: {
        panelId: PanelId;
        shelfIds: Readonly<Record<string, string>>;
        widgetIds: Readonly<Record<string, WidgetInstanceId>>;
        groupIds: Readonly<Record<string, string>>;
      };
    }
  | { type: 'panel.reset'; panelId: PanelId }
  | { type: 'panel.clear'; panelId: PanelId }
  | { type: 'panel.delete'; panelId: PanelId }
  | { type: 'panel.activate'; panelId: PanelId }
  | { type: 'panel.reorder'; panelId: PanelId; toIndex: number }
  | { type: 'shelf.create'; shelf: ShelfState }
  | { type: 'shelf.resize'; panelId: PanelId; regionId: string; shelfId: string; weight: number }
  | { type: 'widget.create'; instance: WidgetInstance; placement: VisibleWidgetPlacement }
  | { type: 'widget.place'; instanceId: WidgetInstanceId; placement: VisibleWidgetPlacement }
  | { type: 'widget.shelve'; instanceId: WidgetInstanceId }
  | { type: 'widget.restore'; instanceId: WidgetInstanceId }
  | { type: 'widget.delete'; instanceId: WidgetInstanceId }
  | { type: 'widget.group'; instanceId: WidgetInstanceId; targetInstanceId: WidgetInstanceId; groupId: string }
  | { type: 'widget.group.activate'; instanceId: WidgetInstanceId }
  | { type: 'widget.group.reorder'; instanceId: WidgetInstanceId; toIndex: number }
  | { type: 'widget.group.separate'; instanceId: WidgetInstanceId; placement: VisibleWidgetPlacement }
  | { type: 'layout.undo' }
  | { type: 'layout.hydrate'; state: WorkbenchState };
```

- [ ] **Step 1: Write failing strict-schema tests**

Cover all three template families, unique region IDs/orders, Columns two through six, shelf uniqueness, normalized weights, docked/floating/shelved placement, and every command/event. Reject recursive placement, a shelved `lastVisible` that is itself shelved, unknown region roles, invalid shelf weights, duplicate regions, non-integer columns, and missing IDs.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/contracts/src/contracts.test.ts
```

- [ ] **Step 3: Add schemas, types, and event names minimally**

Add one success event per mutation (`panel.renamed`, `panel.duplicated`, `panel.reset`, `panel.cleared`, `panel.deleted`, `shelf.created`, `shelf.resized`, `widget.shelved`, `widget.restored`, `widget.deleted`, `widget.group-separated`, `layout.undone`). Preserve strict, serializable shapes and existing branded IDs.

- [ ] **Step 4: Run GREEN and typecheck contracts**

```powershell
npm.cmd exec vitest run packages/contracts/src/contracts.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit the shared layout vocabulary**

```powershell
git add packages/contracts
git commit -m "feat(contracts): define shared Panel layout"
```

### Task 2: Implement the framework-neutral template registry

**Files:**

- Create: `packages/layout/src/templates.ts`
- Create: `packages/layout/src/templates.test.ts`
- Modify: `packages/layout/src/index.ts`
- Modify: `packages/layout/README.md`

**Interfaces:**

```ts
export interface ResolvedPanelTemplate {
  readonly id: string;
  readonly label: string;
  readonly family: PanelTemplateDefinition['family'];
  readonly regions: readonly PanelRegionDefinition[];
}

export interface PanelTemplateRegistry {
  list(): readonly PanelTemplateDefinition[];
  get(id: string): PanelTemplateDefinition | undefined;
  resolve(panel: PanelState):
    | { readonly ok: true; readonly template: ResolvedPanelTemplate }
    | { readonly ok: false; readonly code: 'UNKNOWN_TEMPLATE' | 'INVALID_TEMPLATE_OPTIONS'; readonly message: string };
}

export const BUILT_IN_PANEL_TEMPLATES: readonly PanelTemplateDefinition[];
export function createPanelTemplateRegistry(
  definitions?: readonly PanelTemplateDefinition[]
): PanelTemplateRegistry;
```

`story-stage.v1` resolves `left`, `stage`, `composer`, and `right`; `focus-support.v1` resolves `focus` and `support`; `columns.v1` resolves `column-1` through the requested `column-N`. The Columns definition declares all six stable IDs and `resolve()` filters them through `enabledWhen`.

- [ ] **Step 1: Write failing registry tests**

Table-test exact region IDs/order/roles for all three recipes and every Columns count. Require immutable list/get/resolve results. Reject duplicate template IDs, duplicate region IDs, unsupported columns, and unknown template IDs without rewriting the Panel.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/layout/src/templates.test.ts
```

- [ ] **Step 3: Implement registry and built-ins**

Use public contract schemas on registration and resolution. Keep labels generic and adopter-safe. Unknown templates return explicit failure with the original ID intact.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run packages/layout/src/templates.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit the template registry**

```powershell
git add packages/layout/src/templates.ts packages/layout/src/templates.test.ts packages/layout/src/index.ts packages/layout/README.md
git commit -m "feat(layout): add Panel template registry"
```

### Task 3: Add normalized shelves, placement compatibility, and retained restoration

**Files:**

- Modify: `packages/layout/src/state.ts`
- Modify: `packages/layout/src/operations.ts`
- Modify: `packages/layout/src/operations.test.ts`
- Modify: `packages/layout/src/index.ts`
- Modify: `packages/core/src/view-model.ts`
- Modify: `packages/core/src/view-model.test.ts`

**Interfaces:**

```ts
export function normalizeShelves(shelves: readonly ShelfState[]): readonly ShelfState[];
export function createShelf(state: WorkbenchState, shelf: ShelfState, templates: PanelTemplateRegistry): LayoutResult;
export function resizeShelf(state: WorkbenchState, key: ShelfKey, weight: number): LayoutResult;
export function shelveWidget(state: WorkbenchState, instanceId: WidgetInstanceId): LayoutResult;
export function restoreWidget(state: WorkbenchState, instanceId: WidgetInstanceId, context: PlacementContext): LayoutResult;
export function separateWidgetGroup(state: WorkbenchState, instanceId: WidgetInstanceId, placement: VisibleWidgetPlacement, context: PlacementContext): LayoutResult;
```

`PlacementContext` supplies the template registry and Widget manifest lookup. Compatibility checks region existence, accepted shape, `minColumns`, and minimum geometry before advancing revision. Exact restoration first tries `lastVisible`; if it is no longer compatible, it selects the first compatible region by resolved template order and the first shelf by order.

- [ ] **Step 1: Write failing layout tests**

Cover before/between/after shelf insertion, weight normalization, resize clamping against neighboring minimums, placement into compatible named regions, tab-group preservation, shelve/restore exact origin, safe fallback after template change, floating promotion, and separate-to-shelf/float. Reject absent Panels, regions, shelves, Widgets, incompatible shapes, duplicate shelves, cross-Panel groups, and illegal orders without revision or success events.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/layout/src/operations.test.ts packages/core/src/view-model.test.ts
```

- [ ] **Step 3: Implement normalization and pure transitions**

Key dock normalization by `panelId + regionId + shelfId`. Normalize group members only within one shelf. A shelved Widget remains in `widgets` and `placements`, but view-model projections exclude it from visible regions and include it in a new `widgetShelf` projection.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run packages/layout/src/operations.test.ts packages/core/src/view-model.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit shelf and restoration logic**

```powershell
git add packages/layout packages/core/src/view-model.ts packages/core/src/view-model.test.ts
git commit -m "feat(layout): add shelves and Widget retention"
```

### Task 4: Add Panel management, adopter capability policy, and session-only undo

**Files:**

- Create: `packages/core/src/panel-policy.ts`
- Create: `packages/core/src/history.ts`
- Create: `packages/core/src/history.test.ts`
- Modify: `packages/layout/src/operations.ts`
- Modify: `packages/layout/src/operations.test.ts`
- Modify: `packages/core/src/store.ts`
- Modify: `packages/core/src/store.test.ts`
- Modify: `packages/core/src/index.ts`
- Modify: `packages/core/README.md`

**Interfaces:**

```ts
export type PanelCapability = 'rename' | 'duplicate' | 'reset' | 'clear' | 'delete';

export interface PanelCapabilityPolicy {
  allows(panel: PanelState, capability: PanelCapability): boolean;
  resetState?(panel: PanelState): {
    readonly panel: PanelState;
    readonly shelves: readonly ShelfState[];
    readonly widgets: Readonly<Record<string, WidgetInstance>>;
    readonly placements: Readonly<Record<string, WidgetPlacement>>;
  } | null;
}

export interface WorkbenchStore {
  readonly registry: WidgetRegistry;
  readonly templates: PanelTemplateRegistry;
  getState(): WorkbenchState;
  canUndo(): boolean;
  dispatch(command: unknown): CommandResult;
  subscribe(listener: WorkbenchListener): () => void;
}
```

The store keeps at most one `UndoRecord { before, commandType }`. Undo replays the prior presentation data with `revision = current.revision + 1` and emits `layout.undone`; it does not restore after hydrate/reload. Every accepted Panel, shelf, placement, group, activation, or presentation mutation replaces the one-step record; hydrate and undo do not create another record. Failed commands never replace history.

- [ ] **Step 1: Write failing operation/store tests**

Cover rename, deep duplicate with fresh Widget and shelf IDs, shipped reset, user clear, active-Panel delete selecting the nearest survivor, capability denial, one-step undo for every Panel/Widget presentation mutation, monotonic revision, listener isolation, and undo history clearing after use/hydrate. Assert no theme ID enters policy decisions.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/layout/src/operations.test.ts packages/core/src/store.test.ts packages/core/src/history.test.ts
```

- [ ] **Step 3: Implement policy-gated transitions and undo**

Pure layout functions receive already-authorized inputs; the core store checks policy before mutation. Duplication requires caller-supplied fresh IDs for deterministic tests and backend-neutral ownership. `panel.delete` never leaves an invalid active Panel.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run packages/layout/src/operations.test.ts packages/core/src/store.test.ts packages/core/src/history.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit Panel management**

```powershell
git add packages/layout packages/core
git commit -m "feat(core): add Panel management and undo"
```

### Task 5: Migrate V1 snapshots to deterministic V2 state

**Files:**

- Modify: `packages/contracts/src/model.ts`
- Modify: `packages/layout/src/persistence.ts`
- Modify: `packages/layout/src/persistence.test.ts`
- Modify: `apps/workbench-lab/src/storage.ts`
- Modify: `tests/unit/packed-consumer.test.mjs`

**Interfaces:**

```ts
export const WORKBENCH_STATE_SCHEMA = 'pomegranate.ui.state.v2' as const;
export const LAYOUT_SNAPSHOT_V2_SCHEMA = 'pomegranate.ui.layout.v2' as const;

export function migrateLayoutSnapshotV1(
  snapshot: LayoutSnapshotV1,
  templates: PanelTemplateRegistry
): LayoutSnapshotV2;
```

Mapping is literal: `left -> left`; `main -> stage` for Story Stage, `focus` for Focus + Support, and `column-1` for Columns; `right -> right` for Story Stage, `support` for Focus + Support, and the highest enabled column for Columns. Create one `primary` shelf per used region with weight `1`. Preserve the V1 schema solely as a decoder input.

- [ ] **Step 1: Write failing migration and canonicalization tests**

Fixture all three templates with docked, grouped, and floating Widgets. Assert stable migrated JSON byte order, exact identity/order/activity/bounds, one shelf per used region, no transient fields, idempotent V2 decode/encode, and malformed input falling back to the supplied known default with an inspectable error.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/layout/src/persistence.test.ts
node --test tests/unit/packed-consumer.test.mjs
```

- [ ] **Step 3: Implement V2 encode and V1/V2 decode**

Canonicalize panels, shelves, widgets, and placements independently. Never serialize undo history, capabilities, pointer state, host data, theme drafts, or preference IDs.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run packages/layout/src/persistence.test.ts
node --test tests/unit/packed-consumer.test.mjs
npm.cmd run typecheck
```

- [ ] **Step 5: Commit persistence migration**

```powershell
git add packages/contracts/src/model.ts packages/layout apps/workbench-lab/src/storage.ts tests/unit/packed-consumer.test.mjs
git commit -m "feat(layout): migrate layouts to regions"
```

### Task 6: Render templates, regions, shelves, and safe unavailable states

**Files:**

- Create: `apps/workbench-lab/src/recipes/PanelTemplateSurface.svelte`
- Create: `apps/workbench-lab/src/recipes/DockRegion.svelte`
- Create: `apps/workbench-lab/src/recipes/DockShelf.svelte`
- Create: `apps/workbench-lab/src/recipes/ShelfResizeHandle.svelte`
- Create: `apps/workbench-lab/src/recipes/UnavailableTemplate.svelte`
- Modify: `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetGroup.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/src/App.test.ts`
- Create: `registry/recipes/workbench-surface/PanelTemplateSurface.svelte`
- Create: `registry/recipes/workbench-surface/DockRegion.svelte`
- Create: `registry/recipes/workbench-surface/DockShelf.svelte`
- Create: `registry/recipes/workbench-surface/ShelfResizeHandle.svelte`
- Create: `registry/recipes/workbench-surface/UnavailableTemplate.svelte`
- Modify: `registry/recipes/workbench-surface/WorkbenchSurface.svelte`
- Modify: `registry/recipes/recipe-manifest.json`
- Modify: `tests/unit/recipes.test.mjs`

- [ ] **Step 1: Write failing component and recipe tests**

Require exact region IDs for every template/count, ordered shelves, one visible active group member, one floating layer, accessible separators with `aria-valuenow/min/max`, and an explicit unavailable surface that names the unknown template without mutating state. Verify source-owned recipe copies and deterministic hashes.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts
node --test tests/unit/recipes.test.mjs
```

- [ ] **Step 3: Implement the shared projection recipes**

`WorkbenchSurface` asks the public template registry for the active resolved template and passes each projected region to `PanelTemplateSurface`. CSS grid areas derive from region roles and count, not theme ID. Use native buttons and separators; no recursive component call.

- [ ] **Step 4: Refresh recipe hashes and run GREEN**

```powershell
node scripts/verify-recipes.mjs --write
npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts
node --test tests/unit/recipes.test.mjs
npm.cmd run typecheck
```

- [ ] **Step 5: Commit template rendering**

```powershell
git add apps/workbench-lab/src/recipes apps/workbench-lab/src/styles.css registry/recipes tests/unit/recipes.test.mjs
git commit -m "feat(svelte): render Panel templates and shelves"
```

### Task 7: Build Panel creation/management and the Widget Shelf

**Files:**

- Create: `apps/workbench-lab/src/recipes/PanelCreateDialog.svelte`
- Create: `apps/workbench-lab/src/recipes/PanelMenu.svelte`
- Create: `apps/workbench-lab/src/recipes/WidgetShelf.svelte`
- Create: `apps/workbench-lab/src/recipes/LayoutUndo.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelTabs.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/mockup/state.ts`
- Modify: `apps/workbench-lab/src/mockup/widgets.ts`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`

- [ ] **Step 1: Write failing browser flows**

Require visual template choices and Columns two-through-six selection; create/reload exact template; rename/duplicate/reset/clear/delete according to Lab policy; nearest-Panel activation; menu keyboard handling; Widget Shelf listing location labels; Shelve retaining instance; Restore exact origin; incompatible fallback; floating-to-shelf; one-step Undo; focus restoration; modal top-layer correctness; and no destructive action without the Lab confirmation pattern.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts --project=chromium --grep "Panel|Widget Shelf|Undo|template"
```

- [ ] **Step 3: Implement the Lab consumer**

The Lab policy protects its shipped Scene, Library, and Settings Panels from clear/delete and supplies reset fixtures, while user-created Panels allow all capabilities. This policy is Lab configuration, not package behavior. Rename the existing remove action to `Move to Widget Shelf`; expose destructive delete only inside the capability-gated Panel/Widget management UI.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts --project=chromium --grep "Panel|Widget Shelf|Undo|template"
```

- [ ] **Step 5: Commit management surfaces**

```powershell
git add apps/workbench-lab/src tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts
git commit -m "feat(lab): add Panel and Widget management"
```

### Task 8: Complete the unified docking transaction

**Files:**

- Modify: `apps/workbench-lab/src/recipes/WidgetDragController.ts`
- Create: `apps/workbench-lab/src/recipes/PlacementRails.svelte`
- Modify: `apps/workbench-lab/src/recipes/DockShelf.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetGroup.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetCatalog.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Modify: `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `scripts/generate-lab-catalog.mjs`
- Modify: `apps/workbench-lab/src/mockup/catalog.ts`
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/conformance/drivers/workbench-lab/interactions.ts`
- Modify: `tests/conformance/specs/deep-current-interactions.spec.ts`

**Transaction contract:**

- Body zones are `25% previous shelf / 50% tab merge / 25% next shelf`.
- Title/tab targets take precedence over body zones.
- A `10px` hysteresis band prevents zone flicker.
- Existing shelf, before, between, and after seams are keyboard-addressable.
- Escape and `pointercancel` restore the exact immutable origin snapshot.
- Catalog direct drag and keyboard placement use the same accepted-target resolver.

- [ ] **Step 1: Write failing pointer, keyboard, and touch flows**

Cover dock to every compatible region; create shelf above/below/between; merge/reorder/separate tabs; move shelf members; float/clamp/raise/move multiple frames; float-to-shelf; Catalog direct drag; rail traversal; invalid release; Escape; `pointercancel`; theme switching mid-drag rejection; and exact origin restoration for Scene, Library, Settings, user-created Panels, and floating Widgets.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts --project=chromium --grep "dock|drag|shelf|tab|floating|Catalog"
npm.cmd exec playwright test --config playwright.conformance.config.mjs tests/conformance/specs/deep-current-interactions.spec.ts
```

- [ ] **Step 3: Implement one target resolver and controller**

Build candidate targets from resolved template regions, shelves, manifest geometry, and pointer/keyboard coordinates. Snapshot parent Panel, region, shelf, group, order, floating bounds, classes, and inline style before any preview mutation. Clear candidate, ghost, caret, rails, capture, and drag state on every finish path.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run packages/layout/src/operations.test.ts packages/core/src/store.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts --project=chromium --grep "dock|drag|shelf|tab|floating|Catalog"
npm.cmd exec playwright test --config playwright.conformance.config.mjs tests/conformance/specs/deep-current-interactions.spec.ts
```

- [ ] **Step 5: Commit docking completion**

```powershell
git add packages apps/workbench-lab scripts/generate-lab-catalog.mjs tests/browser tests/conformance
git commit -m "feat(lab): complete shared docking transactions"
```

### Task 9: Prove the full behavior matrix across four targets

**Files:**

- Create: `tests/browser/shared-workbench-capabilities.spec.ts`
- Create: `tests/conformance/specs/shared-workbench-capabilities.spec.ts`
- Create: `docs/conformance/shared-workbench-capabilities-ledger.md`
- Modify: `tests/conformance/manifest.ts`
- Modify: `tests/unit/conformance.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Add a table-driven four-target matrix**

For each target, exercise all template families/counts; region/shelf rendering; resize; shelve/restore; dock; tab merge/reorder/separate; float/raise/move; Panel management; undo; save/reload; keyboard; touch; reduced motion; reduced transparency; and `44x44` targets. Compare command/event traces across themes after replacing only target ID and computed visual values.

- [ ] **Step 2: Run RED and confirm missing coverage rather than selector failure**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/shared-workbench-capabilities.spec.ts --project=chromium
npm.cmd run test:conformance:unit
```

- [ ] **Step 3: Close behavior discrepancies and create the ledger**

No shared capability may be waived for a theme. Ledger entries require scenario, evidence, diagnosis, status, and regression owner. Resolve every P0/P1 and unapproved P2.

- [ ] **Step 4: Run the tranche gate**

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:native
npm.cmd run build
npm.cmd run check:recipes
npm.cmd run test:pack
npm.cmd exec playwright test tests/browser/shared-workbench-capabilities.spec.ts --project=chromium
npm.cmd run test:conformance
git diff --check
```

- [ ] **Step 5: Commit the shared matrix**

```powershell
git add tests docs/conformance package.json
git commit -m "test: freeze shared Workbench capabilities"
```

### Task 10: Tranche review and completion record

- [ ] Review every Plan 2 bullet and every capability in the approved design.
- [ ] Search for `edge` in V2 state/commands, recursive Panel fields, theme-ID branches, serialized transient state, stale destructive `widget.remove`, and untested command/event variants.
- [ ] Verify unknown templates preserve serialized state and render an explicit unavailable surface.
- [ ] Verify V1 fixtures migrate from a clean install and V2 canonical JSON is deterministic.
- [ ] Verify recipe copies and hashes match their source-owned implementations.
- [ ] Run the immutable Atmospheric `95/95` and Widget Overhaul `212/212` harnesses unchanged.
- [ ] Run `npm.cmd run check` when reserved ports are available; do not terminate another worktree's servers.
- [ ] Record fresh gate output and commit SHA before beginning Plan 3.
