# Pom Conformance Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic dual-driver conformance system, record a truthful Deep Current macro baseline, and make the restored macro shell pass its first frozen authority scenarios.

**Architecture:** Test-only TypeScript modules validate preserved authorities, scenarios, ledgers, normalized measurements, and comparisons. Playwright drives the preserved Atmospheric Workbench and the Svelte Workbench Lab independently, then emits deterministic structured evidence plus diagnostic images. Source-owned Svelte recipes restore the macro shell without importing preserved runtime code or branching on theme IDs.

**Tech Stack:** Node.js 24, TypeScript 7 native preview, Svelte 5, Playwright 1.62, Vite 8, Node test runner, existing Pom packages and static server.

**Spec:** `docs/superpowers/specs/2026-08-28-pom-mockup-conformance-design.md`

## Global Constraints

- Preserve every byte under `prototypes/sonder-baseline/**`, `design/foundations/sonder-ui-bible/**`, and `design/widget-specifications/sonder-panels-and-widgets/**`.
- Atmospheric Workbench owns macro layout/material/responsive behavior; Widget Overhaul owns later Panel/Widget/Catalog behavior.
- Keep all three themes on one component tree; no recipe may branch on `deep-current`, `pom-neutral`, or `bunny`.
- Preserve all 94 Catalog identities and category totals `{ story: 12, library: 19, systems: 21, settings: 39, extensions: 3 }`.
- Do not invent specialized bodies for the 46 surfaces outside the 49 implemented Widget Overhaul surfaces.
- Runtime dependencies remain `contracts -> layout -> core -> svelte` with the separate `contracts -> theme` path.
- Test and Lab code may read preserved files; package and application runtime code may not import preserved mockup code.
- Generated images and JSON evidence belong under ignored `test-results/`; commit only small structured baselines and approved reference frames.
- Use `npm.cmd` on Windows and keep `apps/workbench-lab/dist` a static relative-base artifact.
- No npm publication, GitHub Pages deployment, Sonder cutover, or server-code import in this plan.
- Execute inline because this session does not have user authority to dispatch subagents.

---

## File structure

- `tests/conformance/types.ts`: test-only authority, scenario, measurement, comparison, and error types.
- `tests/conformance/authorities.ts`: exact preserved paths, hashes, and expected harness totals.
- `tests/conformance/viewports.ts`: named immutable CSS viewport matrix.
- `tests/conformance/manifest.ts`: initial Deep Current macro scenarios and manifest validation.
- `tests/conformance/ledger.ts`: strict Markdown ledger parsing and cross-reference validation.
- `tests/conformance/normalize.ts`: deterministic CSS-pixel and computed-style normalization.
- `tests/conformance/compare.ts`: profile-driven structured comparisons.
- `tests/conformance/evidence.ts`: deterministic evidence paths, images, and JSON reports.
- `tests/conformance/drivers/reference/atmospheric.ts`: Atmospheric Workbench setup and measurement.
- `tests/conformance/drivers/workbench-lab/deep-current.ts`: independent Lab setup and measurement.
- `tests/conformance/specs/deep-current-macro.spec.ts`: Playwright orchestration and attachments.
- `tests/conformance/baselines/deep-current-macro.json`: reviewed passing macro measurements.
- `tests/unit/conformance.test.mjs`: infrastructure unit contracts.
- `docs/conformance/*.md`: operator instructions and target discrepancy ledgers.
- `apps/workbench-lab/src/App.svelte`: restored shell composition.
- `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`: semantic regions and toolbar resize controls.
- `apps/workbench-lab/src/styles.css`: authority-derived macro geometry and responsive layout.

---

### Task 1: Validate authorities, viewports, and scenario manifests

**Files:**
- Create: `tests/conformance/types.ts`
- Create: `tests/conformance/authorities.ts`
- Create: `tests/conformance/viewports.ts`
- Create: `tests/conformance/manifest.ts`
- Create: `tests/unit/conformance.test.mjs`
- Modify: `tsconfig.tests.json`

**Interfaces:**
- Produces: `AUTHORITY_RECORDS`, `CONFORMANCE_VIEWPORTS`, `DEEP_CURRENT_MACRO_SCENARIOS`, and `validateConformanceManifest(scenarios, options): Promise<ValidatedConformanceManifest>`.
- Throws: `ConformanceError` with code `REFERENCE_HASH_DRIFT` or `MANIFEST_INVALID` and stable details.

