# Pom Theme Recipes and PomOS Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Lab-specific theme skins with a versioned semantic-part recipe system, migrate all targets without component forks, and deliver a Tahoe-informed original PomOS that passes functional, accessibility, and adversarial visual review.

**Architecture:** `@pomegranate-ui/contracts` validates versioned v1/v2 theme data; `@pomegranate-ui/theme` migrates v1, resolves immutable v2 materials/shapes/parts/canvas/assets/policy, and compiles a deterministic fixed-selector stylesheet. Pom-owned Svelte recipes expose stable `data-pom-part` anatomy, while the Workbench Lab supplies four data-only conformance themes and visual evidence without inspecting theme IDs.

**Tech Stack:** TypeScript 7 native preview, Zod, Svelte 5, CSS custom properties/backdrop filters, Vitest, Playwright, Vite static output, Node 24, npm workspaces.

**Spec:** `docs/superpowers/specs/2026-08-29-pom-theme-recipes-pomos-overhaul-design.md`

## Global Constraints

- Preserve `contracts -> layout -> core -> svelte` and `contracts -> theme`; framework-neutral packages import no DOM or view framework.
- Theme input contains no raw CSS, selectors, JavaScript, HTML, executable expression, filesystem path, or automatically fetched remote URL.
- PomOS, Deep Current, and Bunny do not extend one another; all target presentation flows through public v2 data and stable parts.
- Theme switching remains immediate and preserves the live Panel/Widget/component/state tree.
- The root canvas is the only wallpaper owner; stage and docks cannot paint target-specific wallpaper.
- Atmospheric Workbench remains Deep Current visual authority; Widget Overhaul remains Widget inventory/state authority; supplied Tahoe images govern the PomOS rubric.
- Do not modify preserved prototype bytes, add SvelteKit, publish packages, change Sonder, or add an ambient animation engine.
- Use `npm.cmd` on Windows; retain `apps/workbench-lab/dist` as the relative-base static artifact.
- Every behavior change follows a witnessed red-green cycle. Each task ends with a reviewable commit.

---

### Task 1: Versioned v2 theme contracts and v1 migration

**Files:**
- Create: `packages/contracts/src/theme-shared.ts`
- Create: `packages/contracts/src/theme-v1.ts`
- Create: `packages/contracts/src/theme-v2.ts`
- Modify: `packages/contracts/src/theme.ts`
- Modify: `packages/contracts/src/theme.test.ts`
- Create: `packages/theme/src/migrate.ts`
- Create: `packages/theme/src/migrate.test.ts`
- Modify: `packages/theme/src/index.ts`

**Interfaces:**
- Consumes: current `ThemeDefinitionSchema`, `ThemePatchSchema`, and all v1 public types.
- Produces: `THEME_SCHEMA_VERSION_V2`, `ThemeDefinitionV1`, `ThemeDefinitionV2`, `ThemeDefinitionInput`, `ThemeMaterialV2`, `ThemeShapeV2`, `ThemePartId`, `ThemePartRecipe`, `migrateTheme(input): ThemeMigrationResult`.

- [ ] **Step 1: Freeze the v1 public contract in failing compatibility tests**

Add tests importing both `ThemeDefinitionV1Schema` and the legacy aliases. Assert a current PomOS-shaped v1 fixture parses byte-for-byte equivalently and the public `ThemeDefinition` alias remains v1 until the v2 resolver task switches it deliberately.

- [ ] **Step 2: Write failing v2 schema tests**

Use a complete literal fixture and assert:

```ts
expect(ThemeDefinitionV2Schema.parse(V2_FIXTURE)).toMatchObject({
  schemaVersion: 'pomegranate.ui.theme.v2',
  recipes: { parts: { 'widget.surface': { material: 'window-glass' } } }
});
```

Add table cases rejecting unknown parts, missing referenced materials/shapes, a fifth shadow, raw `css`, `selector`, `html`, `script`, and `https://` asset values. Expected diagnostics name the exact public path.

- [ ] **Step 3: Run RED**

Run:

```powershell
npm.cmd exec vitest run packages/contracts/src/theme.test.ts packages/theme/src/migrate.test.ts
```

