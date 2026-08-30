# PomegranateUI Public Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a current-tree-clean, MIT-licensed PomegranateUI repository and deploy the Workbench Lab to GitHub Pages.

**Architecture:** Remove the imported evidence/provenance lane and replace its active font, icon, server, documentation, and test dependencies with Pom-native or independently licensed equivalents. Keep the native packages and Lab as the public authority, gate Pages behind the cross-platform `main` verification matrix, and change visibility only after local and private-remote proof succeeds.

**Tech Stack:** TypeScript, Svelte 5, Node.js 24, Vite 8, Vitest, Playwright, GitHub Actions, GitHub Pages, GitHub CLI

**Spec:** `docs/superpowers/specs/2026-08-30-pomegranateui-public-release-design.md`

## Global Constraints

- The final current tree has zero case-insensitive `sonder` matches in tracked paths and tracked text.
- Historical commits remain unchanged.
- Copyright holder is exactly `2026 MentallyQuill` under the standard MIT License.
- PomegranateUI remains a developer toolkit for AI roleplay frontends, not a turnkey application frontend.
- Publish only `apps/workbench-lab/dist`; do not create a `gh-pages` branch.
- Do not publish npm packages, add a backend, add a custom domain, or modify another repository.
- Preserve unrelated untracked recovery and attachment directories.
- Use `npm.cmd` on Windows and keep GitHub Actions pinned to immutable commit SHAs.
- The temporary spec and this plan must be deleted before the final current-tree audit.

---

### Task 1: Lock the public release boundary test-first

**Files:**
- Modify: `tests/unit/repository-boundary.test.mjs`
- Modify: `tests/unit/packed-consumer.test.mjs`
- Modify: `tests/unit/lab-scripts.test.mjs`

**Interfaces:**
- Consumes: repository root and public package manifests
- Produces: executable assertions for clean current-tree vocabulary, MIT metadata, native-only gates, generic examples, and one Lab server

- [ ] **Step 1: Replace preservation assertions with failing public-release assertions**

Add a text-file walk that excludes `.git`, `.worktrees`, `node_modules`, `dist`, generated test output, binary extensions, and exactly the two temporary public-release design/plan paths. Assert that every other scanned relative path and source string is free of `/sonder/i`. Replace the root `check` expectation with:

```js
assert.equal(
  rootPackage.scripts.check,
  'npm run test:unit && npm run typecheck && npm run test:native && npm run build && npm run check:recipes && npm run test:pack && npm run test:browser'
);
```

Assert `LICENSE` contains `Copyright (c) 2026 MentallyQuill`, every repository-owned manifest declares `license: "MIT"`, README contains the Pages URL, and CI contains native Pages upload/deploy actions. Remove expectations for the imported example, provenance directories, preservation attributes, migration reports, and external conformance commands.

- [ ] **Step 2: Run the boundary tests and confirm red state**

```powershell
node --test tests/unit/repository-boundary.test.mjs tests/unit/packed-consumer.test.mjs tests/unit/lab-scripts.test.mjs
```

Expected: FAIL because imported paths/text, missing MIT metadata, old scripts, and dual-server setup still exist.

- [ ] **Step 3: Keep the test failure focused**

Confirm the failures name the intended release gaps rather than syntax or fixture errors. Fix only test code defects; do not weaken the zero-match contract.

- [ ] **Step 4: Commit the red contract tests**

```powershell
git add tests/unit/repository-boundary.test.mjs tests/unit/packed-consumer.test.mjs tests/unit/lab-scripts.test.mjs
git commit -m "test: define public release boundary"
```

### Task 2: Replace active inherited assets and simplify browser hosting

