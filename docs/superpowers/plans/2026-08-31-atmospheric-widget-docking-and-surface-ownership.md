# Atmospheric Widget Docking and Surface Ownership Implementation Plan

> **For Codex:** Execute this plan with test-driven development and visual Playwright loops. Do not refresh snapshots until localized differences are intentional and reviewed against the Atmospheric oracle.

**Goal:** Make held-Widget docking and tab reordering indistinguishable from the Atmospheric interaction authority, make the top-level Panel menu fully theme-bound, and consolidate Custom Theme into one renderer across all themes.

**Architecture:** Keep docking and tab-reorder decisions in pure TypeScript modules, while controllers own pointer lifecycle, ephemeral DOM, and existing store-command translation. Active shelf destinations become temporary flex children so real siblings reflow. Use semantic shared parts for all themes, a native top-layer popover for the Panel menu, and one responsive `ThemeSettings.svelte` renderer.

**Tech Stack:** TypeScript, Svelte 5, PomegranateUI contracts/core, Vitest, Playwright, CSS theme expressions.

---

## Task 1: Freeze the approved interaction contract

**Files:**
- Add: `docs/superpowers/specs/2026-08-31-atmospheric-widget-docking-and-surface-ownership-design.md`
- Add: `docs/superpowers/plans/2026-08-31-atmospheric-widget-docking-and-surface-ownership.md`

Record the authority split, intent zones, visual states, cancellation rules, Panel/sub-panel ownership, single Theme Settings implementation, and required verification matrix. Commit these documents before implementation.

## Task 2: Add a pure docking-intent engine

**Files:**
- Add: `apps/workbench-lab/src/recipes/widget-docking.ts`
- Add: `apps/workbench-lab/src/recipes/widget-docking.test.ts`
- Modify: `apps/workbench-lab/src/recipes/WidgetDragController.ts`

1. Write failing tests for 25/50/25 Widget-body zones, hard header/tab targets, ordered shelf rails, empty region targets, floating fallback, ten-pixel hysteresis, and viewport clamping.
2. Run `npm.cmd run test:unit -- widget-docking.test.ts` and confirm the red failures describe missing behavior.
3. Implement `DockRect`, `DockTarget`, `DockIntent`, `resolveDockIntent`, `stabilizeDockIntent`, and `clampHeldRect` as DOM-free functions.
4. Rerun the focused unit test until green, then refactor names and invariants without changing behavior.

## Task 3: Port the Atmospheric held-state and target overlay

**Files:**
- Modify: `apps/workbench-lab/src/recipes/WidgetDragController.ts`
- Modify: `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`

1. Replace seam-based browser assertions with failing tests that require a complete inert Widget preview, a visually vacant source footprint, labeled contextual rails, a full-size in-layout slot, sibling reflow, collapsed-edge opening, tab insertion, and preview-to-commit fidelity.
2. Build targets from the live active Panel/sub-panel DOM on every drag frame. Paint an overlay inside the active surface with semantic `data-pom-part` hooks.
3. Clone the full Widget visual safely by stripping duplicate IDs, names, focusability, form submission behavior, and accessibility exposure.
4. Preserve the source's layout footprint while hiding all of its card content, preserve pointer grab offset, and guarantee exact cancellation cleanup.
5. Commit the stable `DockIntent` rather than re-hit-testing on pointer release. Translate tab, shelf before/after/append, empty-region, and float intents to store commands with deterministic shelf orders; create-and-place shelf drops must be one atomic command and undo record.
6. Add pointer capture loss, Escape, blur, and component-destruction cleanup. Retain keyboard placement paths and preserve an accepted release animation until its completion cleanup.
7. Run the focused native browser specs and inspect screenshots at 1920x1080, 390x844, 844x390, and 720x1280.

## Task 4: Move the Panel menu into the top layer

**Files:**
- Modify: `apps/workbench-lab/src/recipes/PanelMenu.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelTabs.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/browser/sub-panels.spec.ts`

