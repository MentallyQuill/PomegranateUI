# Ash & Amber Fourth Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hash-lock the reviewed `SonderUI_RW2_1` frame, separate theme, canvas, and ambient ownership, and ship Ash & Amber as a complete fourth Workbench Lab target with atomic switching and frozen conformance evidence.

**Architecture:** Begin from the final merged Theme Recipes/PomOS revision. Preserve its accepted V1/V2 input, `ResolvedThemeV2`, semantic-part compiler, policy, assets, and root-only layered canvas contracts. Add an additive V3 target envelope whose `ThemeDefinitionV3`, `CanvasDefinition`, and `AmbientProfile` are separate validated owners; migrate V1/V2 input by lifting the legacy canvas array into the envelope. Resolve and compile that envelope atomically while keeping the live Workbench store outside activation. The recording frame is immutable design evidence, never a runtime canvas or imported application implementation.

**Tech Stack:** TypeScript, Zod, `@pomegranate-ui/contracts`, `@pomegranate-ui/theme`, Svelte 5, CSS custom properties, Vitest, Playwright, SHA-256 evidence manifests, Vite.

**Spec:** `docs/superpowers/specs/2026-08-29-deep-fidelity-shared-workbench-ash-amber-design.md`

## Global Constraints

- Use the exact source and frame digests in the approved spec. Never commit the MP4 or modify preserved prototypes.
- Do not begin implementation until `Align Svelte rebuild goals` reports its final merged `main` SHA. Rebase this branch onto that SHA; never cherry-pick its in-progress checkpoint.
- Preserve the exact accepted `pomegranate.ui.theme.v2` schema/API for compatibility. New target owners are additive V3 contracts: `ThemeDefinitionV3` contains no canvas or ambient layers; `CanvasDefinition` contains no component materials; `AmbientProfile` contains no arbitrary CSS or remote asset.
- Reuse `ThemeAssetRegistry`, `resolveThemeV2`, `applyThemePolicy`, `compileThemeBindings`, `compileThemeStyleSheet`, `compileCanvasLayers`, and the 22-part `data-pom-part` vocabulary. Do not create a parallel compiler or Lab-only binding path.
- All four targets use one `ThemeTargetBundle` activation path and one mounted Panel/Widget tree.
- Preserve stable preset IDs `deep-current`, `pom-neutral`, `bunny`, and `ash-amber`; the user-facing fourth label is exactly `Ash & Amber`.
- Keep theme preference storage device-local and separate from layout persistence.
- Do not add theme-ID behavior branches, remote URLs, runtime dependencies, package publication, hosting, or Sonder cutover.
- Every production change follows a witnessed red-green cycle. Use `npm.cmd` on Windows.
- Do not update a screenshot or hash merely to make a failing test green. Diagnose the difference and record it in the target ledger.

---

### Task 1: Import and fail-closed hash-lock the canonical authority frame

**Files:**

- Create: `design/theme-targets/ash-amber/sonderui-rw2-1-t80.png`
- Create: `design/theme-targets/ash-amber/reference.json`
- Create: `tests/unit/visual-reference-assets.test.mjs`
- Modify: `docs/theme-art-direction-assets.md`

**Interfaces:**

```ts
type VisualReferenceManifest = {
  schema: 'pomegranate.ui.visual-reference.v1';
  id: 'sonderui-rw2-1-ash-amber-t80';
  source: {
    fileName: 'SonderUI_RW2_1.mp4';
    sha256: '56F84670C2A4B1318BD26A9A482790AE93C49387D47A6D6A4AF7C470C635A889';
    width: 1920;
    height: 1280;
    fps: 60;
    durationSeconds: 101.682;
  };
  extraction: {
    timestampSeconds: 80;
    output: 'sonderui-rw2-1-t80.png';
    sha256: '6403A7BCFD8F43195FA42C5D9715CC79964C8B7569F47C22FDEEFD1B89804997';
  };
};
```

- [ ] **Step 1: Write the failing manifest/hash test**

Add a test that parses `reference.json`, checks every literal above, hashes the repository PNG, and fails if the file is absent, malformed, outside `design/theme-targets/ash-amber`, or has a different digest. Also reject absolute source paths in the committed manifest.

- [ ] **Step 2: Run the focused test and witness RED**

```powershell
node --test tests/unit/visual-reference-assets.test.mjs
```

Expected: FAIL because the manifest and PNG do not exist.

- [ ] **Step 3: Re-extract and verify the source before import**

