# Unified Panel And Sub-Panel Tab Rails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one accessible, scroll-first Panel/sub-panel tab-rail contract with mouse panning, native touch scrolling, context actions, explicit handle-only reordering, responsive opaque actions, and verified GitHub Pages publication.

**Architecture:** A pure `tab-rail.ts` decision layer and one DOM-side `TabRailController` own pan, hold, overflow, and reveal behavior for both navigation components. Existing store commands remain authoritative. A shared `TabOrderDialog` moves reordering out of normal rails, while themes style one semantic DOM through existing tokens.

**Tech Stack:** TypeScript, Svelte 5 runes, Vitest, Playwright, Vite, deterministic recipe tooling, GitHub Actions/Pages.

**Spec:** `docs/superpowers/specs/2026-08-31-unified-tab-rails-design.md`

## Global Constraints

- Use `npm.cmd` on Windows and write every behavior test before production code.
- Keep `contracts`, `layout`, `core`, and `theme` free of DOM/Svelte imports; DOM behavior remains in Workbench/recipe integration.
- Normal rails never dispatch reorder commands. Reorder occurs only through explicit management controls.
- Keep one mounted Panel/Widget tree and never select behavior by concrete theme ID.
- Preserve unrelated dirty/untracked work, deterministic generated output, current IDs, persistence, undo, and scroll ownership.
- Keep coarse-pointer targets at least 44x44 while testing visible faces separately.
- Do not publish npm packages.

---

### Task 1: Pure tab-rail decisions and DOM controller

**Files:**
- Create: `apps/workbench-lab/src/recipes/tab-rail.ts`
- Create: `apps/workbench-lab/src/recipes/tab-rail.test.ts`
- Create: `apps/workbench-lab/src/recipes/TabRailController.ts`
- Create: `apps/workbench-lab/src/recipes/TabRailController.test.ts`

**Interfaces:**
- Produces: `railPanDecision`, `tabRailOverflow`, `revealTabScrollLeft`, `createTabRailController`, `TabRailContextRequest`, and controller methods `pointerDown`, `pointerMove`, `pointerUp`, `pointerCancel`, `contextMenu`, `keyboardContext`, `consumeClick`, `reveal`, `sync`, and `destroy`.
- Consumes: An existing scroll-owner element and a host callback receiving the exact tab ID, anchor, and input source.

- [ ] **Step 1: Write failing pure-decision tests.**

```ts
it('turns horizontal mouse movement into rail panning without treating vertical movement as pan', () => {
  expect(railPanDecision({ dx: 8, dy: 2 })).toBe('pan');
  expect(railPanDecision({ dx: 2, dy: 8 })).toBe('cancelled');
  expect(railPanDecision({ dx: 4, dy: 2 })).toBe('pending');
});

it('reports exact before and after overflow states', () => {
  expect(tabRailOverflow({ scrollLeft: 0, clientWidth: 200, scrollWidth: 500 })).toEqual({ before: false, after: true });
  expect(tabRailOverflow({ scrollLeft: 150, clientWidth: 200, scrollWidth: 500 })).toEqual({ before: true, after: true });
  expect(tabRailOverflow({ scrollLeft: 300, clientWidth: 200, scrollWidth: 500 })).toEqual({ before: true, after: false });
});
```

- [ ] **Step 2: Run `npm.cmd exec -- vitest run apps/workbench-lab/src/recipes/tab-rail.test.ts` and verify RED because the module does not exist.**
- [ ] **Step 3: Implement the minimal pure functions with a 7px default pan threshold, one-pixel overflow tolerance, and rail-local reveal math.**
- [ ] **Step 4: Rerun the focused test and verify GREEN.**
- [ ] **Step 5: Write failing controller tests using real DOM elements and synthetic PointerEvents.**

```ts
it('pans after threshold, suppresses the click, and reflects edge state', () => {
  const controller = createTabRailController({ rail, onContextRequest });
  controller.pointerDown(pointer('pointerdown', { clientX: 100, pointerType: 'mouse' }), 'settings');
  controller.pointerMove(pointer('pointermove', { clientX: 80, pointerType: 'mouse' }));
  expect(rail.scrollLeft).toBe(20);
  expect(controller.consumeClick()).toBe(true);
  expect(rail.dataset.overflowBefore).toBe('true');
});
```

