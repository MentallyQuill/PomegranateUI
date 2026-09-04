# Widget Interaction Playtest and Evidence-Led Remediation Design

**Date:** 2026-09-03
**Status:** Approved for autonomous execution

## Outcome

PomegranateUI will gain an intensive, deterministic Playwright playtest for Widget manipulation. The playtest will expose unintuitive or visually artifacted transitions across dragging, docking, grouping, floating, reordering, resizing, collapsing, expanding, cancellation, undo, and persistence. Production behavior will change only after the playtest reduces a failure to an evidence-backed root cause.

The likely remediation is a unified transient drag-session state machine, but that refactor is contingent on audit evidence. The audit is the first deliverable and remains valuable even if localized fixes prove sufficient.

## Authority and boundaries

- PomegranateUI owns reusable interaction, layout, accessibility, theme, command, event, and test-driver contracts.
- The Workbench store remains the only authority for committed and persisted layout state.
- Drag previews, candidate targets, origin vacancies, and temporary destination gaps are transient presentation state and never enter the persisted schema.
- Theme switching retains one mounted Workbench, Panel, and Widget tree. Behavior cannot branch on theme IDs.
- The playtest uses the Workbench Lab as a reusable toolkit demonstration, not as evidence that PomegranateUI owns an adopter's backend, persistence, or product information architecture.
- The attached screenshot is failure evidence, not an instruction or a visual mockup to reproduce.
- Design and review remain text-only. No new mockups are required.

## Current evidence and hypotheses

The existing grouped-Widget implementation creates both a tab-reorder controller and a Widget-drag controller, then makes a one-way ownership decision after early pointer motion. This explains why a natural horizontal or diagonal departure may remain trapped in reorder mode rather than becoming a tear-off into Scene space.

The existing held state uses a complete cloned Widget plus separate rail, snap, label, and slot layers. Browser assertions establish that these layers exist and have geometry, while attached screenshots are not pass/fail visual oracles. This permits several translucent, text-bearing layers to overlap even when structural assertions pass.

These observations are hypotheses to verify through the audit. They do not authorize a refactor before reproducible failing journeys and root-cause evidence exist.

## Approved interaction oracle

The playtest and any subsequent implementation use these approved rules:

1. A grouped tab remains reorderable while the pointer is inside its tab corridor and becomes a tear-off whenever the pointer exits toward a dock or open canvas. The current mode is reconsidered throughout the gesture; initial movement does not permanently lock ownership.
2. A lifted Widget is represented by one compact identity proxy. The proxy contains only the identity needed to recognize the Widget and does not clone interactive Widget content.
3. The original Widget keeps an exact-size vacant footprint until commit or cancellation. The footprint contains no title, controls, content, or translucent duplicate.
4. Only the active dock destination opens a real, correctly sized, text-free gap. Neighboring Widgets reflow smoothly around that gap. Inactive destinations remain visually quiet.
5. Grouping is previewed in the destination tab strip. The destination content remains unchanged, an exact tab-sized insertion gap opens, and the compact proxy aligns with it.
6. Any movable Widget can reach any valid, visible destination directly from its current state without an intermediate drop.
7. Pointer release commits the currently visible intent. Cancellation restores the exact origin, and undo plus save/reload reproduce the canonical topology.

## Playtest architecture

### Deterministic fixture builder

Tests create named layouts through authoritative store commands or a validated test driver, not ad hoc DOM mutation. Fixtures cover:

- a docked singleton;
- an active grouped tab;
- an inactive grouped tab;
- a floating Widget;
- occupied shelves with before, between, and after destinations;
- an empty region;
- collapsed left and right docks;
- resized docks and shelves;
- compact and wide Workbench geometries.

Each fixture has stable Widget identities, placement topology, viewport, theme, input mode, revision, and persistence state so failures can be replayed exactly.

### Journey driver

A shared Playwright driver performs semantic actions such as lift Widget, move through points, enter or leave a tab corridor, hover a destination, release, cancel, resize, collapse, expand, undo, save, and reload. It records checkpoints rather than relying on arbitrary timeouts.

Every journey produces an evidence record containing:

- starting fixture and exact action sequence;
- active transient interaction state exposed through test-only semantic attributes;
- source, proxy, destination, and affected sibling rectangles;
- visible semantic parts and their counts;
- Workbench revision and canonical placements before and after commit;
- screenshot clips at lifted, targeting, settling, and final checkpoints when visually relevant;
- Playwright trace and video on failure.

Test-only diagnostics expose semantic state but cannot become runtime or persistence authority.

### Coverage model

The suite derives cases from four axes rather than maintaining one enormous hand-written list:

- **Origin:** docked singleton, active grouped tab, inactive grouped tab, floating.
- **Intent:** reorder, group, insert before, insert after, create shelf, dock in empty region, float.
- **Destination:** same shelf, another shelf, occupied Widget, existing group, empty region, open canvas, collapsed dock, invalid space.
- **Completion:** commit, Escape, pointer cancellation, blur, unmount, undo, save/reload.

