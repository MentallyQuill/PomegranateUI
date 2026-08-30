# Bunny Surface Expression and Fidelity Implementation Plan

> **Execution:** Follow strict red-green-refactor cycles and verify every
> browser claim against the executable Bunny reference.

**Goal:** Add the smallest reusable presentation capability needed to express
the approved Bunny target exactly without changing accepted theme contracts,
part IDs, component behavior, or the mounted Workbench tree.

**Architecture:** A strict contracts package schema validates a separate
SurfaceExpression profile. A theme package compiler resolves semantic roles
against a policy-adjusted theme and emits sparse CSS variables. The shared
semantic part stylesheet consumes those variables with existing-binding
fallbacks. The Lab associates profiles with presets and atomically serializes
their compiled bindings into the active theme snapshot.

## Task 1: Lock the SurfaceExpression contract

**Files:**

- Add `packages/contracts/src/surface-expression.test.ts`
- Add `packages/contracts/src/surface-expression.ts`
- Modify `packages/contracts/src/index.ts`

1. Write tests for a valid frozen profile, empty default, record maxima,
   bounded radii/angles/opacity, two-to-eight ordered stops, strict 22-part
   optional keys, strict nested objects, and the literal frozen type table.
2. Run the focused test and confirm the missing export/module failure.
3. Implement the minimum strict Zod schemas, inferred public types, default
   profile, and deterministic table.
4. Run the focused test and package typecheck.

## Task 2: Compile sparse policy-aware expression bindings

**Files:**

- Add `packages/theme/src/surface-expression.test.ts`
- Add `packages/theme/src/surface-expression.ts`
- Modify `packages/theme/src/index.ts`

1. Write tests proving semantic gradient resolution, no raw authored colors,
   asymmetric radii, joined-edge precedence, literal `lg` 17px typography,
   sparse output, invalid/unknown-ID diagnostics, deep freezing, an empty
   non-Bunny fallback, and reduced-transparency removal after policy.
2. Run the focused test and confirm failure for the missing compiler.
3. Implement validation, dependency checks, deterministic number/color/radius
   compilation, sparse binding emission, and deep freeze.
4. Run the focused test and package typecheck.

## Task 3: Add generic semantic-part consumption

**Files:**

- Modify `packages/theme/src/compile.test.ts`
- Modify `packages/theme/src/compile.ts`

1. Add tests proving the shared stylesheet consumes expression variables with
   fallbacks and contains no concrete theme selector.
2. Confirm the test fails against the current stylesheet.
3. Add generic radius, background-image, font-size, line-height,
   letter-spacing, and text-transform fallbacks.
4. Run compiler tests and the theme-ID-selector unit guard.

## Task 4: Integrate profiles atomically in the Lab

**Files:**

- Add `apps/workbench-lab/src/themes/bunny-expression.ts`
- Modify `apps/workbench-lab/src/themes/presets.ts`
- Modify `apps/workbench-lab/src/themes/controller.test.ts`
- Modify `apps/workbench-lab/src/themes/controller.ts`

1. Add tests that Bunny activation includes the exact sparse expression
   bindings, another target includes none, policy-adjusted reduced transparency
   removes decorative gradients, and activation preserves snapshot atomicity.
2. Confirm the integration assertions fail.
3. Extend the Lab-only preset envelope with an optional profile and merge its
   compiled bindings only after `compileThemeTarget` applies policy.
4. Run controller/theme tests.

## Task 5: Project the exact Bunny target

**Files:**

- Modify `apps/workbench-lab/src/themes/bunny.ts`
- Modify `apps/workbench-lab/src/themes/themes.test.ts`
- Modify `apps/workbench-lab/src/App.svelte` only if required for binding
  application (no structure or theme-ID branch)
- Modify `apps/workbench-lab/src/styles.css` only through generic semantic-part
  selectors

1. Add failing theme tests for the reference palette, image-free canvas,
   reference radii, 17px reading scale, gradients, pill actions, contrast, and
   reduced-transparency fallback.
2. Replace the image-led Bunny canvas with four-corner pastel data and tune its
   semantic materials/typography to the reference.
3. Attach SurfaceExpression presentation through semantic parts only.
4. Run focused unit/type/build gates.

## Task 6: Lock browser and conformance evidence

**Files:**

- Extend the existing original-theme target spec with a Bunny-only exact
  measurement profile
- Update the narrow Bunny driver, measurement, baseline, ledger, and browser
  tests required by the existing conformance architecture
- Update Bunny-only canonical screenshots

1. Add failing exact wide/compact measurements for shell/chrome/Widget/action
   radii, gradient material, 17px reading type, overflow, dock transformation,
   focus, coarse-pointer hit areas, reduced motion/transparency, and same-state
   target switching.
2. Run focused conformance/browser scenarios and correct only general recipes
   or Bunny data justified by the reference.
3. Capture and visually inspect 1440x900 and 390x844 canonical screenshots.
4. Update the Bunny discrepancy ledger with exact evidence and remaining
   intentional differences, if any.

## Task 7: Verify, review, and hand off

1. Run focused unit, typecheck, build, Bunny conformance, browser, accessibility,
   and renderer-contract gates.
2. Run `npm.cmd run check` when strict ports are available; never terminate a
   sibling worktree server.
3. Inspect the full diff for accidental theme selectors, accepted-schema/part
   mutations, raw Bunny colors in compiler code, and unrelated checkpoint
   changes.
4. Commit only the Bunny/SurfaceExpression scope.
5. Report the exact branch SHA, gates, screenshots, framework capabilities,
   fallbacks, and source integration notes to task
   `01a04f2d-2ed8-71c1-a557-4409bf0a9d36` without merging main.
