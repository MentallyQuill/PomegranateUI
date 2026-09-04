# Theme-Scoped Typography Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the redundant Reading and Layout preset picker with bundled, theme-scoped typography authoring; derive theme thumbnails dynamically; and make Open Custom Theme visibly navigate to its editor.

**Architecture:** Add optional typography to v2 theme drafts and project it through the existing validated theme pipeline. Expose narrowly-scoped controller operations through the shared theme-authoring port, render a reusable Theme Typography recipe for the existing widget ID, and derive thumbnails only from compiled theme tokens.

**Tech Stack:** TypeScript, Svelte 5, Zod contracts, Vitest, Playwright, Vite, bundled variable fonts.

**Spec:** `docs/superpowers/specs/2026-09-03-theme-typography-controls-design.md`

## Global Constraints

- Preserve Deep Current's Geist / Newsreader / Geist Mono typography.
- Typography choices are per-theme, never global.
- Bundle every selectable family and its license.
- Preserve compatibility with stored drafts that predate typography.
- Keep themes data-only and avoid theme-ID selectors/component forks.
- Preserve the dirty primary checkout; work only in this isolated worktree.
- Run the full verification gate before pushing directly to `main`.

---

## Task 1: Theme draft typography contract and projection

**Files:**
- Modify: `packages/contracts/src/theme-draft.ts`
- Modify: `packages/theme/src/draft.ts`
- Test: relevant contract/theme unit tests under `tests/unit/`

- [x] Add failing tests for seeded typography, projected edits, and legacy v2 drafts without typography.
- [x] Run the focused tests and confirm the intended failures.
- [x] Add optional v2 typography and seed/project it with base-theme fallback.
- [x] Run the focused tests to green.

## Task 2: Approved defaults, bundled font catalog, and font assets

**Files:**
- Modify: `apps/workbench-lab/src/themes/{pom-neutral,bunny,ash-amber}.ts`
- Add: `apps/workbench-lab/src/themes/bundled-fonts.ts`
- Modify: `apps/workbench-lab/src/styles.css`
- Add: font and license assets under `apps/workbench-lab/src/assets/fonts/`
- Modify: `THIRD_PARTY_NOTICES.md`
- Modify: `apps/workbench-lab/vite.config.ts`
- Modify: `scripts/verify-lab-dist.mjs`
- Test: theme defaults and Lab distribution tests

- [x] Add failing tests for exact approved theme stacks and required legal artifacts.
- [x] Run focused tests and confirm failure.
- [x] Add the bundled-font catalog, update theme defaults, and import official variable fonts/licenses.
- [x] Add font faces and static legal-artifact copying/verification.
- [x] Run focused tests to green.

## Task 3: Per-theme controller operations

**Files:**
- Modify: `apps/workbench-lab/src/themes/controller.ts`
- Modify: `apps/workbench-lab/src/recipes/theme-authoring/types.ts`
- Modify: `registry/recipes/theme-settings/ThemeAuthoringTypes.ts`
- Test: controller unit tests

- [x] Add failing tests for live role/scale edits, theme isolation, and typography-only reset.
- [x] Run focused tests and confirm failure.
- [x] Implement controller operations and expose them through the reusable authoring port.
- [x] Run focused tests to green.

## Task 4: Theme Typography recipe and widget replacement

**Files:**
- Add: `apps/workbench-lab/src/recipes/theme-authoring/ThemeTypography.svelte`
- Add: `registry/recipes/theme-settings/ThemeTypography.svelte`
- Modify: `apps/workbench-lab/src/recipes/ImplementedWidget.svelte`
- Modify: widget fixture/catalog authority files
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: recipe manifest/generated hashes
- Test: component and recipe tests

- [x] Add failing component tests for family selectors, semantic sizes, spacing controls, live specimen, and no duplicate theme picker.
- [x] Run focused tests and confirm failure.
- [x] Implement the host-driven Theme Typography component and route the stable widget ID to it.
- [x] Rename visible catalog copy to Theme Typography and update recipe metadata deterministically.
- [x] Run focused tests and recipe verification to green.

## Task 5: Dynamic thumbnails and Custom Theme navigation

**Files:**
- Add: `apps/workbench-lab/src/themes/preview.ts`
- Modify: `apps/workbench-lab/src/themes/presets.ts`
- Modify: `apps/workbench-lab/src/recipes/host-context.ts`
- Modify: `apps/workbench-lab/src/App.svelte`
- Test: preview helper and App component tests

- [x] Add failing tests for theme-derived distinct thumbnails, live authored thumbnail updates, and navigation/focus.
- [x] Run focused tests and confirm failure.
- [x] Derive thumbnail styles from compiled theme tokens and refresh the active thumbnail on draft application.
- [x] Activate Settings and Appearance, scroll Custom Theme into view, and focus its action when opened.
- [x] Run focused tests to green.

## Task 6: Integration and delivery

- [x] Run unit, typecheck, native, build, recipe, pack, and browser verification.
- [x] Inspect the rendered controls and interactions in the real Workbench Lab.
- [x] Review the complete diff for unrelated changes and legal coverage.
- [ ] Commit the scoped implementation.
- [ ] Integrate the latest remote `main` without touching the dirty primary checkout.
- [ ] Push the verified commit directly to `main` and confirm the remote head.
