# Theme Settings and Ambient Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared six-role Theme Settings editor and ambient authoring system with safe device-local drafts, deterministic precedence, accessibility vetoes, live semantic propagation, and exact Ash & Amber reproducibility.

**Architecture:** Extend the merged V2 semantic-part recipe system and Plan 1 V3 target envelope; do not replace them. Keep frozen target bundles immutable and project a validated `ThemeDraft` plus `AmbientProfile` over the selected base target. Pure color conversion, V2 material/part-preserving projection, contrast diagnostics, upstream policy integration, and ambient precedence live in `@pomegranate-ui/theme`; browser storage and Eyedropper capability are Lab adapters. The controller owns one last-valid applied snapshot and one possibly-invalid editable draft, so user input is never lost and invalid input never replaces the rendered target.

**Tech Stack:** TypeScript, Zod, `@pomegranate-ui/contracts`, `@pomegranate-ui/theme`, Svelte 5, CSS custom properties, localStorage adapter, EyeDropper progressive enhancement, Vitest, Testing Library, Playwright, axe-compatible accessible semantics.

**Spec:** `docs/superpowers/specs/2026-08-29-deep-fidelity-shared-workbench-ash-amber-design.md`

## Global Constraints

- Theme Library is the preset chooser; Theme Settings is the canonical authoring owner. Do not create a second independent draft owner on Scene.
- Reuse the merged `ThemeDefinitionV2/V3`, material/shape/part recipes, `ThemeAssetRegistry`, `applyThemePolicy`, binding/fixed-stylesheet compilers, and layered root-only `ThemeCanvas`. Do not revive Lab-specific bindings or concrete target selectors.
- Theme drafts may contain only validated colors and bounded numbers. Reject CSS, HTML, JavaScript, remote URLs, arbitrary assets, and unknown fields.
- Frozen target definitions remain immutable. Applying or resetting a draft always produces a new resolved target.
- Invalid or inaccessible drafts remain editable and report field-specific errors, but the rendered Workbench stays on the last valid snapshot.
- Draft persistence is device-local, long-lived, versioned, deterministic, and separate from layout persistence.
- Precedence is exact: accessibility vetoes, device/adopter capabilities, temporary scene override, active target ambient profile, theme fallback.
- Reduced motion disables ambient motion; reduced transparency removes translucent ambient haze and preserves readable opaque surfaces.
- All editor controls have labels, keyboard operation, visible focus, live values, and `44x44` coarse-pointer targets.
- One editor component and controller path serves all four targets. Do not branch on target ID except to select the immutable base bundle.

---

### Task 1: Define strict Theme draft and authoring contracts

**Files:**

- Create: `packages/contracts/src/theme-draft.ts`
- Modify: `packages/contracts/src/storage.ts`
- Modify: `packages/contracts/src/index.ts`
- Modify: `packages/contracts/src/theme.test.ts`
- Modify: `packages/contracts/src/contracts.test.ts`
- Modify: `packages/contracts/README.md`

**Interfaces:**

```ts
export const THEME_DRAFT_SCHEMA_VERSION = 'pomegranate.ui.theme-draft.v1' as const;

export const THEME_DRAFT_COLOR_ROLES = [
  'canvas',
  'glass',
  'chrome',
  'ambient',
  'text',
  'source'
] as const;

export type ThemeMaterialControls = {
  readonly glassDensity: number;
  readonly barOpacity: number;
  readonly selectedStrength: number;
  readonly frostLevel: number;
};

export type ThemeDraft = {
  readonly schemaVersion: typeof THEME_DRAFT_SCHEMA_VERSION;
  readonly baseTargetId: string;
  readonly colors: Readonly<Record<ThemeDraftColorRole, string>>;
  readonly materials: ThemeMaterialControls;
};

export type PersistedThemeDraft = {
  readonly schemaVersion: 'pomegranate.ui.persisted-theme-draft.v1';
  readonly draft: ThemeDraft;
  readonly ambient: AmbientProfile;
};

export interface ThemeDraftStorage {
  load(key: string): Promise<string | null>;
  save(key: string, value: string): Promise<void>;
  remove?(key: string): Promise<void>;
}
```

All colors use `#RRGGBB`; all material controls are finite integers `0..100`. Persisted draft and ambient IDs/base IDs must agree through a strict refinement.

- [ ] **Step 1: Write failing schema tests**

