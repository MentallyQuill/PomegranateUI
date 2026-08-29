# Deep Current Exact Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the shared Workbench composition and recording-visible Widgets so Deep Current matches the Atmospheric Workbench and both `SonderUI_RW2` recordings in geometry, material, lighting, typography, density, responsive behavior, shelf/settings presentation, and float/dock states, while all four themes retain the same complete tree and capabilities.

**Architecture:** Plans 1-3 supply the final V3 target envelope, semantic-part recipe compiler, root-only canvas, Panel templates/regions/shelves, docking transactions, Widget Shelf, and Theme Settings. This tranche changes the shared `story-stage.v1` composition and Lab fixtures, then expresses Deep's exact identity through data-only materials/shapes/parts/canvas/ambient values. Shared markup never inspects a theme ID. Reference-visible domain copy stays in the Lab fixture/adapter boundary; reusable Widget, Panel, layout, focus, accessibility, and persistence behavior stays in packages and source-owned recipes.

**Tech Stack:** Svelte 5, TypeScript, V2/V3 Pom theme contracts, semantic `data-pom-part` recipes, CSS Grid, local images/fonts/icons, Vitest, Testing Library, Playwright, deterministic conformance drivers, PNG overlays/diffs, SHA-256 manifests.

**Spec:** `docs/superpowers/specs/2026-08-29-deep-fidelity-shared-workbench-ash-amber-design.md`

## Global Constraints

- Begin only after Plans 1-3 pass their tranche gates on top of the final merged Theme Recipes/PomOS SHA.
- Atmospheric Workbench owns macro composition, spacing, material, lighting, typography, responsive transformation, and restraint. Widget Overhaul owns Widget inventory/state and interaction behavior. The recordings supplement both with explicit states.
- Preserve the exact source video hashes: `SonderUI_RW2.mp4` is `5E188EF5866BB82AEA25653AF4FEA6161E36596F760EB00E6FEDF42B2675E011`; `SonderUI_RW2_1.mp4` is `56F84670C2A4B1318BD26A9A482790AE93C49387D47A6D6A4AF7C470C635A889`.
- Preserved prototypes, recordings, and committed extracted frames are immutable evidence. Do not import prototype runtime HTML/CSS/JavaScript or commit either MP4.
- The shared composition changes for every target. Deep fidelity comes from target data, not Deep-only markup, selectors, or component forks.
- Keep the root `ThemeCanvas` as the only wallpaper owner. Docks, stage, Widgets, and overlays may use validated materials, veils, and ambient bindings but no target-specific wallpaper pseudo-elements.
- Preserve the merged 22-part semantic vocabulary, fixed selector stylesheet, and host-owned local asset registry.
- Keep one mounted Panel/Widget tree and no cross-theme transition.
- Do not claim fidelity from a structured ledger alone. Closure requires original-resolution visual review with zero blocking or substantive findings.
- Keep public package copy backend-neutral. The Lab may use fictional Sonder-like fixture data to reproduce the evidence.

---

### Task 1: Freeze both recording evidence sets and exact scenario frames

**Files:**

- Create: `design/theme-targets/deep-current/recordings/reference.json`
- Create: `design/theme-targets/deep-current/recordings/rw2-t52.png`
- Create: `design/theme-targets/deep-current/recordings/rw2-t59.png`
- Create: `design/theme-targets/deep-current/recordings/rw2-t67.png`
- Create: `design/theme-targets/deep-current/recordings/rw2-t76.png`
- Create: `design/theme-targets/deep-current/recordings/rw2-t84.png`
- Create: `design/theme-targets/deep-current/recordings/rw2-1-t2.png`
- Create: `design/theme-targets/deep-current/recordings/rw2-1-t14.png`
- Create: `design/theme-targets/deep-current/recordings/rw2-1-t26.png`
- Create: `design/theme-targets/deep-current/recordings/rw2-1-t39.png`
- Create: `design/theme-targets/deep-current/recordings/rw2-1-t60.png`
- Reuse: `design/theme-targets/ash-amber/sonderui-rw2-1-t80.png`
- Modify: `tests/unit/visual-reference-assets.test.mjs`
- Modify: `docs/theme-art-direction-assets.md`

