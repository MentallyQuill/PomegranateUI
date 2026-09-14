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

- [x] Regress insertion between two widgets sharing a shelf, including a group and multiple dock columns.
- [x] Represent widget-relative insertion explicitly and commit that position atomically; shelf rails remain shelf-relative. Preserve untouched ordering, ownership, undo and rejected-operation atomicity.
- [x] Verify preview and final neighbour order agree for before/after, same-shelf moves and Catalog additions.

## 4. Continuous motion

Owners: `WidgetDragController.ts`, shared preview controller, `styles.css`, Catalog proxy presentation.

- [x] Add frame-sampled browser assertions for grab anchoring, held identity, preview/final bounds and cancellation cleanup, with motion enabled and reduced motion variants.
- [x] Keep one inert recognizable held representation without duplicate accessible/interactive content. Show floating bounds before release. Measure committed destination bounds and coordinate held-object arrival and neighbouring reflow; avoid nonuniform text stretching and duplicate entrance effects.
- [x] Verify rapid repeat drags, panel unmount, cancel, blur, pointercancel and reduced motion.

## 5. Clear feedback

Owners: shared preview controller, `WidgetDragController.ts`, `CatalogPlacementController.ts`, `styles.css`.

- [x] Regress stable indicator identity and correct visible intent for grouping, insertion and floating across Catalog/existing-widget gestures.
- [x] Update persistent preview elements instead of replacing the overlay on every pointer event. Use one destination cue and concise action labels; retain useful discovery without stacking equivalent highlights.
- [x] Verify all four themes for legibility and matching semantics.

## 6. Discoverable actions and gestures

Owners: `WidgetFrame.svelte`, `WidgetGroup.svelte`, `widget-group-gesture.ts`, `TabReorderController.ts`, drag controllers, `styles.css`.

- [x] Regress accessible action access without guessing right-click; keyboard/pen/touch paths and cross-panel dwell feedback.
- [x] Expose unobstructed action controls, communicate drag/reorder/detach semantics and pending panel activation, and preserve responsive target sizing and cancellation ownership.
- [x] Verify all named modalities and grouped/ungrouped widgets.

## 7. Shelf placement workflow

Owners: `WidgetShelf.svelte`, `WidgetActionMenu.svelte`, shared placement integration and `styles.css`.