Require exact round trips for Deep and Ash & Amber seeds. Reject alpha shorthand, named colors, `url()`, surrounding whitespace, `NaN`, decimals, out-of-range controls, mismatched target IDs, executable strings, unknown keys, and missing roles.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/contracts/src/theme.test.ts packages/contracts/src/contracts.test.ts
```

- [ ] **Step 3: Implement the minimal strict schemas**

Reuse shared theme ID and color primitives rather than duplicating looser validators. Export inferred types from the contracts package and keep storage browser-neutral.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run packages/contracts/src/theme.test.ts packages/contracts/src/contracts.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit authoring contracts**

```powershell
git add packages/contracts
git commit -m "feat(contracts): define Theme draft schema"
```

### Task 2: Implement deterministic color math and semantic projection

**Files:**

- Create: `packages/theme/src/color.ts`
- Create: `packages/theme/src/draft.ts`
- Create: `packages/theme/src/draft.test.ts`
- Modify: `packages/theme/src/conformance.ts`
- Modify: `packages/theme/src/index.ts`
- Modify: `packages/theme/README.md`

**Interfaces:**

```ts
export type HsvColor = {
  readonly hue: number;
  readonly saturation: number;
  readonly value: number;
};

export function hexToHsv(hex: string): HsvColor;
export function hsvToHex(color: HsvColor): string;
export function mixHex(left: string, right: string, amount: number): string;
export function bestContrastingText(background: string): '#000000' | '#FFFFFF';

export type ThemeDraftProjection =
  | { readonly ok: true; readonly target: ThemeTargetBundle; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemeDiagnostic[] };

export function createThemeDraft(target: ThemeTargetBundle): ThemeDraft;
export function projectThemeDraft(
  base: ThemeTargetBundle,
  draft: ThemeDraft,
  ambient: AmbientProfile
): ThemeDraftProjection;
```

Projection rules are explicit and deterministic:

```ts
const semanticProjection = {
  canvas: draft.colors.canvas,
  surface: draft.colors.glass,
  surfaceElevated: mixHex(draft.colors.glass, draft.colors.text, 0.08),
  surfaceInset: mixHex(draft.colors.glass, draft.colors.canvas, 0.18),
  chrome: draft.colors.chrome,
  text: draft.colors.text,
  textMuted: mixHex(draft.colors.text, draft.colors.glass, 0.30),
  textFaint: mixHex(draft.colors.text, draft.colors.glass, 0.45),
  textOnAccent: bestContrastingText(draft.colors.ambient),
  accent: draft.colors.ambient,
  selection: draft.colors.ambient,
  focus: mixHex(draft.colors.ambient, draft.colors.text, 0.18),
  warning: draft.colors.source
};
```

Preserve the base target's success and danger roles, complete V2 material/shape/part recipes, controls, composition values, asset declarations, and canvas definition unless an edited role explicitly projects into them. Map material controls through upstream `applyThemePolicy` runtime/user overrides rather than mutating stored recipe definitions. Set the returned ambient profile color role to `accent` so the editable ambient swatch is the light source.

- [ ] **Step 1: Write failing color/projection tests**

Table-test primary/secondary/achromatic HSV conversions, hue wrap, stable uppercase-to-lowercase normalization, round-trip tolerance at one RGB channel, mix endpoints, best contrasting text, exact semantic role projection, immutable base input, and exact Ash & Amber target reproduction from its recorded seed.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/theme/src/draft.test.ts
```

- [ ] **Step 3: Implement pure color and projection functions**

Clamp only trusted internal arithmetic. Public functions parse through contract schemas and return diagnostics rather than silently repairing invalid user input. Run the final bundle through `resolveThemeTarget()` and contrast policy before success.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run packages/theme/src/draft.test.ts packages/theme/src/theme.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit semantic authoring logic**

```powershell
git add packages/theme
git commit -m "feat(theme): project semantic Theme drafts"
```

### Task 3: Implement ambient precedence and accessibility vetoes

**Files:**

- Create: `packages/theme/src/ambient.ts`
- Create: `packages/theme/src/ambient.test.ts`
- Modify: `packages/theme/src/index.ts`
- Modify: `packages/theme/README.md`

**Interfaces:**

