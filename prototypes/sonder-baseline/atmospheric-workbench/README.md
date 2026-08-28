# Sonder Atmospheric Workbench Reference

This directory preserves the canonical visual and interaction reference for
[Sonder UI Design Bible 2.0](../../design/sonder-ui-bible/README.md). It began
as an exploratory Play-workspace calibration and was promoted after iterative
review of typography, glass, theming, portraits, toolbars, shelves, tabs,
floating modules, and docking behavior.

The artifact defines target presentation and interaction. It does not call
Sonder APIs and is not itself the production frontend. Production integration
must preserve current runtime, persistence, security, localization,
accessibility, and extension authority while reproducing this result.

## Contents

- `sonder-workbench-calibration.html` — source-form self-contained reference
  fragment, immutable at this revision's recorded hash.
- `sonder-workbench-calibration-preview.html` — same-origin standalone package
  preview of the editable source and its vendored assets.
- `sonder-drag-regression.html` — focused regression harness for viewport
  height, dock capacity, Panel and Catalog behavior, tab merge/reorder, exact
  drag restoration, shelf placement, and floating.
- `.gitattributes` — preserves the three hash-identified HTML artifacts
  byte-for-byte across Git checkouts.
- `Newsreader-Variable.ttf`, `Geist-Variable.woff2`, and
  `GeistMono-Variable.woff2` — local open-license font assets used by both the
  source and preview, with their license texts beside them.

Atmosphere and character portraits are embedded as data URLs. The reference
loads no remote fonts or icons.

## Run locally

From the repository root:

```powershell
python -m http.server 8765 --directory docs/experiments/sonder-atmospheric-workbench
```

Open:

```text
http://127.0.0.1:8765/sonder-workbench-calibration-preview.html
```

Run focused interaction checks at:

```text
http://127.0.0.1:8765/sonder-drag-regression.html
```

The preserved checkpoint passed all 95 focused browser regressions. The matrix
includes real pointer review of Settings, Library, and Scene cancellation or
invalid-drop recovery, native pointer cancellation, custom floating geometry,
preview font loading, three-tab insertion, path-independent title-bar docking,
25/50/25 Widget-body intent bands, boundary stability, and footer-safe shelf
feedback.

## Reference hashes

- fragment: `38878D2CF8A86F5E879FABA4B41A214E4293F22ED755975023E02C962D61B913`
- preview: `14C735C159724E03B66E84CF166B7937F99F0654D9EA9D7D36374D0A9A15E557`
- regression: `737BB396B5D522E5449C9EC66F4689D525F0B4109D4E40693BE50CB6C447F0C0`

## Authority boundary

Use the artifact for macro composition, proportions, material, type,
interaction targets, and signature behavior. Use Design Bible 2.0 for the
generalized rules and states not shown by the seeded fixture. Use current
source and maintained implementation guides for data and effects.

The original calibration brief is retained as
[provenance](../../superpowers/specs/2026-08-24-sonder-atmospheric-digital-workbench-mockup-design.md),
not as a competing scope or authority statement.
