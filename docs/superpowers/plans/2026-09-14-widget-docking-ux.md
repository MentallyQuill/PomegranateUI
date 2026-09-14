# Widget docking UX implementation plan

> Execute sequentially using `superpowers:executing-plans`; record failing tests, passing checks, and browser evidence for each item before progressing.

**Goal:** Complete the seven improvements authorized by the active task goal, preserving reusable toolkit boundaries.

**Architecture:** Keep layout state and validated commands in contracts/layout/core. Let Svelte project visible shelf items and own temporary interaction presentation. Shared geometry and preview controllers must describe the same operation that commits; preview DOM must not feed back into target selection.

**Tech stack:** TypeScript, Svelte, Vitest, Playwright, CSS and Web Animations.

**Spec:** The seven numbered requirements in the active task goal and the source-backed review in this task. This plan supersedes the old compact-chip visual treatment where it conflicts with the approved continuous-drag objective.

## Constraints

- Worktree: `F:/git/PomegranateUI/.worktrees/widget-docking-ux`, branch `codex/widget-docking-ux`, baseline `3cbabce`.
- Preserve unrelated dirty documentation in the parent checkout. No npm publication.
- One mounted theme-independent component tree; adapters own domain data.
- `contracts -> layout -> core -> svelte`; no framework/DOM imports in neutral packages.
- Use `npm.cmd`; add behavior regressions before production changes.
- Keep the complete goal active until all seven items and final verification are proven.

## 1. Shelf allocation

Owners: `apps/workbench-lab/src/recipes/DockShelf.svelte`, `DockRegion.svelte`, `styles.css`; matching registry recipes when reusable structure changes. Tests: `tests/browser/widget-docking-ux.spec.ts`.

- [x] Add a real drag regression that moves Theme Materials into a separate right shelf and measures widget versus shelf height in all four themes. A singleton must fill the usable shelf; two items retain their intended proportions.
- [x] Run `npm.cmd run build` and `npm.cmd exec -- playwright test tests/browser/widget-docking-ux.spec.ts`; confirm phantom-row failure.
- [x] Project visible item counts (a tab group counts as one); use one row for a singleton, authored ratios for exactly two, and explicit rows for larger counts. Remove the fixed phantom divider. Avoid rendering/resizing empty shelves left by moves while retaining a target for an entirely empty region.
- [x] Verify grouping, moving the final item out of a shelf, undo, and constrained viewport allocation. Capture and inspect screenshots with animations enabled.
- [x] Record checks/evidence below.

## 2. Stable docking targets

Owners: `widget-docking.ts`, `widget-docking-dom.ts`, `WidgetDragController.ts`, `CatalogPlacementController.ts`. Tests: corresponding native geometry tests and browser UX suite.

- [x] Add a regression which repeatedly moves by 0–1 px around a settled insertion preview and asserts destination identity and geometry do not oscillate.
- [x] Separate authoritative target geometry from in-layout preview effects; refresh deliberately on actual layout/scroll/panel changes. Use shared geometry collection/observation for existing and Catalog drags; unify presentation in item 5.
- [x] Verify before/between/after rails, grouping boundaries, collapsed docks, scrolling and cross-panel retargeting. Ensure the last displayed stable intent is what release commits.

## 3. Destination semantics

Owners: `widget-docking.ts`, both placement controllers, `packages/contracts/src`, `packages/layout/src/operations.ts`, `packages/core/src/store.ts` as needed for one atomic command.

- [ ] Regress insertion between two widgets sharing a shelf, including a group and multiple dock columns.
- [ ] Represent widget-relative insertion explicitly and commit that position atomically; shelf rails remain shelf-relative. Preserve untouched ordering, ownership, undo and rejected-operation atomicity.
- [ ] Verify preview and final neighbour order agree for before/after, same-shelf moves and Catalog additions.

## 4. Continuous motion

Owners: `WidgetDragController.ts`, shared preview controller, `styles.css`, Catalog proxy presentation.

