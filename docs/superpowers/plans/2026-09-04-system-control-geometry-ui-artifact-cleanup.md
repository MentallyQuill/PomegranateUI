# System Control Geometry and UI Artifact Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace cross-theme button, rail, text, underline, tile, and Characters-footer artifacts with shared semantic geometry and verified rendered behavior.

**Architecture:** Recipes declare joined segment positions and content-tile shape roles. The fixed `@pomegranate-ui/theme` stylesheet interprets those markers through existing theme-authored part variables, while Workbench CSS owns layout, legibility, and Deep’s intentional tab treatment. Browser tests verify geometry against the rendered owner rather than theme names or screenshot-only assumptions.

**Tech Stack:** TypeScript, Svelte 5, CSS custom properties, Vitest, Playwright, npm workspaces.

**Spec:** `docs/superpowers/specs/2026-09-04-system-control-geometry-ui-artifact-cleanup-design.md`

## Global Constraints

- Keep one mounted Workbench, Panel, sub-panel, and Widget tree during theme changes.
- Keep every maintained theme data-only; add no theme-ID selectors or component forks.
- Preserve 44px coarse-pointer targets separately from compact painted faces.
- Add tests before each production change and observe the intended failure.
- Keep Add sub-panel outside the ARIA tablist.
- Preserve Deep’s intentional one-pixel tab indicator, but remove non-tab and non-Deep underlines.
- Do not refresh an authority image until its diff is localized to an approved visual change.
- Do not publish npm packages.

---

### Task 1: Compile shared control-geometry semantics

**Files:**
- Modify: `packages/theme/src/compile.test.ts`
- Modify: `packages/theme/src/compile.ts`

**Interfaces:**
- Consumes: existing `--pom-part-button-surface-*` and `--pom-part-widget-surface-radius` bindings.
- Produces: fixed CSS behavior for `data-pom-control-segment="start|middle|end|only"` and `data-pom-control-shape="content-tile"`.

- [ ] **Step 1: Write the failing compiler test**

Add a test that calls `compileThemeStyleSheet(RESOLVED_THEME)` and requires literal output rules with these consumer effects:

```ts
it('compiles joined control topology and content-tile geometry without theme selectors', () => {
  const css = compileThemeStyleSheet(RESOLVED_THEME);

  expect(css).toContain('[data-pom-control-segment="middle"]');
  expect(css).toMatch(/data-pom-control-segment="start"[^}]*border-start-end-radius:\s*0/s);
  expect(css).toMatch(/data-pom-control-segment="end"[^}]*border-inline-start-width:\s*0/s);
  expect(css).toMatch(/data-pom-control-segment="middle"[^}]*border-radius:\s*0/s);
  expect(css).toMatch(/data-pom-control-shape="content-tile"[^}]*var\(--pom-part-widget-surface-radius\)/s);
  expect(css).not.toContain('[data-pom-theme="');
});
```

- [ ] **Step 2: Run the compiler test and verify RED**

Run: `npm.cmd run test:native -- packages/theme/src/compile.test.ts`

Expected: FAIL because the emitted stylesheet does not yet recognize either semantic marker.

- [ ] **Step 3: Append the minimal fixed semantic rules**

In `POM_SEMANTIC_PART_STYLE_SHEET`, after generated part rules and before slider rules, emit shared rules equivalent to:

```css
[data-pom-theme-root] [data-pom-control-segment] { position: relative; }
[data-pom-theme-root] [data-pom-control-segment]:focus-visible { z-index: 1; }
[data-pom-theme-root] [data-pom-control-segment="start"] {
  border-start-end-radius: 0;
  border-end-end-radius: 0;
}
[data-pom-theme-root] [data-pom-control-segment="middle"] {
  border-radius: 0;
  border-inline-start-width: 0;
}
[data-pom-theme-root] [data-pom-control-segment="end"] {
  border-start-start-radius: 0;
  border-end-start-radius: 0;
  border-inline-start-width: 0;
}
[data-pom-theme-root] [data-pom-control-shape="content-tile"] {
  border-radius: var(--pom-part-widget-surface-radius);
  clip-path: var(--pom-part-widget-surface-clip-path);
}
```