- [x] **Step 1: Write failing authority and manifest tests**

Assert a duplicate scenario, unknown viewport/driver/profile, missing deviation,
absolute path, escaping path, and wrong hash each fail with the exact code. Use:

```js
await assert.rejects(
  validateConformanceManifest([validScenario], { ...options, hashFile: async () => 'wrong' }),
  (error) => error.code === 'REFERENCE_HASH_DRIFT'
);
```

Assert the five preserved hashes and every viewport dimension from the spec.

- [x] **Step 2: Run the unit test and verify the module is absent**

Run: `node --test tests/unit/conformance.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for the manifest module.

- [x] **Step 3: Implement immutable types and exact records**

Define:

```ts
export class ConformanceError extends Error {
  constructor(
    public readonly code: ConformanceErrorCode,
    message: string,
    public readonly details: Readonly<Record<string, unknown>> = {}
  ) { super(message); this.name = 'ConformanceError'; }
}
```

Hash exact bytes with `createHash('sha256')`, compare lower-case values, freeze
all records, and seed `dc-shell-wide`, `dc-shell-medium`, `dc-shell-compact`,
`dc-shell-landscape-short`, and `dc-shell-zoom-200`.

- [x] **Step 4: Reject filesystem escape before reading**

Reject absolute paths first. Resolve from an injected repository root and
require `path.relative(root, resolved)` to be non-absolute and not begin with
`..`. Validate all cross references before hashing.

- [x] **Step 5: Run gates and commit**

```powershell
node --test tests/unit/conformance.test.mjs
npm.cmd run typecheck
git add tests/conformance tests/unit/conformance.test.mjs tsconfig.tests.json
git commit -m "test(conformance): validate authorities"
```

---

### Task 2: Enforce discrepancy ledger integrity

**Files:**
- Create: `tests/conformance/ledger.ts`
- Modify: `tests/unit/conformance.test.mjs`
- Create: `docs/conformance/README.md`
- Create: `docs/conformance/deep-current-ledger.md`
- Create: `docs/conformance/pom-neutral-ledger.md`
- Create: `docs/conformance/bunny-ledger.md`

**Interfaces:**
- Produces: `parseDiscrepancyLedger(markdown): readonly Discrepancy[]` and `validateDiscrepancyLedger(entries, manifest): LedgerValidation`.

- [x] **Step 1: Write failing parser and cross-reference tests**

Require the exact design columns. Reject duplicate IDs, unknown scenarios,
invalid status/severity, closed rows without regression evidence, incomplete
deviations, and mismatch between scenario deviation IDs and ledger rows.

- [x] **Step 2: Run the test and verify the parser is absent**

Run: `node --test tests/unit/conformance.test.mjs`

Expected: FAIL importing `tests/conformance/ledger.ts`.

- [x] **Step 3: Implement the narrow repository-owned table parser**

Require this header exactly:

```text
| ID | Category | Severity | Authority | Scenario | Evidence | Diagnosis | Status | Regression | Deviation |
```

Split only table rows, trim cells, reject embedded separators, and return
frozen records. This is not a general Markdown parser.

- [x] **Step 4: Seed truthful target ledgers**

Create open Deep Current rows for shell structure, toolbar widths, center stage,
composer, canvas/portraits, and missing resize/docking states. Evidence names
must match Task 5. Neutral and Bunny contain only the header and the explicit
pre-reference note.

- [x] **Step 5: Document workflow, run, and commit**

Document P0-P3, fail-closed errors, the three-attempt review rule, and the
freeze gate. Then run and commit:

```powershell
node --test tests/unit/conformance.test.mjs
git add tests/conformance/ledger.ts tests/unit/conformance.test.mjs docs/conformance
git commit -m "test(conformance): enforce discrepancy ledger"
```

---

### Task 3: Normalize and compare structured browser evidence

**Files:**
- Create: `tests/conformance/normalize.ts`
- Create: `tests/conformance/compare.ts`
- Modify: `tests/conformance/types.ts`
- Modify: `tests/unit/conformance.test.mjs`

**Interfaces:**
- Produces: `normalizeMeasurement`, `compareMeasurements`, and named `MEASUREMENT_PROFILES`.
- `ComparisonReport` contains sorted path, expected, actual, tolerance, pass, category, and severity results.

- [x] **Step 1: Write failing deterministic normalization tests**

Assert recursively sorted keys, stable array order, `-0` to `0`, two-decimal
geometry, canonical `rgba(r, g, b, a)`, and rejection of non-finite/undefined
required DOM values.

- [x] **Step 2: Write failing profile comparison tests**

Use shelf/left/stage/right/composer boxes. Assert exact containment/order,
declared numeric tolerance, style equality, missing-path failure, and
deterministic result order. Prove one tolerance cannot affect another path.

- [x] **Step 3: Implement explicit comparators**

Implement `equal`, `within`, `contains`, `ordered`, `no-overflow`, and
`ratio-within`. The initial `deep-current-shell` profile compares macro order,
viewport fill, shelf height, toolbar widths, stage/composer bounds, shared
edges, overflow, and named styles. There is no global pass threshold.

- [x] **Step 4: Run gates and commit**

```powershell
node --test tests/unit/conformance.test.mjs
npm.cmd run typecheck
git add tests/conformance tests/unit/conformance.test.mjs
git commit -m "test(conformance): compare structured evidence"
```

---

### Task 4: Emit deterministic evidence artifacts

**Files:**
- Create: `scripts/conformance/image-diff.mjs`
- Create: `tests/conformance/evidence.ts`
- Modify: `tests/unit/conformance.test.mjs`
- Modify: `.gitignore`
- Modify only if needed: `package.json`, `package-lock.json`

**Interfaces:**
- Produces: `createEvidencePaths`, `writeComparisonReport`, and `createDiagnosticImages`.

- [x] **Step 1: Write failing path and report tests**

Reject unsafe scenario IDs, require output beneath the injected directory,
require byte-identical repeated JSON, prohibit source overwrite, and return a
structured dimension-mismatch diagnostic.

- [x] **Step 2: Implement exact evidence names**

For `dc-shell-wide`, emit `.reference.png`, `.actual.png`, `.overlay.png`,
`.diff.png`, `.measurements.json`, and `.report.json` under
`test-results/conformance`. Use stable JSON and atomic rename inside the output
directory.

- [x] **Step 3: Implement diagnostic PNGs**

Use Playwright's installed PNG decoder if resolvable; otherwise add exact
`pngjs` dev dependency. For equal dimensions, write a 50-percent overlay and
absolute RGBA diff plus differing-pixel/max-channel summaries. These summaries
never decide conformance.

- [x] **Step 4: Run, prove ignore, and commit**

```powershell
node --test tests/unit/conformance.test.mjs
git check-ignore test-results/conformance/example.png
git add scripts/conformance tests/conformance/evidence.ts tests/unit/conformance.test.mjs .gitignore package.json package-lock.json
git commit -m "test(conformance): emit diagnostic evidence"
```

---

### Task 5: Drive preserved and native shells independently

**Files:**
- Create: `tests/conformance/drivers/reference/atmospheric.ts`
- Create: `tests/conformance/drivers/workbench-lab/deep-current.ts`
- Create: `tests/conformance/specs/deep-current-macro.spec.ts`
- Modify: `tests/browser/global-setup.mjs`
- Modify: `tests/unit/browser-server-lifecycle.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Reference driver produces `prepareAtmosphericState` and `measureAtmosphericShell`.
- Lab driver produces `prepareDeepCurrentState` and `measureLabShell`.
- Runner produces `runConformanceScenario(page, testInfo, scenario): Promise<ComparisonReport>`.

