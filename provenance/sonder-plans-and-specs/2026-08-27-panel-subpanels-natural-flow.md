# Panel Sub-panels and Natural-flow Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one optional level of user-created Panel sub-panels, selectable natural-flow column layouts, and a shipped six-group Settings composition whose Widget containers expand to natural height.

**Architecture:** Extend the mock Panel persistence model with optional sub-panel records while preserving flat Panels unchanged. Render one conditional local tab strip beneath the 40 px global shelf, and render the active sub-panel as explicit vertical lane containers whose Widgets keep natural height while the Panel surface owns page scrolling.

**Tech Stack:** Standalone HTML, CSS, and browser JavaScript in the Widget Overhaul mockup; same-origin iframe regression harness; in-app Browser Playwright verification.

**Spec:** `docs/superpowers/specs/2026-08-27-panel-subpanels-natural-flow-design.md`

## Global Constraints

- Sub-panel nesting stops after one level; persisted nested input is rejected.
- Flat Panels retain the existing 40 px top shelf and rendering behavior.
- A sub-panel strip is exactly 32 px and appears only for Panels with sub-panels.
- Layout ids are `single`, `two-equal`, `three-equal`, `wide-left`, and `wide-right`.
- Layout templates define lane widths only and never clamp Widget height.
- The active Panel surface is the sole vertical page-scroll owner; intrinsic textarea/code-editor scrolling remains allowed.
- Responsive collapse never rewrites persisted lane assignment.
- The shipped Settings groups use the current interface-branch labels and ownership taxonomy.
- Preserve unrelated dirty files and do not stage the existing untracked Widget Overhaul package as a new repository artifact.

---

### Task 1: Persist a backward-compatible sub-panel model

**Files:**
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul.html:19940-20140`
- Test: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul-regression.html:314-470`

**Interfaces:**
- Produces: `SUB_PANEL_LAYOUTS: Readonly<Record<string, { id: string, label: string, columns: string[] }>>`
- Produces: `normalizeSubPanel(candidate, panelId, index): SubPanel | null`
- Produces: `activeSubPanel(panel): SubPanel | null`
- Produces: `panelWidgets(panel): WidgetPlacement[]`
- Extends Panel with optional `activeSubPanelId` and `subPanels` records containing `id`, `name`, `layoutId`, `widgets`, `scrollTop`, and optional `shipped`/`hidden`.

- [ ] **Step 1: Add failing persistence and shipped-default regressions**

Add isolated browser tests that assert:

```js
const settings = api.panelStateSnapshot().panels.find((panel) => panel.id === 'panel-settings');
assert(settings.subPanels.length === 6, 'Settings did not ship six sub-panels');
assert(settings.subPanels.map((item) => item.name).join('|') ===
  'Account and Access|AI and Models|Appearance and Accessibility|Story Defaults and Content|Data, Extensions, and Maintenance|Advanced',
  'Settings sub-panel taxonomy diverged from the interface branch');
assert(settings.subPanels.map((item) => item.layoutId).join('|') ===
  'two-equal|two-equal|three-equal|two-equal|wide-left|single',
  'Settings shipped layout defaults changed');
```

Add a persistence test that stores a flat legacy Panel, reloads, and asserts it has no sub-panel strip and retains its Widget placements. Add malformed input with nested `subPanels` inside a sub-panel and assert normalization drops the nested field while retaining the first-level record.

- [ ] **Step 2: Run the harness and confirm the new tests fail**

Run the standalone regression page and record failures naming the absent Settings sub-panels, absent layout ids, and missing nested-input rejection. Existing unrelated Dialogue and Agency demo-API failures remain partitioned.

- [ ] **Step 3: Add layout records and normalized optional state**

Define immutable layout records:

```js
const SUB_PANEL_LAYOUTS = Object.freeze({
  single: Object.freeze({ id: 'single', label: 'Single column', columns: Object.freeze(['1fr']) }),
  'two-equal': Object.freeze({ id: 'two-equal', label: 'Two equal columns', columns: Object.freeze(['1fr', '1fr']) }),
  'three-equal': Object.freeze({ id: 'three-equal', label: 'Three equal columns', columns: Object.freeze(['1fr', '1fr', '1fr']) }),
  'wide-left': Object.freeze({ id: 'wide-left', label: 'Wide left', columns: Object.freeze(['2fr', '1fr']) }),
  'wide-right': Object.freeze({ id: 'wide-right', label: 'Wide right', columns: Object.freeze(['1fr', '2fr']) })
});
```

