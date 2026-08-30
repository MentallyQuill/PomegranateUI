# Bunny Surface Expression and Exact Fidelity Design

**Status:** Approved for implementation

**Approved:** 2026-08-29

**Source checkpoint:** `9549a526126f038b37f1d0a349335a10faecef03`

## Decision

Bunny remains a data-only target over the one mounted Workbench. It will match
`design/theme-targets/bunny-reference.html` as a soft stationery interface,
not as a pastel recoloring of Deep and not as an image-led garden scene.

The accepted Theme V2/V3, ThemeTargetBundle V1, CanvasDefinition V1, and fixed
22-part vocabulary remain unchanged. The three presentation facts that those
contracts cannot currently express become one separate, additive
`pomegranate.ui.surface-expression.v1` profile:

- asymmetric corner radii for shell and chrome silhouettes;
- semantic linear-gradient fills for milky surface material; and
- explicit per-part type scale and text transformation.

The compiler consumes that profile through generic CSS variables. It never
branches on a theme ID and never emits authored raw colors. A missing profile
or missing override compiles to the current non-Bunny presentation.

## Authority and evidence

The visual authority is `design/theme-targets/bunny-reference.html`. Exact
wide and compact geometry is measured from that executable reference, including
its 24/24/12/12 chrome radius, 12/12/26/26 shell radius, 20px dock radius,
17px Widget radius, pill rows and actions, 17px reading treatment, milky
surface gradients, hairlines, and soft layered shadows.

The committed Lab render at the source checkpoint is the behavioral baseline.
It proves the shared Panel, Widget, region, shelf, Catalog, persistence,
responsive, and accessibility tree. Source-task same-state renders are
coordination evidence only and are not copied into this branch.

## SurfaceExpression contract

`packages/contracts/src/surface-expression.ts` owns the strict, versioned
authoring schema. It contains:

- at most 16 named shape overrides and at most 32 named material overrides;
- four radii per shape, each bounded from 0 through 999 pixels;
- semantic linear gradients with angles bounded from -360 through 360 degrees;
- two through eight ordered stops, semantic color roles only, opacity and
  position bounded from 0 through 1; and
- a strict optional-key object generated from the fixed 22 Theme part IDs.

The exported type scale table is deeply frozen and deterministic. Its five
steps compile to literal font size, unitless line height, and em letter spacing:

| Step | Font size | Line height | Letter spacing |
|---|---:|---:|---:|
| `xs` | 11px | 1.4 | 0.01em |
| `sm` | 12px | 1.4 | 0.01em |
| `md` | 14px | 1.45 | 0em |
| `lg` | 17px | 1.55 | 0em |
| `xl` | 21px | 1.25 | 0.01em |

The 17px Bunny reading treatment is therefore an explicit `lg` override, not
an inference from spacing or the target's legacy typography scale.

## Compiler semantics

`packages/theme/src/surface-expression.ts` validates and compiles sparse
bindings for real overrides only.

- A part whose resolved recipe material has a gradient override receives a
  semantic `linear-gradient(...)` binding.
- Gradient roles resolve against the already policy-adjusted resolved theme.
- A reduced-transparency recipe redirected to a fallback material receives no
  gradient unless that fallback material explicitly owns one.
- A part shape override is applied before the Theme shape's `joinedEdges`, so
  shared top/right/bottom/left edges still collapse the affected corners to
  zero.
- Type scale and text transformation bindings exist only for parts that opt in.
- Unknown material IDs, shape IDs, or invalid profile input fail closed with
  structured diagnostics; they do not partially style the root.

The semantic part stylesheet consumes these variables through fallbacks to the
existing part bindings. Typography consumption uses a low-specificity semantic
fallback so sparse profiles never override component-owned icon hiding or
content hierarchy. No theme selector or Bunny literal appears in shared
compiler output.

## Bunny projection

The Lab owns a Bunny SurfaceExpression profile next to its target definition.
It maps reference geometry and material intent through semantic IDs:

- chrome shelf: 24/24/12/12;
- panel shell: 12/12/26/26;
- material-neutral dock/group structure with a 20px silhouette, preserving one
  material owner per Widget;
- Widget, reader, composer, menu, dialog, and floating surfaces: 17-18px;
- rows and action controls: pill geometry;
- Widget surfaces: a soft diagonal semantic white-to-milk gradient;
- reading content: explicit `lg` 17px scale;
- headers and controls: explicit compact steps without forced uppercase.

The Bunny canvas drops the garden image and uses the reference four-corner
pastel atmosphere over `#faeef6`. Other targets retain their own Canvas data.
Controller activation merges the target bindings and expression bindings into
one immutable snapshot, so switching remains immediate and atomic.

## Responsive, motion, and accessibility contract

Wide conformance runs at 1440x900. Compact conformance runs at 390x844, with a
short-landscape overflow check. The same mounted state and Widget identities
survive target switches. Compact Bunny hides instrument docks through the
shared responsive recipe while retaining reachable controls.

Keyboard focus remains the existing high-contrast semantic outline. Coarse
pointer controls retain at least 44-by-44 hit areas even when the visual face is
a smaller pill. Reduced motion disables decorative entrance motion through the
existing media policy. Reduced transparency is applied before expression
compilation and removes decorative gradients when the resolved fallback does
not opt in. No shape may clip focus outlines or change semantic roles.

## Acceptance

Completion requires focused schema/compiler/controller tests, exact wide and
compact browser measurements, focus and coarse-pointer assertions,
reduced-motion/transparency checks, same-state switching proof, reviewed wide
and compact screenshots, the relevant conformance gates, and `npm.cmd run
check`. The branch is committed and reported to the source task for coordinated
integration; it is not merged to main independently.
