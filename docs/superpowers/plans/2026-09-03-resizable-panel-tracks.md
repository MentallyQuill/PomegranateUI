# Resizable Panel Tracks Implementation Plan

> **Execution:** Use `superpowers:executing-plans` task by task, with red-green-refactor and verification before completion.

**Goal:** Add persistent, accessible row and column resizing to reusable Panel recipes and fix pointer dragging for shelf separators.

**Architecture:** Contracts own optional sizing state and typed commands; layout owns normalization and mutation; core projects resolved weights; shared Svelte controls translate pointer/keyboard gestures into commands; themes style the same tree.

**Spec:** `docs/superpowers/specs/2026-09-03-resizable-panel-tracks-design.md`

### Task 1: Sizing contracts and operations

**Files:**
- Modify: `packages/contracts/src/model.ts`
- Modify: `packages/contracts/src/commands.ts`
- Modify: `packages/contracts/src/events.ts`
- Modify: `packages/layout/src/operations.ts`
- Modify: `packages/layout/src/sub-panels.ts`
- Test: `packages/contracts/src/contracts.test.ts`
- Test: `packages/layout/src/operations.test.ts`
- Test: `packages/layout/src/sub-panels.test.ts`

- [x] Add failing schema tests for column weights, docked height, and the three commands.
- [x] Add failing operation tests for adjacent normalized columns, reset-on-layout-choice, bounded row height, and grouped rows.
- [x] Implement the minimum schemas and pure transitions; rerun focused tests green.

### Task 2: Persistence, projection, and store routing

**Files:**
- Modify: `packages/layout/src/persistence.ts`
- Modify: `packages/core/src/view-model.ts`
- Modify: `packages/core/src/store.ts`
- Test: `packages/layout/src/persistence.test.ts`
- Test: `packages/core/src/view-model.test.ts`
- Test: `packages/core/src/store.test.ts`

- [x] Add failing deterministic round-trip and projection tests.
- [x] Canonicalize optional sizing state, normalize recoverable invalid weights, and project authored defaults.
- [x] Route commands, events, and undo through the store; rerun focused tests green.

### Task 3: Shared resize controls

**Files:**
- Create: `apps/workbench-lab/src/recipes/ColumnResizeHandle.svelte`
- Create: `apps/workbench-lab/src/recipes/WidgetRowResizeHandle.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelTemplateSurface.svelte`
- Modify: `apps/workbench-lab/src/recipes/DockRegion.svelte`
- Modify: `apps/workbench-lab/src/recipes/DockShelf.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetGroup.svelte`
- Modify: `apps/workbench-lab/src/recipes/ShelfResizeHandle.svelte`
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Test: `tests/browser/native-workbench.spec.ts`

- [x] Add failing Playwright coverage for Settings column and Theme Canvas row pointer/keyboard sizing, reset, reload persistence, responsive collapse, and shelf pointer dragging.
- [x] Implement shared accessible handles with pointer capture/cancel and invisible-at-rest styling.
- [x] Verify all input paths and existing visual behavior.

### Task 4: Complete verification and delivery

- [x] Run focused unit, type, and browser tests.
- [x] Obtain the `PORTS_4173_4174_FREE` ownership receipt and run `npm.cmd run check`.
- [x] Review the diff for scope, generated artifacts, and theme-ID selectors.
- [x] Commit the isolated branch, update current `main` safely, integrate, rerun proportional verification, and push `main`.
- [x] Verify GitHub remote `main` resolves to the delivered commit.