The catalog validates a curated set of required high-risk pairs; it does not claim exhaustive pairwise coverage of every reachable combination. A smaller set of canonical multi-step journeys covers stateful sequences, including group -> direct float -> dock -> group, resize -> move -> collapse -> reveal -> commit, and commit -> undo -> reload. Deterministic seeded exploratory journeys may be added after the canonical suite is stable; they must print a replayable seed and minimized action sequence.

## Assertions and visual gates

Every active drag checkpoint enforces universal invariants:

- exactly one identity proxy exists;
- exactly one source footprint is vacant and retains its pre-drag rectangle within tolerance;
- at most one active destination reservation exists;
- the proxy contains no enabled interactive descendants and no duplicated IDs or accessible content;
- destination content is not duplicated, covered by a text-bearing preview, or removed before commit;
- the reserved gap matches the placement that release will commit;
- transient layers remain within the active Workbench and viewport;
- no horizontal page overflow, clipped active target, or stale global interaction class appears;
- cancellation removes every transient part without changing revision or canonical placement;
- commit changes revision exactly as required by the accepted command and creates no orphan shelf or group;
- reduced motion removes nonessential transitions without removing spatial feedback;
- forced colors and reduced transparency retain distinct, readable target boundaries.

Canonical visual checkpoints use focused screenshot assertions rather than report-only attachments. Geometry and semantic assertions accompany screenshots so a rendering difference can be localized before any snapshot update. No snapshot is refreshed merely to make the suite green.

## Failure taxonomy and root-cause gate

Each failure is assigned to the earliest broken stage:

1. activation and input arbitration;
2. transient session ownership;
3. geometry collection;
4. intent resolution or hysteresis;
5. origin/proxy/destination presentation;
6. preview-to-command translation;
7. store acceptance and normalization;
8. settling animation and cleanup;
9. undo or persistence restoration;
10. responsive, accessibility, or theme expression.

Before changing production behavior, the failing journey must reproduce consistently, identify the earliest broken stage, and state one falsifiable root-cause hypothesis. The smallest focused test proves or rejects that hypothesis. Fixes are not bundled across unrelated stages.

## Contingent remediation architecture

If the audit confirms repeated failures at the dual-controller lifecycle seam, each mounted Workbench will receive one transient interaction host backed by a DOM-free TypeScript reducer.

The reducer owns only `idle`, `pressed`, `dragging`, `settling`, and cancellation transitions. During dragging, pluggable resolvers continuously derive reorder, dock, group, or float intent from current geometry. Four adapters remain outside the reducer:

- an input adapter normalizes mouse, pen, held-touch, and keyboard events;
- a geometry adapter measures live tabs, Widgets, shelves, regions, collapsed docks, and canvas space;
- a presentation adapter renders the one compact proxy, vacant origin, and active destination reservation;
- a commit adapter translates the accepted intent into existing Workbench commands.

The reducer owns no Svelte components, DOM nodes, themes, animations, store implementation, persisted state, or adopter semantics. Resize, expand, collapse, and focus remain independent operations that the journeys compose with drag sessions.

The interaction host remains private to the Workbench recipe until the audit and repaired suite demonstrate a stable reusable boundary. Public package or npm publication is outside this work and requires separate approval.

If the audit instead finds isolated failures, the implementation will make localized fixes and retain the current controller structure. The playtest, oracle, and failure taxonomy remain unchanged.

## Migration sequence

1. Add the fixture builder, semantic journey driver, evidence recorder, and two golden reproductions for the reported overlay and grouped-tab-to-Scene failures.
2. Run the audit against the unchanged implementation and preserve the expected failing evidence.
3. Expand to the curated required-pair catalog and canonical stateful journeys, distinguishing product failures from test-driver or environment failures.
4. Reduce and classify failures, then choose localized repairs or the contingent interaction host based on evidence.
5. Implement one root-cause repair tranche at a time with focused unit and Playwright tests.
6. Rerun the complete matrix after every tranche and inspect canonical screenshots in all themes.
7. Mirror reusable recipe changes and deterministic hashes only after behavior is stable.

## Required environments

The canonical suite covers:

- mouse and keyboard on wide desktop;
- mouse at short landscape and 200% zoom-equivalent geometry;
- real coarse-pointer touch on phone portrait and desktop-site mobile;
- pen events for pointer-path parity;
- Deep Current, PomOS, Bunny, and Ash & Amber without theme-specific behavior forks;
- normal and reduced motion;
- normal and reduced transparency;
- forced colors/high contrast where supported.

The suite establishes port ownership before starting the preview and never terminates another task's listener.

## Completion criteria

Work is complete only when:

1. The original screenshot failure and grouped-tab direct-to-Scene failure are reliable golden journeys and pass after evidence-backed repair.
2. The coverage matrix includes every origin, intent, destination, and completion value, with its deliberately curated required pairs documented and canonical stateful journeys passing.
3. Canonical screenshot assertions prove the compact proxy, exact vacant origin, one destination gap, tab-strip insertion, and absence of overlapping text-bearing layers.
4. Commit, cancellation, pointer cancellation, blur, unmount, undo, and save/reload preserve exact command and topology invariants.
5. Resizing, collapsing, expanding, responsive layouts, all themes, and accessibility preference modes preserve the same interaction semantics.
6. Focused unit, browser, accessibility, and visual tests pass.
7. `npm.cmd run check` passes without modifying unrelated checkout changes.
