# Ash & Amber Neutral Fidelity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove every purple and magenta value from Ash & Amber while adding reusable opt-in palette constraints and semantic color-role canvas recipes that still compile to the existing CanvasDefinition v1 contract.

**Architecture:** Keep the accepted `pomegranate.ui.theme.v2`/v3 schemas, 22 semantic parts, compiler, CanvasDefinition v1, and mounted Workbench unchanged. Add two pure focused modules to `@pomegranate-ui/theme`: one resolves semantic color-role canvas recipes into existing validated canvas layers, and one validates an explicitly supplied palette constraint profile. Ash & Amber consumes those APIs as data, binds warm-neutral chrome through existing semantic parts/materials, and supplies exact functional, policy, conformance, and reviewed screenshot evidence.

**Tech Stack:** TypeScript, Vitest, Zod-backed existing canvas schemas, Svelte 5, Playwright, PomegranateUI conformance drivers, Windows screenshot baselines.

**Spec:** `docs/superpowers/specs/2026-08-29-deep-fidelity-shared-workbench-ash-amber-design.md`, with the later user correction and source-task approval that Ash contains no purple/magenta and uses rounded 4px bevels.

## Global Constraints

- Do not change `ThemeDefinition` v2/v3, `CanvasDefinition` v1, `AmbientProfile`, `ThemeTargetBundle`, `THEME_PART_IDS`, `compile.ts`, or shared Panel/layout behavior.
- The semantic canvas resolver accepts existing `ThemeColorRole` references plus alpha and emits only existing `ThemeCanvasLayer` shapes; unknown roles, invalid alpha, unresolved colors, or invalid mapped layers fail closed with deterministic typed diagnostics.
- Palette constraints are opt-in and target/conformance-facing. They never become global parsing or theme-resolution policy and must not reject unrelated adopter palettes.
- Ash uses existing `chrome.shelf`, `widget.header`, and `widget.actions` semantic parts, target-owned materials, neutral reduced-transparency fallbacks, and rounded 4px shapes with zero chamfer.
- PomOS owns blur-policy validation. Deep owns spatial ambient geometry. This plan adds neither.
- Preserve the byte-hashed authority PNG. It remains composition evidence; the user's later no-purple correction governs Ash palette semantics.
- Do not add theme-ID selectors, component forks, remote assets, dependencies, package publication, hosting, or Sonder runtime code.
- Use `npm.cmd` on Windows. Every production behavior must have a witnessed failing test before implementation.
- Do not update screenshot baselines until the rendered result is inspected at original resolution.

---

### Task 1: Resolve semantic color-role canvas recipes

**Files:**

- Create: `packages/theme/src/semantic-canvas.test.ts`
- Create: `packages/theme/src/semantic-canvas.ts`
- Modify: `packages/theme/src/index.ts`

**Interfaces:**

- Consumes: existing `THEME_COLOR_ROLES`, `ThemeColorRole`, `ThemeCanvasLayer`, and `ThemeCanvasLayerSchema` from `@pomegranate-ui/contracts`.
- Produces:

```ts
export interface SemanticCanvasColorReference {
  readonly role: ThemeColorRole;
  readonly alpha?: number;
}

export type SemanticCanvasLayer =
  | { readonly kind: 'solid'; readonly color: SemanticCanvasColorReference }
  | { readonly kind: 'linear-gradient'; readonly angle: number; readonly stops: readonly SemanticCanvasGradientStop[] }
  | { readonly kind: 'radial-gradient'; readonly shape: 'circle' | 'ellipse'; readonly x: number; readonly y: number; readonly stops: readonly SemanticCanvasGradientStop[] }
  | { readonly kind: 'conic-gradient'; readonly angle: number; readonly x: number; readonly y: number; readonly stops: readonly SemanticCanvasGradientStop[] }
  | { readonly kind: 'four-corner'; readonly topLeft: SemanticCanvasColorReference; readonly topRight: SemanticCanvasColorReference; readonly bottomLeft: SemanticCanvasColorReference; readonly bottomRight: SemanticCanvasColorReference }
  | Extract<ThemeCanvasLayer, { kind: 'image' | 'texture' }>
  | { readonly kind: 'veil'; readonly mode: 'reading' | 'vignette'; readonly color: SemanticCanvasColorReference; readonly opacity: number };

export type SemanticCanvasResolution =
  | { readonly ok: true; readonly layers: readonly ThemeCanvasLayer[]; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly SemanticCanvasDiagnostic[] };

export function resolveSemanticCanvasLayers(
  colors: Readonly<Partial<Record<ThemeColorRole, string>>>,
  layers: readonly SemanticCanvasLayer[]
): SemanticCanvasResolution;
```

