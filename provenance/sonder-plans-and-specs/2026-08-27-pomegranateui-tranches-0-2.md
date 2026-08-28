# PomegranateUI Tranches 0-2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Use `superpowers:test-driven-development` for every tooling behavior, `superpowers:systematic-debugging` for unexpected failures, and `superpowers:verification-before-completion` before any completion claim.

**Goal:** Establish PomegranateUI as a private, independent repository containing a lossless, hash-verified copy of the complete Sonder UI incubation corpus, executable preserved browser regressions, stable contract identities, and CI that proves zero unaccounted evidence.

**Architecture:** The extraction has two repositories and one immutable handoff point. Sonder Engine remains the source and backend authority; a reviewed green commit on its `interface` branch becomes the extraction baseline. PomegranateUI imports bytes only from that Git commit, records every artifact and contract in machine-readable provenance, and runs the preserved HTML harnesses without translating them. The TypeScript toolkit lane is represented only by reserved directories and boundary documentation in this plan; production TypeScript starts in Tranche 3.

**Tech Stack:** Git and GitHub CLI; Node.js 24; npm workspaces reserved but not activated for production packages; Node built-in test runner; Playwright browser tests; HTML/CSS/plain JavaScript preserved from Sonder; JSON and Markdown provenance records; GitHub Actions on Windows and Ubuntu.

**Spec:** [`docs/superpowers/specs/2026-08-27-pomegranateui-extraction-design.md`](../specs/2026-08-27-pomegranateui-extraction-design.md)

**Global Constraints:**

- Do not delete, move, reset, clean, or rewrite any Sonder source artifact during Tranches 0-2.
- Treat the current Sonder working tree as user-owned. Stage and commit only the reviewed extraction paths. Leave unrelated staged, modified, and untracked paths untouched.
- Read artifacts from the selected Git commit, never implicitly from the working tree, when constructing the PomegranateUI import.
- Capture harness-reported case totals and inventory totals at execution time. Do not hard-code counts observed while this plan was written.
- If an in-scope path was committed before execution reaches it, record its actual owning commit and continue; do not create empty or duplicate commits.
- Initial extraction allows no `retired-approved` entries and no unaccounted entries.
- PomegranateUI stays private during this plan. Do not publish an npm package, make the repository public, or declare a root PomegranateUI license without the product owner's later publication decision.
- Preserve the Sonder MIT license text as source provenance and preserve all bundled font and icon license/provenance files.
- Use `npm.cmd` on Windows. Use the Sonder virtual environment only where a Sonder Python command is required.
- Use GitHub CLI with network permission enabled for every GitHub operation, per Sonder's `AGENTS.md`.
- Do not begin the TypeScript implementation, React bindings, or Sonder package adoption in this plan.

## Repository and File Responsibility Map

### Sonder Engine: `F:\git\Sonder_Engine`

- `docs/experiments/sonder-atmospheric-workbench/**`: canonical preserved prototype, wrappers, regression harness, fonts, screenshots, and local licenses.
- `docs/experiments/sonder-widget-overhaul/**`: current Widget-overhaul prototype, wrappers, regression harness, rendered evidence, fonts, and local licenses.
- `docs/design/sonder-panels-and-widgets/**`: Widget inventory, contracts, adoption guidance, and complete surface ledger.
- `docs/design/sonder-ui-bible/**`: authoritative design foundation and change records.
- `docs/design/sonder-ui-replacement/CANDIDATE_SALVAGE_LEDGER.md`: historical boundary and rejected legacy mechanisms.
- `docs/guides/INTERFACE.md` and `docs/guides/UI_REFERENCE.md`: maintained implementation and reference authority.
- The PomegranateUI design spec plus the UI plans and specs named in `provenance/source-scope.json`: design intent and review provenance.
- `docs/superpowers/plans/2026-08-27-pomegranateui-tranches-0-2.md`: the approved executable extraction record.
- `artifacts/minimal-ui-icons/README.md`, `artifacts/minimal-ui-icons/manifest.json`, and every icon file actually referenced by imported evidence: icon provenance and selected source assets.
- `tests/**` entries selected by the source-inventory rules: source-side generic and Sonder-integration test accountability. Tests remain physically in Sonder unless explicitly included as historical evidence.

### PomegranateUI: `F:\git\PomegranateUI`

- `scripts/lib/extraction.mjs`: shared path normalization, Git object reads, SHA-256 calculation, source classification, and contract-ID generation.
- `scripts/import-sonder-baseline.mjs`: the only writer for imported baseline artifacts and generated extraction records.
- `scripts/verify-extraction.mjs`: zero-unaccounted, hash, owner, license, and stable-ID gate.
- `scripts/generate-migration-report.mjs`: deterministic human-readable status report.
- `scripts/serve-static.mjs`: dependency-free static server for preserved browser evidence.
- `tests/unit/extraction.test.mjs`: import, hash, dirty-tree independence, and completeness tests.
- `tests/unit/contracts.test.mjs`: stable ID, harness-title extraction, Widget-ledger extraction, and ownership tests.
- `tests/unit/report.test.mjs`: report totals and deterministic output tests.
- `tests/browser/preserved-harnesses.spec.mjs`: both preserved browser-oracle runs.
- `provenance/source-scope.json`: reviewed source path rules and destination mappings.
- `provenance/extraction-manifest.json`: machine-readable completeness authority.
- `provenance/contract-index.json`: stable contract IDs mapped to legacy titles, ledger rows, documented acceptance items, and Sonder-owned evidence.
- `provenance/sonder-test-dispositions.json`: explicit owner and physical-location decision for every discovered relevant Sonder test file.
- `provenance/extraction-ledger.md`: generated human-readable disposition ledger.
- `provenance/migration-report.md`: generated coverage and unaccounted report.
- `provenance/source-commits.md`: baseline branch, commit, source remote, checkpoint commits, and harness evidence.
- `provenance/SONDER_LICENSE.txt`: verbatim license from the baseline commit.
- `prototypes/sonder-baseline/**`: byte-for-byte imported evidence lane.
- `design/**`: imported foundations and Widget specifications.
- `apps/**`, `examples/**`, `packages/**`, and `registry/**`: boundary READMEs only until Tranche 3.
- `.github/workflows/ci.yml`: clean-install, provenance, unit, and browser gates.

