# Pom Theme Art Direction Design

## Purpose

Re-art-direct the Workbench Lab's three visual targets so each feels cohesive,
professional, and deliberately authored while all three continue to render the
same Svelte component tree, Panel and Widget inventory, commands, state, and
accessible relationships.

The targets are:

1. **Deep Current** — cinematic industrial dark-tech derived from the preserved
   Sonder visual direction.
2. **Pom Neutral** — an original neutral desktop experience informed by modern
   macOS material principles without copying Apple assets or trade dress.
3. **Bunny** — an original cute pastel Japanese stationery and character-goods
   identity that is refined rather than nostalgic-web or novelty UI.

Theme changes remain immediate and atomic. This tranche does not add theme
morphing, ambient animation, remote assets, or a second application.

## Problem statement

The current targets prove color and geometry variation but do not yet prove
professional art direction:

- the shared developer context rail reads as an unrelated bright strip in Deep
  Current;
- Deep Current's side surfaces are flatter and less atmospheric than its story
  stage;
- Pom Neutral resembles a pale web dashboard rather than a spatial desktop
  material system;
- Bunny depends too heavily on pink, pill shapes, and a bunny-ear mark, producing
  a dated novelty-page impression;
- blur declarations exist, but the layering behind several surfaces is too
  uniform for the frost to be visually legible; and
- the scene-stage composition becomes empty and generic outside Deep Current.

The correction must address composition, depth, hierarchy, typography, control
language, and theme-specific restraint together. A palette swap is insufficient.

## Authority and constraints

The authority split remains:

- `prototypes/sonder-baseline/atmospheric-workbench/**` supplies Deep Current's
  composition, glass, lighting, typography, spacing, and restraint;
- `prototypes/sonder-baseline/widget-overhaul/**` supplies the Widget inventory,
  geometry, state, Catalog, and later interaction direction;
- current Pom packages own layout, persistence, commands, accessibility, and
  reusable theme contracts; and
- the Workbench Lab is a static, inspectable consumer, not production package
  authority and not a branded turnkey frontend.

Preserved prototypes remain byte-identical. No Sonder server code, Apple assets,
remote fonts, third-party runtime dependency, or new binary asset enters this
tranche. Existing locally vendored fonts and the approved Deep Current image may
continue to be used.

The component and recipe source must not branch on target IDs. The Lab stylesheet
may use the root `data-pom-theme` attribute to express source-owned presentation
recipes, because that selector is demo composition rather than a package runtime
branch. Target-specific decoration must use CSS, existing markup, and
pseudo-elements; it may not create separate Widget or Panel implementations.

## Selected approach

Use a shared material and composition layer backed by the existing semantic
theme bindings, followed by small theme-scoped presentation recipes.

This is preferred over token-only recoloring because the defects involve
hierarchy and composition. It is preferred over theme-specific Svelte variants
because variants would weaken the flexibility proof and create three surfaces
to maintain.

The source responsibilities are:

- the three preset files own semantic palette, typography, geometry, spacing,
  material, and canvas values;
- `styles.css` owns shared structure and the target-specific composition recipes;
- the existing Svelte files retain one DOM and behavior path; and
- Playwright owns computed-material, identity, interaction, responsive, and
  reviewed screenshot evidence.

No new generalized public theme API is required. If the desired expression
cannot be reached with the approved semantic values, the implementation may add
one narrowly reusable binding only after a failing behavior test demonstrates
the gap.

## Shared visual system

### Composition hierarchy

The story stage is the dominant surface. Side docks are supporting instruments;
theme selection and layout persistence are tertiary developer controls. The
developer controls remain discoverable but become a compact themed utility bar
instead of visually outranking the Workbench.

The top shelf, utility bar, Workbench shell, docks, Widgets, transcript, and
composer must establish at least three perceivable depth levels. Depth comes
from translucent fill, content behind the fill, edge highlights, soft shadow,
and controlled saturation—not shadow alone.

### Glass contract

Every target uses visibly meaningful frosted glass:

- the top shelf and utility bar have translucent backgrounds and a computed
  backdrop blur of at least 16 CSS pixels;
- the Workbench shell or its docks have translucent backgrounds and a computed
  backdrop blur of at least 12 CSS pixels;
- floating, Catalog, dialog, transcript, and composer surfaces remain visibly
  elevated from their parent layer;
- translucent layers have non-uniform canvas detail behind them so blur can be
  perceived in screenshots; and
- reduced-transparency behavior continues to resolve to an opaque accessible
  surface.

Glass must not reduce text contrast or make boundaries ambiguous. Borders use a
light-facing highlight plus a lower-contrast material edge rather than a single
heavy outline.

### Typography and controls

UI, technical metadata, display/story identity, and literary prose remain
distinct roles. Headings and story identity carry stronger hierarchy than tool
labels. Uppercase technical copy is used sparingly and with adequate tracking.

Not every control is a pill. Segment controls may be pill-shaped in Bunny;
ordinary actions and Widget chrome use the target's normal small radius. Icon
faces remain compact while coarse-pointer hit targets retain 44 by 44 CSS pixels.

### Motion

Theme switching stays immediate. Existing interaction motion may use short,
non-essential hover or press feedback, but the implementation introduces no
cross-theme transition or ambient animation system. Reduced-motion behavior
remains authoritative.

## Target art direction