**Files:**
- Create: `apps/workbench-lab/src/assets/fonts/` with three font binaries and the Geist/Newsreader license texts
- Create: `apps/workbench-lab/src/assets/icons/{dock-left,dock-right,grid,move,float,remove}.svg`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/themes/deep-current.ts`
- Modify: `tests/browser/global-setup.mjs`
- Modify: `playwright.config.mjs`
- Modify: `tests/unit/browser-server-lifecycle.test.mjs`
- Delete: `apps/workbench-lab/src/assets/deep-current-stage.jpg`

**Interfaces:**
- Consumes: Vite asset URL rewriting and `createStaticServer({ root, host, port })`
- Produces: one Lab-only `startBrowserServer({ root, port = 4174 })` result with `labOrigin`, `labUrl`, and idempotent `close()`

- [ ] **Step 1: Write failing asset and server lifecycle assertions**

Assert CSS uses only `./assets/fonts/` and `./assets/icons/`; assert `App.svelte` has no uncertain stage import/registry entry; assert `startBrowserServer` serves the Lab on an ephemeral port and closes idempotently.

- [ ] **Step 2: Run focused tests and confirm red state**

```powershell
node --test tests/unit/browser-server-lifecycle.test.mjs tests/unit/repository-boundary.test.mjs
```

Expected: FAIL on old prototype URLs, two-server interface, and the uncertain stage asset.

- [ ] **Step 3: Relocate independently licensed fonts**

Move the three font binaries and exact upstream license texts into `apps/workbench-lab/src/assets/fonts/`. Update `@font-face` URLs to `./assets/fonts/<filename>`.

- [ ] **Step 4: Add Pom-native SVG controls**

Create six 24-by-24, `fill="none"`, `stroke="currentColor"`, `stroke-linecap="round"`, `stroke-linejoin="round"` SVGs. Use simple authored geometry: left/right arrows, a four-square grid, crossed move arrows, two offset rectangles for float, and a lidded trash can. Update action CSS to use these local assets.

- [ ] **Step 5: Remove the uncertain Deep Current image dependency**

Delete its import and asset-registry entry from `App.svelte`. Change the Deep Current canvas recipe to gradients and existing semantic colors only; delete the JPEG.

- [ ] **Step 6: Replace the dual browser server with one Lab server**

Expose:

```js
export async function startBrowserServer({
  root,
  port = 4174,
  labRoot = path.join(root, 'apps/workbench-lab/dist')
})
```

Return `{ labOrigin, labUrl: labOrigin, close }`, serve only `labRoot`, and set Playwright `baseURL` to `http://127.0.0.1:4174`.

- [ ] **Step 7: Run focused tests and build**

```powershell
node --test tests/unit/browser-server-lifecycle.test.mjs tests/unit/lab-scripts.test.mjs
npm.cmd run build
```

Expected: PASS; emitted assets contain neutral font/icon paths and no uncertain JPEG.

- [ ] **Step 8: Commit asset independence**

```powershell
git add apps/workbench-lab/src tests/browser/global-setup.mjs tests/unit/browser-server-lifecycle.test.mjs playwright.config.mjs
git commit -m "refactor(lab): own public demo assets"
```

### Task 3: Remove imported evidence, provenance, and external-oracle lanes

**Files:**
- Delete: `prototypes/`, `provenance/`, imported design foundations/specifications, imported theme recordings, and `examples/sonder-integration/`
- Delete: extraction/import/report scripts, `scripts/conformance/`, `tests/conformance/`, and `playwright.conformance.config.mjs`
- Delete: preservation/extraction/report unit and browser tests
- Modify: `package.json`, `package-lock.json`, `tsconfig.tests.json`, `.gitattributes`
- Modify: `scripts/verify-packed-consumers.mjs` and remaining unit tests that enumerate examples or gates

**Interfaces:**
- Consumes: native package APIs, recipe verifier, packed-consumer verifier, and native browser suite
- Produces: `npm.cmd run check` as the complete public native gate

- [ ] **Step 1: Remove scripts for retired lanes from `package.json`**

Remove `check:extraction`, `report`, every `test:conformance:*` script, `test:conformance`, and `inspect:conformance`. Set `check` to the exact Task 1 string.

- [ ] **Step 2: Remove imported trees and dedicated tools/tests**

Use path-scoped `git rm -r` for the listed directories and files. Remove all `.gitattributes` preservation entries and keep only generally applicable repository attributes.

- [ ] **Step 3: Retain native testkit contracts without extraction tooling**

Keep `packages/testkit` public conformance helpers and Pom contract IDs. Delete unit tests that rebuild those IDs from imported artifacts; retain package-native tests that exercise public APIs directly.

- [ ] **Step 4: Remove the imported packed-consumer example**

Update `verify-packed-consumers.mjs` and packed-consumer tests to use only `examples/mock-roleplay-backend` plus isolated generated consumers. Keep all six package checks.

- [ ] **Step 5: Remove old source-authority references from active code**

Edit Lab catalog/fixture/theme copy and remaining tests to describe generic AI-roleplay host data and Pom-native behavior. Delete old plan/spec documents that exist to record the imported lane; keep the temporary release spec and plan until Task 6.

