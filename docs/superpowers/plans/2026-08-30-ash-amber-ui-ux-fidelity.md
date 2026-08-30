# Ash & Amber UI/UX Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the measured Ash & Amber UI artifacts through shared Workbench presentation contracts while preserving theme identity and behavior across all themes.

**Architecture:** Keep Workbench state, theme schemas, compiler bindings, and component ownership unchanged. Correct layout at the shared Svelte recipe and semantic CSS boundaries, use a native top-layer dialog for Catalog isolation, and make overflow ownership explicit at the surface that needs it.

**Tech Stack:** Svelte 5, TypeScript, CSS semantic part bindings, Vitest, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-30-ash-amber-ui-ux-fidelity-design.md`

## Global Constraints

- Do not add concrete theme-id selectors or a forked component tree.
- Do not change ThemeDefinition parsing, schema versions, compiler contracts, or `THEME_PART_IDS`.
- Preserve neutral graphite/ash surfaces, warm grey-brown chrome, restrained amber, zero purple/magenta, rounded 4px bevels, and no chamfers.
- Preserve immediate atomic theme switching and all Panel, Widget, docking, persistence, undo, responsive, and accessibility behavior.
- Work red-green-refactor and update screenshot baselines only after functional geometry is green and visually reviewed.

---

### Task 1: Freeze composer, header, navigation, and Custom Theme failures

**Files:**
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/browser/theme-settings.spec.ts`

**Interfaces:**
- Consumes: existing `openFresh`, semantic part selectors, Panel and Widget ARIA roles.
- Produces: geometry assertions that fail on line-box clipping, metadata overflow, title wrapping, weak active state, and unreachable Custom Theme content.

- [ ] **Step 1: Add failing compact composer assertions**

At 390x844 and 844x390, measure the composer textarea and metadata:

```ts
expect(textarea.clientHeight).toBeGreaterThanOrEqual(textarea.lineHeight);
expect(meta.scrollWidth).toBeLessThanOrEqual(meta.clientWidth + 1);
expect(meta.bottom).toBeLessThanOrEqual(field.bottom + 1);
```

- [ ] **Step 2: Add failing Widget heading and selected-tab assertions**

For `Scene Effects` and `Custom Theme`, require one rendered line and no header
collision. Require the active Panel tab to have a non-`none` structural selected
indicator in addition to different foreground/background values.

- [ ] **Step 3: Add failing Custom Theme scroll-reach assertions**

At 1440x900, 390x844, and 844x390, assert the named Custom Theme scroll region
owns any overflow, the document remains fixed, and `scrollIntoView()` can bring
the final ambient value or save action inside both the region and viewport.

- [ ] **Step 4: Run the focused specs and verify RED**

Run:

```powershell
npx.cmd playwright test tests/browser/native-workbench-accessibility.spec.ts tests/browser/theme-settings.spec.ts --workers=1
```

Expected: the new geometry assertions fail for the measured clipping, wrapping,
selected indication, or scrolling reasons while the pre-existing assertions
remain green.

### Task 2: Freeze Catalog isolation and scroll-affordance failures

**Files:**
- Modify: `apps/workbench-lab/src/App.test.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/browser/theme-renderer-contracts.spec.ts`

**Interfaces:**
- Consumes: existing `CatalogController`, launcher accessible name, and semantic dialog material.
- Produces: native modal, focus-return, backdrop, reduced-transparency, containment, and scroll-cue requirements.

- [ ] **Step 1: Update the component expectation to a dialog contract**

Require `Widget Catalog` to render as a dialog while open and retain all 94
results and existing controls.

- [ ] **Step 2: Add failing top-layer and focus-cycle assertions**

Open Catalog from the launcher and require:

```ts
expect(await catalog.evaluate((node) => node.matches(':modal'))).toBe(true);
expect(await catalog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
```

Cycle Tab, close with Escape, and require focus to return to the launcher.

- [ ] **Step 3: Add failing containment and scroll-cue assertions**

At 1440x900 and 390x844, require the dialog inside the viewport, the result list
to own its overflow, the visible scroll/count cue inside the dialog, and the
launcher face/focus outline inside the top shelf.

- [ ] **Step 4: Add reduced-transparency assertions and verify RED**