### Deep Current

Deep Current is a submerged technical observatory: near-black blue-green glass,
cold cyan signal light, restrained green status, precise hairlines, and a
literary story field. The approved stage image remains the atmospheric anchor.

Required corrections:

- remove every white or light-dashboard surface from the developer rail and
  persistence controls;
- make shelf, utility bar, and side instruments share the same cold glass and
  edge-light language as the stage;
- use sharper, quieter geometry and compact technical labeling without making
  content cramped;
- give selected tabs and primary actions one controlled cyan signal treatment;
- keep decorative glow subordinate to text and state; and
- preserve the existing narrative image focal point and readable transcript.

No pastel, bright neutral panel, rounded bubble card, or warm consumer-dashboard
element may leak into this target.

### Pom Neutral

Pom Neutral is an original modern desktop workspace: a calm cool wallpaper,
layered translucent chrome, bright edge highlights, soft deep shadows, careful
rounding, and confident system-like sans typography.

Required corrections:

- use a dimensional wallpaper made from layered local CSS gradients so glass is
  visually legible;
- present the application as one coherent desktop window rather than a stack of
  unrelated web cards;
- distinguish toolbar, sidebar, stage, transcript, and composer through material
  depth while keeping the palette neutral;
- use moderate 12–18 pixel radii, restrained blue selection, and soft separators;
- avoid literal Apple icons, traffic lights, logos, assets, or exact platform
  layout; and
- keep prose warm and readable within the cooler system chrome.

The target succeeds when the macOS-like influence is immediately legible from
material, spacing, typography, and window composition even with branding hidden.

### Bunny

Bunny is a premium Japanese stationery and character-goods workspace: warm
milk-paper neutrals, sakura blush, lavender, mint, and a small apricot accent;
milky translucent glass; soft but structured shadows; and sparse mascot detail.

Required corrections:

- move away from monochrome pink by giving semantic roles distinct pastel
  families over a warm neutral base;
- replace pill-everything with a consistent rounded-card system and reserve pills
  for segments, status, or primary friendly actions;
- use subtle paper-grid, petal, sparkle, or confection-like CSS motifs behind
  glass, never behind dense text;
- keep bunny ears limited to the wordmark or one similarly restrained signature;
- establish adult-quality typography, spacing, and hierarchy suitable for a
  polished product; and
- retain robust contrast and obvious focus/state treatment.

The target succeeds when it feels cute at first glance and professionally
usable on inspection, without evoking a nostalgic personal homepage.

## Playwright evidence

Playwright must exercise the real built Lab at the approved wide `1440x900` and
compact `390x844` viewports.

Automated checks must prove:

- all three root theme IDs render through the same Panel and Widget identities;
- theme switching preserves active Panel, Widget instances, Workbench revision,
  focus behavior, and functional controls;
- the named shelf, utility bar, Workbench shell/docks, transcript, and composer
  have theme-appropriate computed background, radius, shadow, and backdrop-filter
  values;
- at least the shelf and utility bar expose 16-pixel-or-greater blur, and a
  Workbench layer exposes 12-pixel-or-greater blur, for every target;
- no target has horizontal overflow at either viewport;
- coarse-pointer and accessibility checks remain green; and
- reviewed wide and compact screenshots exist for all three targets.

Visual baselines are updated only after the critic loop closes. Existing bad
baselines are evidence of the starting state, not a requirement to preserve the
rejected art direction.

## Adversarial critic loop

Each round follows the same sequence:

1. build the static Lab;
2. render all three targets at wide and compact viewports with fonts ready,
   animation disabled, clean local storage, and scroll at zero;
3. inspect each image at original resolution without consulting the
   implementation intent;
4. record concrete findings in
   `docs/conformance/theme-art-direction-critic-ledger.md`;
5. classify each finding as blocking, substantive, or preference;
6. add or strengthen a failing automated check when the finding is measurable;
7. correct every blocking or substantive finding; and
8. repeat the complete render set.

A finding is substantive when it identifies ambiguous target identity,
cross-theme leakage, incoherent hierarchy or composition, visually ineffective
glass, unfinished typography or spacing, illegible content/state, responsive
breakage, or functional/accessibility regression. A preference is a concrete
alternative with no corresponding defect.

The loop closes only when the critic can identify no blocking or substantive
finding across the complete six-image set. The final ledger records each round,
its evidence paths, findings, resolutions, and the final zero-substantive pass.

## Verification and delivery

Implementation is complete only when:

- every new automated behavior was introduced through a witnessed red-green
  test cycle;
- focused component and browser checks pass;
- the full `npm.cmd run check` gate passes freshly on the final tree;
- preserved prototype bytes and harnesses remain green;
- a fresh code and requirements review has no unresolved critical or important
  issue;
- the branch is pushed, a pull request is created, CI is green, and the pull
  request is merged to `main`; and
- the primary checkout is synchronized to the merged remote revision without
  disturbing unrelated worktrees.

## Non-goals

- theme-transition animation or cross-fade infrastructure;
- ambient particle, rain, fog, petal, or canvas engines;
- theme-specific Svelte component trees;
- a generalized theme editor or marketplace;
- new binary art, remote assets, or copied platform trade dress;
- package publication, public license changes, GitHub Pages deployment, or
  Sonder Engine cutover; and
- modification of preserved mockup artifacts or their hashes.