- [x] **Step 1: Write failing server and driver-boundary tests**

Require both origins from the browser server. Reject driver cross-imports,
reference use of Lab selectors, and Lab use of `.sonder-*` selectors.

- [x] **Step 2: Implement semantic `scene-ready` setup**

Reference opens the preserved same-origin preview iframe, clears only its
documented key, waits for local fonts, and proves all macro regions. Lab opens
port 4174, clears only Pom layout/theme keys, selects Deep Current, and proves
the equivalent `data-conformance-region` elements.

- [x] **Step 3: Implement the shared measurement shape independently**

Both drivers return:

```ts
interface ShellMeasurement {
  readonly viewport: { width: number; height: number };
  readonly regions: Readonly<Record<'shelf' | 'left' | 'stage' | 'right' | 'composer', RegionMeasurement>>;
  readonly document: { scrollWidth: number; clientWidth: number; scrollHeight: number; clientHeight: number };
}
```

Selectors stay local. Each region includes box, visible, overflow, and named
computed styles.

- [x] **Step 4: Orchestrate Playwright and capture expected red**

Validate authorities/ledger in `beforeAll`. Capture both images, measure,
compare, write reports/diffs, attach files, and map failures to ledger IDs.
During restoration the focused command exits non-zero with
`DISCREPANCY_REMAINS`; it is not yet in root `check`.