**Frame contract:**

| Frame | SHA-256 | Required evidence |
|---|---|---|
| `rw2-t52.png` | `7EAC0F71B594CE5860D8A93EED8A3FCE129074933A981F33A6300833E81F5856` | base Scene, Characters, Custom Theme, Scene Effects, Personas |
| `rw2-t59.png` | `DEDB153CCC0119DB01A5653B1C7D6463725C877A456C2271062F92FB7F71A8DD` | floating AI Connections and integrated right tab |
| `rw2-t67.png` | `F365B4A925BE6D0AAE43C7D18C17D446EDBB6E2E06956466811307F7106F5DCC` | right Characters/AI Connections shelf stack |
| `rw2-t76.png` | `C1CF2D281A2C900056C7B5BDB3507E7F4CAEAE77619129B75F068421BF3B0AC6` | Widget Shelf and hidden Custom Theme |
| `rw2-t84.png` | `5F8313D53802FE9A783A684616BC685C752325E4BD039E94D6A75CC708B5F7D9` | restored Custom Theme as a left tab |
| `rw2-1-t2.png` | `343267F966A3D1A7E0C8DACE8ADFC886792708E45CA2DD472A79539F6F23F11B` | Canvas Ink authoring |
| `rw2-1-t14.png` | `131540F086240423291473B0CD5EC0106AC0054E5A9DF3E3B524123580853AA7` | Control Chrome propagation |
| `rw2-1-t26.png` | `C36E7AD1A28660C2DAE68FAFC84880887016CBEB1843D530EC347AD2B88B2653` | ambient/chrome color interaction |
| `rw2-1-t39.png` | `1F2F08A310FF15C9F9B53B1AB9E66ED7E774270F9DF66DB59CE44CCD6872A735` | Interface Text propagation and unsafe edit behavior |
| `rw2-1-t60.png` | `61E80EDC61D6CD78B853E86474486470ABDF6C2D27C29EAFB5445B6C227D9520` | muted chrome, ambient authoring, floating surfaces |
| `rw2-1-t80.png` | `6403A7BCFD8F43195FA42C5D9715CC79964C8B7569F47C22FDEEFD1B89804997` | final Ash & Amber target |

- [ ] **Step 1: Extend the failing visual-reference test**

Require both video digest literals, exact timestamps, `1920x1280` frame dimensions, frame digests, repository-relative paths, unique scenario IDs, and documented authority purpose. Reject missing/extra frames, absolute source paths, hash drift, and a manifest that points at the MP4.

- [ ] **Step 2: Run RED**

```powershell
node --test tests/unit/visual-reference-assets.test.mjs
```

- [ ] **Step 3: Re-extract and verify every frame**

For each timestamp use the same deterministic command shape:

```powershell
ffmpeg -hide_banner -loglevel error -ss 52.000 -i 'C:\Users\Keptin\Videos\SonderUI_RW2.mp4' -frames:v 1 -c:v png "$env:TEMP\rw2-t52.png"
Get-FileHash -Algorithm SHA256 "$env:TEMP\rw2-t52.png"
```

Repeat with the literal table timestamps and source file. Stop on any mismatch. Copy only verified PNGs to the reference directory; reuse the already locked t=80 frame.

- [ ] **Step 4: Run GREEN and commit evidence**

```powershell
node --test tests/unit/visual-reference-assets.test.mjs
git diff --check
git add design/theme-targets/deep-current design/theme-targets/ash-amber docs/theme-art-direction-assets.md tests/unit/visual-reference-assets.test.mjs
git commit -m "test: lock Deep recording frames"
```

### Task 2: Replace shallow macro checks with exact fidelity measurements

**Files:**