## Task 1: Select and prove the green Sonder checkpoint

**Files:**

- Review: `docs/guides/INTERFACE.md`
- Review: `docs/guides/UI_REFERENCE.md`
- Review: `docs/design/sonder-ui-bible/README.md`
- Review: `docs/design/sonder-panels-and-widgets/12_WIDGET_UX_OVERHAUL_LEDGER.md`
- Review: `docs/experiments/sonder-atmospheric-workbench/sonder-drag-regression.html`
- Review: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul-regression.html`
- Create later in PomegranateUI: `provenance/source-commits.md`

- [ ] **Step 1: Capture the entire Sonder working-tree inventory without changing it**

  Run:

  ```powershell
  git status --short
  git diff --name-only
  git diff --cached --name-only
  git ls-files --others --exclude-standard
  git branch --show-current
  git rev-parse HEAD
  git remote get-url origin
  ```

  Save the outputs outside the repository in a new `New-TemporaryFile` path for comparison during this task. Do not stash or clean anything.

- [ ] **Step 1a: Checkpoint this approved execution plan**

  Verify and commit only this plan so it is addressable from the later baseline Git object:

  ```powershell
  git diff --check -- docs/superpowers/plans/2026-08-27-pomegranateui-tranches-0-2.md
  git add -- docs/superpowers/plans/2026-08-27-pomegranateui-tranches-0-2.md
  git commit --only -m "docs(ui): plan PomegranateUI extraction" -- docs/superpowers/plans/2026-08-27-pomegranateui-tranches-0-2.md
  ```

- [ ] **Step 2: Run the canonical Atmospheric Workbench harness from the current source tree**

  Start a local server:

  ```powershell
  .venv\Scripts\python.exe -m http.server 8765 --directory docs\experiments\sonder-atmospheric-workbench
  ```

  Open `http://127.0.0.1:8765/sonder-drag-regression.html` using the browser-control skill. Wait for the title to begin with `PASS —`, assert `#results .fail` is empty, and record the exact `#results h1` text. If the title begins with `FAIL —`, stop checkpointing and use systematic debugging; do not commit a red baseline.

- [ ] **Step 3: Run the active Widget-overhaul harness from the current source tree**

  Start a separate local server:

  ```powershell
  .venv\Scripts\python.exe -m http.server 8766 --directory docs\experiments\sonder-widget-overhaul
  ```

  Open `http://127.0.0.1:8766/sonder-widget-overhaul-regression.html`. Apply the same title, failure-row, and reported-total checks. Save screenshots of the results page and the editable/preview pair at every viewport named by that package's README or ledger.

- [ ] **Step 4: Review and checkpoint canonical-reference changes only**

  Review diffs under these pathspecs:

  ```powershell
  git diff --check -- docs/guides/UI_REFERENCE.md docs/design/sonder-ui-bible docs/experiments/sonder-atmospheric-workbench
  git diff -- docs/guides/UI_REFERENCE.md docs/design/sonder-ui-bible docs/experiments/sonder-atmospheric-workbench
  ```

  If those pathspecs contain changes, stage only them and verify the staged list:

  ```powershell
  git add -- docs/guides/UI_REFERENCE.md docs/design/sonder-ui-bible docs/experiments/sonder-atmospheric-workbench
  git diff --cached --name-only -- docs/guides/UI_REFERENCE.md docs/design/sonder-ui-bible docs/experiments/sonder-atmospheric-workbench
  git commit --only -m "docs(ui): checkpoint Workbench calibration" -- docs/guides/UI_REFERENCE.md docs/design/sonder-ui-bible docs/experiments/sonder-atmospheric-workbench
  ```

  If there is no diff, record the owning commits instead of making an empty commit:

  ```powershell
  git log -1 --format="%H %s" -- docs/guides/UI_REFERENCE.md
  git log -1 --format="%H %s" -- docs/design/sonder-ui-bible
  git log -1 --format="%H %s" -- docs/experiments/sonder-atmospheric-workbench
  ```

- [ ] **Step 5: Review and checkpoint Widget-overhaul changes only**

  Review diffs, including untracked files, under:

  ```powershell
  git status --short -- docs/design/sonder-panels-and-widgets docs/experiments/sonder-widget-overhaul
  git diff --check -- docs/design/sonder-panels-and-widgets docs/experiments/sonder-widget-overhaul
  git diff -- docs/design/sonder-panels-and-widgets docs/experiments/sonder-widget-overhaul
  ```

  Verify every screenshot/render is named by the ledger or package README. Stage and commit only these two path families:

  ```powershell
  git add -- docs/design/sonder-panels-and-widgets docs/experiments/sonder-widget-overhaul
  git diff --cached --name-only -- docs/design/sonder-panels-and-widgets docs/experiments/sonder-widget-overhaul
  git commit --only -m "docs(ui): checkpoint Widget overhaul" -- docs/design/sonder-panels-and-widgets docs/experiments/sonder-widget-overhaul
  ```

  If no diff remains, record the existing owning commits instead.

