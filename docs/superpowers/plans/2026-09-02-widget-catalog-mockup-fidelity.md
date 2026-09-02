# Widget Catalog Mockup Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Workbench Lab marketplace-style Widget Catalog with the exact Sonder Widget Overhaul expanded catalog composition, 94 shared-renderer miniatures, variable masonry geometry, and whole-result placement behavior.

**Architecture:** Extend the framework-neutral catalog controller only for reusable display/filter/suspension state. Keep the 94 roleplay fixtures and renderer registrations in the Lab, render preview instances through the existing renderer registry, and isolate DOM geometry/placement mechanics in focused recipe controllers. One Svelte catalog tree serves expanded, drawer, compact, and all themes.

**Tech Stack:** TypeScript, Svelte 5, Vitest, Testing Library, Playwright, CSS Grid, PomegranateUI contracts/core/Svelte/theme packages.

**Spec:** `docs/superpowers/specs/2026-09-02-widget-catalog-mockup-fidelity-design.md`

## Global Constraints

- Preserve runtime dependency direction `contracts -> layout -> core -> svelte`; framework-neutral packages cannot import Svelte or DOM globals.
- Workbench Lab owns roleplay identities, neutral fixtures, host context, and renderer registrations.
- Keep one mounted Catalog/Widget tree; no theme-ID selectors, component forks, or theme-specific catalog markup.
- Expanded Deep Current is the exact source-mockup target; drawer and narrow modes reflow the same tree.
- All 94 identities must have shared placed/preview renderers; no `Renderer unavailable` output remains.
- Previews are inert, side-effect free, secret-free, ID-safe, and based on neutral fixture data.
- Use `npm.cmd` on Windows and do not start browser gates without a fresh `PORTS_4173_4174_FREE` receipt.
- Preserve unrelated dirty files in the primary checkout.

---

### Task 1: Reusable Catalog preferences, utilities, and suspension

**Files:**
- Modify: `packages/core/src/catalog.ts`
- Modify: `packages/core/src/catalog.test.ts`

**Interfaces:**
- Produces: `CatalogUtility = 'favorites' | 'recent' | 'on-panel' | 'fits-layout'`
- Produces: `CatalogHostAdapter.matchesUtility(manifest, utility): boolean`
- Produces: `CatalogState.previewWidth`, `CatalogState.utility`, `CatalogState.suspended`
- Produces: `setPreviewWidth`, `setUtility`, `suspend`, and `resume` controller methods

- [ ] **Step 1: Add failing controller tests**

  Add literal expectations proving width clamps to 200 and 420, defaults to 286,
  utility filtering composes with query/category filtering, a thrown adapter does
  not block other results, close retains view/width/category preferences while
  clearing query, and suspend/resume preserves the exact immutable snapshot.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm.cmd exec vitest run packages/core/src/catalog.test.ts`

  Expected: compile/assertion failures because the new state and methods do not exist.

- [ ] **Step 3: Implement the minimal framework-neutral state**

  Add the union, adapter option, normalized width helper, new state fields, and
  methods. Keep `snapshot` frozen and filter adapter failures locally.

- [ ] **Step 4: Run the focused test and verify GREEN**

  Run: `npm.cmd exec vitest run packages/core/src/catalog.test.ts`

- [ ] **Step 5: Commit the controller slice**

  ```powershell
  git add packages/core/src/catalog.ts packages/core/src/catalog.test.ts
  git commit -m "feat: extend catalog display state"
  ```

### Task 2: Complete the 94 shared Lab renderers

**Files:**
- Modify: `apps/workbench-lab/src/mockup/implemented-surfaces.ts`
- Modify: `apps/workbench-lab/src/mockup/surface-fixtures.ts`
- Modify: `apps/workbench-lab/src/mockup/implemented-surfaces.test.ts`
- Create: `apps/workbench-lab/src/mockup/surface-fixtures.test.ts`
- Modify: `apps/workbench-lab/src/mockup/renderers/ImplementedWidget.svelte`
- Modify: `apps/workbench-lab/src/mockup/widgets.ts`

**Interfaces:**
- Produces: one `SurfaceFixture` and renderer registration for every manifest
- Consumes: `createCatalogManifests()` as the identity/title/category authority

- [ ] **Step 1: Change renderer-completeness tests to the required boundary**

  Expect 94 unique implemented surfaces, totals `{ story: 12, library: 19,
  systems: 21, settings: 39, extensions: 3 }`, 94 fixtures, 94 registered
  renderers, exact manifest-title parity, ready/failure states for every fixture,
  and no undefined renderer for `systems.temporal-ledger`.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm.cmd exec vitest run apps/workbench-lab/src/mockup/implemented-surfaces.test.ts`

  Expected: 52 instead of 94 plus the existing undefined temporal-ledger renderer.

