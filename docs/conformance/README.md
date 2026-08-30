# Pom conformance operations

The conformance lane compares the maintained Svelte Workbench Lab with explicit
authorities. Deep Current uses the preserved Atmospheric Workbench for macro
composition, material, and responsive staging and the Widget Overhaul for
Panel, Widget, Catalog, geometry, and audited state behavior. Pom Neutral and
Bunny use the independent, byte-hashed original frames in
`design/theme-targets/`. All three targets preserve one mounted Panel and
Widget tree; only theme-owned tokens and presentation change. Ash & Amber uses
the byte-hashed SonderUI_RW2_1 frame at 80 seconds for its reviewed atmospheric
identity, with compact and Catalog states frozen as explicitly bounded Lab
implementation regressions.

Current Lab screenshots are implementation evidence. They are not reference
authority and cannot be refreshed to close a discrepancy.

Pixel overlays remain diagnostic because the independent authority and Lab DOM
trees are not pixel-aligned. Visually governed lanes fail on explicit material,
color, geometry, overflow, and theme-token comparisons; reviewed Windows
screenshots separately freeze exact implementation pixels. Interaction-only and
Catalog lifecycle cases use screenshots as trace evidence rather than claiming
that a preserved harness result row is a visual rendering oracle.

Deep Current macro geometry uses the authority-hash-bound reviewed structured
baseline in `tests/conformance/baselines/deep-current-macro.json`. Each run still
captures the live preserved authority for materials, visibility, overflow, and
diagnostic images. This keeps geometry deterministic across operating systems
when the preserved calibration controls wrap differently outside the actual
Workbench shell, without relaxing the reviewed shell target.

## Ledger lifecycle

Every failing structured comparison has one stable target-prefixed row. The
row names its authority, scenario, evidence, diagnosis, status, regression, and
any reviewed deviation. Status moves from `open` to `fixing`, then `verified`
and `closed` only after the named regression passes. A requested deviation must
be cited by the scenario and contain its bounded review record.

Severity means:

- P0: reference integrity, security/data boundary, unusable primary flow, or
  invalid conformance evidence;
- P1: missing feature/state, wrong macro structure, inaccessible interaction,
  persistence loss, or severe responsive failure;
- P2: material geometry, styling, content, or interaction mismatch in ordinary
  use; and
- P3: minor polish with no layout, feature, comprehension, or accessibility
  consequence.

A target freezes with zero open P0/P1 rows, zero unapproved P2 rows, and only
reviewed P3 rows. Raising a global pixel threshold never closes a discrepancy.
After three ineffective fixes to the same row, revisit structure, authority
interpretation, selectors, or the explicit tolerance instead of looping.

## Failure meanings

- `REFERENCE_HASH_DRIFT`: authority bytes changed before browser setup.
- `REFERENCE_SETUP_FAILED`: the reference driver did not reach its state.
- `IMPLEMENTATION_SETUP_FAILED`: the Lab driver did not reach its state.
- `MANIFEST_INVALID`: scenario or ledger metadata is unsafe or inconsistent.
- `MEASUREMENT_FAILED`: a required locator or value is unavailable.
- `UNLEDGERED_DISCREPANCY`: a comparison failed without a work-queue row.
- `DISCREPANCY_REMAINS`: a known row still fails.
- `STALE_DISCREPANCY`: a closed row lacks passing regression evidence.
- `UNAPPROVED_DEVIATION`: a cited exception lacks a complete review record.

Generated reference, actual, overlay, diff, measurement, trace, and report
files live below ignored `test-results/conformance/`. Failed CI jobs upload
that directory. Preserved sources and reviewed reference frames are read-only.

The executable interface is
`npm.cmd run test:conformance:unit`,
`npm.cmd run test:conformance:deep-current`,
`npm.cmd run test:conformance:theme-targets`,
`npm.cmd run test:conformance:ash-amber`,
`npm.cmd run test:conformance`, and
`npm.cmd run inspect:conformance -- --scenario <id>`.

The inspection command requires one exact scenario ID and retains its complete
evidence set without updating a baseline. Theme switching is immediate and
atomic on the same mounted Panel and Widget tree. The hostable boundary is
still `apps/workbench-lab/dist`.

This machinery is test infrastructure for a developer toolkit. It does not publish
packages. Sonder cutover has not occurred. The lane does not import Sonder server
code or deploy the later GitHub Pages showcase.