Emulate reduced transparency, reopen Catalog, and require an opaque dialog plus
`none` backdrop blur. Run the focused component and browser specs and confirm the
new assertions fail for the current `aside` overlay.

### Task 3: Implement the shared presentation corrections

**Files:**
- Modify: `apps/workbench-lab/src/recipes/WidgetCatalog.svelte`
- Modify: `registry/recipes/widget-catalog/WidgetCatalog.svelte`
- Modify: `apps/workbench-lab/src/mockup/renderers/CompactThemeWidget.svelte`
- Modify: `apps/workbench-lab/src/styles.css`

**Interfaces:**
- Consumes: `CatalogController`, `dialog.surface`, `button.surface`, existing theme color/material/shape variables.
- Produces: modal Catalog state binding, named Custom Theme scroll region, stable compact action face, absolute action rail, readable secondary roles, and responsive containment.

- [ ] **Step 1: Implement native Catalog dialog synchronization**

Keep the dialog mounted, synchronize `state.open` with `showModal()`/`close()`,
route `cancel` and close-button actions to `catalog.close()`, and use
`dialog.surface`. Use `button.surface` for the text Close action.

- [ ] **Step 2: Add an explicit Catalog result status**

Keep the list as the sole result scroll owner, reserve scrollbar space, and add
a persistent `Scroll results · N widgets` footer inside the dialog.

- [ ] **Step 3: Make Custom Theme a named scroll region**

Give the compact surface `role="region"`, `aria-label="Custom Theme controls"`,
and `tabindex="0"`; use `overflow:auto`, `overscroll-behavior:contain`, and stable
scrollbar space.

- [ ] **Step 4: Correct shared CSS geometry and typography**

Provide textarea client height for the line box, wrap composer metadata, keep
the composer inside phone/landscape bounds, absolutely layer hover/focus Widget
actions, force single-line headings, expose a square icon-only compact Catalog
launcher without focus reflow, add the active tab accent edge, and raise
operational secondary labels/values to readable muted technical text.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the Task 1 and Task 2 specs plus `npm.cmd run check:recipes`; keep production
changes minimal until every new assertion and existing focused assertion passes.

### Task 4: Freeze and inspect same-state visual evidence

**Files:**
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Modify: reviewed PNG files under `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/`

**Interfaces:**
- Consumes: stable functional geometry from Tasks 1-3.
- Produces: reviewed wide, compact, and Catalog evidence for Deep Current, PomOS, Bunny, and Ash & Amber.

- [ ] **Step 1: Extend all-theme Catalog coverage**

Capture a wide Catalog state for PomOS and Bunny in addition to existing Deep
Current and Ash & Amber states. Keep each theme in the same Scene state.

- [ ] **Step 2: Run visual tests without update mode**

Confirm expected failures identify only intentional geometry changes.

- [ ] **Step 3: Regenerate intentional baselines**

Run the visual spec with `--update-snapshots`, then immediately rerun without
update mode.

- [ ] **Step 4: Inspect original-resolution images**

Review every changed PNG at original resolution for boundary crossings, title
wrap, focus artifacts, unintended pills/chamfers, bottom clipping, palette
drift, and readable secondary text. Reject and iterate on any artifact.

### Task 5: Full verification, coordination, and scoped commit

**Files:**
- Modify only files already named by Tasks 1-4 plus generated recipe manifest hashes if required by the registry verifier.

**Interfaces:**
- Consumes: reviewed source and screenshots.
- Produces: exact clean gate evidence, image hashes, integration notes, and one commit SHA.

- [ ] **Step 1: Run focused conformance**

Run `npm.cmd run test:conformance:ash-amber`, theme renderer contracts, Catalog,
Theme Settings, and native Workbench browser specs.

- [ ] **Step 2: Run static and complete gates**

Run `npm.cmd run typecheck`, `npm.cmd run build`, `git diff --check`, and finally
`npm.cmd run check` against the unchanged source.

- [ ] **Step 3: Hash evidence and audit the diff**

Compute SHA-256 for every changed screenshot, confirm no purple/magenta raw Ash
value or theme-id selector was added, and inspect the complete diff.

- [ ] **Step 4: Coordinate and commit**

Report changed shared module/export surfaces to the coordinating thread, stage
only scoped files, commit with a conventional message, and report the exact
branch SHA without merging `main`.