```powershell
Get-FileHash -Algorithm SHA256 'C:\Users\Keptin\Videos\SonderUI_RW2_1.mp4'
ffmpeg -hide_banner -loglevel error -ss 80.000 -i 'C:\Users\Keptin\Videos\SonderUI_RW2_1.mp4' -frames:v 1 -c:v png "$env:TEMP\sonderui-rw2-1-t80.png"
Get-FileHash -Algorithm SHA256 "$env:TEMP\sonderui-rw2-1-t80.png"
```

Stop if either digest differs. Copy only the verified PNG into the new reference directory, then create the deterministic manifest and document that this is reviewed reference evidence with no runtime or redistribution claim for the full recording.

- [ ] **Step 4: Run GREEN and repository-boundary checks**

```powershell
node --test tests/unit/visual-reference-assets.test.mjs
npm.cmd run test:unit -- --grep "visual reference|repository boundary"
git diff --check
```

- [ ] **Step 5: Commit the authority lock**

```powershell
git add design/theme-targets/ash-amber docs/theme-art-direction-assets.md tests/unit/visual-reference-assets.test.mjs
git commit -m "test: lock Ash and Amber authority"
```

### Task 2: Separate target contracts and preserve strict validation

**Files:**

- Create: `packages/contracts/src/canvas-definition.ts`
- Create: `packages/contracts/src/ambient.ts`
- Create: `packages/contracts/src/theme-target.ts`
- Create: `packages/contracts/src/theme-v3.ts`
- Modify: `packages/contracts/src/theme.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/src/theme.test.ts`
- Modify: `packages/contracts/src/contracts.test.ts`
- Modify: `packages/contracts/README.md`

**Interfaces:**

```ts
export const CANVAS_SCHEMA_VERSION = 'pomegranate.ui.canvas.v1' as const;
export const AMBIENT_SCHEMA_VERSION = 'pomegranate.ui.ambient.v1' as const;
export const THEME_TARGET_SCHEMA_VERSION = 'pomegranate.ui.theme-target.v1' as const;
export const THEME_SCHEMA_VERSION_V3 = 'pomegranate.ui.theme.v3' as const;

export type ThemeDefinitionV3 = Omit<
  ThemeDefinitionV2,
  'schemaVersion' | 'canvas'
> & {
  readonly schemaVersion: typeof THEME_SCHEMA_VERSION_V3;
};

export type CanvasDefinition = {
  readonly schemaVersion: typeof CANVAS_SCHEMA_VERSION;
  readonly id: string;
  readonly layers: readonly ThemeCanvasLayer[];
};

export type AmbientProfile = {
  readonly schemaVersion: typeof AMBIENT_SCHEMA_VERSION;
  readonly id: string;
  readonly colorRole: 'accent' | 'selection' | 'danger' | 'success' | 'warning';
  readonly position: { readonly x: number; readonly y: number };
  readonly radius: number;
  readonly power: number;
  readonly motion?: {
    readonly enabled: boolean;
    readonly driftX: number;
    readonly driftY: number;
    readonly durationMs: number;
  };
};

export type ThemeTargetBundle = {
  readonly schemaVersion: typeof THEME_TARGET_SCHEMA_VERSION;
  readonly id: string;
  readonly theme: ThemeDefinitionV3;
  readonly canvas: CanvasDefinition;
  readonly ambient: AmbientProfile;
};
```

`x`, `y`, `radius`, and `power` are normalized finite numbers in `[0, 1]`. Motion drift is bounded to `[-1, 1]` and duration to `250..120000` milliseconds. `ThemeTargetBundleSchema` refines that bundle, theme, canvas, and ambient IDs are identical.

V1 and V2 remain accepted exactly as delivered upstream. Reuse their
`ThemeCanvasLayerSchema`; do not move or redefine it. `ThemeDefinitionV3Schema`
is derived from the V2 structure with `schemaVersion` replaced and `canvas`
omitted. `ThemeTargetBundleSchema` accepts V3 only. Compatibility migration in
Task 3 lifts a valid V1/V2 canvas array into `CanvasDefinition.layers`.

- [ ] **Step 1: Write failing contract tests**

Add tests proving a complete bundle parses, its three owners remain separate, and strict schemas reject mismatched IDs, a remote image URL, invalid hex, out-of-range ambient values, excess layers, unknown keys, and executable strings. Assert the Ash profile parses as:

