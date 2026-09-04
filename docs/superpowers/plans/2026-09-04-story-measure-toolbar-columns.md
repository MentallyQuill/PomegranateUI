# Story Measure and Toolbar Columns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Story transcript and composer share a user-resizable centered measure, and make each Story toolbar support explicit user-added columns with safe removal and Undo.

**Architecture:** Add optional Story layout state to the public contracts, keep requested dock widths in the existing Panel configuration, and assign toolbar columns to shelves. Pure layout operations own validation, normalization, geometry, and atomic transitions; Core routes commands and projects columns; the shared Svelte recipe renders all themes without theme-ID branching. Live pointer movement updates local CSS only, while pointer release sends one command and creates one Undo entry.

**Tech Stack:** TypeScript 6, Zod contracts, Vitest, Svelte 5, Playwright, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-09-04-story-measure-toolbar-columns-design.md`

## Global constraints

- Preserve the dependency direction `contracts -> layout -> core -> svelte`.
- Parse every public command and persisted value through `@pomegranate-ui/contracts`.
- Keep themes data-only and render one shared Story recipe for every theme.
- Do not edit `tests/browser/deep-story-measure.spec.ts`; the concurrent Deep-theme task owns that file.
- Preserve unrelated dirty and untracked files.
- Use `npm.cmd` on Windows and do not terminate listeners on strict ports 4173 or 4174.
- A completed drag, column addition, or confirmed column removal must create exactly one revision and one Undo entry.

---

## Task 1: Define Story layout contracts and pure geometry

**Files:**

- Create: `packages/layout/src/story-layout.ts`
- Modify: `packages/contracts/src/model.ts`
- Modify: `packages/contracts/src/commands.ts`
- Modify: `packages/contracts/src/events.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/layout/src/index.ts`
- Modify: `packages/contracts/src/contracts.test.ts`
- Create: `packages/layout/src/story-layout.test.ts`

- [ ] **Step 1: Write failing contract tests**

Add cases proving the schemas accept and infer this shape:

```ts
interface StoryLayoutState {
  readonly preferredMeasure: number;
  readonly toolbarColumns: {
    readonly left: number;
    readonly right: number;
  };
}

interface ShelfState {
  // existing fields
  readonly dockColumn?: number;
}
```

Add command-schema cases for:

```ts
{ type: 'panel.set-story-measure', panelId, measure: 860 }
{ type: 'panel.add-toolbar-column', panelId, edge: 'left' }
{
  type: 'panel.remove-toolbar-column',
  panelId,
  edge: 'right',
  expectedWidgetIds: [widgetId]
}
```

Require a finite Story measure of at least 420 pixels, integer column counts from 1 through 6, non-negative integer shelf column indices, left/right edges only, and a duplicate-free expected Widget ID list. Add corresponding changed/added/removed event-schema cases.

- [ ] **Step 2: Run the contract test and confirm RED**

Run: `npm.cmd run test:native -- packages/contracts/src/contracts.test.ts`

Expected: failures for the absent `storyLayout`, `dockColumn`, commands, and events.

- [ ] **Step 3: Write failing geometry tests**

Cover exported constants and resolvers for:

- the 800-pixel default and 420-pixel minimum Story measure;
- one default column per edge when state is omitted;
- preservation of the preferred measure while rendered measure is clamped;
- per-column dock minimum and maximum widths;
- add-column eligibility with enough and insufficient center space;
- temporary one-lane compression below the wide threshold without mutating saved counts;
- compact toolbar hiding and fluid Story measure;
- finite, non-negative results for malformed numeric input.

- [ ] **Step 4: Run the geometry test and confirm RED**

Run: `npm.cmd run test:native -- packages/layout/src/story-layout.test.ts`

Expected: module-not-found or missing-export failure.

- [ ] **Step 5: Implement contracts and pure resolver**

Add exported Zod schemas and inferred types for Story layout. Keep all new state optional on legacy Panel/Shelf records. In `story-layout.ts`, expose named constants and pure helpers along these lines:

```ts
export const STORY_DEFAULT_MEASURE = 800;
export const STORY_MIN_MEASURE = 420;
export const STORY_MAX_TOOLBAR_COLUMNS = 6;
export const STORY_TOOLBAR_COLUMN_MIN = 200;
export const STORY_TOOLBAR_COLUMN_IDEAL = 286;
export const STORY_TOOLBAR_COLUMN_MAX = 420;