Expected: imports or v2 parsing fail because the v2 schemas and migrator do not exist.

- [ ] **Step 4: Split shared and v1 schemas without behavior drift**

Move reusable bounded-number, color, ID, typography, spacing, asset, and canvas definitions to `theme-shared.ts`; move the current schema unchanged to `theme-v1.ts`; make `theme.ts` re-export exact legacy names plus explicit v1 names. Run the existing contract/theme tests before adding v2 behavior.

- [ ] **Step 5: Implement strict v2 schemas**

Define the spec's bounded material palette, shape palette, complete part inventory, composition values, and cross-reference refinements. Use `z.object(...).strict()` and bounded arrays/records. Do not accept extension bags.

- [ ] **Step 6: Implement deterministic v1-to-v2 migration**

Map each v1 material role to a named v2 material, derive an unbranded shape palette from v1 geometry, map all required parts to conservative semantic defaults, preserve typography/colors/assets/canvas/accessibility, and return literal `THEME_MIGRATION_*` diagnostics. Deep-freeze successful output.

- [ ] **Step 7: Run GREEN and commit**

```powershell
npm.cmd exec vitest run packages/contracts/src/theme.test.ts packages/theme/src/migrate.test.ts packages/theme/src/theme.test.ts
npm.cmd run typecheck
git add packages/contracts/src packages/theme/src
git commit -m "feat(theme): add versioned recipe contracts"
```

### Task 2: V2 resolution, policy, assets, and deterministic part compilation

**Files:**
- Modify: `packages/theme/src/resolve.ts`
- Create: `packages/theme/src/policy.ts`
- Create: `packages/theme/src/assets.ts`
- Create: `packages/theme/src/compile.ts`
- Create: `packages/theme/src/compile.test.ts`
- Modify: `packages/theme/src/conformance.ts`
- Modify: `packages/theme/src/index.ts`
- Modify: `packages/theme/src/theme.test.ts`
- Modify: `packages/theme/README.md`

**Interfaces:**
- Consumes: `migrateTheme`, complete v2 schemas, host asset registry, and accessibility/runtime policy.
- Produces: `ResolvedThemeV2`, `ThemePolicy`, `ThemeAssetRegistry`, `resolveThemeV2`, `applyThemePolicy`, `compileThemeBindings`, `compileThemeStyleSheet`, and stable diagnostics.

- [ ] **Step 1: Write failing resolver and policy tests**

Assert v1 and v2 inputs resolve to the same immutable v2 shape; missing material/shape/icon/asset references fail closed; reduced transparency selects opaque fallbacks and zero blur; user/device policy overrides runtime/theme values; invalid resolution retains no partial output.

- [ ] **Step 2: Write failing compiler tests**

Assert compiled output is byte-deterministic, contains fixed selectors such as:

```css
[data-pom-theme-root] [data-pom-part="widget.surface"]
```

and contains no concrete theme ID. Assert range rules include WebKit and Firefox track/thumb selectors, visible-face variables, and a separate coarse-pointer hit size. Assert changing one part recipe changes only that part's declarations.

- [ ] **Step 3: Run RED**

```powershell
npm.cmd exec vitest run packages/theme/src/compile.test.ts packages/theme/src/theme.test.ts
```

- [ ] **Step 4: Implement resolution and literal diagnostics**

Resolve semantic colors, named material and shape references, state mappings, asset/icon requirements, and composition into deep-frozen values. Keep `resolveTheme()` as a compatibility entry point delegating through migration.

- [ ] **Step 5: Implement policy precedence**

Apply theme defaults, bounded runtime override, user preference, then device/accessibility veto. Reduced transparency replaces each translucent part's material with its declared fallback and disables backdrop filters without mutating source data.

- [ ] **Step 6: Implement fixed-selector compilation**

Generate all CSS syntax in code from validated values. Compile root tokens, part rules, state rules, focus rules, joined-edge geometry, and range pseudo-elements. Escape no theme-provided selector because no selector enters the model.

- [ ] **Step 7: Run package boundary and packed checks, then commit**

