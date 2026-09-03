# Widget Interaction Audit

**Audited commit:** `cd11012f90a33835f0fd9aba014460ce80c792fe`

**Environment:** Windows, Node.js 24.16.0, Playwright 1.62.1, Chromium 151.0.7922.34 (`chromium-1234`). The canonical browser port remained 4174. Because other repository worktrees legitimately owned it during the audit, the final isolated run used the validated `POM_PLAYWRIGHT_PORT=4184` override.

**Viewport/input matrix:** default desktop mouse and keyboard; wide 1440×900 coarse touch; synthetic pen parity. The retained native Workbench suite also covers 390×844 and 390×500 mobile paths, touch exploration, pre-hold cancellation, and reduced motion.

**Themes:** Deep Current, PomOS, Bunny, and Ash & Amber remain covered by the shared native lifecycle test. The literal failure reproductions use Deep Current; all four themes consume the same controller, group recipe, and semantic parts.

**Audit result:** 16 Playwright journeys completed in 32.4 seconds: 11 passed and five expected-failure executions represented four unique P1 defects. The nine-case catalog covers every approved origin, intent, destination, and completion value plus every required reachable pair. No journey is skipped.

| Issue | Journey | Earliest broken stage | Reproduction | Evidence | Root-cause hypothesis | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `AUDIT-P1-GROUP-DIRECT-FLOAT` | Active and inactive grouped tabs move horizontally, then leave the tab corridor for open Scene space | Intent arbitration | Group Theme Materials with Characters, begin on either tab, move horizontally as if reordering, then continue into the open stage | [`widget-interaction-playtest.spec.ts:49`](../tests/browser/widget-interaction-playtest.spec.ts#L49) and [`widget-interaction-playtest.spec.ts:244`](../tests/browser/widget-interaction-playtest.spec.ts#L244): no `widget.drag-preview` and no floating placement | [`WidgetGroup.svelte:83`](../apps/workbench-lab/src/recipes/WidgetGroup.svelte#L83) chooses one owner once; the reorder branch cancels the Widget drag candidate at line 100, and later moves can only reach the reorder controller at line 112 | reproduced twice for active and inactive tabs |
| `AUDIT-P1-SINGLE-PRESENTATION` | A singleton Widget is lifted over an occupied destination | Preview creation | Drag Characters over the upper insertion zone of World State | [`widget-interaction-playtest.spec.ts:77`](../tests/browser/widget-interaction-playtest.spec.ts#L77): proxy count 1, nested articles 1, interactive descendants 3, active reservations 1, origin vacant true; overlay text contains all shelf labels plus `Insert before World State` | [`WidgetDragController.ts:73`](../apps/workbench-lab/src/recipes/WidgetDragController.ts#L73) clones the complete visual root into the proxy; lines 322 and 348 add text to every rail and the active intent | reproduced twice with screenshot, JSON, and trace evidence |
| `AUDIT-P1-GROUP-ACTIONS` | The active Widget in the default Room Ambience group exposes its action control | Hit testing | Hover or focus the group and target the center of the active Widget action button | [`widget-interaction-playtest.spec.ts:103`](../tests/browser/widget-interaction-playtest.spec.ts#L103): `elementFromPoint` does not resolve to the action or its descendants; a real click is intercepted by the group tab layer | The absolute grouped action navigation at [`styles.css:2038`](../apps/workbench-lab/src/styles.css#L2038) shares the tab strip without a reliable reserved hit area/topmost stacking contract | reproduced by geometry and real pointer click |
| `AUDIT-P1-COLLAPSED-DOCK-COMMIT` | A Widget is dropped into a collapsed left dock | Post-commit presentation cleanup | Collapse left, drag Room Ambience to the revealed left shelf, and release | [`widget-interaction-playtest.spec.ts:140`](../tests/browser/widget-interaction-playtest.spec.ts#L140): reveal and slot are visible before release, placement commits to left and revision advances, then the left region is hidden again | [`WidgetDragController.ts:387`](../apps/workbench-lab/src/recipes/WidgetDragController.ts#L387) removes the transient reveal during cleanup without notifying the App-owned collapsed state that an accepted drop must expand the destination | reproduced twice with trace evidence |

## Passing boundaries

- Horizontal grouped-tab reorder commits exactly once and leaves no Widget-drag residue.
- Blur and active-Panel unmount cancel a lifted grouped Widget without changing its placement.
- Escape and pointer cancellation restore exact floating placement and revision.
- Insert-before plus Undo restores the complete placement snapshot.
- Grouping, group order, dock widths, and shelf weights survive Save layout plus reload.
- Mouse, pen, deliberate coarse touch, and keyboard paths reach the same public layout commands.
- Invalid release, empty-region cancellation, collapsed-dock preview reveal, and destination reflow all clean their transient layers.

## Remediation decision

The evidence warrants the approved bounded transient interaction coordinator. Two literal failures arise from competing tab-reorder and Widget-drag ownership, while collapsed-dock commit exposes a missing handoff from transient presentation state to App-owned dock state. The repair should remain small and adapter-based:

1. Add a DOM-free grouped-gesture intent reducer that keeps reorder and tear-off candidates viable until the pointer exits the tab corridor. Initial horizontal motion cannot permanently cancel tear-off.
2. Replace the cloned Widget card with a compact identity proxy and remove text from the destination overlay. Retain the exact-size vacant origin and one real in-layout destination reservation.
3. Give an accepted collapsed-dock drop an explicit expansion callback into the App-owned collapse state before transient cleanup.
4. Repair the grouped action hit area as a local layout/stacking contract; do not fold ordinary Widget actions into the drag reducer.

Resize, collapse toggles, focus, persistence, and ordinary Widget actions remain separate operations composed by the Playwright journeys. The coordinator is not a general Workbench controller and no persisted schema changes are required.