- [ ] **Step 1: Add failing deterministic mapping and diagnostic tests**

Create literal tests proving solid, linear, radial, conic, four-corner, veil, image, and texture layers preserve order and map role colors plus alpha into exact `#RRGGBB`/`#RRGGBBAA` values. Add independent failures for unknown role, non-finite/out-of-range alpha, missing or malformed role values, and invalid mapped canvas geometry. Assert exact diagnostic codes and paths and verify neither input is mutated.

- [ ] **Step 2: Run the focused test and witness RED**

Run: `npm.cmd run test:native -- packages/theme/src/semantic-canvas.test.ts`

Expected: FAIL because `resolveSemanticCanvasLayers` and its module do not exist.

- [ ] **Step 3: Implement the minimal pure resolver**

Use existing role constants for runtime role validation, deterministic uppercase hex serialization, multiplicative alpha for `#RRGGBBAA` source colors, and `ThemeCanvasLayerSchema.safeParse` for the final mapped layer. Return frozen ordered output or frozen ordered diagnostics; never partially return layers on failure.

- [ ] **Step 4: Verify GREEN and public export**

Run: `npm.cmd run test:native -- packages/theme/src/semantic-canvas.test.ts`

Expected: PASS with every success and fail-closed branch covered.

---

### Task 2: Validate opt-in palette constraint profiles

**Files:**

- Create: `packages/theme/src/palette-constraints.test.ts`
- Create: `packages/theme/src/palette-constraints.ts`
- Modify: `packages/theme/src/index.ts`

**Interfaces:**

- Consumes: existing `ThemeColorRole` and `hexToHsv`.
- Produces:

```ts
export interface ThemePaletteHueExclusion {
  readonly fromDeg: number;
  readonly toDeg: number;
  readonly minimumSaturation: number;
}

export interface ThemePaletteRoleGroupConstraint {
  readonly id: string;
  readonly roles: readonly ThemeColorRole[];
  readonly maximumSaturation?: number;
  readonly hueExclusions?: readonly ThemePaletteHueExclusion[];
}

export type ThemePaletteValidation =
  | { readonly ok: true; readonly diagnostics: readonly [] }
  | { readonly ok: false; readonly diagnostics: readonly ThemePaletteDiagnostic[] };

export function validateThemePalette(
  colors: Readonly<Partial<Record<ThemeColorRole, string>>>,
  constraints: readonly ThemePaletteRoleGroupConstraint[]
): ThemePaletteValidation;
```

- [ ] **Step 1: Add failing behavior tests**

Use literal palettes and profiles to prove maximum-saturation checks, ordinary and wraparound hue exclusions, neutral colors below `minimumSaturation`, overlapping role groups, and deterministic diagnostic order. Add failures for unknown roles, missing/malformed colors, duplicate/blank group IDs, invalid saturation bounds, and invalid hue bounds. Prove a purple theme remains accepted by normal `resolveThemeV2` until this validator is explicitly called.

- [ ] **Step 2: Run the focused test and witness RED**

Run: `npm.cmd run test:native -- packages/theme/src/palette-constraints.test.ts`

Expected: FAIL because the opt-in validator module does not exist.

- [ ] **Step 3: Implement the minimal validator**

Validate the profile before evaluating colors, reuse `hexToHsv` for exact six-digit RGB channels, ignore alpha for hue/saturation measurement, support circular hue ranges when `fromDeg > toDeg`, and return frozen diagnostics without modifying or normalizing the theme.

- [ ] **Step 4: Verify GREEN and public export**

Run: `npm.cmd run test:native -- packages/theme/src/palette-constraints.test.ts`

Expected: PASS, including the opt-in isolation test.

---

### Task 3: Rebuild Ash & Amber as warm-neutral data and evidence

**Files:**

- Modify: `apps/workbench-lab/src/themes/ash-amber.ts`
- Modify: `apps/workbench-lab/src/themes/themes.test.ts`
- Modify: `tests/browser/native-workbench.spec.ts`
- Modify: `tests/conformance/drivers/reference/ash-amber.ts`
- Modify: `docs/conformance/ash-amber-ledger.md`
- Replace after review: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-ash-amber.png`
- Replace after review: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/compact-ash-amber.png`
- Replace after review: `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots/wide-catalog-ash-amber.png`

**Interfaces:**