- [ ] Add frame-sampled browser assertions for grab anchoring, held identity, preview/final bounds and cancellation cleanup, with motion enabled and reduced motion variants.
- [ ] Keep one inert recognizable held representation without duplicate accessible/interactive content. Show floating bounds before release. Measure committed destination bounds and coordinate held-object arrival and neighbouring reflow; avoid nonuniform text stretching and duplicate entrance effects.
- [ ] Verify rapid repeat drags, panel unmount, cancel, blur, pointercancel and reduced motion.

## 5. Clear feedback

Owners: shared preview controller, `WidgetDragController.ts`, `CatalogPlacementController.ts`, `styles.css`.

- [ ] Regress stable indicator identity and correct visible intent for grouping, insertion and floating across Catalog/existing-widget gestures.
- [ ] Update persistent preview elements instead of replacing the overlay on every pointer event. Use one destination cue and concise action labels; retain useful discovery without stacking equivalent highlights.
- [ ] Verify all four themes for legibility and matching semantics.

## 6. Discoverable actions and gestures

Owners: `WidgetFrame.svelte`, `WidgetGroup.svelte`, `widget-group-gesture.ts`, `TabReorderController.ts`, drag controllers, `styles.css`.

- [ ] Regress accessible action access without guessing right-click; keyboard/pen/touch paths and cross-panel dwell feedback.
- [ ] Expose unobstructed action controls, communicate drag/reorder/detach semantics and pending panel activation, and preserve responsive target sizing and cancellation ownership.
- [ ] Verify all named modalities and grouped/ungrouped widgets.

## 7. Shelf placement workflow

Owners: `WidgetShelf.svelte`, `WidgetActionMenu.svelte`, shared placement integration and `styles.css`.

- [ ] Regress placement from the Shelf into a chosen destination, cancellation, restore, undo and last-visible state.
- [ ] Support direct drag or explicit accessible destination placement using the shared placement semantics. Clarify shelving and restore actions, use human-readable locations and give the Shelf an opaque/readable menu surface and dismissal/focus behavior.
- [ ] Verify empty/nonempty Shelf, multiple panels, constrained viewports and themes.

## Final audit

- [ ] Run `test:unit`, `typecheck`, `test:native`, `build`, `check:recipes`, `test:pack`, `test:browser` and `check` as applicable; inspect coverage, not just exit codes.
- [ ] Exercise Catalog, docked, grouped, floating and shelved widgets across all themes and responsive states. Include cancellation, restoration, undo, persistence and actual animation frames.
- [ ] Review scoped diff and recipe parity. Record limitations; do not claim completion if any requirement lacks evidence.

## Evidence log

- Review baseline: singleton shelves reproduced with phantom rows in Bunny and Deep Current; 19 focused native docking tests passed despite the rendered issue.
- Previous goal turn: progress (created the active goal). This continuation begins implementation.
- Item 1 red: real browser assertion received 129.55 px for a singleton requiring >322.5 px. Native empty-shelf projection assertion also failed before its fix.
- Item 1 green: three browser tests cover all four themes at 1280x720 and grouped shelves at 1280x580, empty-shelf removal and undo. Screenshots in `test-results/widget-docking-ux-*` were captured with motion enabled; Deep Current and Ash & Amber inspected visually. All 629 native tests (59 files), typecheck, build and recipe verification passed. The registry exposes the same item-count/grid-row hooks, revision 5.
- Final responsive audit still includes phone/tablet and all placement modalities; item 1's focused evidence does not substitute for that audit.
- Item 2 red: 0–1 px pointer sweep changed preview Y by 64.61 px; viewport resize left both existing-widget and Catalog previews 80 px behind the slot; Catalog closed a revealed dock when entering its widget. Browser regressions failed before each fix.
- Item 2 green: underlying geometry excludes temporary slot flow; frame-coalesced geometry observers handle resize, scroll, content changes and active-panel rebinding. Catalog retains a revealed dock until the pointer leaves it. Eleven focused browser tests passed, including cross-panel grouped/ungrouped commits, collapsed-dock cancellation, Catalog layouts, stationary sweep and both resize cases. 47 existing native tests passed; an additional native scroll/coalescing/cancellation regression passed. Typecheck and build passed. Geometry and motion remain separate: continuous arrival and persistent indicators are items 4–5.