- Modify: `tests/conformance/types.ts`
- Modify: `tests/conformance/measurements.ts`
- Modify: `tests/conformance/compare.ts`
- Modify: `tests/conformance/viewports.ts`
- Modify: `tests/conformance/manifest.ts`
- Create: `tests/conformance/drivers/reference/recording-frame.ts`
- Modify: `tests/conformance/drivers/reference/atmospheric.ts`
- Modify: `tests/conformance/drivers/workbench-lab/deep-current.ts`
- Create: `tests/conformance/specs/deep-fidelity.spec.ts`
- Create: `tests/conformance/baselines/deep-fidelity.json`
- Modify: `tests/unit/conformance.test.mjs`
- Create: `docs/conformance/deep-fidelity-ledger.md`

**Measurement contract:**

```ts
export interface FidelityMeasurement {
  readonly geometry: Readonly<Record<
    'header' | 'left' | 'stage' | 'right' | 'story' | 'composer' | 'floating' | 'widgetShelf',
    RegionMeasurement
  >>;
  readonly typography: Readonly<Record<
    'wordmark' | 'navigation' | 'widgetTitle' | 'technical' | 'storyHeading' | 'storyBody' | 'composer',
    { family: string; size: number; weight: number; lineHeight: number; tracking: number; transform: string }
  >>;
  readonly materials: Readonly<Record<
    'header' | 'widget' | 'widgetHeader' | 'storyVeil' | 'composer' | 'floating' | 'dialog',
    { background: string; opacity: number; blur: number; border: string; radius: number; shadow: string }
  >>;
  readonly structure: {
    readonly panelTabs: readonly string[];
    readonly regions: readonly string[];
    readonly visibleWidgets: readonly string[];
    readonly widgetLocations: Readonly<Record<string, string>>;
  };
  readonly functional: {
    readonly stateReached: true;
    readonly identityStable: true;
    readonly noOverflow: true;
    readonly keyboardAccessible: true;
  };
}
```

- [ ] **Step 1: Add failing fail-closed tests**

Require every measurement path above, both executable prototype authorities, every recording frame hash, original-resolution screenshots, pixel diff images, and a ledger row for every nonzero structural/material discrepancy. Add `REFERENCE_HASH_DRIFT`, `REFERENCE_SETUP_FAILED`, `MEASUREMENT_FAILED`, `IMPLEMENTATION_SETUP_FAILED`, and `UNLEDGERED_DISCREPANCY` fixtures.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd run test:conformance:unit
```

- [ ] **Step 3: Implement independent drivers and profiles**

The Atmospheric driver uses only its preserved iframe/test API. The recording driver reads only the committed manifest/frame pixels and records image landmarks approved in the baseline. The Lab driver uses public controls and stable attributes. Do not import Lab CSS or target definitions into reference code.

- [ ] **Step 4: Capture the honest pre-change baseline**

```powershell
npm.cmd run build
npm.cmd exec playwright test --config playwright.conformance.config.mjs tests/conformance/specs/deep-fidelity.spec.ts
```

Populate `deep-fidelity-ledger.md` with every observed gap. Existing `closed` rows in `deep-current-ledger.md` are not waivers; transfer any gap that remains perceptually visible into the new ledger as open.

- [ ] **Step 5: Commit the red fidelity contract**

```powershell
git add tests/conformance tests/unit/conformance.test.mjs docs/conformance/deep-fidelity-ledger.md
git commit -m "test: define exact Deep fidelity"
```

### Task 3: Recompose the shared Workbench as the Atmospheric story stage

**Files:**

- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelTabs.svelte`
- Modify: `apps/workbench-lab/src/recipes/PanelTemplateSurface.svelte`
- Modify: `apps/workbench-lab/src/recipes/DockRegion.svelte`
- Modify: `apps/workbench-lab/src/recipes/DockShelf.svelte`
- Modify: `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Create: `apps/workbench-lab/src/recipes/StoryStage.svelte`
- Create: `apps/workbench-lab/src/recipes/StoryComposer.svelte`
- Create: `apps/workbench-lab/src/recipes/WorkbenchDeveloperDrawer.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: corresponding `registry/recipes` copies and `registry/recipes/recipe-manifest.json`
- Modify: `apps/workbench-lab/src/App.test.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/browser/native-workbench-visual.spec.ts`

