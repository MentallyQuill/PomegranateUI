# PomegranateUI One-Level Sub-Panels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the preserved one-level sub-panel feature as a shared PomegranateUI contract and mockup-faithful Settings experience in Deep Current, PomOS, Bunny, and Ash & Amber.

**Architecture:** `contracts` defines bounded identities and state, `layout` owns all deterministic transitions and migration, `core` projects the active owner, and shared Svelte recipes render one semantic bar/selector. Themes remain data-only and style the same mounted tree through existing tokens.

**Tech Stack:** TypeScript, Zod, Vitest, Svelte 5, Playwright, Vite, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-08-31-pomegranateui-subpanels-all-themes-design.md`

## Global Constraints

- Preserve dependency flow `contracts -> layout -> core -> svelte`; keep contracts, layout, and core free of Svelte and DOM imports.
- Keep one mounted Workbench tree and data-only themes; add no concrete theme-ID selector or component fork.
- Preserve existing flat Panel snapshots and adopt versioned migration for shipped flat Settings.
- Sub-panels are exactly one level deep and cannot contain Panels or sub-panels.
- Use `npm.cmd` on Windows and do not publish npm packages or change a downstream adopter.
- Every production behavior must be preceded by a failing real-behavior test.

---

### Task 1: Public sub-panel state contracts

**Files:**
- Modify: `packages/contracts/src/ids.ts`
- Modify: `packages/contracts/src/model.ts`
- Modify: `packages/contracts/src/commands.ts`
- Modify: `packages/contracts/src/events.ts`
- Test: `packages/contracts/src/contracts.test.ts`

**Interfaces:**
- Produces: `SubPanelId`, `SubPanelLayoutId`, `SubPanelState`, optional Panel sub-panel fields, optional placement owner/lane fields, and typed sub-panel commands/events.
- Preserves: Existing serialized flat Panel and placement inputs.

- [ ] **Step 1: Write one failing schema test for a valid Panel with two siblings and an active identity.**

```ts
expect(WorkbenchStateSchema.parse(state).panels[0]).toMatchObject({
  activeSubPanelId: 'settings-account-access',
  subPanels: [{ id: 'settings-account-access', layoutId: 'two-equal', order: 0 }]
});
```

- [ ] **Step 2: Run `npm.cmd exec -- vitest run packages/contracts/src/contracts.test.ts` and verify failure is caused by strict schemas rejecting the new fields.**
- [ ] **Step 3: Add the minimal branded ID, enums, schemas, and interfaces required for that state to parse.**
- [ ] **Step 4: Rerun the focused test and verify green.**
- [ ] **Step 5: Repeat red-green cycles for invalid active IDs, duplicate sibling IDs, nested data, invalid layouts, placement owner/lane, and every command/event variant.**
- [ ] **Step 6: Run contracts tests and typecheck, then commit the independently valid public vocabulary.**

### Task 2: Deterministic normalization and layout transitions

**Files:**
- Create: `packages/layout/src/sub-panels.ts`
- Create: `packages/layout/src/sub-panels.test.ts`
- Modify: `packages/layout/src/operations.ts`
- Modify: `packages/layout/src/index.ts`

**Interfaces:**
- Consumes: Task 1 state and command vocabulary.
- Produces: `SUB_PANEL_LAYOUTS`, `activateSubPanel`, `createSubPanel`, `renameSubPanel`, `duplicateSubPanel`, `reorderSubPanel`, `changeSubPanelLayout`, `setSubPanelScroll`, `moveSubPanelWidgets`, `deleteSubPanel`, and `normalizeSubPanels`.

- [ ] **Step 1: Write a failing test proving first creation moves every flat Widget placement into `Overview` without changing Widget instances or groups.**
- [ ] **Step 2: Run the focused test and confirm the missing exported operation is the failure.**
- [ ] **Step 3: Implement only lossless first conversion plus blank sibling activation and rerun green.**
- [ ] **Step 4: Add one red-green test cycle per transition: activation/scroll, rename, duplicate with supplied IDs, reorder, five layouts, lane shrink append order, lane growth stability, move-all append order, deletion, last-sibling flattening, hidden siblings, and invalid-state normalization.**
- [ ] **Step 5: Add mutation cases for wrong active identity, wrong final lane, missing Widget deletion, and lost group identity.**
- [ ] **Step 6: Run all layout tests and typecheck, then commit the transition engine.**

### Task 3: Versioned persistence and shipped Settings migration

**Files:**
- Modify: `packages/contracts/src/storage.ts`
- Modify: `packages/layout/src/persistence.ts`
- Test: `packages/layout/src/persistence.test.ts`
- Modify: `apps/workbench-lab/src/mockup/state.ts`
- Create: `apps/workbench-lab/src/mockup/settings-sub-panels.ts`
- Test: `apps/workbench-lab/src/mockup/implemented-surfaces.test.ts`

**Interfaces:**
- Consumes: `normalizeSubPanels` and the authoritative six-sibling Settings seed.
- Produces: A new layout snapshot version and `upgradeFlatSettingsPanel` that retains known instance identities/configuration and deterministically routes extension/unmatched Widgets.

- [ ] **Step 1: Write a failing round-trip test for sibling metadata plus placement owner/lane.**
- [ ] **Step 2: Implement canonical serialization and hydration, then verify the round trip passes byte-stably.**
- [ ] **Step 3: Write a failing legacy flat Settings fixture containing known, extension, and unmatched Widgets.**
- [ ] **Step 4: Implement the one-time six-sibling migration and prove identities/configurations survive in the correct owners.**
- [ ] **Step 5: Seed all authoritative Settings Widgets and verify exact names, layouts, membership, lanes, orders, and first active sibling.**
- [ ] **Step 6: Run persistence, mockup, and typecheck gates, then commit migration and seed data.**

### Task 4: Store dispatch, history, and active-owner projections

**Files:**
- Modify: `packages/core/src/store.ts`
- Test: `packages/core/src/store.test.ts`
- Modify: `packages/core/src/history.ts`
- Test: `packages/core/src/history.test.ts`
- Modify: `packages/core/src/view-model.ts`
- Test: `packages/core/src/view-model.test.ts`

**Interfaces:**
- Consumes: Task 2 operations.
- Produces: Store dispatch for every sub-panel command, undoable events, `selectSubPanelTabs`, and active-owner filtering in `selectPanelSurface`.

- [ ] **Step 1: Write a failing store test for `sub-panel.activate` and verify no handler exists.**
- [ ] **Step 2: Add minimal dispatch/event mapping and verify green.**
- [ ] **Step 3: Add red-green cycles for all remaining commands and exact undo restoration.**
- [ ] **Step 4: Write a failing projection test with two siblings whose Widgets share regions; assert only the active sibling appears.**
- [ ] **Step 5: Implement tab projection, lane geometry, active filtering, shelved/floating ownership, and deterministic actions.**
- [ ] **Step 6: Run all core tests and typecheck, then commit core integration.**

### Task 5: Shared Svelte sub-panel navigation and dialogs

**Files:**
- Create: `apps/workbench-lab/src/recipes/SubPanelBar.svelte`
- Create: `apps/workbench-lab/src/recipes/SubPanelDialog.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelMenu.svelte`
- Modify: `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Modify: `apps/workbench-lab/src/App.svelte`
- Create: `registry/recipes/sub-panel-bar/SubPanelBar.svelte`
- Create: `registry/recipes/sub-panel-bar/SubPanelDialog.svelte`
- Modify: `registry/recipes/recipe-manifest.json`
- Test: `tests/browser/native-workbench.spec.ts`