- [ ] **Step 6: Re-run both harnesses against committed bytes and select the baseline**

  Re-run Steps 2 and 3. Confirm their reported totals are identical to the pre-commit totals and both remain green. Then record:

  ```powershell
  git rev-parse HEAD
  git branch --show-current
  git status --short
  git log -3 --format="%H%x09%s"
  ```

  Assign and validate the resulting `HEAD`:

  ```powershell
  $puiBaselineCommit = (git rev-parse HEAD).Trim()
  if ($puiBaselineCommit -notmatch '^[0-9a-f]{40}$') { throw 'Baseline commit is not a full Git SHA.' }
  "PUI_BASELINE=$puiBaselineCommit"
  ```

  Record every remaining dirty path as excluded working-tree state. Do not require the whole worktree to be clean.

## Task 2: Bootstrap the private PomegranateUI repository

**Files:**

- Create: `F:\git\PomegranateUI\.gitignore`
- Create: `F:\git\PomegranateUI\AGENTS.md`
- Create: `F:\git\PomegranateUI\README.md`
- Create: `F:\git\PomegranateUI\package.json`
- Generate: `F:\git\PomegranateUI\package-lock.json`
- Create: boundary `README.md` files in every reserved directory from the approved repository structure
- Test: `F:\git\PomegranateUI\tests\unit\repository-boundary.test.mjs`

- [ ] **Step 1: Verify the destination is safe to create**

  Run:

  ```powershell
  Test-Path -LiteralPath F:\git\PomegranateUI
  gh auth status
  gh repo view N0819/PomegranateUI --json nameWithOwner,visibility,url
  ```

  Expected: the local path and GitHub repository do not already exist. If either exists, inspect it and reconcile it explicitly; never initialize over existing content.

- [ ] **Step 2: Initialize the local repository and write a failing boundary test**

  Create `F:\git\PomegranateUI`, then run:

  ```powershell
  git init -b main F:\git\PomegranateUI
  node --test tests/unit/repository-boundary.test.mjs
  ```

  The test must initially fail because the reserved directory READMEs and boundary wording do not exist. It must assert:

  - all approved top-level and second-level directories exist;
  - `README.md` says “developer toolkit” and says PomegranateUI is not an application frontend;
  - package READMEs reserve `@pomegranate-ui/contracts`, `core`, `layout`, `react`, `testkit`, and `theme` without claiming they are implemented;
  - example READMEs forbid importing Sonder server code; and
  - no `.ts` or `.tsx` production file exists yet.

- [ ] **Step 3: Create the repository boundary documents and tooling package**

  `package.json` must be private and contain no publishable workspaces yet:

  ```json
  {
    "name": "pomegranate-ui-incubator",
    "version": "0.0.0-private",
    "private": true,
    "type": "module",
    "engines": { "node": ">=24" },
    "scripts": {
      "test:unit": "node --test tests/unit/*.test.mjs",
      "test:browser": "playwright test",
      "check:extraction": "node scripts/verify-extraction.mjs",
      "report": "node scripts/generate-migration-report.mjs --check",
      "check": "npm run test:unit && npm run check:extraction && npm run report && npm run test:browser"
    }
  }
  ```

  The initial file deliberately has no dependency range. The next step resolves and records one exact Playwright version.

  `AGENTS.md` must carry the product boundary, provenance rules, test commands, no-retirement rule, and the prohibition on treating a prototype as package authority. `README.md` must describe the two evidence lanes and state that TypeScript begins in Tranche 3.

- [ ] **Step 4: Install tooling and make the boundary test green**

  Run:

  ```powershell
  $puiPlaywrightVersion = ((npm.cmd view @playwright/test version) | Select-Object -Last 1).Trim()
  if ($puiPlaywrightVersion -notmatch '^\d+\.\d+\.\d+$') { throw 'Registry did not return one exact Playwright version.' }
  npm.cmd install --save-dev --save-exact "@playwright/test@$puiPlaywrightVersion"
  node --test tests/unit/repository-boundary.test.mjs
  npm.cmd exec playwright install chromium
  ```

  Expected: the boundary test passes and both `package.json` and the lockfile contain the same exact Playwright version.

- [ ] **Step 5: Commit the repository foundation**

  Run:

  ```powershell
  git status --short
  git add -- .gitignore AGENTS.md README.md package.json package-lock.json apps design examples packages prototypes provenance registry tests/unit/repository-boundary.test.mjs
  git commit -m "chore: establish private toolkit incubator"
  ```

## Task 3: Implement a commit-addressed, lossless importer

**Files:**

- Create: `provenance/source-scope.json`
- Create: `scripts/lib/extraction.mjs`
- Create: `scripts/import-sonder-baseline.mjs`
- Create: `tests/fixtures/source-repo/**`
- Create: `tests/unit/extraction.test.mjs`

