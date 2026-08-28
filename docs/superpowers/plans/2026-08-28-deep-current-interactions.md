# Deep Current Interaction Conformance Implementation Plan

**Status:** Approved for autonomous execution

**Goal:** Reproduce the preserved Widget Overhaul interaction contracts in the
Workbench Lab without importing prototype runtime code, while retaining Pom's
framework-neutral command, layout, persistence, accessibility, and Svelte
boundaries.

**Authority:**

- `prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul.html`
  owns current Panel, Widget, Catalog, focus, drag, docking, and restoration
  behavior.
- `prototypes/sonder-baseline/widget-overhaul/sonder-widget-overhaul-regression.html`
  remains immutable and must continue to report `212/212 passed`.
- The Atmospheric Workbench remains authoritative for macro composition and
  responsive visibility. Interaction work may not regress the frozen
  `dc-shell-*` scenarios.
- Pom runtime contracts own schemas, commands, events, persistence, and adapter
  boundaries. The preserved prototype is a reference oracle, never runtime
  source.

**Non-goals:** Sonder backend semantics, prototype JavaScript reuse, animation,
arbitrary freeform layout editing, a new theme package, or unaudited product
behavior.

## Scenario vocabulary

All interaction scenarios use the Widget Overhaul authority hash and independent
reference/Lab drivers. Each scenario captures a functional trace, final geometry,
accessible state, and a screenshot. Every successful mutation also asserts one
Pom command/event path and one persistence round trip.

| ID | Reference state | Input modes | Contract |
|---|---|---|---|
| `dc-int-resize-left` | `scene-left-toolbar-resized` | pointer, keyboard | left toolbar clamps and persists |
| `dc-int-resize-right` | `scene-right-toolbar-resized` | pointer, keyboard | right toolbar clamps and persists |
| `dc-int-shelf-insert` | `scene-toolbar-new-shelf` | pointer, keyboard, touch | seam creates a shelf and places the Widget |
| `dc-int-tab-merge` | `scene-group-tab-merge` | pointer, keyboard, touch | drop on a Widget makes one tab group |
| `dc-int-tab-reorder` | `scene-group-tab-reordered` | pointer, keyboard | insertion caret reorders tabs deterministically |
| `dc-int-float` | `scene-widget-floating` | pointer, keyboard, touch | Widget becomes a clamped floating frame |
| `dc-int-invalid-restore` | `scene-invalid-drop-restored` | pointer, touch | invalid drop restores exact origin |
| `dc-int-cancel-restore` | `scene-pointer-cancel-restored` | pointer, touch | cancellation restores exact origin |
| `dc-int-focus-back` | `scene-widget-focused` | pointer, keyboard | Focus and Back preserve state and restore focus |
| `dc-int-panel-persist` | `panel-layout-restored` | keyboard | Scene, Library, and Settings round-trip independently |
| `dc-int-catalog-place` | `catalog-keyboard-placement` | keyboard | discovery and compatible placement complete without pointer |
| `dc-int-coarse-targets` | `scene-coarse-pointer` | touch | every actionable target is at least 44 by 44 CSS px |

## Task 1: Freeze interaction authority and add fail-closed drivers

**Files:**

- Modify `tests/conformance/authorities.ts`
- Modify `tests/conformance/types.ts`
- Modify `tests/conformance/manifest.ts`
- Create `tests/conformance/drivers/reference/widget-overhaul.ts`
- Create `tests/conformance/drivers/workbench-lab/interactions.ts`
- Create `tests/conformance/specs/deep-current-interactions.spec.ts`
- Create `tests/conformance/baselines/deep-current-interactions.json`
- Modify `tests/unit/conformance.test.mjs`

**Red:** Add unit fixtures proving a wrong Widget Overhaul hash reports
`REFERENCE_HASH_DRIFT`, an absent reference test API reports
`REFERENCE_SETUP_FAILED`, an absent Lab interaction region reports
`IMPLEMENTATION_SETUP_FAILED`, and an unknown interaction mismatch reports
`UNLEDGERED_DISCREPANCY`.

**Green:** Register the preserved source and regression hashes, add scenario
builders for the table above, and implement independent drivers. The reference
driver may invoke only the mockup's documented `?test` API and visible controls;
the Lab driver may invoke only Pom UI controls and public test-driver contracts.

**Verify:**

```powershell
npm.cmd run test:conformance:unit
npm.cmd run test:browser -- --grep "preserved Widget Overhaul"
```

## Task 2: Extend the framework-neutral layout contract

**Files:**

- Modify `packages/contracts/src/model.ts`
- Modify `packages/contracts/src/commands.ts`
- Modify `packages/contracts/src/events.ts`
- Modify `packages/layout/src/operations.ts`
- Modify `packages/layout/src/state.ts`
- Modify `packages/layout/src/persistence.ts`
- Modify `packages/core/src/store.ts`
- Modify `packages/core/src/view-model.ts`
- Modify corresponding package tests

**Red:** Add command/schema tests for:

- toolbar width update with bounded finite width;
- explicit shelf creation and shelf-local order;
- tab-group merge and reorder with one active member;
- floating bounds and z-order promotion;
- exact-origin restoration after a rejected transaction;
- forward-compatible hydration of the new presentation fields.

Reject missing Panels/Widgets, duplicate shelves/groups, illegal insertion
indices, invalid floating bounds, and cross-Panel group membership without
advancing revision or emitting success events.

**Green:** Add the smallest backend-neutral command/event vocabulary needed by
the twelve scenarios. Keep state serializable, versioned, normalized, and free
of DOM/Svelte types. A drag is a UI transaction over public placement commands,
not a persisted pointer session.

**Verify:**