- Consumes: `resolveSemanticCanvasLayers`, `validateThemePalette`, existing target builder, existing semantic part/material recipes, existing controller and conformance scenarios.
- Produces: exported `ASH_AMBER_PALETTE_CONSTRAINTS`, a role-derived existing-v1 canvas layer array, a warning/amber ambient profile, and corrected reviewed evidence.

- [ ] **Step 1: Add failing Ash target tests**

Update literal expectations to a neutral graphite/ash palette, warm muted grey-brown chrome, restrained amber accent/focus/warning roles, rounded 4px shapes, quiet warm-neutral selection-role ambient color, and role-derived layered canvas output. Assert the opt-in Ash constraints pass, recursive target hex values contain no excluded purple/magenta hue, `widget.header` resolves through the header/chrome material, `chrome.shelf` resolves through shelf/chrome, and reduced-transparency policy maps translucent parts to the neutral opaque material.

- [ ] **Step 2: Run focused target tests and witness RED**

Run: `npm.cmd run test:native -- apps/workbench-lab/src/themes/themes.test.ts`

Expected: FAIL on the old plum/magenta literals, chamfered shapes, accent ambient role, and raw canvas colors.

- [ ] **Step 3: Implement the minimal data-only Ash target**

Define one colors object and one opt-in Ash constraint profile. Resolve its semantic canvas recipe at module initialization and fail with its typed diagnostics if invalid. Use only neutral/warm role references in solid, gradients, veil, and desaturated local image layers. Keep the existing target ID, label, material defaults, geometry position/radius/power, assets, mounted tree, and controller path.

- [ ] **Step 4: Add browser policy and color evidence**

Extend the existing browser target test to assert Ash's compiled ambient color equals its quiet warm-neutral selection role while amber remains restrained to accent/focus/warning detail, its semantic chrome/title-bar parts expose warm-neutral computed fills, reduced-transparency leaves no blur and uses opaque neutral fallbacks, all visible faces keep 4px rounded geometry without `clip-path`, keyboard/coarse-pointer contracts remain unchanged, and theme switching preserves Panel/Widget identity and composer state.

- [ ] **Step 5: Correct the independent conformance semantic rubric**

Keep the authority image digest and independent driver unchanged as byte evidence, but update the driver’s semantic expectations from the superseded magenta interpretation to the user-approved neutral canvas, amber accent, and 4px radii. Update the ledger prose to state that the later explicit correction governs palette semantics while the locked frame governs composition, title-bar warmth, hierarchy, and material restraint.

- [ ] **Step 6: Run focused functional and conformance gates**

Run:

```powershell
npm.cmd run test:native -- packages/theme/src/semantic-canvas.test.ts packages/theme/src/palette-constraints.test.ts apps/workbench-lab/src/themes/themes.test.ts
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd run test:conformance:unit
npm.cmd run build
npm.cmd run test:browser -- tests/browser/native-workbench.spec.ts
npm.cmd run test:conformance:ash-amber
```

Expected: all focused behavior, schema-bound output, accessibility, responsive, identity, and conformance assertions pass without updating screenshots.

- [ ] **Step 7: Generate only the three Ash screenshots, then inspect before promotion**

Run: `npm.cmd run test:browser -- tests/browser/native-workbench-visual.spec.ts --grep "Ash and Amber freezes" --update-snapshots`

Inspect all three PNGs at original resolution. Reject them if purple/magenta remains visible, title bars are not warm-neutral, amber dominates the canvas, corners are chamfered, chrome loses the subtle 4px bevel, compact overflow appears, or Catalog readability regresses. Only after review, rerun the same command without `--update-snapshots`.

- [ ] **Step 8: Update exact screenshot hashes and rerun evidence**

Calculate SHA-256 for the three reviewed files, record the exact values in `docs/conformance/ash-amber-ledger.md`, and rerun `npm.cmd run test:conformance:ash-amber` plus the visual grep without update mode.

- [ ] **Step 9: Run the relevant full gate and review the scoped diff**

Run:

```powershell
npm.cmd run check
git diff --check
git status --short
```

Expected: the full PomegranateUI gate is green, no preserved artifact changed, and the diff is confined to the two new theme modules/tests/exports, Ash target/tests/evidence, this plan, and the three Ash screenshots.

- [ ] **Step 10: Report shared exports, request independent review, and create one scoped commit**

Before committing, report the exact new public exports and module paths to source task `01a04f2d-2ed8-71c1-a557-4409bf0a9d36`. Request a reviewer against the integrated Lab base `74279b4b5c7a8f1bb610afd039ca8aba9e174654`, resolve all Critical/Important findings, rerun affected gates, then create one scoped Conventional Commit containing the complete integration unit.