- [ ] **Step 1: Define the reviewed source scope**

  `provenance/source-scope.json` must include these directory mappings:

  | Source path | Destination path | Default classification |
  |---|---|---|
  | `docs/experiments/sonder-atmospheric-workbench/` | `prototypes/sonder-baseline/atmospheric-workbench/` | `historical-evidence` |
  | `docs/experiments/sonder-widget-overhaul/` | `prototypes/sonder-baseline/widget-overhaul/` | `historical-evidence` |
  | `docs/design/sonder-panels-and-widgets/` | `design/widget-specifications/sonder-panels-and-widgets/` | `toolkit-generic` |
  | `docs/design/sonder-ui-bible/` | `design/foundations/sonder-ui-bible/` | `reference-theme` |
  | `docs/design/sonder-ui-replacement/CANDIDATE_SALVAGE_LEDGER.md` | `provenance/sonder-design/CANDIDATE_SALVAGE_LEDGER.md` | `historical-evidence` |
  | `docs/guides/INTERFACE.md` | `provenance/sonder-guides/INTERFACE.md` | `sonder-integration` |
  | `docs/guides/UI_REFERENCE.md` | `provenance/sonder-guides/UI_REFERENCE.md` | `historical-evidence` |
  | `docs/superpowers/specs/2026-08-27-pomegranateui-extraction-design.md` | `provenance/sonder-plans-and-specs/2026-08-27-pomegranateui-extraction-design.md` | `historical-evidence` |
  | `docs/superpowers/specs/2026-08-24-sonder-atmospheric-digital-workbench-mockup-design.md` | `provenance/sonder-plans-and-specs/2026-08-24-sonder-atmospheric-digital-workbench-mockup-design.md` | `historical-evidence` |
  | `docs/superpowers/specs/2026-08-27-panel-subpanels-natural-flow-design.md` | `provenance/sonder-plans-and-specs/2026-08-27-panel-subpanels-natural-flow-design.md` | `historical-evidence` |
  | `docs/superpowers/plans/2026-08-24-sonder-atmospheric-workbench-calibration.md` | `provenance/sonder-plans-and-specs/2026-08-24-sonder-atmospheric-workbench-calibration.md` | `historical-evidence` |
  | `docs/superpowers/plans/2026-08-25-sonder-panels-widget-catalog-mockup.md` | `provenance/sonder-plans-and-specs/2026-08-25-sonder-panels-widget-catalog-mockup.md` | `historical-evidence` |
  | `docs/superpowers/plans/2026-08-26-sonder-all-widget-mockup.md` | `provenance/sonder-plans-and-specs/2026-08-26-sonder-all-widget-mockup.md` | `historical-evidence` |
  | `docs/superpowers/plans/2026-08-26-sonder-widget-catalog-direct-drag.md` | `provenance/sonder-plans-and-specs/2026-08-26-sonder-widget-catalog-direct-drag.md` | `historical-evidence` |
  | `docs/superpowers/plans/2026-08-27-panel-subpanels-natural-flow.md` | `provenance/sonder-plans-and-specs/2026-08-27-panel-subpanels-natural-flow.md` | `historical-evidence` |
  | `docs/superpowers/plans/2026-08-27-pomegranateui-tranches-0-2.md` | `provenance/sonder-plans-and-specs/2026-08-27-pomegranateui-tranches-0-2.md` | `historical-evidence` |
  | `LICENSE` | `provenance/SONDER_LICENSE.txt` | `asset-or-license` |
  | `artifacts/minimal-ui-icons/README.md` | `provenance/assets/minimal-ui-icons/README.md` | `asset-or-license` |
  | `artifacts/minimal-ui-icons/manifest.json` | `provenance/assets/minimal-ui-icons/manifest.json` | `asset-or-license` |

  Add `referencedAssetRules` for `artifacts/minimal-ui-icons/*.svg`: every `.svg` basename appearing in any imported HTML or Markdown file must be resolved through the source manifest and copied to `prototypes/sonder-baseline/assets/minimal-ui-icons/`.

- [ ] **Step 2: Write failing importer tests**

  Build a tiny Git fixture repository with two commits and a dirty working-tree modification. Tests must prove:

  - imported content comes from the requested commit, not the dirty working tree;
  - directory and single-file mappings preserve exact bytes;
  - destination paths cannot escape the repository;
  - duplicate destinations fail;
  - a missing mapped source fails;
  - a referenced icon absent from the source manifest fails;
  - imported files receive lower-case SHA-256 hashes; and
  - source commit, branch, and remote are recorded.

  Run:

  ```powershell
  node --test tests/unit/extraction.test.mjs
  ```

  Expected: FAIL because the importer library does not exist.

- [ ] **Step 3: Implement the smallest importer that satisfies the tests**

  `scripts/lib/extraction.mjs` must expose these exact interfaces:

  ```js
  export function normalizeRepoPath(value) {}
  export function sha256(buffer) {}
  export function listCommitFiles({ sourceRoot, sourceCommit, sourcePath }) {}
  export function readCommitFile({ sourceRoot, sourceCommit, sourcePath }) {}
  export function resolveScope({ sourceRoot, sourceCommit, scope }) {}
  export function findReferencedIconBasenames(importedFiles) {}
  export function importBaseline({ sourceRoot, sourceCommit, destinationRoot, scope }) {}
  ```

  Use Git's `-C`, `ls-tree`, and `show` arguments through `spawnSync` argument arrays populated from the validated `sourceRoot`, `sourceCommit`, and normalized source path. Never invoke a shell or copy working-tree bytes for mapped sources. Write destination bytes only after the full scope validates.

- [ ] **Step 4: Generate the artifact section of the manifest**

  `scripts/import-sonder-baseline.mjs` must accept:

  It accepts the flags `--source-root`, `--source-commit`, `--scope`, and `--write`. The first two values must be an absolute directory and a full 40-character commit SHA; the scope value in this repository is `provenance/source-scope.json`.

  It writes `provenance/extraction-manifest.json` with:

  ```json
  {
    "schemaVersion": 1,
    "baseline": {
      "sourceRepository": "resolved remote URL",
      "sourceBranch": "interface",
      "sourceCommit": "resolved 40-character commit"
    },
    "artifacts": [],
    "contracts": []
  }
  ```

  Each artifact records `sourcePath`, `destinationPath`, `sourceCommit`, `sourceSha256`, `destinationSha256`, `classification`, `licenseEvidence`, and `status`. Imported artifacts start as `preserved-verbatim`; Sonder-only test records added later start as `sonder-owned`.