Run:

```powershell
npm.cmd run build
npm.cmd run test:conformance:deep-current
```

Expected: preserved setup succeeds; current Lab fails only on ledgered macro
differences and emits complete evidence.

- [x] **Step 5: Inspect evidence, refine diagnoses, and commit**

Inspect wide/compact reference, actual, overlay, and structured report. Update
diagnoses only; do not close rows or raise tolerance.

```powershell
git add tests/conformance tests/browser/global-setup.mjs tests/unit/browser-server-lifecycle.test.mjs package.json docs/conformance/deep-current-ledger.md
git commit -m "test(conformance): expose Deep Current gaps"
```

---

### Task 6: Restore the Deep Current macro shell test-first

**Files:**
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/App.test.ts`
- Modify: `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelTabs.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `docs/conformance/deep-current-ledger.md`
- Create: `tests/conformance/baselines/deep-current-macro.json`

**Interfaces:**
- Consumes: existing store, catalog, renderer registry, theme snapshot, commands, and stable IDs.
- Produces: semantic shelf/left/stage/right/composer regions and authority-shaped geometry without state recreation.

- [x] **Step 1: Add failing component structure tests**

Require exactly one of every `data-conformance-region`. Require composer as the
stage footer owner rather than a tall generic Widget. Prove theme activation
preserves revision, Panel, Widget IDs, draft, and focused control.

- [x] **Step 2: Add failing responsive browser assertions**

At 1600x900, 1180x800, 768x1024, 430x932, 390x844, 844x390, and 800x450,
assert no horizontal overflow, composer reachability, active Panel visibility,
and no toolbar collision. Coarse targets remain at least 44 by 44 CSS pixels.

- [x] **Step 3: Run focused tests and verify red**

```powershell
npm.cmd run test:native -- apps/workbench-lab/src/App.test.ts
npm.cmd run test:browser -- tests/browser/native-workbench-accessibility.spec.ts
```

Expected: FAIL on absent semantic regions/current generic geometry.

- [x] **Step 4: Recompose without recreating runtime state**

Keep existing runtime/store/host/theme singletons. Put Panel strip/story lockup
in the top band, integrated left/right owners around an image-led stage, and
one shared composer draft/action at the stage footer. Add semantic attributes;
copy no standalone mockup script.

- [x] **Step 5: Restore geometry through theme-neutral structural CSS**

At wide sizes target equal side toolbars from the authority's
`min(286px, 18vw)` formula, a flexible center stage,
top shelf, and centered lower-stage composer. Bind every visual value through
semantic custom properties. Use structural CSS for grid, resize ranges,
docking, and reflow. Add no theme-ID selector.

- [x] **Step 6: Iterate and close one discrepancy at a time**

Run its scenario, inspect geometry before pixels, make the smallest shared
correction, rerun focused gates, and close only with passing regression. After
three ineffective fixes revisit structure/authority mapping.

- [x] **Step 7: Freeze, verify, and commit**

Write the normalized passing baseline and rerun without update mode:

```powershell
npm.cmd run test:native -- apps/workbench-lab/src/App.test.ts
npm.cmd run test:browser -- tests/browser/native-workbench-accessibility.spec.ts
npm.cmd run test:conformance:deep-current
npm.cmd run typecheck
npm.cmd run build
git add apps/workbench-lab/src tests/browser/native-workbench-accessibility.spec.ts tests/conformance/baselines/deep-current-macro.json docs/conformance/deep-current-ledger.md
git commit -m "feat(lab): restore Deep Current shell"
```

---

### Task 7: Make conformance a repository and CI contract