Normalize ids, names, layout fallbacks, lane/order placement, scroll position, shipped/hidden flags, and Widget arrays. Never copy a candidate sub-panel's own `subPanels` property. Extend Settings shipped state with six first-level records and map existing owners into their approved groups. Keep Scene, Library, and user-created flat Panels on the original `widgets` path.

- [ ] **Step 4: Run focused persistence tests**

Reload the harness and verify legacy flat Panels, six Settings defaults, layout fallback, exact active identity, and nested-input rejection pass.

- [ ] **Step 5: Record task completion without staging the untracked mockup package**

Run `git status --short -- docs/experiments/sonder-widget-overhaul docs/superpowers/plans` and confirm only the intended mockup files plus this tracked plan are involved in this task.

### Task 2: Render and operate the conditional local tab strip

**Files:**
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul.html:221-520`
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul.html:18620-18790`
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul.html:20060-20320`
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul.html:31480-31730`
- Test: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul-regression.html:314-560`

**Interfaces:**
- Consumes: `activeSubPanel(panel)` and normalized sub-panel records from Task 1.
- Produces: `renderSubPanelTabs(panel): void`
- Produces: `activateSubPanel(panelId, subPanelId, { restoreScroll = true } = {}): boolean`
- Produces: `createSubPanel(panelId, { name, layoutId, duplicateCurrent = false }): SubPanel | null`
- Produces: `flattenLastSubPanel(panelId): boolean`
- Produces: `SUB_PANEL_ACTIONS` shared by visible menu, right-click, and keyboard menu paths.

- [ ] **Step 1: Add failing strip, creation, and depth regressions**

Cover flat Scene/Library geometry, shipped Settings geometry, first conversion, and shared menu actions:

```js
assert(doc.querySelector('.sonder-topbar').getBoundingClientRect().height <= 41,
  'Global shelf changed height');
assert(!doc.querySelector('[data-sub-panel-tabs]'), 'Flat Scene reserved a local strip');
doc.querySelector('[data-panel-tab="panel-settings"]').click();
const strip = doc.querySelector('[data-sub-panel-strip]');
assert(strip && Math.abs(strip.getBoundingClientRect().height - 32) <= 1,
  'Settings local strip is not 32 px');
assert(doc.querySelectorAll('[data-sub-panel-tab]').length === 6,
  'Settings strip does not expose six sibling tabs');
assert(!doc.querySelector('[data-sub-panel-tab] [data-sub-panel-tabs]'),
  'Sub-panel nesting escaped into the DOM');
```

Create a flat temporary Panel, invoke Add sub-panel, and assert its existing Widgets moved losslessly into Overview while the new blank sibling becomes active. Assert the visible menu, contextmenu, Shift+F10, and trailing plus reach the same creation operation. Assert Escape/cancel restores exact focus and state.

- [ ] **Step 2: Run the harness and confirm the strip tests fail**

Record failures for the absent strip, creation conversion, shared action surface, ARIA tab behavior, and one-level guard.

- [ ] **Step 3: Add strip markup, styling, and state transitions**

Insert one local navigation element after the global topbar. Style it as a 32 px integrated material band with shared hairlines and no wrapping. Drive the Panel surface/workspace top inset through a root `data-has-sub-panels` state rather than changing the global shelf height.

Render sibling tabs, active state, a visible active-sub-panel action trigger, and trailing Add action. Implement ArrowLeft/ArrowRight/Home/End, click activation, tab reordering, contextmenu, Shift+F10/Menu, focus restoration, and per-sub-panel scroll capture/restore.

Implement first creation as Overview plus the requested new record. Subsequent creation uses Name, Blank/Duplicate, and five layout choices. Implement rename, duplicate, move left/right, move Widgets, delete, and last-item flatten confirmation through one shared action registry. Reject attempts to create below a sub-panel.

- [ ] **Step 4: Run focused strip and interaction tests**

Verify conditional height, tab order, activation, plus/menu parity, keyboard behavior, first conversion, duplication, deletion/flatten, and cancellation all pass.

- [ ] **Step 5: Record task completion without staging the untracked mockup package**

Inspect `git status --short` and ensure no unrelated workspace file changed.

### Task 3: Render natural-height lanes and selectable layouts

**Files:**
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul.html:2645-2725`
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul.html:18950-19030`
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul.html:31170-31540`
- Test: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul-regression.html:3650-3830`

**Interfaces:**
- Consumes: active sub-panel layout and Widget records.
- Produces: `renderSubPanelLanes(panel, subPanel): void`
- Produces: `changeSubPanelLayout(panelId, subPanelId, layoutId): boolean`
- Produces: `moveWidgetToSubPanel(widgetId, targetSubPanelId, targetLane = 0): boolean`
- Persists Widget placement as `{ lane: number, order: number }` inside its owning sub-panel.

- [ ] **Step 1: Add failing natural-height and layout regressions**

For each layout, render Widgets of different intrinsic heights and assert:

```js
assert(surface.scrollHeight > surface.clientHeight, 'Panel surface did not become the scroll owner');
assert(Array.from(surface.querySelectorAll('[data-sub-panel-lane]')).every((lane) =>
  getComputedStyle(lane).gridAutoRows === 'max-content' || getComputedStyle(lane).display === 'flex'),
  'A sub-panel lane still imposes equal-height rows');