- [ ] **Step 5: Run tests and commit the importer**

  Run:

  ```powershell
  node --test tests/unit/extraction.test.mjs
  git diff --check
  git add -- provenance/source-scope.json scripts/lib/extraction.mjs scripts/import-sonder-baseline.mjs tests/fixtures/source-repo tests/unit/extraction.test.mjs
  git commit -m "feat: add commit-addressed baseline importer"
  ```

  Expected: all importer tests pass.

## Task 4: Import the Sonder baseline and verify every byte

**Files:**

- Generate: `prototypes/sonder-baseline/**`
- Generate: `design/foundations/sonder-ui-bible/**`
- Generate: `design/widget-specifications/sonder-panels-and-widgets/**`
- Generate: `provenance/sonder-design/**`
- Generate: `provenance/sonder-guides/**`
- Generate: `provenance/sonder-plans-and-specs/**`
- Generate: `provenance/assets/**`
- Generate: `provenance/SONDER_LICENSE.txt`
- Generate/update: `provenance/extraction-manifest.json`
- Create: `provenance/source-commits.md`

- [ ] **Step 1: Import only from the selected baseline commit**

  From `F:\git\PomegranateUI`, run:

  ```powershell
  $puiBaselineCommit = (git -C F:\git\Sonder_Engine rev-parse HEAD).Trim()
  if ($puiBaselineCommit -notmatch '^[0-9a-f]{40}$') { throw 'Baseline commit is not a full Git SHA.' }
  node scripts/import-sonder-baseline.mjs --source-root F:\git\Sonder_Engine --source-commit $puiBaselineCommit --scope provenance/source-scope.json --write
  ```

  Confirm the printed SHA matches the value captured in Task 1 before accepting the write. The importer must print artifact totals grouped by classification and selected-icon count.

- [ ] **Step 2: Independently verify the generated hashes**

  Add a test case that reads every artifact entry, hashes the destination, and compares it to both recorded hashes. For each source path, independently execute Git `show` against `manifest.baseline.sourceCommit` and that artifact's source path, then hash the returned bytes. Run:

  ```powershell
  node --test tests/unit/extraction.test.mjs
  ```

  Expected: all artifacts match source and destination hashes, and no manifest destination is missing.

- [ ] **Step 3: Record the human-readable baseline evidence**

  Write `provenance/source-commits.md` with:

  - source remote and branch;
  - exact baseline SHA;
  - canonical-reference and Widget-overhaul owning commit SHAs;
  - pre-commit and post-commit harness result strings;
  - exact run date and browser engine version;
  - excluded dirty path list from Task 1; and
  - statement that imports were read from Git objects, not working-tree files.

- [ ] **Step 4: Check byte-for-byte status before committing**

  Run the importer without `--write`; it must exit zero and report no drift. Then run:

  ```powershell
  git diff --check
  git status --short
  git add -- prototypes design/foundations/sonder-ui-bible design/widget-specifications/sonder-panels-and-widgets provenance/extraction-manifest.json provenance/source-commits.md provenance/SONDER_LICENSE.txt provenance/sonder-design provenance/sonder-guides provenance/sonder-plans-and-specs provenance/assets
  git commit -m "docs: preserve the Sonder UI baseline"
  ```

## Task 5: Assign stable IDs to every legacy contract and Widget surface

**Files:**

- Create: `scripts/generate-contract-index.mjs`
- Create: `provenance/contract-family-rules.json`
- Generate: `provenance/contract-index.json`
- Update: `provenance/extraction-manifest.json`
- Create: `tests/unit/contracts.test.mjs`

- [ ] **Step 1: Write failing parser and identity tests**

  Tests must cover:

  - all `run(literalTitle, callback)` cases in both preserved harnesses are extracted once;
  - every non-header Widget-overhaul ledger row is extracted once;
  - applicable acceptance bullets/tables identified in `source-scope.json` are extracted once;
  - IDs remain unchanged when source order or line numbers change;
  - IDs change if the normalized behavior title changes;
  - duplicate normalized evidence within one source fails unless it has an explicit discriminator;
  - every ID begins with an approved family; and
  - `retired-approved` is rejected.

  Run:

  ```powershell
  node --test tests/unit/contracts.test.mjs
  ```

  Expected: FAIL because the generator does not exist.

- [ ] **Step 2: Define deterministic contract families**

  `provenance/contract-family-rules.json` must classify in this precedence order:

  1. Sonder routes, persistence endpoints, runtime stages, and backend authority -> `POM-INTEGRATION-SONDER`;
  2. keyboard, focus, accessible names, announcements, reduced motion, and input equivalence -> `POM-A11Y`;
  3. drag start, pointer movement, release, invalid drop, cancel, and exact-origin restoration -> `POM-DRAG`;
  4. viewport, width, height, phone, tablet, landscape, stacking, and reflow -> `POM-RESPONSIVE`;
  5. stored layout, save/restore, schema version, migration, and persistence envelope -> `POM-PERSIST`;
  6. Catalog discovery, filtering, miniature, search, and placement source -> `POM-CATALOG`;
  7. theme, token, contrast, typography, color, motion, sound, and feedback -> `POM-THEME`;
  8. panel, shelf, toolbar, slot, tab, docking, floating, resizing, and undo -> `POM-PANEL` or `POM-LAYOUT`, selected by the explicit rule match;
  9. Widget manifest, instance, renderer, lifecycle, state family, and audited surface -> `POM-WIDGET`.

  Unmatched evidence must fail generation instead of defaulting silently.