```ts
{
  schemaVersion: AMBIENT_SCHEMA_VERSION,
  id: 'ash-amber',
  colorRole: 'accent',
  position: { x: 0.57, y: 0.97 },
  radius: 0.60,
  power: 0.56
}
```

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/contracts/src/theme.test.ts packages/contracts/src/contracts.test.ts
```

Expected: FAIL because the additive V3 target-owner schemas do not exist.

- [ ] **Step 3: Implement the minimal schemas and exports**

Keep `contracts` free of DOM and framework imports. Reuse the upstream local asset ID grammar, semantic parts, material/shape recipes, controls, and strict cross-reference validation. Preserve the exact V1/V2 exports and tests.

- [ ] **Step 4: Run GREEN and typecheck**

```powershell
npm.cmd exec vitest run packages/contracts/src/theme.test.ts packages/contracts/src/contracts.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit the target contract split**

```powershell
git add packages/contracts
git commit -m "feat(contracts): separate theme target owners"
```

### Task 3: Resolve complete target bundles and compile ambient/canvas bindings

**Files:**

- Create: `packages/theme/src/resolve-target.ts`
- Create: `packages/theme/src/migrate-target.ts`
- Modify: `packages/theme/src/resolve.ts`
- Modify: `packages/theme/src/conformance.ts`
- Modify: `packages/theme/src/index.ts`
- Modify: `packages/theme/src/theme.test.ts`
- Modify: `packages/theme/README.md`
- Modify: `apps/workbench-lab/src/themes/material-controls.ts`
- Modify: `apps/workbench-lab/src/themes/themes.test.ts`

**Interfaces:**

```ts
export interface ResolvedThemeTarget {
  readonly id: string;
  readonly theme: ResolvedThemeV2;
  readonly canvas: CanvasDefinition;
  readonly ambient: AmbientProfile;
}

export type ThemeTargetResolution =
  | { readonly ok: true; readonly target: ResolvedThemeTarget; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeDiagnostic[] };

export function resolveThemeTarget(input: unknown): ThemeTargetResolution;
export function migrateThemeTarget(input: ThemeDefinitionInput | ThemeTargetBundle): ThemeTargetMigrationResult;
export function collectThemeTargetAssetIds(target: ResolvedThemeTarget): readonly string[];
export function compileThemeTarget(target: ResolvedThemeTarget, policy?: ThemePolicy): {
  readonly bindings: Readonly<Record<string, string>>;
  readonly styleSheet: string;
  readonly canvas: readonly CanvasPresentationLayer[];
  readonly ambient: AmbientProfile;
};
export function projectMaterialControls(target: ThemeTargetBundle, controls: LabMaterialControls): ThemeTargetBundle;
```

`resolveThemeV2()` and all upstream compilation APIs remain unchanged. `migrateThemeTarget()` first uses upstream `migrateTheme()` for V1 input, then lifts V2 `canvas` into a V3 envelope and supplies a bounded static fallback ambient profile. `resolveThemeTarget()` validates the envelope once, resolves V3 through the V2-compatible material/part resolver, deep-freezes every owner, and returns no partial success. `compileThemeTarget()` delegates to upstream binding, fixed-selector stylesheet, canvas-layer, asset, and policy functions; it only adds deterministic `--pom-ambient-*` bindings.

- [ ] **Step 1: Write failing resolution tests**

Test V1->V2->target and V2->target deterministic migration, deep freeze, stable asset order across theme materials and canvas layers, fail-closed bundle resolution, canonical binding sort order, unchanged fixed-selector stylesheet, and exact ambient values. Prove material policy changes only effective resolved materials and preserves the canvas and ambient object values.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/theme/src/theme.test.ts apps/workbench-lab/src/themes/themes.test.ts
```

- [ ] **Step 3: Implement bundle resolution and binding projection**

Delegate theme/material/icon asset collection to upstream helpers and add canvas assets from `target.canvas.layers` without duplication. Compile semantic parts from `target.theme`, layered canvas through `compileCanvasLayers`, and ambient through the additive envelope.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run packages/theme/src/theme.test.ts apps/workbench-lab/src/themes/themes.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit target resolution**

```powershell
git add packages/theme apps/workbench-lab/src/themes/material-controls.ts apps/workbench-lab/src/themes/themes.test.ts
git commit -m "feat(theme): resolve complete target bundles"
```

### Task 4: Convert the three existing targets and add Ash & Amber

**Files:**

- Modify: `apps/workbench-lab/src/themes/deep-current.ts`
- Modify: `apps/workbench-lab/src/themes/pom-neutral.ts`
- Modify: `apps/workbench-lab/src/themes/bunny.ts`
- Create: `apps/workbench-lab/src/themes/ash-amber.ts`
- Modify: `apps/workbench-lab/src/themes/presets.ts`
- Modify: `apps/workbench-lab/src/themes/material-controls.ts`
- Modify: `apps/workbench-lab/src/themes/themes.test.ts`
- Modify: `apps/workbench-lab/src/assets.d.ts`

**Interfaces:**

Each preset module exports one V3 bundle (`DEEP_CURRENT_TARGET`, `POM_NEUTRAL_TARGET`, `BUNNY_TARGET`, `ASH_AMBER_TARGET`) migrated from the final upstream V2 data definitions without changing their rendered parts. `LAB_THEME_IDS` becomes:

```ts
export const LAB_THEME_IDS = [
  'deep-current',
  'pom-neutral',
  'bunny',
  'ash-amber'
] as const;
```

Ash & Amber uses the exact seed and material values:

```ts
const seed = {
  canvas: '#2C2938',
  surface: '#382D31',
  chrome: '#716667',
  accent: '#84008E',
  text: '#FFFFFF',
  warning: '#D2B57A'
};