- [ ] **Step 3: Add the missing reviewed fixture definitions**

  Add explicit neutral scope, meaningful presentation, task facts, boundary copy,
  actions, and state set for each missing manifest. Extensions use the same
  anatomy boundary but remain adopter-owned neutral examples. Do not synthesize
  fixtures from geometry or show registry/debug prose to users.

- [ ] **Step 4: Register the complete manifest inventory**

  Derive `IMPLEMENTED_SURFACES` from `createCatalogManifests()` after verifying
  that every type has an explicit fixture. Register `ImplementedWidget` for all
  94 types. Keep specialized renderers selected inside `ImplementedWidget`.

- [ ] **Step 5: Run renderer and native suites and verify GREEN**

  Run: `npm.cmd exec vitest run apps/workbench-lab/src/mockup/implemented-surfaces.test.ts apps/workbench-lab/src/mockup/surface-fixtures.test.ts`

- [ ] **Step 6: Commit the renderer slice**

  ```powershell
  git add apps/workbench-lab/src/mockup/implemented-surfaces.ts apps/workbench-lab/src/mockup/surface-fixtures.ts apps/workbench-lab/src/mockup/implemented-surfaces.test.ts apps/workbench-lab/src/mockup/renderers/ImplementedWidget.svelte apps/workbench-lab/src/mockup/widgets.ts
  git commit -m "feat: render all catalog widgets"
  ```

### Task 3: Preview geometry and scroll-anchor controller

**Files:**
- Create: `apps/workbench-lab/src/recipes/CatalogGridController.ts`
- Create: `apps/workbench-lab/src/recipes/CatalogGridController.test.ts`

**Interfaces:**
- Produces: `normalizeCatalogPreviewWidth(value): number`
- Produces: `catalogPreviewLabel(width): 'Small' | 'Medium' | 'Large' | 'Custom'`
- Produces: `catalogTrackCount(availableWidth, requestedWidth, gap): number`
- Produces: `catalogShapeSpan(shape, columns): 1 | 2`
- Produces: `catalogRowSpan(height, rowHeight, rowGap): number`
- Produces: `createCatalogGridController(options)` with `sync`, `captureAnchor`, `restoreAnchor`, and `destroy`

- [ ] **Step 1: Write failing pure geometry and DOM-anchor tests**

  Use literal cases for 199->200, 286->286, 421->420; named detents; 2172px
  results width producing seven 286px tracks with 8px gaps; Large producing five
  420px tracks at the source wide measurement; two-track shape spans collapsing
  to one; and restoration of a first-visible item to its previous top offset.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm.cmd exec vitest run apps/workbench-lab/src/recipes/CatalogGridController.test.ts`

  Expected: module-not-found failure.

- [ ] **Step 3: Implement the pure helpers and measured controller**

  Use an 8px auto row/gap, measured `getBoundingClientRect()` heights, a
  `ResizeObserver`, and caller-supplied result/scroll accessors. No product data
  or Svelte imports enter this file.

- [ ] **Step 4: Run the focused test and verify GREEN**

  Run: `npm.cmd exec vitest run apps/workbench-lab/src/recipes/CatalogGridController.test.ts`

- [ ] **Step 5: Commit the geometry slice**

  ```powershell
  git add apps/workbench-lab/src/recipes/CatalogGridController.ts apps/workbench-lab/src/recipes/CatalogGridController.test.ts
  git commit -m "feat: add catalog masonry geometry"
  ```

### Task 4: Shared inert preview host and exact catalog shell

**Files:**
- Create: `apps/workbench-lab/src/recipes/CatalogWidgetPreview.svelte`
- Create: `apps/workbench-lab/src/recipes/WidgetCatalog.test.ts`
- Modify: `apps/workbench-lab/src/recipes/WidgetCatalog.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/src/App.svelte`

**Interfaces:**
- `CatalogWidgetPreview` consumes manifest, renderer registry, host context, and neutral preview configuration
- `WidgetCatalog` consumes catalog, renderer registry, host context, instance counts, automatic-placement callback, and placement callback

- [ ] **Step 1: Write failing Svelte behavior tests**

  Render a real catalog controller/runtime and assert the fixed source header,
  preview slider/detents, primary and secondary filters, result footer, 94
  focusable results, 94 inert shared previews, zero unavailable messages, zero
  per-result Add buttons, and Compact mode hiding preview hosts/slider.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm.cmd exec vitest run apps/workbench-lab/src/recipes/WidgetCatalog.test.ts`