- [ ] **Step 3: Implement stable semantic IDs and extraction**

  Export these interfaces from `scripts/generate-contract-index.mjs`:

  ```js
  export function extractHarnessCases(sourceText, sourcePath) {}
  export function extractLedgerRows(sourceText, sourcePath) {}
  export function classifyContract(evidence, rules) {}
  export function stableContractId({ family, normalizedEvidence, discriminator }) {}
  export function buildContractIndex({ manifest, importedRoot, rules }) {}
  ```

  Construct IDs as the string `POM-${family}-${digest}`, where `digest` is the first 10 uppercase hexadecimal characters of SHA-256 over `family + "\0" + normalizedEvidence + "\0" + explicitDiscriminator`. Do not include line numbers, destination paths, or array order in the digest.

- [ ] **Step 4: Generate and review the complete contract index**

  Run:

  ```powershell
  node scripts/generate-contract-index.mjs --write
  node --test tests/unit/contracts.test.mjs
  ```

  Review every unmatched or duplicate report. Add an explicit family rule or discriminator for each legitimate case; do not suppress rows. The generated totals must be read from the source and must include every currently reported harness case and every current ledger surface.

- [ ] **Step 5: Link contracts into the extraction manifest and commit**

  Each contract entry must carry the approved manifest fields: `contractId`, `sourcePath`, `sourceCommit`, `sourceSha256`, `sourceEvidence`, `classification`, `destinationOwner`, `destinationEvidence`, and `status`.

  Legacy PomegranateUI behavior starts as `preserved-verbatim` with the preserved harness or document in `destinationEvidence`. Sonder integration behavior starts as `sonder-owned` and names the source-side test or guide. Run:

  ```powershell
  node --test tests/unit/contracts.test.mjs
  git diff --check
  git add -- scripts/generate-contract-index.mjs provenance/contract-family-rules.json provenance/contract-index.json provenance/extraction-manifest.json tests/unit/contracts.test.mjs
  git commit -m "feat: index preserved UI contracts"
  ```

## Task 6: Account for relevant Sonder tests without moving backend authority

**Files:**

- Create: `provenance/sonder-test-dispositions.json`
- Update: `provenance/contract-index.json`
- Update: `provenance/extraction-manifest.json`
- Update: `tests/unit/contracts.test.mjs`

- [ ] **Step 1: Discover the source-side test candidates from the baseline commit**

  Read the exact SHA from `extraction-manifest.json`, then use it to enumerate tests:

  ```powershell
  $puiBaselineCommit = (Get-Content -Raw provenance/extraction-manifest.json | ConvertFrom-Json).baseline.sourceCommit
  git -C F:\git\Sonder_Engine ls-tree -r --name-only $puiBaselineCommit -- tests
  ```

  Select candidates whose path or source mentions Panel, Widget, Catalog, dock, float, drag, layout, responsive, accessibility, focus, keyboard, theme, transcript, composer, preview, UI, or frontend contracts. Store every discovered candidate in `provenance/sonder-test-dispositions.json`.

- [ ] **Step 2: Write a failing disposition-completeness test**

  The test must rediscover candidates from the baseline and require exactly one disposition per path:

  - `pomegranate-generic-preserved-reference`;
  - `sonder-consumer-contract`;
  - `sonder-backend-authority`; or
  - `not-ui-evidence`, with a non-empty rationale.

  It must reject missing paths, duplicate paths, stale paths, empty rationale, and generic tests without a linked PomegranateUI contract ID.

- [ ] **Step 3: Review every disposition**

  Apply the approved ownership table literally. Generic interaction behavior belongs to PomegranateUI. Routes, authentication, save storage, Director, Living World, Charter, cognition, and engine semantics remain Sonder-owned. Adapter/conversion behavior is a `sonder-consumer-contract` even when it has no native PomegranateUI equivalent yet.

- [ ] **Step 4: Make the disposition test green and commit**

  Run:

  ```powershell
  node --test tests/unit/contracts.test.mjs
  git add -- provenance/sonder-test-dispositions.json provenance/contract-index.json provenance/extraction-manifest.json tests/unit/contracts.test.mjs
  git commit -m "docs: assign Sonder UI test ownership"
  ```

## Task 7: Run both preserved browser oracles from PomegranateUI

**Files:**

- Create: `scripts/serve-static.mjs`
- Create: `playwright.config.mjs`
- Create: `tests/browser/preserved-harnesses.spec.mjs`
- Create: `tests/unit/static-server.test.mjs`
- Generate: `test-results/**` only during test execution; keep ignored

- [ ] **Step 1: Write a failing path-safety test for the static server**

  Test successful serving of an imported HTML file, correct MIME types for HTML/CSS/JS/SVG/font assets, 404 for missing files, and 403 for traversal attempts. Run:

  ```powershell
  node --test tests/unit/static-server.test.mjs
  ```

  Expected: FAIL because the server does not exist.

- [ ] **Step 2: Implement the smallest safe static server**

  `scripts/serve-static.mjs` must accept `--root` and `--port`, bind to `127.0.0.1`, normalize URL paths, reject traversal, and exit cleanly on `SIGINT`/`SIGTERM`.