**Interfaces:**
- Consumes: `selectSubPanelTabs` and sub-panel commands.
- Produces: Conditional desktop tablist, phone selector/picker, Add and actions controls, and create/rename/layout/move/delete dialogs using semantic `data-pom-part` values.

- [ ] **Step 1: Add a failing Playwright test that Settings exposes exactly six sibling tabs below the top Panel shelf while Scene reserves no bar.**
- [ ] **Step 2: Implement the minimal conditional bar and activation route; verify the selected sibling changes visible Widgets.**
- [ ] **Step 3: Add one red-green interaction test per keyboard route and dialog consequence.**
- [ ] **Step 4: Add the phone selector test before its responsive implementation.**
- [ ] **Step 5: Copy the source-owned recipe through the repository recipe workflow and verify manifest hashes.**
- [ ] **Step 6: Run focused browser, recipe, accessibility, and typecheck gates, then commit navigation.**

### Task 6: Catalog, docking, drag, grouping, shelving, focus, removal, and undo scope

**Files:**
- Modify: `apps/workbench-lab/src/recipes/WidgetCatalog.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetDragController.ts`
- Modify: `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetShelf.svelte`
- Modify: `packages/core/src/catalog.ts`
- Test: `packages/core/src/catalog.test.ts`
- Test: `tests/browser/native-workbench.spec.ts`
- Test: `tests/browser/native-workbench-accessibility.spec.ts`