- [ ] **Step 6: Verify RED, then implement only mouse/pen threshold panning, touch-hold timing/cancellation, native context/keyboard requests, click suppression, ResizeObserver/scroll synchronization, reveal, and complete cleanup.**
- [ ] **Step 7: Add red-green cases for no early pointer capture, vertical cancellation, touch movement cancellation, pointercancel, blur, Escape, duplicate native context suppression, inactive-target IDs, resize, and document-stable reveal.**
- [ ] **Step 8: Run both focused tests plus `npm.cmd run typecheck`, then commit the shared controller.**

### Task 2: Panel rail activation, exploration, and targeted actions

**Files:**
- Modify: `apps/workbench-lab/src/recipes/PanelTabs.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelMenu.svelte`
- Test: `tests/browser/native-workbench.spec.ts`
- Test: `tests/browser/native-workbench-accessibility.spec.ts`

**Interfaces:**
- Consumes: Task 1 controller and existing `selectPanelTabs`/Panel commands.
- Produces: One Panel rail scroll owner; programmatic `PanelMenu.open(panelId, anchor, source)`; context actions for inactive or active Panels; no visible per-tab trigger and no direct rail reorder.

- [ ] **Step 1: Replace existing reorder expectations with a failing browser test that seeds eight Panels and proves a drag beginning on a tab changes `scrollLeft`, preserves order, and suppresses activation.**

```ts
const rail = page.getByRole('tablist', { name: 'Panels' });
const beforeOrder = await rail.getByRole('tab').allTextContents();
await dragHorizontally(page.getByRole('tab', { name: 'Settings' }), -120);
expect(await rail.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
await expect(rail.getByRole('tab')).toHaveText(beforeOrder);
```

- [ ] **Step 2: Run that Playwright test and verify RED because the current drag reorders and the active ellipsis remains.**
- [ ] **Step 3: Remove `TabReorderController` from `PanelTabs`, bind Task 1, wrap the tablist in the shared rail shell, and make click/keyboard activation call controller reveal.**
- [ ] **Step 4: Refactor `PanelMenu` into one programmatically opened target-aware popover/dialog. Remove `.panel-menu-trigger`, position from the target tab, preserve rename/duplicate/create/reset/clear/delete, and restore focus.**
- [ ] **Step 5: Add `Reorder Panels…` as a callback placeholder for Task 3, then add failing/passing tests for right-click, Shift+F10/ContextMenu, inactive target identity, Escape, focus restoration, and absent ellipses.**
- [ ] **Step 6: Remove Ctrl+Shift+Arrow reorder from the normal rail; prove Arrow/Home/End activate/reveal without changing order.**
- [ ] **Step 7: Run focused Panel browser/accessibility tests and typecheck, then commit Panel navigation.**

### Task 3: Shared explicit reorder management

**Files:**
- Modify: `apps/workbench-lab/src/recipes/tab-reorder.ts`
- Modify: `apps/workbench-lab/src/recipes/tab-reorder.test.ts`
- Modify: `apps/workbench-lab/src/recipes/TabReorderController.ts`
- Create: `apps/workbench-lab/src/recipes/TabOrderDialog.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelTabs.svelte`
- Test: `tests/browser/native-workbench.spec.ts`

**Interfaces:**
- Produces: Axis-aware handle-only `TabReorderController`; `TabOrderItem`; `TabOrderDialog.open({ label, items, invokingTab })`; `onmove(id, toIndex)` and `onclose` callbacks.
- Preserves: Existing `panel.reorder` and `sub-panel.reorder` commands as the sole state mutation authority.

- [ ] **Step 1: Write a failing unit test for vertical reorder indexing and dedicated-handle activation.**

```ts
expect(reorderIndexAtPoint('settings', 165, [
  { id: 'scene', start: 0, end: 44 },
  { id: 'library', start: 50, end: 94 },
  { id: 'settings', start: 100, end: 144 },
  { id: 'custom', start: 150, end: 194 }
])).toBe(2);
```