- [ ] **Step 3: Write the browser tests before the Playwright configuration**

  Define a table with exactly these pages:

  ```text
  /prototypes/sonder-baseline/atmospheric-workbench/sonder-drag-regression.html
  /prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html
  ```

  For each page:

  - wait until `document.title` starts with `PASS —` or `FAIL —`;
  - require it to start with `PASS —`;
  - require `#results .fail` count to be zero;
  - parse `#results h1` as `<passed>/<total> passed` and require equal positive integers;
  - collect the reported total as test annotation rather than hard-coding it; and
  - attach the result page screenshot and result text on failure.

  Run:

  ```powershell
  npm.cmd run test:browser
  ```

  Expected: FAIL because no Playwright web server is configured.

- [ ] **Step 4: Configure Chromium and make both oracles green**

  `playwright.config.mjs` must use `scripts/serve-static.mjs --root . --port 4173`, `baseURL: http://127.0.0.1:4173`, one worker, trace on first retry, and screenshot only on failure. Give each preserved harness 120 seconds because it executes a large browser suite.

  Run:

  ```powershell
  npm.cmd run test:unit
  npm.cmd run test:browser
  ```

  Expected: both browser pages report all of their own dynamically discovered cases passing.

- [ ] **Step 5: Commit the executable legacy lane**

  Run:

  ```powershell
  git add -- scripts/serve-static.mjs playwright.config.mjs tests/browser/preserved-harnesses.spec.mjs tests/unit/static-server.test.mjs .gitignore
  git commit -m "test: run preserved browser oracles"
  ```

## Task 8: Enforce provenance, licenses, and zero unaccounted contracts

**Files:**

- Create: `scripts/verify-extraction.mjs`
- Create: `tests/unit/verification.test.mjs`
- Update: `provenance/extraction-manifest.json`

- [ ] **Step 1: Write failing tests for every preservation gate**

  Fixture mutations must prove the verifier fails for:

  - missing or hash-mismatched artifact;
  - source path in scope but absent from the artifact manifest;
  - artifact entry whose source path is no longer in scope;
  - legacy browser case without a stable ID;
  - Widget-ledger row without a destination owner;
  - unknown contract ID cited by destination evidence;
  - contract with no evidence;
  - referenced asset without manifest provenance or license evidence;
  - `retired-approved` during extraction;
  - any status outside the approved enum; and
  - any `unaccounted` item.

- [ ] **Step 2: Implement the verifier as a pure check**

  Export:

  ```js
  export function verifyExtraction({ root, manifest, contractIndex, scope, testDispositions }) {}
  ```

  Return structured findings for unit tests. The CLI prints grouped failures and exits non-zero without rewriting generated files.

- [ ] **Step 3: Prove selected icon provenance**

  For every copied SVG, verify:

  - its basename appears in an imported evidence file;
  - its source manifest entry exists;
  - source-manifest SHA-256 matches imported bytes;
  - license metadata is `CC0`; and
  - the icon provenance README is present.

  Full source manifest preservation is required even though only referenced SVG files are copied.

- [ ] **Step 4: Run all non-browser checks and commit**

  Run:

  ```powershell
  npm.cmd run test:unit
  npm.cmd run check:extraction
  git add -- scripts/verify-extraction.mjs tests/unit/verification.test.mjs provenance/extraction-manifest.json
  git commit -m "test: enforce extraction completeness"
  ```

## Task 9: Generate the migration ledger and coverage report

**Files:**

- Create: `scripts/generate-migration-report.mjs`
- Generate: `provenance/extraction-ledger.md`
- Generate: `provenance/migration-report.md`
- Create: `tests/unit/report.test.mjs`

- [ ] **Step 1: Write failing deterministic-report tests**

  Test that the report calculates, from the manifest rather than constants:

  - total baseline contracts;
  - preserved artifacts;
  - assigned Widget/renderer surfaces;
  - `dual-green` contracts;
  - Sonder-owned contracts;
  - awaiting-native-port contracts;
  - unaccounted contracts;
  - counts by family, classification, status, and destination owner; and
  - both preserved harness names and their latest reported totals.

  The same inputs must produce byte-identical Markdown. `--check` must fail if committed reports are stale.

- [ ] **Step 2: Implement and generate both Markdown files**

  `extraction-ledger.md` is the row-by-row view. `migration-report.md` is the aggregate view and must display `Unaccounted: 0` prominently. Run:

  ```powershell
  node scripts/generate-migration-report.mjs --write
  node --test tests/unit/report.test.mjs
  node scripts/generate-migration-report.mjs --check
  ```

- [ ] **Step 3: Commit generated accountability evidence**

  Run:

  ```powershell
  git add -- scripts/generate-migration-report.mjs tests/unit/report.test.mjs provenance/extraction-ledger.md provenance/migration-report.md
  git commit -m "docs: publish extraction coverage ledger"
  ```

## Task 10: Add preservation CI and prove a clean clone

**Files:**

- Create: `.github/workflows/ci.yml`
- Update: `README.md`
- Update: `provenance/source-commits.md`

- [ ] **Step 1: Create a failing local workflow-equivalence check**

  From a fresh temporary clone of the local PomegranateUI repository, run:

  ```powershell
  npm.cmd ci
  npm.cmd exec playwright install chromium
  npm.cmd run check
  ```

  Expected before workflow setup: repository checks pass locally, but no CI definition exists; `repository-boundary.test.mjs` should fail until it requires `.github/workflows/ci.yml`.

- [ ] **Step 2: Add GitHub Actions with the same commands**

  `.github/workflows/ci.yml` must:

  - run on pushes to `main` and pull requests;
  - use Node 24;
  - run `npm ci`;
  - install Chromium with Playwright's dependency command on Ubuntu;
  - run `npm run check`;
  - upload Playwright artifacts only on failure; and
  - use minimal `contents: read` permissions.

  Pin action revisions to immutable SHAs resolved with GitHub CLI during implementation. Record the associated action release tags in workflow comments.

