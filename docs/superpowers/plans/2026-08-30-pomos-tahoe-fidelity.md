# PomOS Tahoe Fidelity Implementation Plan

> Execute this plan test-first from `codex/pomos-tahoe-fidelity`. Keep all capabilities generic and data-driven; never introduce selectors keyed to `pom-neutral` or PomOS.

## Task 1: Freeze the defect geometry in browser contracts

**Files:**
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`

1. Add a PomOS activation helper that uses the accessible developer controls.
2. Add exact rectangle assertions for 1280x720 side-stack sibling separation, dock containment, composer containment, and shelf-descendant containment.
3. Extend the same containment matrix to 1440x900, 390x844, 844x390, and 800x450.
4. Run the focused Playwright test and retain the red evidence before implementation.

## Task 2: Repair shared short-height and overflow ownership

**Files:**
- Modify: `apps/workbench-lab/src/styles.css`
- Modify if required by semantic ownership: shared Workbench/Panel component styles only

1. Give each side dock and shelf a deterministic min-height/overflow owner.
2. Ensure proportional grid rows cannot be expanded by Widget contents.
3. Make the appropriate Widget content region scroll without letting borders or action rails cross sibling boundaries.
4. Add bounded short-height behavior that preserves the stage and composer.
5. Re-run the new browser contract until green, then run adjacent accessibility tests.

## Task 3: Contain compact chrome and composer controls

**Files:**
- Modify: `apps/workbench-lab/src/styles.css`
- Modify only if semantics require it: `apps/workbench-lab/src/App.svelte`
- Test: `tests/browser/native-workbench-accessibility.spec.ts`

1. Add failing assertions for shelf child containment and composer textarea/button visibility at compact and zoom-equivalent viewports.
2. Replace outgrowing fixed chrome tracks with minmax/overflow ownership while retaining text labels for tabs.
3. Preserve IconAction accessible names and 44px coarse-pointer targets.
4. Re-run the focused matrix and keyboard accessibility coverage.

## Task 4: Refine PomOS theme data and reusable presentation recipes

**Files:**
- Modify: `apps/workbench-lab/src/themes/pom-neutral.ts`
- Modify: `apps/workbench-lab/src/themes/pomos-fidelity.test.ts`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify focused shared recipe/compiler modules only if a proven missing generic capability requires it

1. Replace the hard-transition-count assertion with tests for a crisp, no-blur, curved luminous canvas composition.
2. Add target-data assertions for distinct grouped-control material hierarchy and continuous-rounded geometry.
3. Adjust only target-owned canvas, palette, material, border, shadow, typography, and shape values.
4. Refine shared semantic-part consumers for grouped Scene Effects, readable typography, continuous control geometry, and icon-action consistency.
5. Verify hidden range thumb opacity does not change native thumb dimensions and focus remains visible on the range control.

## Task 5: Add and audit the responsive visual evidence

**Files:**
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Update: `tests/browser/__screenshots__` and/or the repository's current Playwright snapshot directory

1. Add deterministic PomOS screenshots for 1280x720, 844x390, and 800x450 alongside existing 1440x900 and 390x844 evidence.
2. Disable animation and wait for fonts/theme state before capture.
3. Review each image against the defect ledger: no intersections, clipping, malformed buttons, weak hierarchy, inconsistent radii, illegible type, or harsh low-poly wallpaper.
4. Iterate until there are no substantive visual defects, then re-run without update mode.

## Task 6: Accessibility, regression, and delivery

**Files:**
- Add or modify only focused tests required by discovered regressions

1. Verify keyboard range operation, pointer operation, visible focus, reduced motion, reduced transparency, and 44px coarse-pointer targets.
2. Run focused unit, conformance, accessibility, and visual suites.
3. Run `npm.cmd run check` and confirm every sub-gate from fresh output.
4. Review the scoped diff for theme IDs, component forks, semantic part expansion, unrelated changes, and generated-artifact drift.
5. Commit in scoped conventional commits and report SHAs, exact commands/results, screenshot paths, framework capabilities, and integration notes to the source task before any merge.
