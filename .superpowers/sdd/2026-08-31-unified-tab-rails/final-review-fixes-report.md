# Final review fixes report

## Outcome

Completed the bounded A-G final-review pass: shared pointer-scoped rail gesture suppression, Panel and sub-panel dialog focus loops, single-Escape reorder cancellation, rail-local copied-recipe reveal, exact packed renderer conformance, reciprocal copied sub-panel ownership, and public helper tolerance/padding parameters.

## RED evidence

- `TabRailController.test.ts`: four intentional failures demonstrated that seven-pixel touch movement was not suppressed, keyboard clicks were swallowed by global suppression, fresh pointer gestures did not clear stale suppression, and scroll did not cancel a pending hold.
- `tab-rail.test.ts`: two intentional failures demonstrated missing custom overflow tolerance and reveal padding.
- Focused Playwright regressions failed before implementation for Panel menu Shift+Tab wrapping, sub-panel menu Shift+Tab wrapping, and closing an active reorder dialog with one Escape.
- `recipes.test.mjs` and `packed-consumer.test.mjs` failed while copied recipes still used `scrollIntoView`, the packed fixture still installed its shim, and no local-rail/reciprocal-sub-panel proof existed.
- `renderer-conformance.test.ts`: five intentional negative cases were initially accepted: a `+2` revision jump, wrong callback Panel ID, wrong invoking tab ID, a blank order name, and a mismatched order name.
- The first packed end-to-end run exposed that activating the new fixture sub-panel hid the conformance widgets; retaining the real Overview activation restored the renderer surface while keeping the reciprocal activation proof.

## GREEN evidence

- `npm.cmd exec -- vitest run apps/workbench-lab/src/recipes/tab-rail.test.ts apps/workbench-lab/src/recipes/TabRailController.test.ts` — 2 files, 19 tests passed.
- `npm.cmd exec -- vitest run packages/testkit/src/renderer-conformance.test.ts` — 35 tests passed, including all new negative cases.
- Focused Playwright runs for Panel/sub-panel focus loops, reorder Escape, Panel jitter, and sub-panel jitter/cancel/blur/swipe regressions all passed.
- `npm.cmd run test:unit` — 46 tests passed.
- `npm.cmd run typecheck` — zero errors and zero warnings.
- `npm.cmd run build` — production build completed (333 modules transformed).
- `npm.cmd run check:recipes` — 8 recipes and 20 files verified with deterministic manifest hashes.
- `npm.cmd run test:pack` — 6 packages and 2 clean consumers passed. The initial sandboxed attempt hit an npm-cache `EPERM`; the required escalated rerun completed successfully.
- `npm.cmd exec -- playwright test tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts tests/browser/sub-panels.spec.ts` — 104 tests passed.
- `git diff --check` and each staged diff check passed.

## Commits

- `4070632` — `fix(workbench): harden tab rail interactions`
- `fe6dc30` — `fix(recipes): keep tab reveal rail-local`
- `665b062` — `test(testkit): strengthen packed conformance`

## Files

- Workbench behavior and focused unit coverage: `apps/workbench-lab/src/recipes/{PanelMenu,PanelTabs,SubPanelBar,SubPanelMenu,TabRailController,TabReorderController,tab-rail}*`
- Browser regressions: `tests/browser/{native-workbench-accessibility,native-workbench,sub-panels}.spec.ts`
- Copied recipes and deterministic registry: `registry/recipes/panel-tabs/PanelTabs.svelte`, `registry/recipes/sub-panel-navigation/SubPanelBar.svelte`, `registry/recipes/recipe-manifest.json`, `tests/unit/recipes.test.mjs`
- Packed/testkit conformance: `packages/testkit/src/renderer-conformance*`, `scripts/verify-packed-consumers.mjs`, `tests/fixtures/renderer-dom-harness.mjs`, `tests/unit/packed-consumer.test.mjs`

## Residual risks

- Hardware-specific pointer synthesis remains covered through controller unit tests plus Playwright pointer events rather than a physical touch device.
- No visual browser suite was run because this pass changed behavior and fixture logic, not product markup, styles, screenshots, masks, or pixel tolerances.
- The full root `npm.cmd run check` was intentionally not run per the bounded task instructions; all requested focused gates passed.