- [ ] **Step 2: Verify RED, generalize the existing controller to an explicit horizontal/vertical axis, and rerun GREEN without preserving normal-rail imports.**
- [ ] **Step 3: Add a failing browser test that opens `Reorder Panels…`, asserts full ordered names, drags only the Settings handle, and sees the store order change while Settings remains active.**
- [ ] **Step 4: Implement `TabOrderDialog` with semantic dialog/list rows, active marker, 44px handles, Move up/down, Done, Cancel, Escape, internal scrolling, and invoking-tab focus restoration.**
- [ ] **Step 5: Add red-green tests proving row-body dragging scrolls rather than reorders, handle pointercancel commits nothing, Move up/down work by keyboard, and persistence restores the new order.**
- [ ] **Step 6: Run focused unit/browser tests and typecheck, then commit explicit Panel reordering.**

### Task 4: Sub-panel rail and exact-target actions

**Files:**
- Modify: `apps/workbench-lab/src/recipes/SubPanelBar.svelte`
- Create: `apps/workbench-lab/src/recipes/SubPanelMenu.svelte`
- Modify: `apps/workbench-lab/src/recipes/SubPanelDialog.svelte`
- Modify: `apps/workbench-lab/src/App.svelte`
- Test: `tests/browser/sub-panels.spec.ts`
- Test: `tests/browser/deep-atmospheric-responsive.spec.ts`
- Test: `tests/browser/theme-settings.spec.ts`

**Interfaces:**
- Consumes: Tasks 1 and 3 plus existing sub-panel commands.
- Produces: Always-visible horizontal sub-panel rail, fixed Add control, exact-target context actions, `Reorder sub-panels…`, and first-created-tab guidance through the Lab's existing status/live region.

- [ ] **Step 1: Replace the phone selector tests with a failing eight-sub-panel rail test at 390x844 and 844x390. Assert the listbox trigger and ellipsis do not exist.**
- [ ] **Step 2: Verify RED because `.sub-panel-tabs` is hidden below 860px and the selector is present.**
- [ ] **Step 3: Remove selector/action-trigger state and markup, bind the shared controller, keep Add outside the scroll owner, and preserve outgoing/incoming vertical scroll restoration.**
- [ ] **Step 4: Extract exact-target `SubPanelMenu` with Rename, Duplicate, Change layout, Move Widgets, Delete, and Reorder sub-panels. Anchor wide presentation and restore target focus.**
- [ ] **Step 5: Connect `TabOrderDialog` to `sub-panel.reorder`; remove modified-arrow direct reorder and prove order/active identity/persistence through the explicit surface.**
- [ ] **Step 6: Add red-green real touch tests: stationary hold opens target actions, immediate movement scrolls, movement/cancel/blur prevents the menu, and no stray activation occurs.**
- [ ] **Step 7: Make successful first custom Panel/sub-panel creation announce the approved context hint once per current Lab session without adding host persistence to public packages.**
- [ ] **Step 8: Update helper functions in responsive/theme tests to click the now-visible sub-panel tab directly, then run focused sub-panel/theme/browser tests and typecheck. Commit the complete second rail.**

### Task 5: Unified responsive CSS, opaque actions, and SVG gear

