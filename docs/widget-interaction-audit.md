# Widget Interaction Audit

**Audited commit:** `cd11012f90a33835f0fd9aba014460ce80c792fe`

**Remediated implementation commit:** `30a153cc83d76a9dd3e132e873d01e9f1b331ad5`

**Environment:** Windows, Node.js 24.16.0, Playwright 1.62.1, Chromium 151.0.7922.34 (`chromium-1234`). The canonical browser port remained 4174. Because other repository worktrees legitimately owned it during the audit, the final isolated run used the validated `POM_PLAYWRIGHT_PORT=4184` override.

**Viewport/input matrix:** default desktop mouse and keyboard; wide 1440×900 coarse touch; synthetic pen parity. The retained native Workbench suite also covers 390×844 and 390×500 mobile paths, touch exploration, pre-hold cancellation, and reduced motion.

**Themes:** Deep Current, PomOS, Bunny, and Ash & Amber remain covered by the shared native lifecycle test. The literal failure reproductions use Deep Current; all four themes consume the same controller, group recipe, and semantic parts.

**Audit result:** 16 Playwright journeys completed in 32.4 seconds: 12 passed and four expected-failure executions represented three unique P1 defects. The nine-case catalog covers every approved origin, intent, destination, and completion value plus every required reachable pair. No journey is skipped.

**Remediation result:** The expanded 17-journey audit passes without skips or expected-failure annotations. The audit and all 50 retained native Workbench journeys pass together: 67/67 in 3.2 minutes. The additional journey proves the collapsed-dock repair symmetrically with a singleton drop into the right dock; the canonical left-dock journey proves both cancellation and accepted commit from a grouped Widget.

| Issue | Journey | Earliest broken stage | Reproduction | Evidence | Root-cause hypothesis | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `AUDIT-P1-GROUP-DIRECT-FLOAT` | Active and inactive grouped tabs move horizontally, then leave the tab corridor for open Scene space | Intent arbitration | Group Theme Materials with Characters, begin on either tab, move horizontally as if reordering, then continue into the open stage | [`widget-interaction-playtest.spec.ts:49`](../tests/browser/widget-interaction-playtest.spec.ts#L49) and the `grouped-inactive-direct-float` matrix journey initially produced no drag preview or floating placement | One-shot ownership cancelled the Widget candidate as soon as reorder began. [`widget-group-gesture.ts:10`](../apps/workbench-lab/src/recipes/widget-group-gesture.ts#L10) now keeps intent revisable until corridor departure; [`WidgetGroup.svelte:95`](../apps/workbench-lab/src/recipes/WidgetGroup.svelte#L95) transfers ownership while preserving the drag candidate | fixed in `e096804`; active, inactive, and in-corridor reorder journeys pass |
| `AUDIT-P1-SINGLE-PRESENTATION` | A singleton Widget is lifted over an occupied destination | Preview creation | Drag Characters over the upper insertion zone of World State | [`widget-interaction-playtest.spec.ts:76`](../tests/browser/widget-interaction-playtest.spec.ts#L76) initially measured one nested article, three interactive descendants, and overlay instruction text | The drag controller cloned the entire Widget and painted text into every target. [`WidgetDragController.ts:95`](../apps/workbench-lab/src/recipes/WidgetDragController.ts#L95) now creates one inert identity element, while the target painter emits only geometric parts; [`styles.css:824`](../apps/workbench-lab/src/styles.css#L824) contains the compact proxy | fixed in `5ce529e`; zero articles, controls, and overlay text across all four themes |
| `AUDIT-P1-COLLAPSED-DOCK-COMMIT` | A Widget is dropped into a collapsed dock | Post-commit presentation cleanup | Collapse a dock, reveal it with a drag, then cancel or release over a valid target | [`widget-interaction-playtest.spec.ts:140`](../tests/browser/widget-interaction-playtest.spec.ts#L140) initially committed left placement but returned the destination to hidden | Transient cleanup had no accepted-drop handoff to App-owned collapse state. [`WidgetDragController.ts:282`](../apps/workbench-lab/src/recipes/WidgetDragController.ts#L282) tracks the revealed side and line 395 expands it only after acceptance | fixed in `30a153c`; left grouped cancel/commit and right singleton commit pass |

## Passing boundaries

- Horizontal grouped-tab reorder commits exactly once and leaves no Widget-drag residue.
- Blur and active-Panel unmount cancel a lifted grouped Widget without changing its placement.
- Escape and pointer cancellation restore exact floating placement and revision.
- Insert-before plus Undo restores the complete placement snapshot.
- Grouping, group order, dock widths, and shelf weights survive Save layout plus reload.
- Mouse, pen, deliberate coarse touch, and keyboard paths reach the same public layout commands.
- Invalid release, empty-region cancellation, collapsed-dock preview reveal, and destination reflow all clean their transient layers.
- The grouped Widget action hit target passes after explicit hover; its initial audit failure was a setup false positive and required no production CSS change.

## Remediation decision

The corrected evidence did not justify a new global transient interaction coordinator. Three localized boundaries were sufficient: a pure grouped-gesture reducer, a compact proxy/geometric overlay in the existing drag controller, and one accepted-drop callback to App-owned collapse state. Resize, manual collapse toggles, focus, persistence, and ordinary Widget actions remain separate operations composed by the Playwright journeys. No persisted schema or theme-specific behavior changed.