export function storyLayoutFor(panel: PanelState): StoryLayoutState;
export function resolveStoryLayoutGeometry(input: StoryLayoutGeometryInput): StoryLayoutGeometry;
```

The resolver returns rendered Story measure, rendered dock widths, per-edge add eligibility, toolbar visibility, and whether each multi-column toolbar is compressed. It never rewrites preferred values.

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run:

```powershell
npm.cmd run test:native -- packages/contracts/src/contracts.test.ts packages/layout/src/story-layout.test.ts
npm.cmd run typecheck
```

Expected: both suites pass; public packages typecheck.

- [ ] **Step 7: Commit the contract/geometry slice**

```powershell
git add packages/contracts/src/model.ts packages/contracts/src/commands.ts packages/contracts/src/events.ts packages/contracts/src/index.ts packages/contracts/src/contracts.test.ts packages/layout/src/story-layout.ts packages/layout/src/story-layout.test.ts packages/layout/src/index.ts
git commit -m "feat: define story layout contracts"
```

---

## Task 2: Implement normalized, atomic layout transitions

**Files:**

- Modify: `packages/layout/src/operations.ts`
- Modify: `packages/layout/src/state.ts`
- Modify: `packages/layout/src/persistence.ts`
- Modify: `packages/layout/src/errors.ts`
- Modify: `packages/layout/src/operations.test.ts`
- Modify: `packages/layout/src/persistence.test.ts`

- [ ] **Step 1: Write failing operation tests**

Add focused fixtures for a `story-stage.v1` Panel. Prove:

- setting measure changes only that Panel's preference;
- adding a column appends the innermost index, creates an empty primary shelf, and expands requested width toward the ideal lane width;
- one column cannot be removed;
- only the current innermost column is removable;
- empty removal deletes its shelves immediately;
- populated removal requires the sorted exact visible Widget ID set;
- stale expected IDs return `STALE_LAYOUT` with no partial mutation;
- confirmed removal deletes the target column's visible Widget instances and placements only;
- shelved Widgets are preserved and remembered removed-column shelf references rebind to the outer primary shelf;
- multi-column dock resize accepts `count * 200` through `count * 420` and rejects values outside that range;
- non-Story Panels retain the existing 200-through-420 behavior.

- [ ] **Step 2: Run the operation test and confirm RED**

Run: `npm.cmd run test:native -- packages/layout/src/operations.test.ts`

Expected: missing transition exports and missing stale error.

- [ ] **Step 3: Implement pure transitions**

Add:

```ts
export function setStoryMeasure(state: WorkbenchState, panelId: PanelId, measure: number): LayoutResult;
export function addToolbarColumn(state: WorkbenchState, panelId: PanelId, edge: 'left' | 'right'): LayoutResult;
export function removeToolbarColumn(
  state: WorkbenchState,
  panelId: PanelId,
  edge: 'left' | 'right',
  expectedWidgetIds: readonly WidgetInstanceId[]
): LayoutResult;
```

Use a deterministic shelf ID derived through the existing ID factory/collision handling, not string concatenation that can collide with adopter data. Compare sorted visible Widget IDs before any mutation. Add `STALE_LAYOUT` to the typed error code union. Update `resizePanelDock` to derive bounds from Story column count.

- [ ] **Step 4: Write persistence/migration tests and confirm RED**

Add round-trip cases for Story state and shelf column indices, plus legacy snapshots with no Story fields. Add malformed saved-state cases proving invalid counts/measures normalize to defaults and invalid Story toolbar shelf indices normalize to zero without dropping Widgets.

Run: `npm.cmd run test:native -- packages/layout/src/persistence.test.ts`

Expected: new fields are not yet normalized/encoded as specified.

- [ ] **Step 5: Implement normalization and deterministic persistence**

Group Story toolbar shelves by `panelId + regionId + dockColumn`, not only Panel and region. Normalize every Story Panel to one implicit column per edge when state is missing, without unnecessarily materializing optional legacy fields. Preserve new fields through duplication and canonical encoding.

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run:

```powershell
npm.cmd run test:native -- packages/layout/src/operations.test.ts packages/layout/src/persistence.test.ts packages/layout/src/story-layout.test.ts
npm.cmd run typecheck
```

- [ ] **Step 7: Commit the layout slice**

```powershell
git add packages/layout/src/operations.ts packages/layout/src/state.ts packages/layout/src/persistence.ts packages/layout/src/errors.ts packages/layout/src/operations.test.ts packages/layout/src/persistence.test.ts
git commit -m "feat: manage story toolbar columns"
```

---

## Task 3: Route commands, events, projections, and Undo

**Files:**

- Modify: `packages/core/src/store.ts`
- Modify: `packages/core/src/view-model.ts`
- Modify: `packages/core/src/store.test.ts`
- Modify: `packages/core/src/view-model.test.ts`

- [ ] **Step 1: Write failing store tests**

Prove each new command:

- is parsed and routed to its layout transition;
- emits exactly one matching event on success;
- increments revision once;
- records one history snapshot;
- restores exact prior state with `layout.undo`;
- emits no event and records no history for rejected/stale operations.

Also prove a resize preview does not exist in Core: only the final `panel.set-story-measure` command changes state.

- [ ] **Step 2: Run the store test and confirm RED**

Run: `npm.cmd run test:native -- packages/core/src/store.test.ts`

- [ ] **Step 3: Route commands and create events**

Add exhaustive switch cases for the three commands. Include panel ID, edge, resulting count/measure, and removed Widget IDs in their public events. Reuse the existing history transaction boundary so each command is atomic.

- [ ] **Step 4: Write failing projection tests**

Extend the Story projection contract with ordered toolbar columns:

```ts
interface PanelToolbarColumnProjection {
  readonly index: number;
  readonly shelves: readonly ShelfProjection[];
}
```

Prove missing `dockColumn` maps to outer index zero, left columns render outer-to-inner, right columns render inner-to-outer while retaining logical indices, and temporarily compressed projections preserve assignments.

- [ ] **Step 5: Implement view-model projection**

Add toolbar-column projection only for Story instrument regions. Leave existing non-Story region/subpanel lane projections unchanged. Include the resolved Story layout values needed by the recipe without importing DOM or Svelte types.

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run:

```powershell
npm.cmd run test:native -- packages/core/src/store.test.ts packages/core/src/view-model.test.ts
npm.cmd run typecheck
```

- [ ] **Step 7: Commit the Core slice**

```powershell
git add packages/core/src/store.ts packages/core/src/view-model.ts packages/core/src/store.test.ts packages/core/src/view-model.test.ts
git commit -m "feat: project story toolbar columns"
```

---

## Task 4: Make drag-and-drop column-aware

**Files:**

- Modify: `apps/workbench-lab/src/recipes/widget-docking.ts`
- Modify: `apps/workbench-lab/src/recipes/widget-docking-dom.ts`
- Modify: `apps/workbench-lab/src/recipes/WidgetDragController.ts`
- Modify: `apps/workbench-lab/src/recipes/CatalogPlacementController.ts`
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/recipes/widget-docking.test.ts`
- Modify: `apps/workbench-lab/src/recipes/widget-docking-dom.test.ts`
- Modify: `apps/workbench-lab/src/recipes/CatalogPlacementController.test.ts`
- Modify: `apps/workbench-lab/src/App.catalog-placement.test.ts`