The `only` value deliberately keeps the complete theme-authored button radius and border.

- [ ] **Step 4: Run the compiler test and full native suite for GREEN**

Run: `npm.cmd run test:native -- packages/theme/src/compile.test.ts`

Expected: compiler test PASS.

Run: `npm.cmd run test:native`

Expected: 59 test files PASS with no failures.

- [ ] **Step 5: Commit the compiler contract**

```powershell
git add packages/theme/src/compile.ts packages/theme/src/compile.test.ts
git commit -m "feat(theme): compile joined controls"
```

### Task 2: Mark semantic groups in Lab and public recipes

**Files:**
- Modify: `apps/workbench-lab/src/recipes/PanelTabs.svelte`
- Modify: `registry/recipes/panel-tabs/PanelTabs.svelte`
- Modify: `apps/workbench-lab/src/recipes/SubPanelBar.svelte`
- Modify: `registry/recipes/sub-panel-navigation/SubPanelBar.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetGroup.svelte`
- Modify: `registry/recipes/workbench-surface/WidgetGroup.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetCatalog.svelte`
- Modify: `registry/recipes/widget-catalog/WidgetCatalog.svelte`
- Modify: `apps/workbench-lab/src/mockup/renderers/RecordingCharactersWidget.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetAnatomy.svelte`
- Modify: `registry/recipes/recipe-manifest.json`
- Test: `tests/browser/native-workbench.spec.ts`
- Test: `tests/browser/sub-panels.spec.ts`
- Test: `tests/browser/character-roster.spec.ts`
- Test: `tests/browser/theme-renderer-contracts.spec.ts`

**Interfaces:**
- Consumes: Task 1 segment and content-tile markers.
- Produces: ordered start/middle/end/only attributes on real rendered buttons; no change to ARIA roles.

- [ ] **Step 1: Write failing rendered-marker tests**

Add browser assertions that independently expect these literal ordered results:

```ts
expect(await page.getByRole('tablist', { name: 'Panels' }).getByRole('tab')
  .evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute('data-pom-control-segment'))))
  .toEqual(['start', 'middle', 'end']);

expect(await page.getByRole('tablist', { name: 'Settings sub-panels' }).getByRole('tab')
  .evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute('data-pom-control-segment'))))
  .toEqual(['start', 'middle', 'middle', 'middle', 'middle', 'middle']);
await expect(page.getByRole('button', { name: 'Add sub-panel' }))
  .toHaveAttribute('data-pom-control-segment', 'end');

expect(await page.getByRole('group', { name: 'Character portrait size' }).getByRole('button')
  .evaluateAll((buttons) => buttons.map((button) => button.getAttribute('data-pom-control-segment'))))
  .toEqual(['start', 'end']);
```

Also require each Theme Library preset button to have `data-pom-control-shape="content-tile"`, and require grouped Widget/Catalog selector buttons to expose correct ordered positions.

- [ ] **Step 2: Run focused browser tests and verify RED**

Run: `npx.cmd playwright test tests/browser/native-workbench.spec.ts tests/browser/sub-panels.spec.ts tests/browser/character-roster.spec.ts tests/browser/theme-renderer-contracts.spec.ts --grep "semantic control|content tile"`

Expected: FAIL because no recipe emits the markers.

- [ ] **Step 3: Add ordered markers without changing semantics**

For an ordered list with no trailing action, bind:

```svelte
data-pom-control-segment={tabs.length === 1 ? 'only' : index === 0 ? 'start' : index === tabs.length - 1 ? 'end' : 'middle'}
```

For sub-panel tabs followed by Add sub-panel, bind `start` on the first tab and `middle` on every subsequent tab; bind `end` on Add sub-panel. Bind `start` and `end` to the Characters decrement/increment buttons. Bind `content-tile` to every Theme Library preset button. Add `data-pom-control-group="joined"` to each semantic group owner for inspectability, but do not infer grouping from the marker in JavaScript.

- [ ] **Step 4: Update public recipe hashes**

Run: `node scripts/verify-recipes.mjs --write`

Expected: `registry/recipes/recipe-manifest.json` updates only hashes for changed public recipes.