const materialControls = {
  glassDensity: 20,
  barOpacity: 60,
  selectedStrength: 6,
  frostLevel: 50
};
```

Map derived roles, V2 materials, shapes, all 22 semantic parts, control anatomy, and composition values deliberately and literally in `ASH_AMBER_TARGET`; do not generate an indistinguishable all-purple palette. Use `image.deep-current-stage` only as a bounded local canvas layer under a plum reading veil and amber source highlight. The canonical authority PNG is not the runtime background.

- [ ] **Step 1: Write failing four-target table tests**

Assert exactly four unique IDs; exact labels; each owner ID matches the preset; every target resolves; all required assets are local; each preset satisfies contrast; and Ash & Amber has the six recorded seed values, material controls, and ambient profile.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts
```

Expected: FAIL on the preset count, absent fourth target, and old three preset shapes.

- [ ] **Step 3: Convert presets and implement Ash & Amber**

Preserve the final merged visual values, compiled semantic parts, canvas descriptors, and policy behavior of the first three targets during envelope migration. Add the fourth definition without changing Svelte markup, stable part annotations, or Widget fixtures.

- [ ] **Step 4: Run GREEN and contrast matrix**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts packages/theme/src/theme.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit all four target definitions**

```powershell
git add apps/workbench-lab/src/themes apps/workbench-lab/src/assets.d.ts
git commit -m "feat(lab): add Ash and Amber target"
```

### Task 5: Make four-target activation atomic and identity preserving

**Files:**

- Modify: `apps/workbench-lab/src/themes/controller.ts`
- Modify: `apps/workbench-lab/src/themes/theme-storage.ts`
- Modify: `apps/workbench-lab/src/mockup/host-context.ts`
- Modify: `apps/workbench-lab/src/App.svelte`
- Modify: `apps/workbench-lab/src/themes/themes.test.ts`
- Modify: `apps/workbench-lab/src/App.test.ts`
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`

**Interfaces:**

```ts
export interface LabThemeSnapshot {
  readonly activeId: LabThemeId;
  readonly resolved: ResolvedThemeTarget;
  readonly compiled: ReturnType<typeof compileThemeTarget>;
  readonly materialControls: LabMaterialControls;
  readonly diagnostics: readonly ThemeDiagnostic[];
}
```

The controller resolves the entire target and asset set before assigning `snapshot`. On any schema, contrast, or asset diagnostic, the old snapshot remains object-identical and no preference is written.

- [ ] **Step 1: Add failing controller and browser assertions**

Cover successful selection of all four targets, persisted `ash-amber`, unknown/corrupt preference fallback, unavailable target asset rejection, and failed activation preserving the previous snapshot. In Playwright capture `data-workbench-revision`, Panel IDs, Widget instance IDs, focused Widget ID, active Panel, and live textarea value; switch through all four targets; assert exact equality and zero transition duration.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts apps/workbench-lab/src/App.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench.spec.ts --project=chromium --grep "complete themes"
```

- [ ] **Step 3: Implement the atomic controller migration**

