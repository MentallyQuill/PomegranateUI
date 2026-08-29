# Theme Art Direction Critic Ledger

## Scope

This ledger records adversarial visual review of the shared Workbench Lab tree in
Deep Current, Pom Neutral, and Bunny. It follows
`docs/superpowers/specs/2026-08-28-pom-theme-art-direction-design.md`.

The six stable evidence paths are:

- `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-scene.png`
- `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/compact-scene.png`
- `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-pom-neutral.png`
- `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/compact-pom-neutral.png`
- `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-bunny.png`
- `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/compact-bunny.png`

Earlier rounds were generated into those Playwright snapshot paths and reviewed
before being superseded. They were transient working evidence and are retained
as process notes below, not represented as independently recoverable image
artifacts. The rejected starting state remains recoverable from commit
`49dac42`. The promoted round is independently recoverable through the stable
paths and SHA-256 values recorded below without duplicating six binary files.

## Severity contract

- **Blocking:** broken interaction, missing or illegible required content,
  viewport overflow, missing authority asset, or a target that cannot be
  identified.
- **Substantive:** cross-theme leakage, incoherent hierarchy/composition,
  visually ineffective glass, unfinished typography/spacing, low-quality theme
  shorthand, or a responsive presentation defect.
- **Preference:** a concrete alternative with no corresponding defect in
  identity, hierarchy, material, legibility, responsiveness, or function.

The loop closes only after one complete six-image round has no blocking or
substantive finding.

## Round 0 — rejected baseline

Source: commit `49dac42`, the merged state the user reviewed.

| Target | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| All | Substantive | Declared blur existed, but uniform or opaque layers made frost visually ineffective. | Replace palette-first styling with layered canvas, translucent fill, highlight edge, shadow, and real backdrop blur. |
| Deep Current | Substantive | The bright developer rail did not belong to the dark industrial world; side instruments were flat beside the strong stage. | Theme every developer control and strengthen dark glass materials. |
| Pom Neutral | Blocking | The target read as a pale web dashboard rather than a modern macOS-like desktop material system. | Recompose as a single rounded desktop window over a dimensional cool wallpaper. |
| Bunny | Blocking | Pink, universal pills, and a tiny ear logo read as a dated novelty page rather than professional kawaii UI. | Move to milk paper plus blush/lavender/mint/apricot, selective geometry, sparse motifs, and structured cards. |

## Round 1 — material foundation

Capture: Playwright `--update-snapshots` run after the first semantic-material
and presentation-layer pass.

| Target | Severity | Finding | Resolution in next round |
| --- | --- | --- | --- |
| Deep Current | Blocking | A shared dock background shorthand erased the approved stage image, leaving a near-black empty center. | Restore `var(--pom-canvas)` after the shared dock recipe and add a browser assertion for the local image URL. |
| All compact | Blocking | Long persistence and dock controls occupied the same utility-grid row and visibly overlapped. | Replace the compact grid with a contained horizontal utility strip. |
| Pom Neutral | Substantive | Wallpaper detail was too weak to make the new frost legible. | Increase dimensional canvas contrast and reduce panel opacity. |
| Bunny | Substantive | The button material still made most actions pink, preserving the monochrome impression. | Make the default button material milky neutral and reserve blush for selection/primary action. |
| All compact | Substantive | With the stage canvas missing or too faint, the narrow scenes looked like empty sheets rather than themed environments. | Restore each canvas and retain theme-specific stage decoration behind the story glass. |

## Round 2 — restored canvas and responsive structure

Capture: complete six-image Playwright run after the Round 1 corrections.

| Target | Severity | Finding | Resolution in next round |
| --- | --- | --- | --- |
| Pom Neutral | Substantive | The desktop influence was present in chrome, but the stage wallpaper remained too washed out to sell spatial frost. | Add restrained slate-blue and muted-copper fields plus a stronger luminous veil. |
| Bunny | Substantive | The palette and cards were professional, but the scene-scale bunny identity was too timid. | Add one low-opacity CSS bunny watermark and keep all dense content free of decoration. |
| All compact | Substantive | The scrollable utility rail no longer overlapped, but a long control label was cut mid-word at the edge. | Use shorter visual labels through pseudo-content while preserving the full accessible names and horizontal access. |

No functional, focus, identity, or page-overflow regression was found in this
round.

## Round 3 — first zero-substantive visual pass

Capture: the six stable evidence paths listed above, inspected at original
resolution after fonts loaded and animation was disabled.

