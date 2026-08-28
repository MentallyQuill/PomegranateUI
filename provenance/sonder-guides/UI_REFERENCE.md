# UI reference and porting contract

This guide identifies the target presentation for Sonder and separates it from
runtime authority and historical implementation evidence.

## Current design authority

1. [Sonder UI Design Bible 2.0](../design/sonder-ui-bible/README.md) and the
   committed
   [Atmospheric Workbench](../experiments/sonder-atmospheric-workbench/README.md)
   jointly define the canonical UI/UX system. The artifact controls the states
   it demonstrates; the Bible generalizes the system beyond them.
2. A later approved feature specification may explicitly revise the Bible.
3. [`INTERFACE.md`](INTERFACE.md), current source, schemas, routes, and tests own
   runtime integration and present implementation truth.

Existing UI presentation, Design Bible 1.x, the retired progressive redesign,
candidate source, and historical screenshots have no authority to preserve a
conflicting layout.

## Canonical artifact

| File | Role | SHA-256 |
|---|---|---|
| `sonder-workbench-calibration.html` | source-form reference fragment | `38878D2CF8A86F5E879FABA4B41A214E4293F22ED755975023E02C962D61B913` |
| `sonder-workbench-calibration-preview.html` | standalone visual reference | `14C735C159724E03B66E84CF166B7937F99F0654D9EA9D7D36374D0A9A15E557` |
| `sonder-drag-regression.html` | focused interaction evidence | `737BB396B5D522E5449C9EC66F4689D525F0B4109D4E40693BE50CB6C447F0C0` |

The artifact covers the integrated top shelf, atmospheric Scene, fixed reading
measure, composer, modular left/right toolbars, shelves, tabs, floating modules,
Panels, the Widget Catalog, character scaling, Custom Theme controls, docking
feedback, exact cancellation recovery, and height-derived capacity.

The fragment is readable source form, but each published reference revision is
immutable at its recorded hash. A visual change creates a new hash-identified
revision under Design Bible change control.

## Historical evidence

The verified old screenshot archive
`Sonder_UI_Design_Bible_Revision_Screenshots.zip` and reference implementation
`Sonder_Engine_UI_Design_Bible_Revision-main.zip` remain provenance and behavior
inventory. Their hashes remain recorded in repository history and adoption
audits. They do not define target macro composition after Design Bible 2.0.

The candidate salvage ledger may still identify useful runtime tripwires or
interaction lessons. Do not copy obsolete polling, `window.S`, hidden controls,
synthetic clicks, unsafe HTML insertion, or stale API assumptions.

## Authority by question

| Question | Authority |
|---|---|
| What should the interface look and feel like? | Design Bible 2.0 plus canonical artifact. |
| How should docking, tabbing, shelves, floating, and responsive capacity behave? | Design Bible 2.0, artifact, and regression harness. |
| What data/actions must remain available? | Current engine/source contracts and capability evidence. |
| What owns saves, routes, authentication, extensions, and async state? | Current source, schemas, maintained guides, and tests. |
| May the current rail/inspector/mobile layout survive for convenience? | No; it is migration source, not target presentation. |
| May a module duplicate a Settings/Library editor? | No; one live instance and canonical owner. |

## Required porting method

For each production tranche:

1. Inventory the current behavior, state, routes, persistence, accessibility,
   localization, and extension consumers.
2. Identify the matching Design Bible chapters and artifact region/state.
3. Map every visible module and action to one current runtime owner.
4. Port behavior into the workbench composition without hidden duplicate UI.
5. Add focused tests for the migrated behavior and direct-manipulation contract.
6. Render at the same viewport as the artifact and compare macro geometry
   before component polish.
7. Verify pointer, keyboard, touch, reduced motion, solid surfaces, long labels,
   errors, saving, empty states, and responsive shelf capacity.
8. Record any deliberate difference under Design Bible change control.

## Review order

1. full canvas and integrated top shelf;
2. toolbar/Scene/composer geometry;
3. module ownership, shelves, tabs, floating, and the Widget Catalog;
4. responsive width and height behavior;
5. typography, material, color, and 4 px bevels;
6. states, accessibility, localization, and recovery;
7. runtime truth and performance.

Behavioral tests do not prove visual conformance. Screenshots do not prove
behavior. Both are required.