- [ ] **Step 1: Write failing docking tests**

Add optional `dockColumn` to `DockOwner`, `DockTarget`, and `DockIntent`. Prove two targets with the same Panel/region but different columns remain distinct, preview lookup selects the correct column wrapper, and intent stabilization never crosses column ownership accidentally.

- [ ] **Step 2: Run docking tests and confirm RED**

Run:

```powershell
npm.cmd run test:native -- apps/workbench-lab/src/recipes/widget-docking.test.ts apps/workbench-lab/src/recipes/widget-docking-dom.test.ts
```

- [ ] **Step 3: Implement owner propagation**

Read `data-dock-column` from column surfaces and include it in owner comparisons, target keys, preview queries, and intent labels. Keep the field absent for existing region surfaces.

- [ ] **Step 4: Write failing Widget/Catalog placement tests**

Prove a Widget dropped or placed from Catalog into column 1 creates/selects a shelf with `dockColumn: 1`; an untargeted placement still uses outer column zero; and existing subpanel/lane behavior is unchanged.

- [ ] **Step 5: Implement placement propagation**

When creating a shelf from a column-aware intent, carry `dockColumn` into `ShelfState`. When selecting an existing shelf, restrict the search to the same column. Do not add column state to `DockedPlacement`.

- [ ] **Step 6: Run focused tests and confirm GREEN**

Run:

```powershell
npm.cmd run test:native -- apps/workbench-lab/src/recipes/widget-docking.test.ts apps/workbench-lab/src/recipes/widget-docking-dom.test.ts apps/workbench-lab/src/recipes/CatalogPlacementController.test.ts apps/workbench-lab/src/App.catalog-placement.test.ts
npm.cmd run typecheck
```

- [ ] **Step 7: Commit the docking slice**

```powershell
git add apps/workbench-lab/src/recipes/widget-docking.ts apps/workbench-lab/src/recipes/widget-docking-dom.ts apps/workbench-lab/src/recipes/WidgetDragController.ts apps/workbench-lab/src/recipes/CatalogPlacementController.ts apps/workbench-lab/src/App.svelte apps/workbench-lab/src/recipes/widget-docking.test.ts apps/workbench-lab/src/recipes/widget-docking-dom.test.ts apps/workbench-lab/src/recipes/CatalogPlacementController.test.ts apps/workbench-lab/src/App.catalog-placement.test.ts
git commit -m "feat: dock widgets into story columns"
```

---

## Task 5: Render the centered measure and Story toolbar controls

**Files:**

- Create: `apps/workbench-lab/src/recipes/StoryMeasureResizeHandle.svelte`
- Create: `apps/workbench-lab/src/recipes/StoryToolbar.svelte`
- Create: `apps/workbench-lab/src/recipes/StoryToolbarColumn.svelte`
- Create: `apps/workbench-lab/src/recipes/ToolbarColumnRemovalDialog.svelte`
- Modify: `apps/workbench-lab/src/recipes/StoryComposer.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelTemplateSurface.svelte`
- Modify: `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Modify: `apps/workbench-lab/src/recipes/ToolbarResizeHandle.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/src/App.test.ts`

- [ ] **Step 1: Write failing component tests for measure controls**

Render a Story Panel and assert:

- exactly one separator has `data-story-measure-resizer="left"`, semantic part `story.measure-resizer`, and accessible name `Resize Story width from left edge`;
- the right equivalent uses the exact approved strings;
- computed/control state exposes the rendered pixel value;
- click, double-click, and tap without drag send no command;
- spatial Arrow keys, Home, and End send one final command;
- pointer cancellation restores the starting CSS value and sends no command;
- pointer release after multiple moves sends exactly one command.

- [ ] **Step 2: Run the component test and confirm RED**

Run: `npm.cmd run test:native -- apps/workbench-lab/src/App.test.ts`

- [ ] **Step 3: Implement Story measure UI**

Use a focusable `role="separator"` handle on each composer edge with `aria-orientation="vertical"`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow`. Preview by setting a Panel-local CSS variable; commit on pointerup only. Apply the same centered `--pom-story-measure` envelope to transcript and composer. Use `ResizeObserver` in the shared surface to update the pure geometry resolver when its container changes.

- [ ] **Step 4: Write failing component tests for columns/removal**

Prove:

- open toolbars show adjacent symbol-only `−` and `+` controls at the inner bottom edge;
- names are `Add column to left toolbar` / `Remove column from left toolbar` and right equivalents;
- `−` disables at one column and `+` follows resolver eligibility;
- empty removal dispatches immediately;
- populated removal opens a dialog with count/list and initially focused Cancel;
- cancel and Escape mutate nothing and restore focus;
- confirmation dispatches the exact Widget IDs originally listed;
- `STALE_LAYOUT` refreshes the list instead of closing or deleting;
- compressed/closed toolbars hide both controls.

- [ ] **Step 5: Implement toolbar columns and dialog**

Render each logical column as its own `data-pomegranate-region-surface` with `data-dock-column`. Keep the semantic left/right region wrapper as the grid item. Use the established dialog top-layer pattern and existing button tokens. Render only `+` and `−` visibly; put the natural-language descriptions in accessible names.

- [ ] **Step 6: Coalesce existing toolbar-width drags**

Refactor `ToolbarResizeHandle.svelte` so repeated pointermove events update preview geometry locally and pointerup sends one `panel.resize-dock` command. Start a gesture from rendered width when clamped; pointercancel restores the initial CSS value.

- [ ] **Step 7: Style exact geometry and interaction states**

Add generic selectors only. Fine-pointer Story handles use a 12-pixel transparent hit zone and `cursor: col-resize`; coarse pointers get at least 44 pixels. Paint the grip only on hover, focus-visible, or active drag. Fine-pointer `+`/`−` controls are 30 by 30 pixels; coarse-pointer controls are 44 by 44. Preserve theme-authored materials and inner padding.