```ts
export interface AmbientCapabilityLimits {
  readonly enabled: boolean;
  readonly maximumPower: number;
  readonly allowMotion: boolean;
  readonly allowTransparency: boolean;
}

export interface AmbientAccessibilityPreferences {
  readonly reducedMotion: boolean;
  readonly reducedTransparency: boolean;
}

export interface AmbientResolutionInput {
  readonly fallback: AmbientProfile;
  readonly target?: AmbientProfile;
  readonly sceneOverride?: AmbientProfile;
  readonly limits: AmbientCapabilityLimits;
  readonly accessibility: AmbientAccessibilityPreferences;
}

export interface ResolvedAmbientProfile extends AmbientProfile {
  readonly source: 'fallback' | 'target' | 'scene';
  readonly transparencyEnabled: boolean;
}

export function resolveAmbientProfile(input: AmbientResolutionInput): ResolvedAmbientProfile;
```

- [ ] **Step 1: Write failing precedence tests**

Cover all five precedence layers: scene override wins target; target wins fallback; device maximum clamps power; disabled capability returns zero power; reduced motion disables motion; reduced transparency disables translucent haze while retaining static color/position for an opaque fallback; input objects remain immutable.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run packages/theme/src/ambient.test.ts
```

- [ ] **Step 3: Implement one pure precedence function**

Parse all public inputs, select source before applying limits, then apply accessibility vetoes last. Return a complete frozen profile; never return `undefined` values that force UI guessing.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run packages/theme/src/ambient.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit ambient precedence**

```powershell
git add packages/theme
git commit -m "feat(theme): resolve ambient precedence"
```

### Task 4: Add safe draft persistence and last-valid controller state

**Files:**

- Create: `apps/workbench-lab/src/themes/draft-storage.ts`
- Create: `apps/workbench-lab/src/themes/draft-storage.test.ts`
- Modify: `apps/workbench-lab/src/themes/controller.ts`
- Modify: `apps/workbench-lab/src/themes/controller.test.ts`
- Modify: `apps/workbench-lab/src/themes/theme-storage.ts`
- Modify: `apps/workbench-lab/src/mockup/host-context.ts`
- Modify: `apps/workbench-lab/src/App.svelte`

**Interfaces:**

```ts
export const LAB_THEME_DRAFT_KEY = 'pomegranate-ui.workbench-lab.theme-draft.v1' as const;

export interface LabThemeAuthoringSnapshot {
  readonly editable: PersistedThemeDraft;
  readonly applied: LabThemeSnapshot;
  readonly diagnostics: readonly ThemeDiagnostic[];
  readonly dirty: boolean;
}

export interface LabThemeController {
  getSnapshot(): LabThemeSnapshot;
  getAuthoringSnapshot(): LabThemeAuthoringSnapshot;
  activate(id: string): ThemeActivationResult;
  editDraft(next: PersistedThemeDraft): ThemeDraftEditResult;
  resetDraft(): ThemeDraftEditResult;
  saveDraft(): Promise<ThemeDraftSaveResult>;
}
```

Editing runs schema/projection/contrast resolution on each input. Valid edits update both `editable` and `applied`; invalid edits update only `editable` plus diagnostics. Persistence stores the editable record only after schema validation and canonical JSON serialization. Activating a preset changes the base target and starts from that target's saved draft when IDs match, otherwise from `createThemeDraft(target)`. Rendering continues through `compileThemeTarget()`, the fixed part stylesheet, and the root-only layered canvas.

- [ ] **Step 1: Write failing controller/storage tests**

Cover load/save/remove, unavailable storage, malformed JSON, schema mismatch, deterministic key order, valid live apply, invalid edit preserving applied object identity, recovery to valid, per-base reset, stored Ash draft restoration, theme activation without Workbench revision change, and storage failure leaving in-memory authoring usable.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/draft-storage.test.ts apps/workbench-lab/src/themes/controller.test.ts
```

- [ ] **Step 3: Implement storage and controller state machine**

Keep draft diagnostics separate from target activation diagnostics. Do not write the draft into `LAB_THEME_KEY` or `LAB_LAYOUT_KEY`. Bind the applied resolved ambient profile into root CSS, not the invalid editable value.