```powershell
npm.cmd run test:unit -- --grep "layout|placement|shelf|group|floating"
npm.cmd run typecheck
```

## Task 3: Implement toolbar resizing

**Scenarios:** `dc-int-resize-left`, `dc-int-resize-right`

**Files:**

- Modify `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Create `apps/workbench-lab/src/recipes/ToolbarResizeHandle.svelte`
- Modify `apps/workbench-lab/src/styles.css`
- Modify `tests/browser/native-workbench.spec.ts`
- Modify `tests/browser/native-workbench-accessibility.spec.ts`

**Red:** Require pointer drag, Arrow-key increments, Home/End bounds, an
accessible separator role/value, frozen macro geometry at default width, and
round-trip persistence. Compact/short authority states keep toolbars hidden and
do not expose unreachable resize handles.

**Green:** Render one resize separator at each stage boundary, clamp to the
Widget Overhaul bounds, and dispatch one normalized width command per accepted
change. Use no CSS transition.

## Task 4: Implement shelves and compatible Catalog placement

**Scenarios:** `dc-int-shelf-insert`, `dc-int-catalog-place`,
`dc-int-coarse-targets`

**Files:**

- Create `apps/workbench-lab/src/recipes/DockShelf.svelte`
- Create `apps/workbench-lab/src/recipes/PlacementRails.svelte`
- Modify `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Modify `apps/workbench-lab/src/recipes/WidgetCatalog.svelte`
- Modify `apps/workbench-lab/src/styles.css`
- Modify browser tests

**Red:** Require existing-shelf placement, seam insertion into a new shelf,
shape/minimum-geometry compatibility, Catalog restoration after cancellation,
Space pickup, arrow target traversal, Enter placement, Escape cancellation,
and 44 px coarse-pointer targets.

**Green:** Derive placement rails from public manifest geometry and current
Panel state. Keep visual rails transient. Create a shelf only on accepted
placement and never persist hover/caret state.

## Task 5: Implement tab merge and reorder

**Scenarios:** `dc-int-tab-merge`, `dc-int-tab-reorder`

**Files:**

- Create `apps/workbench-lab/src/recipes/WidgetGroup.svelte`
- Modify `apps/workbench-lab/src/recipes/DockShelf.svelte`
- Modify `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Modify browser tests

**Red:** Require merge by dropping on a compatible Widget, one visible active
member, complete accessible tab semantics, pointer-index insertion, keyboard
reorder, stable group identity, and persistence. Reject grouping across Panels
or a group containing a missing instance.

**Green:** Render grouped instances as one Widget frame with a real tablist.
Keep selection presentation-only and deterministic; do not clone Widget state.

## Task 6: Implement floating and exact restoration

**Scenarios:** `dc-int-float`, `dc-int-invalid-restore`,
`dc-int-cancel-restore`

**Files:**

- Create `apps/workbench-lab/src/recipes/WidgetDragController.ts`
- Modify `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Modify `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Modify `apps/workbench-lab/src/styles.css`
- Modify browser tests

**Red:** Capture original parent Panel, edge, shelf, group, order, placement,
floating bounds, classes, and inline style. Require valid canvas release to
float, viewport clamping, subsequent movement, topmost promotion, and exact
restoration for invalid release, Escape, and `pointercancel` for Scene,
Library, and Settings Widgets.

**Green:** Use one pointer-capture controller whose cancellation path consumes
the immutable origin snapshot. Clear candidate, ghost, caret, and rail state on
every finish path. Do not infer the origin from mutated DOM.

## Task 7: Implement Focus and Back

**Scenario:** `dc-int-focus-back`

**Files:**

- Create `apps/workbench-lab/src/recipes/FocusedWidget.svelte`
- Modify `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Modify `apps/workbench-lab/src/App.svelte`
- Modify browser accessibility and visual tests

**Red:** Require a visible Focus action, dialog/top-layer-safe focused surface,
visible Back action, same live renderer state, retained local selection/draft,
one scroll owner, Escape/Back close, background inertness, and focus restoration
to the exact invoking control.

**Green:** Focus the existing Widget identity through a presentation portal;
do not create a second instance or second host owner. Mount overlays under the
nearest open dialog when a focused renderer opens a nested sheet.

## Task 8: Prove Panel isolation and persistence

**Scenario:** `dc-int-panel-persist`

**Files:**

- Modify `apps/workbench-lab/src/storage.ts`
- Modify `apps/workbench-lab/src/mockup/state.ts`
- Modify `tests/browser/native-workbench.spec.ts`
- Modify `tests/conformance/specs/deep-current-interactions.spec.ts`
- Create `docs/conformance/deep-current-interactions-ledger.md`

**Red:** Construct non-default Scene, Library, and Settings arrangements with
different widths, shelves, groups, floating Widgets, and active members. Save,
reload, and prove each Panel restores independently. Also prove malformed saved
state fails safely to the known default.

**Green:** Extend the existing versioned layout codec and migration only as
needed. No Widget content, host secret, theme draft, or transient interaction
state may enter the layout snapshot.

## Task 9: Freeze the interaction baseline

Run each scenario, diagnose every discrepancy, and update
`docs/conformance/deep-current-interactions-ledger.md`. Closure requires zero
unresolved P0/P1, zero unapproved P2, no stale closed row, and no regression in
the frozen macro or preserved harness.

```powershell
npm.cmd run test:conformance:unit
npm.cmd run test:conformance:deep-current
npm.cmd run test:browser
npm.cmd run test:native
npm.cmd run typecheck
npm.cmd run build
git diff --check
```

Commit only after those commands pass:

```powershell
git add packages apps/workbench-lab tests docs/conformance package.json
git commit -m "feat(lab): conform Deep Current interactions"
```