**Interfaces:**
- Consumes: Active sub-panel projections and placement owner/lane.
- Produces: Every Widget operation targets and restores the exact active sibling owner.

- [ ] **Step 1: Write a failing Catalog placement test proving a new Widget appears only in Advanced.**
- [ ] **Step 2: Thread owner/lane through catalog placement and verify green.**
- [ ] **Step 3: Add separate red-green tests for cross-lane drag, group merge/reorder, shelving/restoration, focus/back, removal, pointer cancellation, touch release, and undo.**
- [ ] **Step 4: Verify switching siblings never leaks or duplicates a Widget.**
- [ ] **Step 5: Run core catalog plus focused Playwright interaction/accessibility gates, then commit operation scoping.**

### Task 7: Shared responsive layout and four-theme visual convergence

**Files:**
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/src/themes/compiler.ts`
- Test: `tests/browser/sub-panel-responsive.spec.ts`
- Test: `tests/browser/native-workbench-visual.spec.ts`
- Modify: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Consumes: The single semantic Svelte tree.
- Produces: Theme-token-driven wide bar, phone selector, sole Panel scroll owner, responsive lane projection, 44px coarse targets, and reviewed visual baselines for all themes.

- [ ] **Step 1: Add failing geometry tests at 1920x1080, 390x844, 980x720 touch desktop-site, 844x390, and 200% zoom.**
- [ ] **Step 2: Implement shared structural CSS until containment, scroll ownership, target size, and responsive lane assertions pass.**
- [ ] **Step 3: Capture Deep Current and iterate against Atmospheric/Widget Overhaul geometry.**
- [ ] **Step 4: Repeat screenshot/computed-style inspection for PomOS, Bunny, and Ash & Amber without adding theme-ID selectors.**
- [ ] **Step 5: Add reduced-motion and high-contrast states and verify selection/focus remain perceivable.**
- [ ] **Step 6: Freeze reviewed wide/compact/selector/dialog screenshots and commit visual convergence.**

### Task 8: Conformance repair and release proof

**Files:**
- Create: `tests/native/sub-panel-authority.test.ts`
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/unit/recipe-registry.test.mjs`
- Modify: `docs/atmospheric-convergence-ledger.md`

**Interfaces:**
- Consumes: All prior tasks.
- Produces: Executable parity for the preserved six-sibling, first-conversion, persistence, layout, and responsive authority cases plus release evidence.

- [ ] **Step 1: Add native authority cases that fail if sub-panel checks are replaced by unrelated top-level Panel assertions.**
- [ ] **Step 2: Run focused authority and browser suites, then `npm.cmd run check`.**
- [ ] **Step 3: Inspect every changed screenshot at original resolution and resolve all substantive mismatches.**
- [ ] **Step 4: Review the complete diff, commit, push `codex/subpanels-all-themes`, and open a reviewed GitHub PR.**
- [ ] **Step 5: Require Ubuntu and Windows CI on the exact head SHA, merge, and follow the exact merge SHA through Pages deployment.**
- [ ] **Step 6: Run the sub-panel Playwright matrix against the live Pages URL in every theme and required viewport; mark the goal complete only after all requirements have direct evidence.**
