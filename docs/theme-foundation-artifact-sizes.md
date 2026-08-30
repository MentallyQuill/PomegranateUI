# Theme foundation artifact sizes

This ledger measures the static Workbench Lab boundary before and after the Pom
theme foundation. It is evidence for this tranche, not a permanent budget gate.

## Method

- Baseline: `d0b418e` (`docs: define Pom theme foundation`). The measured build
  came from `bd08b31`; `git diff --name-only d0b418e..bd08b31` confirmed that
  the intervening commits changed only root documentation and documentation
  images, not the Lab, packages, lockfile, or build configuration.
- Theme build: `0af0aa1` plus the packed-consumer and documentation changes in
  this tranche.
- Command: `npm.cmd run build` in each checkout.
- Raw bytes: every emitted file below `apps/workbench-lab/dist`.
- Compressed bytes: Node's `zlib.gzipSync` at level 9, summed per emitted file.
- `other` is the emitted `index.html`.

| Category | Baseline raw | Theme raw | Delta raw | Baseline gzip | Theme gzip | Delta gzip |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| JavaScript | 196,876 | 222,281 | +25,405 | 53,320 | 60,830 | +7,510 |
| CSS | 20,078 | 25,295 | +5,217 | 5,140 | 5,853 | +713 |
| Fonts | 566,512 | 566,512 | 0 | 386,242 | 386,242 | 0 |
| Images | 0 | 0 | 0 | 0 | 0 | 0 |
| Other | 426 | 426 | 0 | 287 | 287 | 0 |
| **Total** | **783,892** | **814,514** | **+30,622** | **444,989** | **453,212** | **+8,223** |

The complete static artifact grows by 30,622 raw bytes and 8,223 gzip bytes
(1.85% compressed). The JavaScript and CSS payload alone grows by 8,223 gzip
bytes. Fonts are unchanged, and the deployable artifact adds no images or other
binary runtime assets.

The tranche adds no third-party runtime dependency: the Lab consumes the new
workspace-owned `@pomegranate-ui/theme` package, which depends only on
`@pomegranate-ui/contracts`. The PNG files added under `tests/browser` are
test-only visual regression evidence and are not emitted into `dist`.

## Theme art-direction follow-up

The later Bunny art-direction pass adds one runtime image. The generated source
PNG was 2,229,603 bytes; it was converted to a visually reviewed 131,562-byte
WebP for the repository and static build, a reduction of 2,098,041 bytes
(94.1%). The current build therefore emits 233,610 raw image bytes across the
existing 102,048-byte Deep Current JPEG and the Bunny WebP. Full provenance,
hashes, and redistribution evidence are recorded in
`docs/theme-art-direction-assets.md`.

The 2026-08-30 showcase-media follow-up adds three theme-specific character
atlases and an independent Ash & Amber canvas, totaling 801,120 bytes. The
current static build emits 1,034,730 raw image bytes across all six runtime
images. No new runtime dependency was added; detailed prompts, source sizes,
dimensions, digests, and review evidence remain in the asset record above.