**Shared composition contract:**

- One restrained full-width header owns wordmark, top-level Panel tabs, story identity, and status.
- `story-stage.v1` places left instruments, image-led stage, right instruments, story reading veil, and bottom composer into one viewport.
- Dock surfaces are edge-to-edge stacks with flush shared seams, not detached card columns.
- Story prose is unboxed over the lower stage veil; composer is a single integrated 56-pixel instrument in wide authority geometry.
- Developer context, persistence controls, event log, and native-contract evidence move into an explicit developer drawer and do not occupy the default reference composition.
- Compact, short landscape, and 200-percent zoom hide both instrument docks and retain reachable stage/story/composer controls in one viewport.

- [ ] **Step 1: Write failing shared-geometry component/browser tests**

At Atmospheric authority viewports require exact header/stage/dock/composer regions within existing conformance tolerances. Assert the default DOM contains no detached context rail or footer band, the developer drawer remains keyboard reachable, story/prose is not inside a generic Widget card, composer retains its live textarea identity, and every target uses the same region/part inventory.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench-accessibility.spec.ts tests/browser/native-workbench-visual.spec.ts --project=chromium --grep "stage|composition|compact|landscape|zoom"
```

- [ ] **Step 3: Implement the shared structure**

Use resolved template regions and semantic parts only. Keep Panel tabs as true tabs and Widget regions as their existing instances. `StoryStage` receives snippets/fixtures; it does not own Sonder state. Move developer controls without deleting their behavior or evidence.

- [ ] **Step 4: Refresh recipe hashes and run GREEN**

```powershell
node scripts/verify-recipes.mjs --write
npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench-accessibility.spec.ts tests/browser/native-workbench-visual.spec.ts --project=chromium --grep "stage|composition|compact|landscape|zoom"
```

- [ ] **Step 5: Commit the shared Atmospheric composition**

```powershell
git add apps/workbench-lab/src registry/recipes tests/browser
git commit -m "feat(lab): adopt Atmospheric composition"
```

### Task 4: Calibrate Deep materials, typography, canvas, and density through target data

**Files:**

- Modify: `apps/workbench-lab/src/themes/deep-current.ts`
- Modify: `apps/workbench-lab/src/themes/base.ts`
- Modify: `packages/theme/src/compile.test.ts`
- Modify: `packages/theme/src/canvas.test.ts`
- Modify: `apps/workbench-lab/src/themes/themes.test.ts`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/theme-renderer-contracts.spec.ts`
- Modify: `tests/browser/native-workbench-visual.spec.ts`

**Deep target requirements:**

- Near-black cyan-green canvas with one local reservoir image, top-to-bottom reading veil, and localized ambient light.
- Low-opacity glass with visible backdrop relationship, restrained one-pixel seams, square/chamfered precision, and no oversized rounded shell.
- One compact sans/technical voice for chrome and one literary serif voice for story prose.
- Uppercase/monospace reserved for figure, status, and measurement labels; normal casing for user actions and prose.
- Widget title bars are shallow shared-edge strips; content rows use separators, not nested cards.
- Selection is quiet cyan; status is restrained green; amber is a source/status accent; no arbitrary magenta leakage in frozen Deep.
- Exact preserved material calibration state remains `20/60/6/50` for reference comparisons.

- [ ] **Step 1: Write failing literal target and computed-style tests**

