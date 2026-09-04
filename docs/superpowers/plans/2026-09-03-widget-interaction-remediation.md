# Widget Interaction Remediation Implementation Plan

**Goal:** Fix the three evidence-backed Widget interaction defects from the Playwright audit, remove every associated expected-failure marker, and retain the full manipulation matrix as regression coverage.

**Architecture:** Keep the fixes local to the existing Widget recipes. Add one pure gesture-arbitration helper so grouped tabs may begin as a reorder and later become a tear-off, replace the cloned Widget drag proxy and text labels with compact geometric feedback, and explicitly promote a transient collapsed-dock reveal to App state only after an accepted drop. Do not change persisted placement schemas, theme contracts, or create a global interaction controller.

**Evidence:** `docs/widget-interaction-audit.md`

## Constraints

- Work test-first from the retained expected failures and focused unit tests.
- Keep one mounted Workbench and data-only themes; behavior cannot branch on theme IDs.
- Keep cancellation, Undo, Save layout, mouse, pen, touch, and keyboard behavior intact.
- The overlay is geometric and text-free; the held proxy is one compact, inert identity element.
- A collapsed dock expands only after an accepted drop into that dock, not on hover or cancellation.
- Use the isolated Playwright port when 4174 is owned by another task; never terminate another listener.

### Task 1: Let grouped-tab reorders become tear-offs

**Files:**
- Create: `apps/workbench-lab/src/recipes/widget-group-gesture.ts`
- Create: `apps/workbench-lab/src/recipes/widget-group-gesture.test.ts`
- Modify: `apps/workbench-lab/src/recipes/WidgetGroup.svelte`
- Test: `tests/browser/widget-interaction-playtest.spec.ts`

- [ ] Write pure reducer tests for pending, reorder, corridor departure, sticky tear-off, cancellation, and pointer types.
- [ ] Implement the reducer using the existing drag thresholds plus current tablist geometry.
- [ ] Keep both reorder and Widget drag candidates alive while the pointer remains in the tab corridor.
- [ ] On corridor departure, cancel only reorder, render the selected frame, and activate the existing Widget drag controller.
- [ ] On reorder commit, explicitly cancel the unused Widget drag candidate.
- [ ] Remove both `AUDIT-P1-GROUP-DIRECT-FLOAT` expected-failure markers after active and inactive grouped-tab journeys pass.

### Task 2: Make drag presentation compact and unambiguous

**Files:**
- Modify: `apps/workbench-lab/src/recipes/WidgetDragController.ts`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/native-workbench.spec.ts`
- Test: `tests/browser/widget-interaction-playtest.spec.ts`

- [ ] Retain the Playwright assertions that require zero nested articles, zero interactive descendants, one origin vacancy, one active reservation, and empty overlay text.
- [ ] Replace the full subtree clone with one inert title/identity proxy sized independently of Widget content.
- [ ] Remove rail and active-intent text nodes while preserving the insertion gap, snap rectangle, tab insertion marker, and semantic part hooks.
- [ ] Update existing native cross-theme assertions to the compact-proxy contract without weakening drag lifecycle checks.
- [ ] Remove the `AUDIT-P1-SINGLE-PRESENTATION` expected-failure marker after the focused golden journey passes.

### Task 3: Preserve an accepted drop into a collapsed dock

**Files:**
- Modify: `apps/workbench-lab/src/recipes/WidgetDragController.ts`
- Modify: `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetGroup.svelte`
- Modify: `apps/workbench-lab/src/App.svelte`
- Test: `tests/browser/widget-interaction-playtest.spec.ts`

- [ ] Track which collapsed side is transiently revealed on the active drag candidate.
- [ ] Add a typed controller callback that is invoked only when a drop into that revealed side commits.
- [ ] Pass the callback through singleton and grouped Widget recipes to the App-owned collapsed state.
- [ ] Prove cancellation removes the transient reveal without expanding the dock.
- [ ] Remove the `AUDIT-P1-COLLAPSED-DOCK-COMMIT` expected-failure marker after placement, revision, and visible expanded state all pass.

### Task 4: Close the audit with full regression evidence

**Files:**
- Modify: `docs/widget-interaction-audit.md`
- Test: all modified unit and browser suites

- [ ] Run focused unit tests and `npm.cmd run typecheck`.
- [ ] Run `npm.cmd run build`.
- [ ] Run the full Widget interaction audit together with `native-workbench.spec.ts` on an owned port.
- [ ] Confirm the suite contains no expected-failure markers or skipped matrix journey.
- [ ] Update each issue row with the repair boundary and verified status; record final test counts and environment.
- [ ] Run `npm.cmd run check` and `git diff --check` before reporting completion.
