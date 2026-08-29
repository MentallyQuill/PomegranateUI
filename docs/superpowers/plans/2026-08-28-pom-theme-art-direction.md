# Pom Theme Art Direction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-art-direct Deep Current, Pom Neutral, and Bunny into three cohesive professional visual systems, prove meaningful glass and preserved behavior with Playwright, and close an adversarial screenshot-critic loop.

**Architecture:** Keep the existing Svelte markup and framework-neutral theme contracts unchanged. Strengthen semantic preset values and a source-owned CSS presentation layer, then use real-browser computed-style contracts plus reviewed wide/compact screenshots as evidence. The critic ledger is the finite work queue: every blocking or substantive finding is fixed before the next full render set.

**Tech Stack:** Svelte 5, TypeScript, semantic Pom theme contracts, CSS custom properties/gradients/backdrop filters, Vitest, Playwright, Vite static build.

**Spec:** `docs/superpowers/specs/2026-08-28-pom-theme-art-direction-design.md`

## Global Constraints

- All three themes render the same Svelte component, Panel, Widget, Catalog, command, state, and accessibility tree.
- Theme switching is atomic and immediate; do not add cross-theme animation or an ambient engine.
- Atmospheric Workbench remains Deep Current's glass, lighting, composition, typography, spacing, and restraint authority; Widget Overhaul remains the Widget inventory/state authority.
- Do not modify preserved mockup bytes, import Sonder server code, copy Apple assets/trade dress, add remote assets, or add a runtime dependency.
- Keep `contracts -> layout -> core -> svelte`, `contracts -> theme`, package/publication, and adopter-ownership boundaries intact.
- Use `npm.cmd` on Windows and keep `apps/workbench-lab/dist` as the static relative-base artifact.
- New automated behavior follows a witnessed red-green cycle.
- Final acceptance requires six reviewed theme images, zero blocking or substantive critic findings, full `npm.cmd run check`, green CI, and merge to `main`.

---

### Task 1: Browser material and hierarchy contract

**Files:**
- Create: `tests/browser/theme-art-direction.spec.ts`

**Interfaces:**
- Consumes: built Workbench Lab at `http://127.0.0.1:4174`, root `data-pom-theme`, stable `.top-shelf`, `.context-rail`, `.workbench-shell`, dock, transcript, and composer selectors.
- Produces: a real-browser regression contract for visible frost, target identity, shared-tree preservation, and compact overflow.

- [ ] **Step 1: Write a failing glass-material test**

Create a Playwright helper that reads real computed styles:

```ts
type MaterialSample = {
  backdropFilter: string;
  backgroundColor: string;
  backgroundImage: string;
  borderRadius: string;
  boxShadow: string;
};

async function material(page: Page, selector: string): Promise<MaterialSample> {
  return page.locator(selector).evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backdropFilter: style.backdropFilter,
      backgroundColor: style.backgroundColor,
      backgroundImage: style.backgroundImage,
      borderRadius: style.borderRadius,
      boxShadow: style.boxShadow
    };
  });
}

function blurPx(filter: string): number {
  return Number(filter.match(/blur\((\d+(?:\.\d+)?)px\)/)?.[1] ?? 0);
}
```

For each `Deep Current`, `Pom Neutral`, and `Bunny`, load a fresh scene and assert shelf and utility-bar blur are at least 16 pixels, a Workbench layer blur is at least 12 pixels, shadows and backgrounds are non-empty, and root canvas imagery is not `none`. This catches the current weak or absent frost, not a token constant.

- [ ] **Step 2: Run the focused test and witness RED**

Run:

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/theme-art-direction.spec.ts --project=chromium
```

Expected: FAIL because current Deep Current shelf/utility blur is 12 pixels and several Workbench layers do not meet the visible material contract.

- [ ] **Step 3: Add shared-tree and compact checks to the same browser contract**

Capture `data-active-panel`, `data-workbench-revision`, all
`[data-widget-type][data-pomegranate-placement]` identity tuples, and focused
theme-button behavior before and after switching. Assert exact equality where
state must persist. At `390x844`, assert `scrollWidth <= clientWidth` for root
and document after each target activation.

- [ ] **Step 4: Keep the test red for the intended production defect**

Run the focused spec again. Confirm failures name insufficient computed blur or
material depth, not selector, server, font, or TypeScript errors.

- [ ] **Step 5: Commit the red contract**

```powershell
git add tests/browser/theme-art-direction.spec.ts tests/browser/native-workbench-accessibility.spec.ts
git commit -m "test: define theme art direction contract"
```

### Task 2: Shared material composition and preset values

**Files:**
- Modify: `apps/workbench-lab/src/themes/deep-current.ts`
- Modify: `apps/workbench-lab/src/themes/pom-neutral.ts`
- Modify: `apps/workbench-lab/src/themes/bunny.ts`
- Modify: `apps/workbench-lab/src/styles.css`
- Create: `apps/workbench-lab/src/themes/art-direction.css`
- Modify: `apps/workbench-lab/src/main.ts`
- Modify: `apps/workbench-lab/src/themes/themes.test.ts`

**Interfaces:**
- Consumes: existing `ThemeDefinition` roles and `compileThemeBindings()` CSS variables.
- Produces: three complete semantic presets and one source-owned, theme-scoped presentation layer imported after the structural stylesheet.

- [ ] **Step 1: Write failing preset-resolution assertions**

Add table-driven theme tests that resolve each real preset and verify its shelf,
panel, and Widget materials retain translucency (`opacity < 0.9` where frost is
required), minimum blur intent (`shelf >= 16`, `panel >= 12`), complete canvas
layers, and target-appropriate density/geometry families. Derive expectations
from the design spec as literal values rather than from compiler output.

- [ ] **Step 2: Run the focused unit test and witness RED**

Run:

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts
```