- [ ] **Step 6: Run native non-browser gates**

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:native
npm.cmd run build
npm.cmd run check:recipes
npm.cmd run test:pack
```

Expected: all commands PASS with no missing imported files.

- [ ] **Step 7: Commit clean separation**

```powershell
git add -A
git commit -m "refactor: remove imported evidence lane"
```

### Task 4: Add MIT licensing and public documentation

**Files:**
- Create: `LICENSE`, `THIRD_PARTY_NOTICES.md`
- Modify: every repository-owned `package.json` and `package-lock.json`
- Modify: `README.md`, `AGENTS.md`, Lab/canonical docs, and registry documentation
- Modify/Delete: remaining historical documents containing retired vocabulary

**Interfaces:**
- Consumes: OSI standard MIT wording and retained font license texts
- Produces: GitHub-detectable root license, package metadata, contributor-facing public docs, and canonical demo URL

- [ ] **Step 1: Add the exact MIT license**

Create the unmodified standard MIT body beginning:

```text
MIT License

Copyright (c) 2026 MentallyQuill
```

- [ ] **Step 2: Add focused third-party notices**

Document Geist/Geist Mono and Newsreader, point to redistributed license files, and state that retained project-specific generated artwork was created for PomegranateUI without third-party reference images. Do not retain notices for removed upstream material.

- [ ] **Step 3: Add package metadata**

Set `"license": "MIT"` in the root, app, generic example, and all six package manifests. Regenerate the lock with `npm.cmd install --package-lock-only` and confirm no dependency drift.

- [ ] **Step 4: Rewrite public-state documentation**

Keep `developer toolkit`, `not an application frontend`, `AI roleplay frontends`, `source-owned recipes`, and `contracts -> layout -> core -> svelte`. Add `https://mentallyquill.github.io/PomegranateUI/`, MIT licensing, local commands, and `apps/workbench-lab/dist`. Remove private-incubator, imported-authority, preservation, and cutover language.

- [ ] **Step 5: Run licensing and documentation tests**

```powershell
node --test tests/unit/repository-boundary.test.mjs tests/unit/packed-consumer.test.mjs
npm.cmd run test:unit
```

Expected: package/license/documentation assertions PASS; only temporary release documents still name removed material.

- [ ] **Step 6: Commit licensing and public docs**

```powershell
git add LICENSE THIRD_PARTY_NOTICES.md package.json package-lock.json packages apps examples README.md AGENTS.md docs registry tests
git commit -m "docs: license PomegranateUI under MIT"
```

### Task 5: Gate and deploy GitHub Pages from verified main

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `tests/unit/repository-boundary.test.mjs`

**Interfaces:**
- Consumes: successful `verification` matrix and `apps/workbench-lab/dist`
- Produces: `publish-demo` using `github-pages` and `steps.deployment.outputs.page_url`

- [ ] **Step 1: Add failing workflow assertions**

Assert `workflow_dispatch`, the two-OS matrix, `publish-demo`, `needs: verification`, a public-main-only condition, Pages concurrency, `pages: write`, `id-token: write`, configure/upload/deploy actions, and artifact path `apps/workbench-lab/dist`. Continue requiring 40-character action SHAs.

- [ ] **Step 2: Run the workflow test and confirm red state**

```powershell
node --test tests/unit/repository-boundary.test.mjs
```

Expected: FAIL because `publish-demo` is absent.

- [ ] **Step 3: Add the CI-gated Pages job**

Rename the workflow to `Native toolkit CI`, add `workflow_dispatch`, and keep default `contents: read`. Configure:

```yaml
publish-demo:
  name: Publish Workbench Lab
  needs: verification
  if: github.ref == 'refs/heads/main' && github.event.repository.visibility == 'public'
  runs-on: ubuntu-latest
  permissions:
    contents: read
    pages: write
    id-token: write
  environment:
    name: github-pages
    url: ${{ steps.deployment.outputs.page_url }}
  concurrency:
    group: github-pages
    cancel-in-progress: true
```

Check out, set up Node 24, run `npm ci`, run `npm run build`, configure Pages, upload `apps/workbench-lab/dist`, and deploy. Resolve every action tag to a current immutable SHA.

- [ ] **Step 4: Run workflow and build tests**

```powershell
node --test tests/unit/repository-boundary.test.mjs
npm.cmd run build
```

