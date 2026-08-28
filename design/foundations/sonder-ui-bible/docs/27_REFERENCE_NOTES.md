# 27. Reference Notes

## Canonical Sonder artifact

The committed Atmospheric Workbench is the visual and interaction reference:

- `docs/experiments/sonder-atmospheric-workbench/sonder-workbench-calibration.html`
  - SHA-256 `38878D2CF8A86F5E879FABA4B41A214E4293F22ED755975023E02C962D61B913`
- `docs/experiments/sonder-atmospheric-workbench/sonder-workbench-calibration-preview.html`
  - SHA-256 `14C735C159724E03B66E84CF166B7937F99F0654D9EA9D7D36374D0A9A15E557`
- `docs/experiments/sonder-atmospheric-workbench/sonder-drag-regression.html`
  - SHA-256 `737BB396B5D522E5449C9EC66F4689D525F0B4109D4E40693BE50CB6C447F0C0`

The artifact passed 95 focused Panel, Catalog, docking, drag, persistence,
accessibility, and responsive regressions at preservation time. This includes
exact-origin recovery after cancelled, pointer-cancelled, or invalid Settings,
Library, Scene, and floating drags plus same-origin preview font loading. Those
tests are calibration evidence, not a substitute for production runtime
integration tests.

## Prime Intellect

Official site: <https://www.primeintellect.ai/>

The desired influence is specifically the top atmospheric section: compact
integrated glass navigation, small modern type, dark media field, thin edges,
and restrained diagrammatic accents. The large marketing headings lower on the
site are not a Sonder reference.

## Other influences

- EVE/Photon contributes cohesion, modular instrument logic, and user control,
  not cockpit ornament.
- PS2-era interfaces contributed an interest in tangible digital material, but
  the attempted CRT/pixel implementation was rejected and is not canonical.
- ChungusHub contributes the value of collapsible side regions and economical
  organization, not a layout to copy.
- Photoshop/VS Code contribute tab, shelf, split, float, and rearrangement
  expectations. Sonder uses a bounded two-dock model rather than an unbounded
  IDE layout engine.

## Historical Sonder material

The Design Bible 1.x, old supplied screenshots, candidate implementation,
progressive-redesign amendment, and replacement work-package screenshots remain
historical evidence. They may answer what capability existed or reveal a past
failure. They do not override Design Bible 2.0 presentation.

## Originality and provenance

- Do not copy external source, markup, styles, icons, imagery, fonts, or
  branding.
- Preserve the bundled reviewed open-license font files rather than introducing
  a remote runtime dependency.
- Record provenance for every shipped atmospheric canvas.
- Preserve each published mockup revision byte-for-byte at its recorded hash;
  a visual change creates a new hash-identified revision under change control.
  Production implementation is an independent port.