Expected: FAIL on Deep Current shelf/panel blur and any opacity or geometry value
that does not meet the new contract.

- [ ] **Step 3: Strengthen semantic presets minimally**

Adjust only the three Lab preset files. Preserve schema and asset references.
Use darker translucent cyan-black roles for Deep Current, neutral cool glass over
a dimensional gradient wallpaper for Pom Neutral, and warm milk/mint/lilac/blush
roles for Bunny. Keep required material blur, readable fallbacks, and local-only
canvas layers.

- [ ] **Step 4: Extract target presentation recipes**

Move the target-specific section currently beginning at the `pom-neutral`
comment out of `styles.css` into `themes/art-direction.css`, add Deep Current to
the same layer, and import it after `styles.css` from `main.ts`:

```ts
import './styles.css';
import './themes/art-direction.css';
```

Keep structural/responsive rules shared. The new stylesheet may select only the
root theme attribute plus existing semantic classes/attributes; it must not
change the DOM or Widget inventory.

- [ ] **Step 5: Implement the shared glass hierarchy**

Give shelf, utility bar, Workbench shell/docks, transcript, composer, Catalog,
dialog, and floating Widgets explicit translucent fills, highlight edges,
shadows, and backdrop filters. Ensure non-uniform canvas gradients remain visible
behind translucent layers. Reduce the utility bar's visual dominance while
keeping every control readable and keyboard accessible.

- [ ] **Step 6: Run GREEN checks**

Run:

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/theme-art-direction.spec.ts --project=chromium
```

Expected: all focused tests pass with no warnings or horizontal overflow.

- [ ] **Step 7: Commit the shared material foundation**

```powershell
git add apps/workbench-lab/src/main.ts apps/workbench-lab/src/styles.css apps/workbench-lab/src/themes apps/workbench-lab/src/themes/themes.test.ts tests/browser/theme-art-direction.spec.ts
git commit -m "feat: establish professional theme materials"
```

### Task 3: Complete the three target identities

**Files:**
- Modify: `apps/workbench-lab/src/themes/art-direction.css`
- Modify: `apps/workbench-lab/src/themes/deep-current.ts`
- Modify: `apps/workbench-lab/src/themes/pom-neutral.ts`
- Modify: `apps/workbench-lab/src/themes/bunny.ts`
- Modify: `tests/browser/theme-art-direction.spec.ts`

**Interfaces:**
- Consumes: Task 2's shared material hierarchy and semantic bindings.
- Produces: distinct Deep Current, desktop-neutral, and premium-kawaii art direction at wide and compact viewports.

- [ ] **Step 1: Finish Deep Current**

Theme every developer control dark; unify the shelf, utility bar, side
instruments, story glass, composer, selection, focus, and status language. Keep
the approved stage image focal point, compact industrial geometry, cyan signal
accent, restrained glow, and literary transcript.

- [ ] **Step 2: Finish Pom Neutral**

Compose an original dimensional cool wallpaper from CSS gradients. Present one
coherent desktop-window frame with layered sidebar, toolbar, stage, transcript,
and composer glass; use soft separators, 12–18 pixel radii, restrained blue
selection, and confident system-like sans typography without literal Apple
controls or assets.

- [ ] **Step 3: Finish Bunny**

Use warm milk as the base with separate sakura, lavender, mint, and apricot
roles. Add sparse CSS paper-grid/petal/sparkle motifs behind the glass, keep bunny
ears limited to the wordmark, replace universal pills with rounded cards, and
retain obvious text/focus hierarchy.

- [ ] **Step 4: Verify distinct real behavior**

Strengthen the Playwright contract only where a concrete implementation mistake
needs protection: light surface leakage in Deep Current, loss of dimensional
canvas imagery in Neutral, monochrome/pill-everything regression in Bunny, or
compact overflow. Do not assert exact screenshots or private CSS source text in
this functional spec.

- [ ] **Step 5: Run focused gates and commit**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts apps/workbench-lab/src/App.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/theme-art-direction.spec.ts tests/browser/native-workbench-accessibility.spec.ts --project=chromium
git add apps/workbench-lab/src/themes tests/browser/theme-art-direction.spec.ts
git commit -m "feat: complete three Pom visual identities"
```