Expected: PASS and `apps/workbench-lab/dist/index.html` exists.

- [ ] **Step 5: Commit Pages automation**

```powershell
git add .github/workflows/ci.yml tests/unit/repository-boundary.test.mjs
git commit -m "ci: deploy verified Workbench demo"
```

### Task 6: Final current-tree audit and private verification

**Files:**
- Delete: the temporary public-release spec and this implementation plan
- Modify: `tests/unit/repository-boundary.test.mjs`
- Modify: any final file found by the zero-match audit

**Interfaces:**
- Consumes: all prior tasks
- Produces: exact private release commit eligible for public visibility

- [ ] **Step 1: Delete temporary release documents**

Remove the spec and plan so the current tree satisfies its zero-match rule; their committed history remains available. Remove their temporary exceptions from `repository-boundary.test.mjs` so no current tracked file is exempt from the assertion.

- [ ] **Step 2: Run exact path and text audits**

```powershell
git ls-files | rg -n -i sonder
git grep -I -n -i sonder -- .
```

Expected: both commands return exit code 1 with no matches. Review retained binary asset provenance manually.

- [ ] **Step 3: Run diff and status checks**

```powershell
git diff --check
git status --short
git diff --stat origin/main...HEAD
```

Expected: no whitespace errors and only intended release changes.

- [ ] **Step 4: Run the complete native gate**

```powershell
npm.cmd run check
```

Expected: PASS for unit, type, native, build, recipes, six packed packages/clean consumers, and native browser/visual/accessibility tests.

- [ ] **Step 5: Scan current tree and full history for secrets**

Run a pinned official Gitleaks release against the working tree and Git history. Also check tracked secret-like filenames and provider-token patterns. Expected: zero verified findings. A credible secret blocks public visibility until removed or revoked.

- [ ] **Step 6: Commit final audit cleanup**

```powershell
git add -A
git commit -m "chore: finalize public release boundary"
```

- [ ] **Step 7: Re-run final verification against committed tree**

```powershell
npm.cmd run check
git diff HEAD --check
git status --short
```

Expected: complete PASS and clean status.

### Task 7: Publish, make public, and launch Pages

**Files:**
- External state: `MentallyQuill/PomegranateUI`

**Interfaces:**
- Consumes: locally verified branch HEAD and GitHub CLI authentication
- Produces: public repository, verified `main`, configured Pages site, and live HTTPS demo

- [ ] **Step 1: Reconcile with current remote main**

Use `gh api 'repos/MentallyQuill/PomegranateUI/commits/main' --jq '.sha'` and fetch current refs. If `origin/main` advanced, integrate without force-pushing, rerun the complete gate, and preserve concurrent work.

- [ ] **Step 2: Push the exact release commit while private**

Push the release branch as backup, then fast-forward `main` only when remote ancestry is verified. Record the exact SHA.

- [ ] **Step 3: Watch private CI for the release SHA**

Require both Ubuntu and Windows `Native toolkit CI` matrix jobs to pass. The Pages job remains skipped while visibility is private.

- [ ] **Step 4: Verify settings before visibility change**

Snapshot visibility, rulesets/branch protection, Actions permissions, secret alerts, and current workflow logs. Confirm no unexpected public-sensitive artifacts or logs.

- [ ] **Step 5: Make the repository public**

```powershell
gh repo edit MentallyQuill/PomegranateUI --visibility public --accept-visibility-change-consequences
```

Verify `PUBLIC`, MIT detection, and expected `main` SHA. Restore prior protection if GitHub disabled it during the visibility change.

- [ ] **Step 6: Configure and dispatch GitHub Pages**

Create the Pages site with Actions as build type, set the repository homepage to `https://mentallyquill.github.io/PomegranateUI/`, and dispatch `ci.yml` on `main`. Watch the matrix and `publish-demo` job through completion.

- [ ] **Step 7: Verify deployment identity and live behavior**

Confirm Pages deployment/status APIs bind deployment to the release SHA. At the live HTTPS URL verify assets, all themes, representative Widget interaction, compact and wide viewports, persisted settings after reload, accessibility semantics, and zero console errors.

- [ ] **Step 8: Record final state**

Report the repository URL, demo URL, release SHA, local/CI counts, Pages run URL, deployment status, and non-blocking limitations. Confirm the primary dirty checkout was not modified by release implementation.