- [ ] **Step 5: Verify GREEN and recipe integrity**

Run: `npm.cmd run build`

Run: the focused Playwright command from Step 2.

Run: `npm.cmd run check:recipes`

Expected: all commands PASS.

- [ ] **Step 6: Commit semantic consumers**

```powershell
git add apps/workbench-lab/src registry/recipes tests/browser
git commit -m "feat(recipes): mark joined control groups"
```

### Task 3: Fix layout, selection, legibility, and Characters separators

**Files:**
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/browser/sub-panels.spec.ts`
- Modify: `tests/browser/character-roster.spec.ts`
- Modify: `tests/browser/theme-renderer-contracts.spec.ts`

**Interfaces:**
- Consumes: Task 2 semantic markers and existing presentation attributes.
- Produces: content-sized sub-panel rail, transparent Story identity, owner-bound readable text, contained selection, nested rounded shelf controls, content tiles, and between-row-only separators.

- [ ] **Step 1: Write failing geometry and style tests**

Add real-browser assertions for these observable outcomes:

```ts
expect(Math.abs(addBox.x - (lastTabBox.x + lastTabBox.width))).toBeLessThanOrEqual(1);
expect(overflow.scrollWidth).toBeGreaterThan(overflow.clientWidth);
expect(Math.abs(addBox.x - railBox.right)).toBeLessThanOrEqual(1);