Assert complete V3 data, all semantic parts, required local assets, exact material control state, target-specific font roles, shape/radius families, single blur owner per stack, root-only canvas, visible veil/ambient, dock transparency, title-bar height, row separators, story line length/line-height, composer height, and contrast under normal/reduced transparency.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/theme/src/compile.test.ts packages/theme/src/canvas.test.ts apps/workbench-lab/src/themes/themes.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/theme-renderer-contracts.spec.ts --project=chromium --grep "Deep Current"
```

- [ ] **Step 3: Adjust only data and generic part consumers**

Prefer `deep-current.ts` material/shape/part/canvas/ambient values. If a generic consumer fails to consume a declared recipe, fix the fixed semantic-part consumer for all targets. Do not add `[data-pom-theme="deep-current"]`, target CSS imports, or stage wallpaper pseudo-elements.

- [ ] **Step 4: Run GREEN and inspect first calibrated render**

```powershell
npm.cmd exec vitest run packages/theme/src/compile.test.ts packages/theme/src/canvas.test.ts apps/workbench-lab/src/themes/themes.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/theme-renderer-contracts.spec.ts tests/browser/native-workbench-visual.spec.ts --project=chromium --grep "Deep Current|wide scene|compact scene"
```

- [ ] **Step 5: Commit Deep target calibration**

```powershell
git add packages/theme apps/workbench-lab/src/themes apps/workbench-lab/src/styles.css tests/browser
git commit -m "feat(theme): calibrate Deep Current"
```

### Task 5: Conform the five recording-visible Widget surfaces

**Files:**

- Create: `apps/workbench-lab/src/mockup/renderers/SceneEffectsWidget.svelte`
- Create: `apps/workbench-lab/src/mockup/renderers/PersonasWidget.svelte`
- Create: `apps/workbench-lab/src/mockup/renderers/AiConnectionsWidget.svelte`
- Modify: `apps/workbench-lab/src/mockup/renderers/CharactersWidget.svelte`
- Modify: `apps/workbench-lab/src/recipes/ThemeSettings.svelte`
- Modify: `apps/workbench-lab/src/mockup/renderers/ImplementedWidget.svelte`
- Modify: `apps/workbench-lab/src/mockup/implemented-surfaces.ts`
- Modify: `apps/workbench-lab/src/mockup/surface-fixtures.ts`
- Modify: `apps/workbench-lab/src/mockup/state.ts`
- Create: `apps/workbench-lab/src/mockup/frame-titles.ts`
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Modify: `tests/conformance/widget-manifest.ts`
- Modify: `tests/conformance/specs/deep-current-widgets.spec.ts`

**Stable type mapping:**

| Recording title | Existing stable Widget type | Lab presentation |
|---|---|---|
| Characters | `story.characters` | four portrait rows, count `4 / 7`, seen/near/away/? status |
| Scene Effects | `story.room-ambience` | Atmosphere 62, Contrast 38, Motion Idle, Reading Veil 48 |
| Personas | `story.personas` | active perspective, Voice, Memory lens, Agency, Private context |
| AI Connections | `settings.connections` | inference route Ready, Director/Narrator, character routes, latency |
| Custom Theme | `settings.custom-theme` | Plan 3's canonical six-role/material/ambient editor |

The Lab title adapter supplies the recording labels for these Scene instances without changing package manifests, Catalog totals, or global Widget type identity.

- [ ] **Step 1: Write failing content/anatomy tests**

Require literal labels/order/statuses, portrait alt text, tab semantics, range names/values, separators, compact title bars, row density, menu actions, one scroll owner, focus mode, state surfaces, and no horizontal overflow. Preserve all 94 Catalog identities and the honest implemented/unavailable counts after adding these renderers.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts apps/workbench-lab/src/mockup/implemented-surfaces.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench.spec.ts --project=chromium --grep "Characters|Scene Effects|Personas|AI Connections|Custom Theme"
```

- [ ] **Step 3: Implement fixture-owned renderers**

Use the existing live Widget instance/renderer boundary and semantic parts. Keep provider secrets, real story state, and engine semantics out of fixtures. Display-only values reproduce the recording; actions remain honest local demo controls.