### Task 4: Adversarial visual critic loop

**Files:**
- Create: `docs/conformance/theme-art-direction-critic-ledger.md`
- Modify: `apps/workbench-lab/src/themes/art-direction.css`
- Modify: the three preset files only when a critic finding belongs to semantic data
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Refresh: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/*.png`

**Interfaces:**
- Consumes: complete built Lab, six wide/compact theme renders, and the substantive-finding definition from the design spec.
- Produces: a round-by-round evidence ledger ending with zero blocking or substantive findings and reviewed visual baselines.

- [ ] **Step 1: Capture critic round 1**

Build and run a temporary Playwright update of the six theme screenshots. Copy
round evidence under Playwright's ignored `test-results/theme-art-direction/`
with deterministic names `round-1-<theme>-<viewport>.png`. Do not promote the
snapshots yet.

- [ ] **Step 2: Critique without implementation intent**

Inspect each image at original resolution. Record composition, identity,
cross-theme leakage, material depth, typography, spacing, legibility,
responsive, and functional findings in the ledger with severity and exact image.
The critic reads screenshots first and source only after findings are recorded.

- [ ] **Step 3: Turn measurable findings red**

For each measurable blocking or substantive finding, add a focused assertion to
the real-browser contract and run it to witness the intended failure. Purely
visual findings remain screenshot/ledger evidence rather than source-text tests.

- [ ] **Step 4: Correct every substantive finding**

Make the smallest source-owned CSS or semantic-preset change that resolves the
finding without introducing theme-specific Svelte markup. Re-run focused unit,
browser, overflow, and accessibility tests.

- [ ] **Step 5: Repeat complete rounds**

Capture `round-2`, critique all six images anew, and continue numbered rounds
until one complete round has zero blocking or substantive findings. Record
preference-only notes separately; they do not authorize scope expansion.

- [ ] **Step 6: Promote final reviewed baselines**

Run:

```powershell
npm.cmd exec playwright test tests/browser/native-workbench-visual.spec.ts --project=chromium --update-snapshots
npm.cmd exec playwright test tests/browser/native-workbench-visual.spec.ts --project=chromium
```

Expected: the refreshed final baselines pass immediately on the unchanged tree.

- [ ] **Step 7: Commit the closed critic loop**

```powershell
git add docs/conformance/theme-art-direction-critic-ledger.md apps/workbench-lab/src/themes tests/browser
git commit -m "test: close theme visual critic loop"
```

### Task 5: Final review, verification, and delivery

**Files:**
- Review: every file changed from `main...HEAD`
- Modify: only files required to resolve review findings

**Interfaces:**
- Consumes: closed critic ledger and final implementation branch.
- Produces: verified, reviewed, merged `main` and a synchronized primary checkout.

- [ ] **Step 1: Run requirements and code review**

Compare the diff to every design-spec acceptance requirement. Inspect for target
ID branches in Svelte/recipe source, unreadable contrast, unnecessary assets or
dependencies, duplicated CSS, responsive regressions, and stale snapshot/ledger
evidence. Fix critical and important findings and rerun affected focused tests.

- [ ] **Step 2: Run the complete fresh gate**

```powershell
npm.cmd run check
```

Expected: exit 0; unit, type, native, build, extraction, recipes, report, pack,
browser, conformance, and preserved harness lanes all pass.

- [ ] **Step 3: Verify repository and artifact state**

Run `git diff --check`, `git status --short`, inspect `git diff main...HEAD`, and
confirm no preserved artifact, generated dependency directory, secret, remote
asset, or unrelated file is changed.

- [ ] **Step 4: Commit review fixes if needed**

```powershell
git add apps/workbench-lab/src/main.ts apps/workbench-lab/src/styles.css apps/workbench-lab/src/themes tests/browser docs/conformance/theme-art-direction-critic-ledger.md
git commit -m "fix: resolve theme art direction review"
```

Skip this commit only when review produced no file changes.

- [ ] **Step 5: Push, open PR, monitor CI, and merge**

Push `codex/theme-art-direction`, create a pull request against `main` using the
repository's template, monitor all checks to a terminal green state, merge the
pull request, and verify the remote `main` SHA equals the merge result.

- [ ] **Step 6: Synchronize primary checkout**

Fast-forward `F:\git\PomegranateUI` to `origin/main`, preserving unrelated
worktrees and dirty files, then verify `git status -sb` and the merged commit.