- [x] Regress placement from the Shelf into a chosen destination, cancellation, restore, undo and last-visible state.
- [x] Support direct drag or explicit accessible destination placement using the shared placement semantics. Clarify shelving and restore actions, use human-readable locations and give the Shelf an opaque/readable menu surface and dismissal/focus behavior.
- [x] Verify empty/nonempty Shelf, multiple panels, constrained viewports and themes.

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
- Item 3 red: four browser cases placed before/after markers 293–345 px from the requested widget boundary. Eight native relative-placement cases initially rejected the missing command. Additional regressions exposed persisted shelf-order gaps, cross-column shelf indexing/weight errors (requested .7 became .9032), and group-height mutation on an unrelated panel with the same group id.
- Item 3 implementation: `widget.place-relative` parses source/optional new instance, target and before/after/tab relation. Layout resolves order after removing the source, treats target groups as one item and publishes one revision/event/undo step. Catalog and existing-widget controllers share it. Widget-relative markers use the widget/group boundary; shelf rails still create shelves and retain persisted order indices. Column and group ownership are scoped correctly.
- Item 3 verification: all 647 native tests (60 files) passed; build, typecheck and recipe verification passed. Four real browser before/after cases cover existing/Catalog widgets and a grouped target, with motion-enabled before/after screenshots and undo. Screenshots inspected. Eighteen repeated browser runs cover these cases and cross-panel grouped/ungrouped docking.
- Follow-up for item 5: one cross-panel browser run during simultaneous native/browser load encountered a transient missing rail element, while the held widget and slot remained present. Both controllers still replace overlay children on refresh. The same six scenarios passed three consecutive runs without concurrent native load. Retain indicator nodes in item 5 and verify this under load; do not treat a retry as resolving DOM churn.
- Item 4 red: browser checks against the preceding commit found a title-only held chip, no floating footprint and no animation toward actual committed bounds. Catalog likewise had no settling frames or floating placement. A later regression caught a second surface entrance after arrival, and Escape during Catalog pointer placement still committed on release.
- Item 4 implementation: a recognizable inert content snapshot retains a frozen grab anchor; floating preview and commit share bounds. Existing and Catalog placements animate to the rendered destination, coordinate neighbour movement and reveal the arriving widget without nonuniform text scale or a second entrance. Blur, resize, scroll and a subsequent drag finish arrival safely. Reduced motion settles immediately. Catalog now supports floating placement, including a floating-only adapter with the Panel as target root, and Escape cancels pointer placement.
- Item 4 verification: 647 native tests passed before the final floating-only regression; all 34 Catalog controller tests passed including that new regression. Typecheck (zero errors/warnings), build and recipe verification passed. Fifteen focused live browser cases passed, including four-theme recognizable held content, frame-sampled arrival/final bounds, neighbour motion, repeated drag, both sources' reduced motion and Escape/blur/pointercancel. Existing cross-panel grouped/ungrouped cases passed with the motion implementation. Held screenshot inspected: identity remains recognizable; float label overlap is explicitly next in item 5. Visual golden updates and final responsive coverage remain pending until feedback/actions stabilize.
- Item 4 final focused suite: all 25 UX browser tests passed before commit `66a8bf1`.
- Item 5 red: one-pixel moves replaced every rail and destination node in both controllers. New browser contrast checks also exposed PomOS labels at 4.35:1 against the canvas. Visual inspection found that a middle-body grouping cue looked like inserted space; a native regression confirmed it outlined only a slice of its destination.
- Item 5 implementation: both drag paths now use the same keyed, persistent preview controller, including floating footprints and one measured action label kept outside the held object and inside the viewport. Grouping outlines the whole destination widget/group; insertion uses one boundary line; floating uses a dashed footprint. Slots reserve layout without a second visible border, active rails do not compete with the destination, and the redundant tab insertion marker and held-object floating outline are gone. Label surfaces use opaque theme surface colors.
- Item 5 verification: all 648 native tests passed after preview consolidation, including a concurrent browser run where grouped and ungrouped cross-panel docking retained their rails. The complete 27-case UX browser suite passed. After the final whole-group cue adjustment, 17 native geometry/DOM tests and six affected live browser cases passed, covering both sources in all four themes, accurate whole-target bounds, retained element identity across intent changes, label contrast >=4.5:1, no held-label overlap, grouped cross-panel moves and atomic Catalog grouping. Typecheck, build and recipe verification passed. Screenshots of grouping, insertion and floating were captured; all four floating themes and representative grouping/insertion cues were visually inspected. Full visual goldens, responsive/input coverage and final repository gates remain for items 6-7 and the final audit.
- Item 6 red: desktop actions were hidden; grouped tabs lacked gesture descriptions and explicit reorder/detach actions; pending panel hover had no explanation and Catalog could not use it. Regression checks caught a 28px/44px coarse-pointer cell conflict, an inaccessible compact Undo control, hidden transcript/composer/Custom Theme actions, and a toolbar toggle covering a floating drag handle. A Catalog touch probe correctly cancelled on a pending programmatic scroll; searching first verified the hold without weakening scroll cancellation.
- Item 6 implementation: visible action cells retain 44px coarse targets; grouped tabs explain both gestures and offer reorder/detach commands; Undo is exposed. Shared 350ms panel dwell presents a readable destination and progress cue, omits motion when requested, cancels cleanly, and rebinds Catalog to the opened panel. Transcript/composer headers remain usable; draft measurement includes header height. Floating widgets sit above toolbar toggles. Registry frame/group action controls match the discoverability contract.
- Item 6 verification: all 651 native tests passed, plus typecheck, build and recipe verification. The 9 new action/input browser cases and 26 of 27 docking UX cases passed together; the remaining interrupted-arrival case exposed the covered floating handle and passed after the stacking fix alongside both coarse-pointer action cases. All 24 theme UX browser cases passed, including multiline composer containment at phone, desktop and short-desktop sizes in four themes. Earlier 16 input/context cases passed for keyboard group reorder/persistence, touch reorder/tear-off, pen and cancellation. New tests cover Catalog keyboard placement/focus return, pen/touch cancel+commit, cross-panel commit and cancelled dwell with both motion preferences. Cross-theme screenshots were inspected. Floating test coordinates now use measured empty stage space because the newly visible transcript header makes the transcript a real docking target. Final full browser suite and visual baselines remain pending.
- Item 7 red: the Shelf offered only Restore/Delete and exposed internal region/shelf identifiers. Browser regressions caught the missing workflow, a clipped phone launcher and Undo action, and non-instrumented phone docks that remained hidden despite their open state. The floating persistence test initially omitted the Lab's explicit Save layout action; adding that action verified the existing save/restore contract without introducing autosave.
- Item 7 implementation: Move to Widget Shelf and Put back distinguish saved placement from deletion. The Shelf is a bounded native popover with Escape/outside dismissal, focus return, opaque theme colors, readable location names and a persistent launcher. Place offers named regions, before/after/group targets through the shared atomic commands, and floating; cancellation does not mutate the layout. Successful placement reveals side docks and focuses the resulting header/tab. Phone toolbars allocate actual space for Shelf, Undo and developer controls, including 44px hit targets inside borders. Non-instrumented phone docks now obey collapse/open state and overlay the stage rather than remaining permanently hidden.
- Item 7 verification: five browser scenarios passed, covering mouse/keyboard placement, grouping as one revision/undo step, cancellation, original-position restoration, floating restore after explicit save/reload, Panel ownership, eight theme/width combinations, and touch placement/reveal with 44px controls in all four themes. All 24 theme UX browser cases and 31 App native cases passed; typecheck and build passed. All six Atmospheric responsive cases passed after updating the measured single-row chrome contract from 44px to 46px to retain 44px controls within its borders. Desktop and phone Shelf screenshots were inspected for readable controls, surface opacity and containment. The full repository and visual audit is still required.