- [ ] **Step 4: Run GREEN and Widget conformance**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts apps/workbench-lab/src/mockup/implemented-surfaces.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench.spec.ts --project=chromium --grep "Characters|Scene Effects|Personas|AI Connections|Custom Theme"
npm.cmd exec playwright test --config playwright.conformance.config.mjs tests/conformance/specs/deep-current-widgets.spec.ts
```

- [ ] **Step 5: Commit recording-visible Widgets**

```powershell
git add apps/workbench-lab/src tests/browser tests/conformance
git commit -m "feat(lab): conform reference Widgets"
```

### Task 6: Match shelf, tab, floating, and docking presentation states

**Files:**

- Modify: `apps/workbench-lab/src/recipes/WidgetShelf.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetGroup.svelte`
- Modify: `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Modify: `apps/workbench-lab/src/recipes/DockShelf.svelte`
- Modify: `apps/workbench-lab/src/recipes/PlacementRails.svelte`
- Modify: `apps/workbench-lab/src/recipes/WorkbenchSurface.svelte`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: corresponding `registry/recipes` files and manifest
- Create: `tests/browser/deep-recording-states.spec.ts`
- Modify: `tests/conformance/drivers/workbench-lab/interactions.ts`
- Modify: `tests/conformance/specs/deep-current-interactions.spec.ts`

**Reference flows:**

1. Float AI Connections above the stage and raise it.
2. Dock AI Connections under Characters on the right.
3. Tab Personas and AI Connections with real tab semantics.
4. Open Widget Shelf and report `Left`, `Right`, `Floating`, or `Hidden`.
5. Shelve Custom Theme, then restore it as a left tab without identity loss.
6. Show quiet `−`, `+`, and `⋮` shelf controls with large invisible touch targets.

- [ ] **Step 1: Write failing exact-state flows**

For every flow assert functional trace, unchanged instance identity/state, geometry, z-order, semantic part inventory, title/tab target priority, keyboard/touch equivalence, focus, persistence, and screenshot comparison with the corresponding recording frame.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/deep-recording-states.spec.ts --project=chromium
```

- [ ] **Step 3: Calibrate shared presentation, not behavior forks**

Reuse Plan 2 commands. Adjust generic shelf/group/frame/rail presentation and the Deep recipe values. Keep the reference `25/50/25` body zones and `10px` hysteresis unchanged.

- [ ] **Step 4: Refresh recipes and run GREEN**

```powershell
node scripts/verify-recipes.mjs --write
npm.cmd run build
npm.cmd exec playwright test tests/browser/deep-recording-states.spec.ts --project=chromium
npm.cmd exec playwright test --config playwright.conformance.config.mjs tests/conformance/specs/deep-current-interactions.spec.ts
```

- [ ] **Step 5: Commit reference interaction states**

```powershell
git add apps/workbench-lab/src registry/recipes tests/browser tests/conformance
git commit -m "feat(lab): match Deep recording states"
```

### Task 7: Close responsive and accessibility fidelity across all targets

**Files:**

- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/browser/shared-workbench-capabilities.spec.ts`
- Modify: `tests/browser/theme-settings.spec.ts`
- Modify: `tests/browser/deep-recording-states.spec.ts`
- Modify: `tests/browser/theme-renderer-contracts.spec.ts`

- [ ] **Step 1: Add failing viewport/preference matrix**

Test `1600x900`, `1440x900`, `1180x800`, `768x1024`, `430x932`, `390x844`, `844x390`, and `800x450`. For every target require no document overflow, reachable header/stage/story/composer, hidden compact docks with reachable open controls, one scroll owner per surface, full keyboard flow, visible focus, 44-pixel coarse targets, reduced motion, and reduced transparency.

- [ ] **Step 2: Add Deep-specific readable-density checks**

Require story text line length and line height, composer visible without page scroll, non-overlapping portrait/status rows, contained settings controls, no clipped floating frame, and no title/control collision at 200-percent zoom equivalent.