- [ ] **Step 4: Run GREEN**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/themes/draft-storage.test.ts apps/workbench-lab/src/themes/controller.test.ts apps/workbench-lab/src/themes/themes.test.ts
npm.cmd run typecheck
```

- [ ] **Step 5: Commit safe draft state**

```powershell
git add apps/workbench-lab/src/themes apps/workbench-lab/src/mockup/host-context.ts apps/workbench-lab/src/App.svelte
git commit -m "feat(lab): preserve last valid Theme draft"
```

### Task 5: Build the shared Theme Settings recipe

**Files:**

- Create: `apps/workbench-lab/src/recipes/ThemeSettings.svelte`
- Create: `apps/workbench-lab/src/recipes/ColorPlane.svelte`
- Create: `apps/workbench-lab/src/recipes/HueControl.svelte`
- Create: `apps/workbench-lab/src/recipes/AmbientPosition.svelte`
- Create: `apps/workbench-lab/src/themes/eyedropper.ts`
- Create: `apps/workbench-lab/src/themes/eyedropper.test.ts`
- Modify: `apps/workbench-lab/src/mockup/renderers/ImplementedWidget.svelte`
- Modify: `apps/workbench-lab/src/mockup/implemented-surfaces.ts`
- Modify: `apps/workbench-lab/src/mockup/surface-fixtures.ts`
- Modify: `apps/workbench-lab/src/mockup/catalog.ts`
- Modify: `scripts/generate-lab-catalog.mjs`
- Modify: `apps/workbench-lab/src/styles.css`
- Modify: `apps/workbench-lab/src/App.test.ts`
- Create: `registry/recipes/theme-settings/ThemeSettings.svelte`
- Create: `registry/recipes/theme-settings/ColorPlane.svelte`
- Create: `registry/recipes/theme-settings/HueControl.svelte`
- Create: `registry/recipes/theme-settings/AmbientPosition.svelte`
- Modify: `registry/recipes/recipe-manifest.json`
- Modify: `tests/unit/recipes.test.mjs`

**Component contract:**

- Six swatches labeled Canvas, Glass, Chrome, Ambient, Text, and Source.
- A two-dimensional saturation/value control with role `application`, explicit instructions, arrow-key steps, Home/End, and live value text.
- A native range hue control plus hexadecimal and three numeric RGB inputs.
- A progressive Eyedropper button whose unavailable state says `Eyedropper unavailable`; denial reports a local non-blocking status.
- Four native range material controls labeled exactly Glass Density, Bar Opacity, Selected Strength, and Frost Level.
- A two-dimensional ambient position control plus Radius and Power ranges.
- Inline field diagnostics, one polite live status, Reset, and Save draft.

- [ ] **Step 1: Write failing component and adapter tests**

Require initial values, swatch selection, HSV pointer and keyboard updates, synchronized hex/RGB fields, invalid input retention, EyeDropper available/unavailable/denied paths, all material and ambient controls, Reset, Save, focus retention, and source-owned recipe hash checks. Verify `settings.custom-theme` becomes an implemented surface without changing the total 94-entry Catalog.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts apps/workbench-lab/src/themes/eyedropper.test.ts
node --test tests/unit/recipes.test.mjs
```

- [ ] **Step 3: Implement the shared editor and browser adapter**

Inject an adapter with `available(): boolean` and `sample(): Promise<string | null>`; only the Lab adapter touches `window.EyeDropper`. Keep pointer geometry local to the controls and send validated values through host-context authoring callbacks. Render the canonical editor for `settings.custom-theme`; Theme Library remains the preset chooser.

- [ ] **Step 4: Refresh recipe hashes and run GREEN**

```powershell
node scripts/verify-recipes.mjs --write
npm.cmd exec vitest run apps/workbench-lab/src/App.test.ts apps/workbench-lab/src/themes/eyedropper.test.ts
node --test tests/unit/recipes.test.mjs
npm.cmd run typecheck
```

- [ ] **Step 5: Commit Theme Settings UI**

```powershell
git add apps/workbench-lab/src registry/recipes scripts/generate-lab-catalog.mjs tests/unit/recipes.test.mjs
git commit -m "feat(svelte): add shared Theme Settings"
```

### Task 6: Prove live propagation, accessibility, and draft safety in browser

**Files:**

- Create: `tests/browser/theme-settings.spec.ts`
- Modify: `tests/browser/native-workbench-accessibility.spec.ts`
- Modify: `tests/browser/theme-art-direction.spec.ts`
- Modify: `tests/browser/native-workbench-visual.spec.ts`
- Create after review: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-theme-settings.png`
- Create after review: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/compact-theme-settings.png`

- [ ] **Step 1: Write failing end-to-end authoring flows**

Open Theme Settings and change each semantic role independently. Assert live computed propagation to canvas, shelf/chrome, Panel, Widget, tabs/selected state, fields, text, floating frame, and ambient layer. Exercise material endpoints independently. Enter an invalid and an insufficient-contrast value and prove the input/diagnostic remain while all applied CSS variables stay equal to the last valid snapshot.

- [ ] **Step 2: Add accessibility and persistence flows**