- [ ] **Step 3: Re-run the clean-clone proof**

  Create a new temporary directory, clone from `F:\git\PomegranateUI`, and run the exact commands from Step 1. Do not rely on the development checkout's `node_modules`, Playwright browser cache beyond the explicit install command, or ignored generated files.

- [ ] **Step 4: Commit CI and private-incubation documentation**

  Update `README.md` with the exact local check commands, source baseline SHA, and a statement that no production TypeScript package exists yet. Then run:

  ```powershell
  git add -- .github/workflows/ci.yml README.md provenance/source-commits.md tests/unit/repository-boundary.test.mjs
  git commit -m "ci: verify preservation from a clean clone"
  ```

## Task 11: Create the private GitHub repository and verify remote CI

**Files:**

- No new product files expected
- Update only if remote URL recording is absent: `provenance/source-commits.md`

- [ ] **Step 1: Reconfirm GitHub authentication and repository absence**

  Run with network permission:

  ```powershell
  gh auth status
  gh repo view N0819/PomegranateUI --json nameWithOwner,visibility,url
  ```

  Continue only when authentication is valid and an existing repository will not be overwritten.

- [ ] **Step 2: Run the complete local release gate**

  Run:

  ```powershell
  npm.cmd run check
  git status --short
  git log --oneline --decorate -8
  ```

  Expected: all unit, extraction, report, and browser checks pass; working tree is clean; migration report says zero unaccounted.

- [ ] **Step 3: Create and push the private repository**

  Run with network permission:

  ```powershell
  gh repo create N0819/PomegranateUI --private --source F:\git\PomegranateUI --remote origin --push
  gh repo view N0819/PomegranateUI --json nameWithOwner,visibility,url,defaultBranchRef
  ```

  Expected: visibility is `PRIVATE` and default branch is `main`.

- [ ] **Step 4: Watch the first CI run to completion**

  Run with network permission:

  ```powershell
  gh run list --repo N0819/PomegranateUI --branch main --limit 5
  gh run watch --repo N0819/PomegranateUI --exit-status
  ```

  If CI fails, inspect the exact job log, apply systematic debugging in PomegranateUI, add a regression test when behavior changes, commit, push, and watch the replacement run.

## Task 12: Final cross-repository preservation audit

**Files:**

- Verify: all PomegranateUI provenance and test files
- Verify: Sonder source baseline and current working tree
- Do not edit or remove Sonder source artifacts

- [ ] **Step 1: Re-verify the exact source commit still exists and imported bytes still match**

  Run from PomegranateUI:

  ```powershell
  $puiBaselineCommit = (Get-Content -Raw provenance/extraction-manifest.json | ConvertFrom-Json).baseline.sourceCommit
  git -C F:\git\Sonder_Engine cat-file -e "$puiBaselineCommit`^{commit}"
  node scripts/import-sonder-baseline.mjs --source-root F:\git\Sonder_Engine --source-commit $puiBaselineCommit --scope provenance/source-scope.json
  npm.cmd run check
  ```

  Expected: no import drift and every check passes.

- [ ] **Step 2: Confirm Sonder was not cut over or stripped**

  Run from Sonder:

  ```powershell
  $puiBaselineCommit = (Get-Content -Raw F:\git\PomegranateUI\provenance\extraction-manifest.json | ConvertFrom-Json).baseline.sourceCommit
  git status --short
  git ls-tree -r --name-only $puiBaselineCommit -- docs/experiments/sonder-atmospheric-workbench docs/experiments/sonder-widget-overhaul docs/design/sonder-panels-and-widgets docs/design/sonder-ui-bible
  ```

  Compare the final status with Task 1's excluded dirty-path inventory. No unrelated path may have been deleted, cleaned, or committed accidentally.

- [ ] **Step 3: Inspect final accountability totals**

  Confirm:

  - `Unaccounted: 0`;
  - no `retired-approved` status;
  - every baseline file has matching source and destination hashes;
  - every legacy browser case has one stable ID;
  - every Widget-ledger row has one owner;
  - every relevant Sonder test has one disposition;
  - both preserved harnesses pass from PomegranateUI; and
  - remote `main` CI is green.

- [ ] **Step 4: Record the completion boundary**

  Add no TypeScript implementation in this task. Report Tranches 0-2 complete and open a separate Tranche 3 plan for strict TypeScript contracts, core state machines, React bindings, Workbench Lab, package packing, and the clean mock consumer.

## Plan Self-Review Checklist

- [ ] Every approved spec section is covered by at least one task or global constraint.
- [ ] Tranches 0, 1, and 2 are implemented; Tranches 3-6 are explicitly excluded.
- [ ] File mappings name exact source and destination owners.
- [ ] Every tooling behavior is introduced test-first.
- [ ] Commands use Windows-safe paths and `npm.cmd` where applicable.
- [ ] No command cleans, resets, force-pushes, deletes, or implicitly stages the entire Sonder tree.
- [ ] Harness totals and corpus counts are captured dynamically from the baseline.
- [ ] The plan contains no deferred-work marker, prose placeholder, invented SHA, or unresolved package range.
- [ ] Function names and manifest fields are consistent across tasks.
- [ ] Public publication and root-license decisions remain outside this plan.
- [ ] Final verification includes local evidence, clean-clone evidence, remote CI, source retention, and zero unaccounted contracts.