- [ ] **Step 3: Run RED**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench-accessibility.spec.ts tests/browser/shared-workbench-capabilities.spec.ts tests/browser/theme-settings.spec.ts tests/browser/deep-recording-states.spec.ts tests/browser/theme-renderer-contracts.spec.ts --project=chromium
```

- [ ] **Step 4: Fix shared responsive rules and run GREEN**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench-accessibility.spec.ts tests/browser/shared-workbench-capabilities.spec.ts tests/browser/theme-settings.spec.ts tests/browser/deep-recording-states.spec.ts tests/browser/theme-renderer-contracts.spec.ts --project=chromium
```

- [ ] **Step 5: Commit responsive closure**

```powershell
git add apps/workbench-lab/src/styles.css tests/browser
git commit -m "fix(lab): close responsive fidelity"
```

### Task 8: Run the adversarial original-resolution visual critic loop

**Files:**

- Modify: `docs/conformance/deep-fidelity-ledger.md`
- Create: `docs/conformance/deep-fidelity-critic-ledger.md`
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Add reviewed snapshots under: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/`
- Modify: `tests/conformance/baselines/deep-fidelity.json`

**Required final captures:** wide Scene, compact Scene, short landscape, zoom equivalent, floating AI Connections, right dock stack, Widget Shelf, Custom Theme tab, Theme Settings expanded, and Ash & Amber final state.

- [ ] **Step 1: Generate a complete candidate set**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench-visual.spec.ts tests/browser/deep-recording-states.spec.ts --project=chromium
npm.cmd exec playwright test --config playwright.conformance.config.mjs tests/conformance/specs/deep-fidelity.spec.ts
```

- [ ] **Step 2: Inspect every source/actual/overlay/diff at original resolution**

Review composition, ratios, seams, title bars, typography, line length, portrait scale, story veil, single blur ownership, ambient falloff, control density, tab/floating hierarchy, compact transformation, focus, and clipping. A finding is substantive when the implementation reads as a generic dashboard/card grid, loses target identity, weakens material/typography hierarchy, or changes reference interaction feel even if structured checks pass.

- [ ] **Step 3: Record findings before fixes**

Each critic row includes round, capture, severity, evidence, diagnosis, correction, and result. Fix blocking/substantive findings test-first, regenerate the entire capture set, and repeat. Never delete a historical round.

- [ ] **Step 4: Freeze only a zero-finding round**

Promote screenshots and baseline values only when one complete fresh round has zero blocking and zero substantive findings. Record every promoted PNG SHA-256. Preference-only notes must identify a coherent alternative, not disguise an unresolved defect.

- [ ] **Step 5: Commit the reviewed evidence**

```powershell
git add docs/conformance tests/browser tests/conformance/baselines/deep-fidelity.json
git commit -m "test: freeze exact Deep fidelity"
```

### Task 9: Final program gate, review, and integration readiness

- [ ] Review all four plans and the approved design line by line; create a finite checklist mapping every completion criterion to test/evidence.
- [ ] Search for unfinished markers, temporary fixtures, target-ID selectors, imported prototype source, remote assets, recursive Panels, stale edge-state fields, serialized transient state, and duplicated Theme Settings owners.
- [ ] Verify all source/reference frame hashes and that no MP4 is tracked.
- [ ] Verify V1/V2 compatibility, V3 target separation, all four data-only targets, root-only canvas ownership, and all semantic parts.
- [ ] Verify the immutable Atmospheric harness reports `95/95` and Widget Overhaul reports `212/212`.
- [ ] Run fresh focused gates, then `npm.cmd run check` when ports `4173/4174` are available; wait rather than terminate another worktree's servers.
- [ ] Run an adversarial code review and resolve every correctness, accessibility, migration, source-boundary, or fidelity finding.
- [ ] Record the final merged-upstream base SHA, branch head SHA, command outputs, screenshot hashes, and critic round in the goal report.
- [ ] Prepare integration without package publication, public hosting changes, license changes, Sonder cutover, or preserved artifact mutation.