assert(Array.from(surface.querySelectorAll('.sonder-panel-slot, .sonder-widget-group, .sonder-module')).every((node) =>
  !['auto', 'scroll'].includes(getComputedStyle(node).overflowY)),
  'A Widget container still owns vertical scrolling');
```

Assert exact lane ratios, no automatic rebalance when a Widget expands, deterministic append when reducing lanes, empty new lane when increasing lanes, stable Widget identity, and Cancel preserving the old template and placement.

- [ ] **Step 2: Run the harness and confirm natural-height tests fail**

Record failures showing equal grid rows, `height: 100%`, slot clipping, internal module scrolling, and absent layout transitions.

- [ ] **Step 3: Replace equal-height slots with explicit lane stacks**

Render one `.sonder-sub-panel-lane` per selected layout column. Use CSS grid only for lane widths and flex/grid `max-content` flow inside each lane. In the sub-panel scope, remove slot/module `height: 100%`, max-height clamping, and Widget-body overflow used solely for fixed Panel geometry. Keep intrinsic textareas and code editors bounded and scrollable.

Implement deterministic layout changes: preserve existing lanes when adding, create new empty lanes, and append removed-lane Widgets to the final survivor in order when reducing. Update Widget placement, drag targets, keyboard placement seams, Catalog drops, duplication, and removal to resolve against the active sub-panel only.

- [ ] **Step 4: Run focused natural-height and placement tests**

Verify every layout, layout transition, Widget move, Catalog placement, keyboard placement, drag cancellation, scroll ownership, and no-Widget-body-scroll assertion passes.

- [ ] **Step 5: Record task completion without staging the untracked mockup package**

Inspect the exact two mockup files and preserve all unrelated dirty files.

### Task 4: Complete responsive, accessibility, and visual verification

**Files:**
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul.html:1800-1940`
- Modify: `docs/experiments/sonder-widget-overhaul/sonder-widget-overhaul-regression.html:270-3900`
- Modify: `docs/experiments/sonder-widget-overhaul/README.md:1-120`

**Interfaces:**
- Consumes: completed state, strip, interaction, and lane renderers.
- Produces: final responsive projection and verification evidence.

- [ ] **Step 1: Add failing responsive and accessibility regressions**

At 1600x900, 1024x768, 768x1024, 430x932, 390x844, 844x390, and 800x450, assert no horizontal document overflow, no wrapped local strip, active-tab visibility, deterministic lane collapse, unchanged persisted placement, 44 px coarse-pointer actions, explicit focus indication, and stable focus after layout/menu cancellation.

- [ ] **Step 2: Run the focused responsive tests and confirm failures**

Capture the exact viewport, control, or lane that violates each new contract.

- [ ] **Step 3: Implement responsive projection and package documentation**

Keep the desktop strip horizontal; make tablet overflow reveal the active sibling; render phone as one selector plus Add. Collapse three lanes to two/one and asymmetric/two lanes to one based on usable lane width without mutating persisted placement. Document sub-panels, layout selection, natural-height scroll ownership, and the no-sub-sub-panel boundary in the package README.

- [ ] **Step 4: Run the complete harness**

Serve `docs/experiments` and run `sonder-widget-overhaul-regression.html`. Require every new sub-panel/layout/natural-height test to pass. Report any unrelated baseline failure by exact test name and cause rather than claiming a clean full suite.

- [ ] **Step 5: Perform the real browser interaction and visual pass**

Use the preview's iframe locator. Exercise Panel-menu first creation, trailing-plus creation, all five layout choices, rename, duplicate, reorder, move, delete/flatten cancellation, keyboard navigation, responsive selector, Settings natural-height scrolling, and draft retention inside a Widget. Capture desktop Settings and compact responsive screenshots, verify browser console errors, and compare shell geometry with the matching Design Bible/Atmospheric Workbench states.

- [ ] **Step 6: Final workspace audit**

Run `git diff --no-index --check -- NUL` against each untracked mockup file, inspect `git status --short`, and confirm no unrelated user-owned changes were staged, reverted, or reformatted.