Exercise the complete editor by keyboard at wide, `390x844`, short landscape, and 200-percent zoom equivalent. Assert no horizontal overflow, one scroll owner, focus containment/restoration, named values, `44x44` coarse targets, reduced motion, reduced transparency, Save/reload, and that clearing layout does not clear the draft.

- [ ] **Step 3: Run RED**

```powershell
npm.cmd run build
npm.cmd exec playwright test tests/browser/theme-settings.spec.ts tests/browser/native-workbench-accessibility.spec.ts --project=chromium
```

- [ ] **Step 4: Fix only production defects and run GREEN**

```powershell
npm.cmd exec vitest run packages/theme/src/draft.test.ts packages/theme/src/ambient.test.ts
npm.cmd run build
npm.cmd exec playwright test tests/browser/theme-settings.spec.ts tests/browser/native-workbench-accessibility.spec.ts tests/browser/theme-art-direction.spec.ts --project=chromium
```

- [ ] **Step 5: Inspect and freeze focused editor evidence**

Inspect wide and compact screenshots at original resolution for color-control clarity, label/value association, material hierarchy, focus visibility, contained scrolling, and absence of cross-theme styling. Record hashes after review.

- [ ] **Step 6: Commit browser authoring proof**

```powershell
git add tests/browser
git commit -m "test: prove Theme Settings authoring"
```

### Task 7: Freeze exact Ash & Amber reproduction and ambient conformance

**Files:**

- Create: `tests/conformance/specs/theme-authoring.spec.ts`
- Create: `tests/conformance/drivers/workbench-lab/theme-authoring.ts`
- Create: `tests/conformance/baselines/theme-authoring.json`
- Create: `docs/conformance/theme-authoring-ledger.md`
- Modify: `tests/conformance/manifest.ts`
- Modify: `tests/conformance/measurements.ts`
- Modify: `tests/conformance/compare.ts`
- Modify: `tests/unit/conformance.test.mjs`
- Modify: `package.json`

**Scenarios:**

| ID | Contract |
|---|---|
| `theme-authoring-ash-seed` | entering `#242321/#302E2A/#625B52/#51493E/#F3F0EA/#D2B57A`, `20/60/6/50`, and `57/97/60/56` resolves exactly to the corrected Ash & Amber target while preserving its `selection` ambient role |
| `theme-authoring-last-valid` | invalid/unsafe edit cannot change the applied target |
| `theme-authoring-ambient-precedence` | accessibility, device, scene, target, fallback order is exact |
| `theme-authoring-round-trip` | saved draft restores independently of layout |

- [ ] **Step 1: Add fail-closed scenario and baseline tests**

Require literal expected values from the approved spec, not imports from `ASH_AMBER_TARGET`. Reject missing controls, target ID mismatch, unledgered value drift, and a driver that cannot expose applied/editable state independently.

- [ ] **Step 2: Run RED**

```powershell
npm.cmd run test:conformance:unit
```

- [ ] **Step 3: Implement the independent Lab driver and ledger**

Use visible editor controls and computed root bindings. Measure editable values, applied semantic colors, material values, ambient values/source, diagnostics, Workbench identity, and persisted JSON. Do not import target definitions into expected evidence.

- [ ] **Step 4: Run the tranche gate**

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:native
npm.cmd run build
npm.cmd run check:recipes
npm.cmd run test:pack
npm.cmd exec playwright test tests/browser/theme-settings.spec.ts --project=chromium
npm.cmd exec playwright test --config playwright.conformance.config.mjs tests/conformance/specs/theme-authoring.spec.ts
npm.cmd run test:conformance:unit
git diff --check
```

- [ ] **Step 5: Commit authoring conformance**

```powershell
git add tests/conformance docs/conformance package.json
git commit -m "test: freeze Theme authoring conformance"
```

### Task 8: Tranche review and completion record

- [ ] Review every Plan 3 bullet and the exact precedence order in the approved design.
- [ ] Search for remote URLs, CSS/HTML injection, `innerHTML`, duplicated draft owners, theme-ID editor branches, draft data in layout snapshots, silent value repair, and direct unguarded `window.EyeDropper` use.
- [ ] Verify all public inputs parse through contract schemas and every invalid path preserves the last applied object.
- [ ] Verify the editor reproduces Ash & Amber exactly from literal expected inputs.
- [ ] Verify reduced-motion and reduced-transparency behavior on every named surface.
- [ ] Run `npm.cmd run check` when reserved ports are available; do not terminate another worktree's servers.
- [ ] Record fresh gate output and commit SHA before beginning Plan 4.