await expect(page.locator('.story-context-heading h1')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
await expect(page.locator('.story-context-heading p')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

const lastRow = page.getByRole('list', { name: 'Characters roster' }).getByRole('listitem').last();
expect(await lastRow.evaluate((node) => getComputedStyle(node).borderBottomWidth)).toBe('0px');
```

For PomOS and Bunny, measure shelf and visible rounded button rectangles and require at least 4px top/bottom clearance. For coarse pointer, separately require a 44px hit box. For selected controls, inspect `getComputedStyle(node, '::after').content` and `boxShadow`: non-Deep tabs and Theme Library tiles have no underline; Deep actual tabs retain a one-pixel contained indicator. For Theme Library cards, require radius below half the card height and require the icon/title/description rectangles to remain inside the button.

Update the existing Story contrast test to composite the transparent text over the first opaque ancestor/canvas rather than expecting an opaque background on the text itself. Add the Workbench Lab subtitle, Widget header metadata, and Theme Library descriptions to the same rendered contrast helper with threshold 4.5.

- [ ] **Step 2: Run focused browser tests and verify RED**

Run: `npx.cmd playwright test tests/browser/native-workbench-accessibility.spec.ts tests/browser/native-workbench.spec.ts tests/browser/sub-panels.spec.ts tests/browser/character-roster.spec.ts tests/browser/theme-renderer-contracts.spec.ts --grep "artifact|clearance|contrast|content tile|sub-panel Add"`

Expected failures: Add sub-panel is far from the final tab; Story text is opaque; final Characters row has a border; Bunny cards are pills; rounded shelf controls lack clearance; non-Deep selectors report lower-edge decoration; named faint labels miss the required contrast.

- [ ] **Step 3: Implement minimal shared CSS**

In `styles.css`:

- Change `.sub-panel-tab-rail-shell` from `flex: 1 1 auto` to `flex: 0 1 auto` and keep Add sub-panel `flex: 0 0 auto`.
- Remove Story `background-color` declarations; bind title/scene foregrounds to the Story surface and retain only non-rectangular text shadow where needed.
- Promote essential `.wordmark small`, `.widget-frame-meta`, and `.surface-themes small` text from `--faint` to the readable owner foreground/muted foreground.
- Disable the generic Panel/sub-panel `::after` indicator and enable it only inside `data-pom-shell-presentation="instrumented"`.
- Remove the Theme Library selected inset underline.
- Add non-instrumented shelf block padding/centering that leaves at least 4px around painted controls while maintaining interaction boxes; do not alter Deep’s instrumented cell rail.
- Change Deep roster borders to `.recording-characters li:not(:last-child)` and keep the last row borderless.
- Give the Characters stepper deliberate bottom/right clearance and no footer rule.

- [ ] **Step 4: Verify GREEN and regression coverage**

Run the focused Playwright command from Step 2.

Run: `npm.cmd run typecheck`

Expected: all focused tests and type-check PASS without warnings.

- [ ] **Step 5: Commit artifact fixes**

```powershell
git add apps/workbench-lab/src/styles.css tests/browser
git commit -m "fix(lab): remove cross-theme UI artifacts"
```

### Task 4: Render and review focused evidence

**Files:**
- Modify only if an approved intentional visual authority needs an exact update: `tests/reference/**`
- Create only if the existing Playwright output policy records reviewed evidence: `artifacts/**`

**Interfaces:**
- Consumes: completed implementation from Tasks 1-3.
- Produces: localized visual evidence for every user-provided problem surface.

- [ ] **Step 1: Confirm browser-port ownership**

Run a read-only listener check for ports 4173 and 4174.

Expected: `PORT_4173_FREE` and `PORT_4174_FREE`. If another task owns a listener, wait for its owner; do not terminate it.

- [ ] **Step 2: Build and run focused visual tests**

Run: `npm.cmd run build`

Run: `npx.cmd playwright test tests/browser/native-workbench-visual.spec.ts tests/browser/deep-atmospheric-exact.spec.ts`

Expected: either PASS or a localized diff confined to approved geometry. Do not lower tolerances.

- [ ] **Step 3: Inspect screenshots at original size**

Inspect PomOS wide shelf/Story/Characters, Bunny shelf, Bunny Theme Library, Deep Settings rail, and Deep Characters footer. Confirm:

- joined groups show only two rounded outer ends;
- sub-panel Add follows the tab run;
- Story identity is plain text;
- essential labels are readable;
- non-Deep controls have no escaped underline;
- rounded shelf faces have visible bar clearance;
- Theme Library cards are rounded rectangles with contained copy;
- Deep Characters has no orphan line.

- [ ] **Step 4: Handle visual authorities conservatively**

If an exact Deep authority fails solely because the approved Characters trailing separator disappeared, update only the corresponding committed authority after inspecting the localized pixel diff. Otherwise fix the implementation and keep the authority unchanged.

- [ ] **Step 5: Commit any reviewed authority delta**

```powershell
git add tests/reference
git commit -m "test(visual): accept artifact cleanup"
```

Skip this commit if no authority changed.

### Task 5: Full verification, review, integration, and push

**Files:**
- Review: every file changed since the design commit.

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified `main` and remote push.

- [ ] **Step 1: Run static hygiene checks**

Run: `git diff --check main...HEAD`

Run: `rg -n -F -e '[data-pom-theme="deep-current"]' -e '[data-pom-theme="pom-neutral"]' -e '[data-pom-theme="bunny"]' -e '[data-pom-theme="ash-amber"]' apps packages registry`

Expected: no whitespace errors and no new concrete-theme selectors.

- [ ] **Step 2: Confirm ports and run the authoritative gate**

Confirm ports 4173 and 4174 are free, then run: `npm.cmd run check`

Expected: unit, type-check, native, build, Lab artifact, recipe, packed-consumer, and all browser suites PASS.

- [ ] **Step 3: Review the complete diff**

Compare the implementation range from the design parent through `HEAD`. Check every design requirement, ARIA ownership, marker ordering, overflow geometry, responsive behavior, theme-data-only constraint, and screenshot localization. Fix Critical or Important findings with a failing regression test and rerun the relevant focused suite.

- [ ] **Step 4: Verify the branch tip again after review fixes**

Run: `npm.cmd run check`

Expected: complete PASS on the exact commit range to integrate.

- [ ] **Step 5: Integrate into the explicitly approved base**

From `F:\git\PomegranateUI`, verify the primary checkout has no tracked modifications, fast-forward `main` to `codex/ui-artifact-system-cleanup`, and retain unrelated untracked user files.

```powershell
git merge --ff-only codex/ui-artifact-system-cleanup
```

- [ ] **Step 6: Verify and push main**

Run the full gate on merged `main` after confirming browser ports are free. Then run:

```powershell
git push origin main
```

Verify the remote `main` SHA equals local `HEAD`. Do not force-push.