| Surface | Identity | Hierarchy/composition | Glass/material | Typography/spacing | Responsive/function | Result |
| --- | --- | --- | --- | --- | --- | --- |
| Deep Current wide | Industrial dark-tech is immediate; no light-theme leakage. | Stage remains dominant; instruments and developer tools are subordinate. | Cold dark frost, edge light, and story/composer elevation are coherent. | Compact technical chrome and literary prose are deliberate and legible. | Full tree and controls visible. | Pass |
| Deep Current compact | Image, cyan signal, and angular restraint survive. | Story and composer remain the only dominant narrow-screen surfaces. | Dark glass retains clear boundaries over the image. | No clipped story copy; control strip is intentionally scrollable. | No page overflow; full controls remain reachable by horizontal strip. | Pass |
| Pom Neutral wide | Original modern desktop influence is immediately legible without copied platform assets. | One rounded application window contains toolbar, utility, sidebars, stage, transcript, and composer. | Wallpaper detail makes luminous frost and soft depth visible. | System-like sans hierarchy and warm prose are balanced. | Widgets and controls preserve the shared tree. | Pass |
| Pom Neutral compact | Desktop-window and blue-selection language remain clear. | Toolbar, utility strip, stage, story glass, and composer form a clean vertical stack. | Cool/warm wallpaper fields remain visible through the central material. | Readable with no overlap. | No page overflow; scrollable utility actions remain available. | Pass |
| Bunny wide | Premium stationery/character-goods identity is immediate and no longer monochrome pink. | Milk-paper stage, pastel instrument accents, story card, and restrained watermark have clear roles. | Milky glass, soft shadows, and edge highlights are visible without washing out text. | Selective rounding and adult-quality spacing avoid novelty-page styling. | Shared Widgets, controls, and states remain intact. | Pass |
| Bunny compact | Bunny signature, multi-family pastels, and paper grid survive at narrow width. | Watermark stays away from dense text; story and composer remain dominant. | Frost and paper layers remain distinct. | No pill-everything regression or text collision. | No page overflow; full utility names remain accessible. | Pass |

## Round 4 — independent-review hardening and final critic pass

The reviewer was asked to assume the implementation was wrong and check the
preserved authorities, accessibility contract, material coverage, evidence
quality, and responsive behavior rather than accept the screenshots at face
value. That pass found substantive contract issues even though Round 3 looked
coherent. All were corrected before this new complete render:

| Severity | Finding | Resolution |
| --- | --- | --- |
| Blocking | Deep Current's stronger shelf treatment had moved the authority-owned shelf from 40 to 50 pixels and changed the measured 12-pixel material. | Restore the exact Atmospheric shell geometry and measured shelf/dock/composer materials; place stronger 24-pixel frost in an overlay and child surfaces that do not falsify the preserved frame. |
| Blocking | Pom Neutral and Bunny had drifted from the byte-hashed target bindings for canvas, accent, text, and core radii. | Restore every bound value while retaining the new gradients, composition, selective geometry, and presentation recipes. All six target conformance cases pass again. |
| Substantive | Reduced-transparency coverage omitted Catalog, ordinary dialog, focused dialog, and higher-specificity Widget frames. | Make every named glass surface opaque, image-free, and blur-free under the media preference; add browser coverage. |
| Substantive | Faint Neutral text missed the declared 4.5 contrast floor, and the matrix did not check the faint role. | Darken all three faint roles where necessary and cover normal, muted, and faint text against every structural background. |
| Substantive | Computed-style evidence omitted docks, transcript, composer, Catalog, dialog, focused, and floating surfaces. | Add table-driven material assertions for every named surface, plus the Deep Current shelf overlay. |
| Evidence | Intermediate image rounds were not independently recoverable. | Mark them honestly as transient process evidence and freeze the promoted six-image round by stable path and SHA-256 below. |

The final visual critic then inspected the regenerated six images at original
resolution without consulting implementation intent. It found no cross-theme
leakage, incoherent hierarchy, ineffective material, unfinished spacing,
illegible state, responsive breakage, or target ambiguity. Deep Current remains
deliberately dense and subdued; Pom Neutral keeps a large quiet wallpaper field;
and Bunny keeps a sparse mascot field. Those are coherent target choices, not
corrective defects.

### Promoted evidence hashes

| Snapshot | SHA-256 |
| --- | --- |
| `wide-scene.png` | `c46e4b6f5f1128d29a41ffa045ed6510fc082454c44b14bdf2eb921a6e471e61` |
| `compact-scene.png` | `0958bf62e3b6f1a235043831b37137e856c0548ebe809143c6580d76c9d674e1` |
| `wide-pom-neutral.png` | `e33a8c6450c13b9e54e76e3e9a94321a2cbe43fd6e0178452de3cef24e71b269` |
| `compact-pom-neutral.png` | `64ced35159c7b579d6ff4a23fdfbb4e6a663229bcf3c62534b5e66c047c49536` |
| `wide-bunny.png` | `b6b879fdce99da451b70a933433e148a2e443a3ac26ec3a7d7d410454dfbcd08` |
| `compact-bunny.png` | `742b1f53a332235c706c5266e3a45c6b41a708115654fb03e587dea76ca72a6f` |

### Preference-only observations

- Deep Current's technical density could be made looser for a different adopter;
  the current density is coherent with this target and does not harm legibility.
- Pom Neutral's wallpaper could be warmer or cooler without correcting a defect.
- Bunny's watermark could be more or less prominent without changing target
  clarity, hierarchy, or usability.

## Closure

Round 4 has **zero blocking findings and zero substantive findings** across the
complete six-image set. The preference-only observations do not justify more
theme-specific code or assets. Final promotion still depends on focused browser
and accessibility checks, unchanged-tree verification, the complete repository
gate, code review, CI, and merge.