**Files:**
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/src/recipes/WorkbenchDeveloperDrawer.svelte`
- Test: `tests/browser/native-workbench-accessibility.spec.ts`
- Test: `tests/browser/sub-panels.spec.ts`

**Interfaces:**
- Consumes: The semantic shells and data attributes produced by Tasks 1-4.
- Produces: One final rail cascade, fixed external controls, pointer-transparent edge cues, natural tab widths, hidden scrollbars, opaque phone action/reorder sheets, scrims, safe-area handling, and a centered inline gear SVG.

- [ ] **Step 1: Add failing geometry/computed-style tests for start/middle/end cue state, natural tab widths, fixed Add controls, 44px targets, opaque phone surfaces, and document containment.**
- [ ] **Step 2: Add a failing gear test comparing the SVG and summary centers:**

```ts
expect(Math.abs((icon.left + icon.right) / 2 - (button.left + button.right) / 2)).toBeLessThanOrEqual(1);
expect(Math.abs((icon.top + icon.bottom) / 2 - (button.top + button.bottom) / 2)).toBeLessThanOrEqual(1);
```

- [ ] **Step 3: Replace the gear pseudo-element with an inline `aria-hidden` SVG and visually hidden accessible label; verify exact centering and 44px target independently.**
- [ ] **Step 4: Consolidate all late `.panel-tabs`, `.panel-menu`, `.sub-panel-*`, compact, instrumented, and coarse-pointer overrides into one final `[data-tab-rail-*]` authority. Remove the obsolete selector and per-tab-menu rules.**
- [ ] **Step 5: Style edge cues from semantic fallback tokens with `pointer-events: none`; ensure `grab` appears only for fine-pointer overflow and `grabbing` only while panning.**
- [ ] **Step 6: Style compact/coarse action and order surfaces as effectively opaque bottom sheets with scrims, safe-area padding, bounded internal scroll, and unchanged command DOM.**
- [ ] **Step 7: Run focused accessibility/responsive tests at all required viewports, then commit responsive presentation.**

### Task 6: Copy-owned recipes and full regression matrix

**Files:**
- Modify: `registry/recipes/panel-tabs/PanelTabs.svelte`
- Modify: `registry/recipes/sub-panel-navigation/SubPanelBar.svelte`
- Modify: `registry/recipes/sub-panel-navigation/SubPanelDialog.svelte`
- Modify: `registry/recipes/recipe-manifest.json`
- Modify: `tests/unit/recipes.test.mjs`
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Modify: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Produces: Copy-owned semantic rail shells and host callbacks for activation, context, and explicit reorder; deterministic manifest hashes; reviewed four-theme visuals.
- Preserves: Recipe independence from Lab fixtures and concrete theme IDs.

- [ ] **Step 1: Add a failing recipe test requiring both navigation recipes to expose the rail shell, exact-target context callback, no selector/ellipsis markup, and explicit reorder callback.**
- [ ] **Step 2: Update the copy-owned Svelte sources without importing Lab controllers; expose typed optional host callbacks and semantic data attributes.**
- [ ] **Step 3: Run `node scripts/verify-recipes.mjs --write`, inspect the exact manifest changes, then run `npm.cmd run check:recipes` and unit recipe tests.**
- [ ] **Step 4: Add eight-tab browser fixtures for every maintained theme and required viewport. Prove panning, context actions, explicit reorder, auto-reveal, cue state, fixed controls, and zero document overflow.**
- [ ] **Step 5: Capture phone top/sub-panel rails, phone action sheet, populated reorder surface, and desktop overflow for Deep Current, PomOS, Bunny, and Ash & Amber. Inspect every changed image at original resolution before accepting it.**
- [ ] **Step 6: Run all browser tests and commit recipes plus reviewed regressions.**

### Task 7: Verification, review, integration, and live proof

**Files:**
- Modify only if evidence requires: files already named above
- Evidence: GitHub PR/checks, Pages deployment, live DOM/console/screenshots

**Interfaces:**
- Consumes: Complete implementation.
- Produces: Reviewed merged main SHA and verified public Workbench Lab.

- [ ] **Step 1: Run focused unit, type, native, build, recipe, pack, and browser gates. Resolve every attributable failure through a failing regression test.**
- [ ] **Step 2: Run `npm.cmd run check` with required Windows/npm-cache access and retain the exact counts and exit status.**
- [ ] **Step 3: Self-review the complete diff against every spec section; run `git diff --check`, confirm no concrete theme-ID selectors, and inspect every changed screenshot.**
- [ ] **Step 4: Request independent code review, resolve all Critical/Important/Minor findings, and rerun affected plus full gates.**
- [ ] **Step 5: Stage only intended files, commit with a concise conventional message, push `codex/unified-tab-rails`, and open a GitHub PR containing scope and verification evidence.**
- [ ] **Step 6: Require hosted Windows and Ubuntu checks on the exact head SHA, merge, and follow the exact merge SHA through the Pages job.**
- [ ] **Step 7: Live-verify `https://mentallyquill.github.io/PomegranateUI/` at desktop and phone geometry: HTTP 200, exact deployed assets/SHA, eight-tab scrolling behavior, context actions, explicit reorder surface, opaque phone sheets, centered gear, clean console, one mounted theme root, and one static `meta[name="darkreader-lock"]`.**
- [ ] **Step 8: Delete the merged remote feature branch after live proof, retain history, verify local intended work is clean, and mark the active goal complete.**