- [ ] **Step 3: Implement the inert shared preview host**

  Create a preview-only instance with `surfacePreview: true`, render the registry
  component inside an inert/aria-hidden container, suppress placed frame chrome,
  and ensure generated preview content has no duplicate IDs.

- [ ] **Step 4: Rewrite the catalog markup as one responsive tree**

  Match source row order/copy, bind the new controller state, attach the grid
  controller, keep the results list as the only scroll owner, and preserve
  modal focus/Escape behavior. Drawer uses the same markup with a presentation
  attribute.

- [ ] **Step 5: Replace marketplace CSS with source-faithful geometry**

  Port semantic measurements/materials from the source through existing theme
  tokens: 80% centered expanded surface, 42px header, compact rows, 286px tracks,
  shape spans/aspect ratios, masonry auto rows, hover/focus/on-panel states,
  compact full-width rows, reduced-transparency and reduced-motion branches.

- [ ] **Step 6: Run focused tests, typecheck, and build**

  Run: `npm.cmd exec vitest run apps/workbench-lab/src/recipes/WidgetCatalog.test.ts apps/workbench-lab/src/recipes/CatalogGridController.test.ts`

  Run: `npm.cmd run typecheck`

  Run: `npm.cmd run build`

- [ ] **Step 7: Commit the visual shell slice**

  ```powershell
  git add apps/workbench-lab/src/recipes/CatalogWidgetPreview.svelte apps/workbench-lab/src/recipes/WidgetCatalog.svelte apps/workbench-lab/src/recipes/WidgetCatalog.test.ts apps/workbench-lab/src/styles.css apps/workbench-lab/src/App.svelte
  git commit -m "feat: recreate visual widget catalog"
  ```

### Task 5: Whole-result placement controller