```powershell
npm.cmd exec vitest run packages/theme/src packages/contracts/src/theme.test.ts
npm.cmd run typecheck
npm.cmd run test:pack
git add packages/theme packages/contracts/src
git commit -m "feat(theme): compile semantic part recipes"
```

### Task 3: Canvas descriptors and maintained Svelte canvas recipe

**Files:**
- Create: `packages/theme/src/canvas.ts`
- Create: `packages/theme/src/canvas.test.ts`
- Modify: `packages/theme/src/index.ts`
- Create: `apps/workbench-lab/src/recipes/ThemeCanvas.svelte`
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/App.test.ts`
- Modify: `apps/workbench-lab/src/styles.css`

**Interfaces:**
- Consumes: resolved `ThemeCanvasLayer` values and host-resolved local assets.
- Produces: `compileCanvasLayers(theme, registry): readonly CanvasPresentationLayer[]` and one root `data-pom-part="canvas.surface"` owner.

- [ ] **Step 1: Write failing descriptor tests for every layer kind**

Assert stable order plus exact fit, focal position, opacity, blur, saturation, and blend for image/texture layers; assert veil and four-corner layers remain separate descriptors; reject unresolved required assets.

- [ ] **Step 2: Write a failing App test**

Assert one `data-pom-canvas-root` exists below chrome/content, each descriptor renders one pointer-transparent layer, and no stage child owns `background-image` when a theme canvas is active.

- [ ] **Step 3: Run RED**

```powershell
npm.cmd exec vitest run packages/theme/src/canvas.test.ts apps/workbench-lab/src/App.test.ts
```

- [ ] **Step 4: Implement pure canvas compilation and Svelte rendering**

Return immutable style values rather than DOM nodes. Render positioned layers in `ThemeCanvas.svelte`; resolve assets in the Lab host, never in theme data. Mount once at the theme root so switches replace descriptors without remounting the Workbench.

- [ ] **Step 5: Remove stage wallpaper ownership and run GREEN**

Delete target wallpaper pseudo-elements from stage styling while retaining structural positioning. Run focused tests and build, then commit.

```powershell
npm.cmd exec vitest run packages/theme/src/canvas.test.ts apps/workbench-lab/src/App.test.ts
npm.cmd run build
git add packages/theme/src apps/workbench-lab/src
git commit -m "feat(theme): render layered root canvases"
```

### Task 4: Stable Pom part anatomy and source gate

**Files:**
- Modify: `registry/recipes/recipe-manifest.json`
- Modify: `registry/recipes/*/*.svelte`
- Modify: `apps/workbench-lab/src/recipes/*.svelte`
- Modify: `apps/workbench-lab/src/mockup/renderers/*.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Create: `tests/unit/theme-recipes.test.mjs`
- Modify: `tests/unit/recipes.test.mjs`
- Modify: `tests/fixtures/renderer-dom-harness.mjs`

**Interfaces:**
- Consumes: Task 2's fixed part inventory and stylesheet.
- Produces: complete stable `data-pom-theme-root` / `data-pom-part` coverage with no concrete theme selector.

- [ ] **Step 1: Write failing source and DOM coverage tests**

Scan production CSS/Svelte for concrete `[data-pom-theme="..."]` selectors and branded preset inheritance. Render the non-Svelte DOM fixture and Svelte recipes; require every visible Pom-owned surface/control to expose an allowed part and every allowed part to resolve a compiled rule.

- [ ] **Step 2: Run RED**

```powershell
node --test tests/unit/theme-recipes.test.mjs tests/unit/recipes.test.mjs
npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts
```

Expected: current theme-ID CSS and missing part annotations fail.

- [ ] **Step 3: Annotate structural recipes first**

Add parts to Workbench, docks, Widget frame/header/content/actions, groups, Catalog, dialogs, fields, buttons, rows, separators, and range inputs. Copy matching source-owned recipe edits into `registry/recipes`, then regenerate deterministic recipe hashes with the repository recipe tool.

- [ ] **Step 4: Replace covered structural styling with compiled part rules**

Keep layout-only CSS in `styles.css`; remove material, shape, state, range-face, and theme-ID decisions now owned by compiled recipes. Structural classes may remain for layout/test selectors but cannot decide a target identity.

- [ ] **Step 5: Run GREEN and commit**

```powershell
node --test tests/unit/theme-recipes.test.mjs tests/unit/recipes.test.mjs
npm.cmd run check:recipes
npm.cmd run typecheck
npm.cmd run build
git add registry apps/workbench-lab/src tests/unit tests/fixtures
git commit -m "refactor(theme): expose semantic Pom parts"
```

### Task 5: Data-only target definitions and external fixture

**Files:**
- Create: `apps/workbench-lab/src/themes/base.ts`
- Modify: `apps/workbench-lab/src/themes/deep-current.ts`
- Modify: `apps/workbench-lab/src/themes/pom-neutral.ts`
- Modify: `apps/workbench-lab/src/themes/bunny.ts`
- Modify: `apps/workbench-lab/src/themes/controller.ts`
- Delete: `apps/workbench-lab/src/themes/bindings.ts`
- Modify: `apps/workbench-lab/src/themes/themes.test.ts`
- Create: `tests/fixtures/external-theme.ts`
- Create: `tests/fixtures/external-theme-consumer.mjs`
- Modify: `tests/unit/packed-consumer.test.mjs`
- Modify: `tests/browser/theme-art-direction.spec.ts`

**Interfaces:**
- Consumes: public v2 contracts/compiler, local registries, semantic parts.
- Produces: three complete data-only Lab presets and one external non-preset conformance consumer.

- [ ] **Step 1: Write failing branded-inheritance and external-fixture tests**

Assert no preset imports another preset, no Lab-local binding compiler exists, all target definitions resolve directly as v2, and the external fixture changes computed material/shape/typography using only public APIs and existing generic part styling.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts
node --test tests/unit/theme-recipes.test.mjs tests/unit/packed-consumer.test.mjs
```

- [ ] **Step 3: Create an unbranded structural base**

The base supplies complete safe recipes and palettes but no target color identity, branded icon pack, target canvas, or target copy. Each target merges the base then explicitly owns its palette, shapes, canvas, typography, and composition.

- [ ] **Step 4: Migrate controller and remove Lab compiler**

Use `resolveTheme`, policy, asset registry, `compileThemeStyleSheet`, and canvas descriptors from `@pomegranate-ui/theme`. Retain atomic failure and selected-theme persistence. Remove `bindings.ts` after all callers use the public package.

- [ ] **Step 5: Build the fourth consumer fixture**

Define the fixture under `tests/fixtures`, outside `LAB_THEME_PRESETS`. Render the same annotated mini-tree through the public compiler, assert distinct computed values, and include it in packed-consumer verification without modifying a stylesheet.

- [ ] **Step 6: Run GREEN and commit**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts packages/theme/src
node --test tests/unit/theme-recipes.test.mjs tests/unit/packed-consumer.test.mjs
npm.cmd run test:pack
git add apps/workbench-lab/src/themes packages tests/fixtures tests/unit
git commit -m "feat(theme): migrate data-only target themes"
```

### Task 6: PomOS Tahoe-informed visual correction

**Files:**
- Modify: `apps/workbench-lab/src/themes/pom-neutral.ts`
- Modify: `apps/workbench-lab/src/styles.css` only for shared layout
- Modify: `tests/browser/theme-art-direction.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `docs/conformance/pom-neutral-ledger.md`

**Interfaces:**
- Consumes: data-only PomOS and supplied Tahoe references.
- Produces: continuous canvas, coherent adaptive materials/geometry/chrome, accessible controls, and a finite visual rubric.

- [ ] **Step 1: Add failing browser contracts for witnessed defects**

At wide/compact/phone widths assert: no decorative header pseudo-content; root is the only wallpaper owner; docks have transparent fill, no border/shadow, and non-clipping scroll ownership; no visible bordered control uses accidental 2px radius; each Widget hierarchy has one backdrop-filter owner; range appearance is custom with a 3–4px track and at least 44px hit area; Widget actions remain reachable.

- [ ] **Step 2: Run RED against the merged baseline**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/theme-art-direction.spec.ts tests/browser/native-workbench-accessibility.spec.ts --project=chromium
```

- [ ] **Step 3: Correct PomOS through theme data and shared recipe values**

Remove stoplights; make the blue canvas continuous; set docks clear; define window/header/content/row/field/button/selected/range materials and shapes; use one rim/elevation vocabulary; simplify shelf/context material hierarchy; improve typography and icon presentation. Do not add a PomOS selector.

- [ ] **Step 4: Exercise functionality and persistence**

Switch themes, resize docks, group/ungroup, focus/back, scroll both stacks, edit sliders, reload saved layout, open Catalog/dialog, and test reduced transparency. Assert exact identity/state continuity.

- [ ] **Step 5: Run GREEN and commit**

```powershell
npm.cmd exec playwright test tests/browser/theme-art-direction.spec.ts tests/browser/native-workbench-accessibility.spec.ts tests/browser/native-workbench.spec.ts --project=chromium
git add apps/workbench-lab/src tests/browser docs/conformance/pom-neutral-ledger.md
git commit -m "feat(pomos): align adaptive glass system"
```

### Task 7: Deep Current and Bunny migration regression

**Files:**
- Modify: `apps/workbench-lab/src/themes/deep-current.ts`
- Modify: `apps/workbench-lab/src/themes/bunny.ts`
- Modify: `tests/browser/theme-art-direction.spec.ts`
- Modify: `docs/conformance/theme-art-direction-critic-ledger.md`

**Interfaces:**
- Consumes: shared v2 recipe engine and existing approved target evidence.
- Produces: distinct migrated identities without target selectors or functional drift.

- [ ] **Step 1: Add failing identity/regression assertions**

Protect Deep Current's dark industrial palette/chamfered compact geometry and Bunny's warm pastel/roomy rounded identity. Assert both share the exact semantic part inventory and neither inherits PomOS materials.

- [ ] **Step 2: Tune only definitions and shared recipes**

Map current approved values into v2 materials/shapes/states. If a needed capability is missing, add it to the public contract test-first rather than restoring a target selector.

- [ ] **Step 3: Run focused and conformance gates, then commit**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts
npm.cmd exec playwright test tests/browser/theme-art-direction.spec.ts --project=chromium
npm.cmd run test:conformance:theme-targets
git add apps/workbench-lab/src/themes tests/browser docs/conformance
git commit -m "feat(theme): preserve opposing target identities"
```

### Task 8: Adversarial Playwright visual critic loop

**Files:**
- Modify: `docs/conformance/theme-art-direction-critic-ledger.md`
- Modify: `docs/conformance/pom-neutral-ledger.md`
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Refresh: intentional files under `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/`
- Modify: implementation files only when a recorded finding proves a defect

**Interfaces:**
- Consumes: required reference images, wide/compact/phone renders, and functional gates.
- Produces: numbered critic rounds and a final round with zero substantive findings.

- [ ] **Step 1: Capture before and round-1 evidence**

Preserve the merged baseline PomOS image as `before` in the ignored Playwright evidence directory. Capture all themes at 1440x900, 640x900, and 390x844 with deterministic state and local fonts/assets ready.

- [ ] **Step 2: Critique screenshots before reading source**

Record material hierarchy, edge/radius consistency, control quality, canvas/dock continuity, typography, icon/chrome coherence, readability, responsive composition, and affordance findings with severity and exact evidence filename.

- [ ] **Step 3: Turn measurable findings red and fix all substantive findings**

Add computed-style/behavior assertions for measurable defects, witness failure, then change the smallest public recipe/definition/layout input. Pure art-direction findings remain ledger and screenshot evidence.

- [ ] **Step 4: Repeat complete rounds**

Re-capture every viewport and reassess as a fresh independent critic. Continue with reasonable effort until a complete pass has no substantive finding; retain preference-only notes separately.

- [ ] **Step 5: Promote final snapshots and verify unchanged rerun**

```powershell
npm.cmd exec playwright test tests/browser/native-workbench-visual.spec.ts --project=chromium --update-snapshots
npm.cmd exec playwright test tests/browser/native-workbench-visual.spec.ts --project=chromium
npm.cmd exec playwright test tests/browser/theme-art-direction.spec.ts tests/browser/native-workbench-accessibility.spec.ts --project=chromium
```

- [ ] **Step 6: Commit closed visual evidence**

```powershell
git add docs/conformance tests/browser apps/workbench-lab/src packages
git commit -m "test(theme): close semantic recipe critic loop"
```

### Task 9: Documentation, full audit, PR, merge, and Pages proof

**Files:**
- Modify: `packages/theme/README.md`
- Modify: `packages/contracts/README.md`
- Modify: `packages/svelte/README.md`
- Modify: `apps/workbench-lab/README.md`
- Modify: `README.md`
- Create: `docs/theme-authoring.md`
- Review: all `main...HEAD` changes and applicable workflows

**Interfaces:**
- Consumes: closed critic ledger and complete implementation.
- Produces: documented public contract, clean full gate, reviewed merged PR, remote-main identity, and Pages artifact evidence.

- [ ] **Step 1: Document authoring and migration**

Explain v1 migration, v2 palettes/shapes/parts/states, compiler, canvas, asset/icon registration, accessibility precedence, the external fixture, immediate switching, and the honest no-custom-CSS boundary. Keep the concrete `npm.cmd run dev:lab`, build, preview, and `apps/workbench-lab/dist` instructions.

- [ ] **Step 2: Run the requirement-by-requirement completion audit**

Map every spec acceptance item to current files, tests, screenshots, computed styles, and runtime evidence. Treat missing or indirect proof as incomplete and fix it before proceeding.

- [ ] **Step 3: Run source, diff, and full verification**

```powershell
git diff --check
git status --short
git diff --stat main...HEAD
rg -n 'data-pom-theme="|DEEP_CURRENT_THEME' apps packages registry
npm.cmd run check
```

Expected: intentional scoped files only; no concrete theme selector or branded inheritance; all gates pass. If npm cache sandboxing repeats for `test:pack`, rerun that identical gate with required filesystem permission and record both outputs.

- [ ] **Step 4: Request final code review and fix substantive findings test-first**

Review architecture, contract safety, migration, package boundaries, part coverage, accessibility, UI function, and visual evidence. Add a reproducing test before each code fix and rerun the affected lane plus the full gate.

- [ ] **Step 5: Push, create PR, and monitor checks**

```powershell
git push -u origin codex/theme-recipes-pomos-overhaul
gh pr create --base main --head codex/theme-recipes-pomos-overhaul --title "Overhaul Pom theme recipes and PomOS" --body-file .github/pull_request_template.md
gh pr checks --watch
```

If no template exists, create a concise body containing architecture, migration, visual evidence, exact test results, boundaries, and limitations. Do not put memory citations in the PR.

- [ ] **Step 6: Merge and verify delivery**

Merge without bypassing protection, verify the PR merge commit equals remote `main`, fast-forward the primary checkout without touching its untracked attachments, and inspect the applicable Pages workflow/artifact for the merged SHA. Report PR URL, merge SHA, tests, screenshots, Pages evidence, limitations, and any proven pre-existing failure.

---

## Plan self-review

- Spec coverage: versioning/migration, materials/shapes/parts, compilation, canvas, assets/icons, accessibility policy, four themes, PomOS defects, opposing-theme regressions, visual critic loop, documentation, full gates, PR/merge, and Pages proof each have an owning task.
- Placeholder scan: no deferred implementation placeholder or undefined “appropriate test” remains; each behavior step names its assertion, command, and expected red/green outcome.
- Type consistency: v2 schemas originate in contracts; migration/resolution/compiler/canvas/policy originate in theme; Svelte and Lab consume public outputs only.
- Boundary consistency: target data may vary values and recipes but never selectors, actions, DOM identity, or product semantics.
- Verification integrity: source checks cannot replace browser evidence, screenshots cannot replace function tests, and a narrow focused gate cannot support full completion.