- [ ] **Step 8: Run focused tests and confirm GREEN**

Run:

```powershell
npm.cmd run test:native -- apps/workbench-lab/src/App.test.ts
npm.cmd run typecheck
npm.cmd run build
```

- [ ] **Step 9: Commit the shared UI slice**

```powershell
git add apps/workbench-lab/src/recipes/StoryMeasureResizeHandle.svelte apps/workbench-lab/src/recipes/StoryToolbar.svelte apps/workbench-lab/src/recipes/StoryToolbarColumn.svelte apps/workbench-lab/src/recipes/ToolbarColumnRemovalDialog.svelte apps/workbench-lab/src/recipes/StoryComposer.svelte apps/workbench-lab/src/recipes/PanelTemplateSurface.svelte apps/workbench-lab/src/recipes/WorkbenchSurface.svelte apps/workbench-lab/src/recipes/ToolbarResizeHandle.svelte apps/workbench-lab/src/styles.css apps/workbench-lab/src/App.test.ts
git commit -m "feat: add story layout controls"
```

---

## Task 6: Prove behavior in browsers and every shipped theme

**Files:**

- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify only localized affected screenshots/ledger entries discovered by the test run
- Do not modify: `tests/browser/deep-story-measure.spec.ts`

- [ ] **Step 1: Add failing cross-theme browser cases**

Cover all shipped themes through the same selectors. At 1920 by 1080, assert the two separators exist, computed cursor is `col-resize`, an outward drag grows both composer and transcript by at least 40 pixels, and both horizontal centers stay within 2 pixels. Add click/double-click/tap no-op, keyboard, pointer-cancel, and preferred-value restoration after viewport clamping.

- [ ] **Step 2: Add failing toolbar-column browser cases**

Exercise left and right `+`/`−`, Widget docking into the new innermost column, disabled add state, empty removal, populated warning content/focus, cancellation, confirmed removal, Undo, responsive one-lane compression, and exact restoration at wide width.

- [ ] **Step 3: Add accessibility/responsive assertions**

Assert separator roles/values/names, 44-pixel coarse targets, visible focus, 200-percent zoom containment, reduced-motion behavior, and forced-colors visibility. Confirm controls disappear when toolbar is closed or compressed.

- [ ] **Step 4: Run browser tests under strict-port ownership**

First inspect ports 4173 and 4174. If another task owns either listener, wait for its ownership receipt instead of terminating it. Then run:

```powershell
npm.cmd run test:browser -- tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts tests/browser/deep-story-measure.spec.ts
```

Expected: all new behavior passes, including the sibling-owned Deep-theme proof.

- [ ] **Step 5: Localize visual diffs before updating fixtures**

For every visual failure, inspect the actual diff and classify it as intended control/geometry movement or regression. Update only accepted affected PNG/ledger files; do not lower thresholds.

- [ ] **Step 6: Commit browser proof**

Stage `tests/browser/native-workbench.spec.ts`, `tests/browser/native-workbench-accessibility.spec.ts`, and only the exact localized fixture files accepted in Step 5, then commit them with:

```powershell
git commit -m "test: cover story layout controls"
```

---

## Task 7: Verify, integrate, and publish to main

- [ ] **Step 1: Review the complete diff**

Run:

```powershell
git status --short
git diff --check
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```

Confirm no theme-ID selector, backend assumption, unrelated file, sibling-owned test edit, generated artifact, or placeholder entered the commits.

- [ ] **Step 2: Run the full repository gate**

Run: `npm.cmd run check`

Expected: unit, typecheck, native, build, static artifact, recipe, package-consumer, and browser gates all pass.

- [ ] **Step 3: Synchronize safely with current remote main**

Fetch with GitHub-authenticated network access. If `origin/main` advanced, merge it into the feature branch without resetting or overwriting dirty workspace content, rerun `npm.cmd run check`, and resolve only in-scope conflicts.

- [ ] **Step 4: Coordinate the sibling-owned Deep test**

Send the implementation commit SHA and verification evidence to task `01a06c66-03c7-7100-923d-843daeabc760`. Include its committed Deep test in the final integrated branch and avoid duplicate/racing pushes.

- [ ] **Step 5: Push the verified integrated head to main**

Run: `git push origin main`

Verify local `HEAD` equals the remote `main` SHA and report the commit plus the full-gate result.