**Files:**
- Create: `apps/workbench-lab/src/recipes/CatalogPlacementController.ts`
- Create: `apps/workbench-lab/src/recipes/CatalogPlacementController.test.ts`
- Modify: `apps/workbench-lab/src/recipes/WidgetCatalog.svelte`
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/styles.css`

**Interfaces:**
- Produces: pointer/keyboard placement controller with `pointerDown`, `keyDown`, `cancel`, `destroy`
- Consumes: manifest, compatible target rectangles, catalog suspend/resume, and App placement callbacks

- [ ] **Step 1: Write failing controller tests**

  Prove mouse threshold before lift, touch long-press, Space lift, arrow target
  cycling, Enter commit, Escape cancellation, singleton refusal, proxy state,
  target highlighting, and exact controller/scroll restoration after cancel.

- [ ] **Step 2: Run the focused test and verify RED**

  Run: `npm.cmd exec vitest run apps/workbench-lab/src/recipes/CatalogPlacementController.test.ts`

- [ ] **Step 3: Implement placement without duplicating store authority**

  The controller discovers only semantic target elements/rectangles and reports
  the chosen target. `App.svelte` creates the instance and dispatches the
  existing `widget.create` command. Automatic placement calls the same App
  function. Do not fork layout or persistence logic.

- [ ] **Step 4: Run controller tests and verify GREEN**

  Run: `npm.cmd exec vitest run apps/workbench-lab/src/recipes/CatalogPlacementController.test.ts`

- [ ] **Step 5: Commit the placement slice**

  ```powershell
  git add apps/workbench-lab/src/recipes/CatalogPlacementController.ts apps/workbench-lab/src/recipes/CatalogPlacementController.test.ts apps/workbench-lab/src/recipes/WidgetCatalog.svelte apps/workbench-lab/src/App.svelte apps/workbench-lab/src/styles.css
  git commit -m "feat: place widgets from catalog results"
  ```

### Task 6: Browser contracts and exact visual evidence

**Files:**
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Modify: `tests/browser/theme-renderer-contracts.spec.ts`
- Modify: `tests/reference/atmospheric-exact/contract.json` only if a newly approved mask/target entry is required
- Modify: recipe ledger/hash files through the repository verifier's supported update path

**Interfaces:**
- Consumes all earlier behavior
- Produces committed browser and screenshot invariants

- [ ] **Step 1: Replace obsolete marketplace assertions with failing fidelity assertions**

  Assert 94 real previews, no unavailable/add controls, source header/filter/footer
  composition, exact 80% modal geometry, 286px default tracks, source shape spans,
  variable natural heights, one scroll owner, and scroll-anchor preservation.

- [ ] **Step 2: Add failing placement/accessibility cases**

  Cover automatic, pointer, keyboard, touch, cancellation restoration,
  multiplicity state, focus containment/restoration, Escape, reduced transparency,
  coarse pointer, short landscape, and 200%-zoom descendant containment.

- [ ] **Step 3: Run focused browser tests after a free-port receipt**

  Run the port ownership command, then:

  `npm.cmd exec playwright test tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts tests/browser/theme-renderer-contracts.spec.ts`

  Expected before final fixes: fidelity/placement assertions fail for any missing behavior.

- [ ] **Step 4: Fix only behavior exposed by the failing cases**

  Keep changes in the catalog/preview/placement units; do not refresh screenshots
  to hide unexplained pixel differences.

- [ ] **Step 5: Capture and inspect exact evidence**

  Capture Deep Current expanded at 1920x1080 and the authority matrix, compare to
  the source render, localize every difference, and verify all four themes use
  identical catalog/result DOM with token-only computed-style changes.

- [ ] **Step 6: Update deterministic recipe hashes and run focused GREEN**

  Use the repository recipe update command documented by `scripts/verify-recipes.mjs`,
  then rerun focused unit/browser/visual tests.

- [ ] **Step 7: Commit the verification slice**

  ```powershell
  git add tests apps/workbench-lab registry
  git commit -m "test: freeze catalog fidelity contracts"
  ```

### Task 7: Final completion audit

**Files:**
- Review all changed files and committed artifacts

**Interfaces:**
- Produces the evidence required to mark the active goal complete

- [ ] **Step 1: Run repository cleanliness and theme-boundary audits**

  Run: `git status --short`

  Run: `rg -n "data-pom-theme-id|Renderer unavailable|Add .*Catalog" apps packages registry tests`

- [ ] **Step 2: Obtain a fresh browser-port receipt**

  Require literal output `PORTS_4173_4174_FREE`; never terminate another task's listener.

- [ ] **Step 3: Run the full Windows gate**

  Run: `npm.cmd run check`

  Expected: exit 0, 0 failed tests, 0 Svelte warnings, all browser projects green.

- [ ] **Step 4: Audit every goal requirement against current evidence**

  Confirm 94 identities/renderers/previews, exact shell, slider/detents, filters,
  masonry geometry, shared tree/all themes, pointer/keyboard/touch/automatic
  placement, cancellation restoration, modal accessibility, responsive matrices,
  Deep Current screenshot fidelity, and unchanged unrelated primary-checkout state.

- [ ] **Step 5: Review branch diff and commit any verification-only updates**

  Run: `git diff main...HEAD --check`

  Run: `git status --short`