**Files:**
- Modify: `package.json`
- Modify: `tests/unit/repository-boundary.test.mjs`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md`
- Modify: `apps/workbench-lab/README.md`
- Modify: `AGENTS.md`
- Modify: `docs/conformance/README.md`

**Interfaces:**
- Produces: `test:conformance:unit`, `test:conformance:deep-current`, `test:conformance`, `inspect:conformance`, root gate integration, and CI evidence artifacts.

- [ ] **Step 1: Write failing repository assertions**

Require exact scripts, frozen conformance after browser tests in `check`, CI
upload of `test-results/conformance/**`, named authorities, local commands,
ledger gate, immediate themes, static artifact, and no publication/cutover.

- [ ] **Step 2: Run and verify red**

Run: `node --test tests/unit/repository-boundary.test.mjs`

Expected: FAIL on absent scripts/workflow/docs.

- [ ] **Step 3: Add commands, CI, and operator docs**

Focused scripts run only requested conformance specs; inspect requires
`--scenario` and retains evidence. Ubuntu and Windows run structured checks;
Windows remains canonical for pixels. Upload traces, reports, measurements,
reference/actual/overlay/diff on failure.

- [ ] **Step 4: Run full gate and commit**

```powershell
npm.cmd run check
git add package.json tests/unit/repository-boundary.test.mjs .github/workflows/ci.yml README.md apps/workbench-lab/README.md AGENTS.md docs/conformance/README.md
git commit -m "ci: gate Deep Current conformance"
```

---

### Task 8: Review foundation and plan mandatory expansion

**Files:**
- Review: all files from `origin/main...HEAD`
- Create: `docs/superpowers/plans/2026-08-28-deep-current-interactions.md`
- Create: `docs/superpowers/plans/2026-08-28-deep-current-widgets.md`
- Create after Deep Current freezes: `docs/superpowers/plans/2026-08-28-pom-neutral-bunny-conformance.md`

**Interfaces:**
- Produces exact test-first plans for interaction parity, 49 implemented surfaces, 94 Catalog identities, and then original Neutral/Bunny frames.

- [ ] **Step 1: Review scope and preservation**

```powershell
git status --short
git diff --check origin/main...HEAD
git diff --name-only origin/main...HEAD
npm.cmd run check:extraction
```

Expected: no preserved path or generated evidence staged.

- [ ] **Step 2: Mutate each failure boundary mentally and with fixtures**

Prove wrong hash, broken reference selector, missing Lab region, unknown
mismatch, and stale closed row each yield their exact designed error.

- [ ] **Step 3: Write the interaction plan**

Give separate red/green tasks to toolbar resizing, shelf insertion, tab
merge/reorder, floating, invalid-drop/pointer-cancel restoration, focus/Back,
keyboard/touch, and persistence across Scene/Library/Settings. Name scenario
IDs and authority states in every task.

- [ ] **Step 4: Write the 49-surface Widget plan**

Enumerate all 49 ledger surfaces by exact Widget type. Give each a ready-state
scenario and its smallest authoritative error/empty/pending/focused/responsive
matrix. Add distinct Catalog inventory/search/preview/placement/fallback tasks
for all 94 identities without specialized bodies for the other 46.

- [ ] **Step 5: Defer the theme plan until Deep Current freezes**

Start it with original frame creation and review, record hashes, reuse the
frozen semantic matrix, and add a structural test rejecting theme-ID branches.

- [ ] **Step 6: Verify and commit plans**

```powershell
npm.cmd run check
git add docs/superpowers/plans
git commit -m "docs: plan conformance expansion"
```

---

## Plan self-review

- Spec coverage: preserved hashes, manifests, dual drivers, independent
  selectors, ledgers, severity gates, deterministic evidence, diagnostic
  images, fail-closed errors, macro viewports, Svelte restoration,
  cross-platform structure, and Windows pixels all have owners.
- Deliberate phase boundary: this plan freezes the Deep Current macro before
  the independently reviewable interaction, 49-surface Widget, and original
  Neutral/Bunny subprojects. The approved master spec keeps them mandatory.
- Placeholder scan: every code-producing task names exports, paths, failure
  conditions, commands, and expected outcomes.
- Type consistency: `ConformanceError`, `ConformanceScenario`,
  `ShellMeasurement`, and `ComparisonReport` have one definition and stable
  consumers.
- Preservation: no production file reads a mockup and no preserved path is
  modified.
- Execution choice: inline execution is selected under the no-subagent
  constraint; checkpoints are test/commit boundaries, not approval gates.