Update host inspection to read `snapshot.resolved.theme`. Apply `compiled.bindings`, the upstream fixed-selector stylesheet, `ThemeCanvas` descriptors, and additive ambient bindings through the existing root owners. Add the fourth visible chooser. Do not recreate `store`, `catalog`, `rendererRegistry`, host context, semantic part tree, or the Panel tree on activation.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/themes.test.ts apps/workbench-lab/src/App.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts --project=chromium --grep "theme|target"
```

- [ ] **Step 5: Commit atomic activation**

```powershell
git add apps/workbench-lab/src tests/browser/native-workbench.spec.ts tests/browser/native-workbench-accessibility.spec.ts
git commit -m "feat(lab): activate four targets atomically"
```

### Task 6: Add Ash & Amber conformance and frozen Windows evidence

**Files:**

- Modify: `tests/conformance/authorities.ts`
- Modify: `tests/conformance/types.ts`
- Modify: `tests/conformance/manifest.ts`
- Modify: `tests/conformance/measurements.ts`
- Modify: `tests/conformance/compare.ts`
- Create: `tests/conformance/drivers/reference/ash-amber.ts`
- Modify: `tests/conformance/drivers/workbench-lab/theme-target.ts`
- Create: `tests/conformance/specs/ash-amber-target.spec.ts`
- Create: `tests/conformance/baselines/ash-amber-target.json`
- Create: `docs/conformance/ash-amber-ledger.md`
- Modify: `tests/unit/conformance.test.mjs`
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Create after review: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-ash-amber.png`
- Create after review: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/compact-ash-amber.png`
- Create after review: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-catalog-ash-amber.png`

**Scenarios:**

| ID | State | Viewport | Authority |
|---|---|---|---|
| `aa-scene-wide` | Scene with Theme Settings visible | `1920x1280` | canonical t=80 recording frame plus semantic manifest |
| `aa-scene-compact` | compact Scene | `390x844` | reviewed canonical Windows target capture plus semantic manifest |
| `aa-catalog-wide` | open Widget Catalog | `1440x900` | reviewed canonical Windows target capture plus semantic manifest |

- [ ] **Step 1: Add fail-closed manifest and driver tests**

Require the new authority ID, exact hash, all three scenario IDs, target `ash-amber`, independent reference/Lab drivers, and an exact ledger row for every discrepancy. Tests must emit `REFERENCE_HASH_DRIFT`, `REFERENCE_SETUP_FAILED`, `IMPLEMENTATION_SETUP_FAILED`, and `UNLEDGERED_DISCREPANCY` for the corresponding fixtures.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd run test:conformance:unit
```

- [ ] **Step 3: Implement independent evidence drivers**

The reference driver reads only the committed manifest and PNG/canonical captures. The Lab driver uses visible controls and stable public attributes. Measure target application, identity stability, exact palette/material/ambient values, overflow, keyboard names, region geometry, and scenario state. Do not import Lab presets into the reference driver.

- [ ] **Step 4: Generate, inspect, and ledger the three evidence sets**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/conformance/specs/ash-amber-target.spec.ts --project=chromium
npm.cmd exec playwright test tests/browser/native-workbench-visual.spec.ts --project=chromium --grep "Ash and Amber"
```

Inspect the source, actual, overlay, and diff images at original resolution. Freeze the compact and Catalog references only after their target identity, hierarchy, containment, and behavior pass the ledger review. Record every frozen screenshot SHA-256 in `docs/conformance/ash-amber-ledger.md`.

- [ ] **Step 5: Run the tranche gate**

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:native
npm.cmd run build
npm.cmd run test:conformance:unit
npm.cmd exec playwright test tests/conformance/specs/ash-amber-target.spec.ts --project=chromium
npm.cmd run test:browser
git diff --check
```

- [ ] **Step 6: Commit the frozen fourth-target lane**

```powershell
git add tests/conformance tests/browser docs/conformance package.json
git commit -m "test: freeze Ash and Amber target"
```

### Task 7: Tranche review and completion record

- [ ] Review the diff against every Plan 1 bullet in the approved spec.
- [ ] Verify the branch started from the final merged Theme Recipes/PomOS SHA reported by `Align Svelte rebuild goals` and record that SHA.
- [ ] Search for unfinished markers, temporary palette values, absolute local paths, remote URLs, and theme-ID behavior branches.
- [ ] Verify V1/V2 compatibility is unchanged and `ThemeDefinitionV3`, `CanvasDefinition`, and `AmbientProfile` remain type-distinct from package exports through the Lab.
- [ ] Verify the canonical frame digest from a clean checkout and that the full MP4 is untracked.
- [ ] Run `npm.cmd run check` when ports `4173` and `4174` are available; do not terminate another worktree's servers.
- [ ] Record the fresh gate output and exact commit SHA in the goal progress report before starting Plan 2.