1. Add failing browser tests that open `Manage Settings`, assert nonzero visible area outside the tab strip, invoke a harmless Panel action, dismiss with Escape, and verify focus restoration at every responsive authority viewport.
2. Replace the clipped `details` popup with a button plus native `popover="auto"` dialog-like surface anchored with fixed geometry; its rename field and buttons use normal Tab semantics.
3. Apply `menu.surface`, the compiled theme material, backdrop blur, reduced-transparency fallback, and forced-colors fallback. Remove Move left/right because ordering belongs to direct tab drag and modified keyboard commands.
4. Focus the name field on open, restore the trigger after Escape/action completion, preserve an outside-click target's focus, and keep literal control labels.
5. Show first-sub-panel creation only when no sub-panel bar exists; keep sub-panel creation and active-sub-panel actions in their existing bar controls otherwise.
6. Rerun the focused accessibility and sub-panel specs.

## Task 4A: Add shared direct tab reordering

**Files:**
- Add: `apps/workbench-lab/src/recipes/tab-reorder.ts`
- Add: `apps/workbench-lab/src/recipes/TabReorderController.ts`
- Modify: `PanelTabs.svelte`, `SubPanelBar.svelte`, `WidgetGroup.svelte`

1. Test literal insertion indexes and mouse/pen/true-touch-hold decisions before implementation, including permanent cancellation when pre-hold motion exceeds slop.
2. Render one inert tab proxy, one in-strip insertion slot, and a vacant origin while reordering.
3. Commit Panel, sub-panel, and group orders through their existing store commands; ordinary Widget headers remain pan-compatible outside the dedicated touch grip.
4. Keep bare arrows for navigation and Ctrl+Shift+Arrow for reorder.
5. In grouped strips, route horizontal motion to reorder and deliberate vertical motion to Widget tear-off docking.

## Task 5: Consolidate Custom Theme

**Files:**
- Modify: `apps/workbench-lab/src/recipes/ThemeSettings.svelte`
- Modify: `apps/workbench-lab/src/mockup/renderers/ImplementedWidget.svelte`
- Delete: `apps/workbench-lab/src/mockup/renderers/CompactThemeWidget.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/theme-settings.spec.ts`
- Modify: `tests/browser/native-workbench-visual.spec.ts`

1. Add failing tests for Scene-to-Settings and Settings-to-Scene material changes, shared invalid-color diagnostics, reset, save, and identical control inventory.
2. Add `presentation: 'compact' | 'full'` to `ThemeSettings.svelte` and move compact composition into the canonical component without duplicating authoring state or mutation functions.
3. Make the component react to any external editable-draft change, not only base-theme changes.
4. Route every `settings.custom-theme` instance through the canonical renderer and remove `CompactThemeWidget.svelte`.
5. Keep one deterministic internal scroll owner at compact/short/zoom layouts and preserve Atmospheric Scene geometry.
6. Run the focused theme-settings and visual specs; localize any snapshot difference before accepting it.

## Task 6: Iterate visually across themes and accessibility modes

**Files:**
- Modify as findings require: shared recipe/CSS/test files above
- Add intentional evidence under ignored `test-results/`

1. Verify ports 4173 and 4174 are free or owned by this task before each server start.
2. Use Playwright to hold and move representative compact, full, grouped, and floating Widgets in Deep Current, PomOS, Bunny, and Ash & Amber.
3. Compare held card, rails, active preview, tab insertion, placeholder, and release animation to the Atmospheric oracle at each authority viewport.
4. Repeat under coarse pointer, reduced motion, reduced transparency, and forced high contrast.
5. Inspect the Panel menu and both Custom Theme placements in the same matrix.
6. Fix the smallest shared semantic cause for each discrepancy and repeat until no unexplained difference remains.

## Task 7: Full verification and integration

1. Run `npm.cmd run check` outside the sandbox if npm cache or browser process restrictions require it.
2. Run `git diff --check`, inspect `git status --short`, and review the complete diff for theme-ID selectors, duplicated renderers, fixture drift, and unrelated changes.
3. Commit implementation on `codex/atmospheric-interaction-correction` with a concise conventional message.
4. Fast-forward or merge the reviewed branch into the primary `main` checkout without touching unrelated untracked files, then `git push origin main`.
5. Use GitHub CLI with network permission to verify the exact main SHA and watch required checks and Pages deployment to completion.
6. Inspect the live GitHub Pages DOM, console, asset loads, responsive layouts, held docking visuals, Panel menu, and Custom Theme parity.
