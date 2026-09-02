# Custom Theme Element Widgets Design

**Date:** 2026-09-02  
**Status:** Approved for implementation

## Outcome

Replace the oversized, internally forked Custom Theme editor with five independently placeable Widgets backed by one recoverable device-local theme draft:

1. **Custom Theme** owns aggregate draft status, diagnostics, Reset, and Save.
2. **Theme Colors** owns the six semantic color roles and color editing.
3. **Theme Materials** owns glass density, bar opacity, selected strength, and frost level.
4. **Theme Canvas** owns image strength, overlay strength, gradient direction, and vignette strength.
5. **Ambient Light** owns ambient position, radius, and power.

Every instance of a Widget type renders the same component and behavior in every placement. There is no Scene-specific renderer, compact/full authoring fork, or independent draft. Settings shows all five authoring Widgets by default. Scene shows only the same Theme Materials Widget used by Settings. The remaining authoring Widgets stay available through the Widget Catalog for optional placement.

## Authority and boundaries

- PomegranateUI owns reusable Widget identity, layout, responsive containment, accessibility, theme-draft, canvas-authoring, command, and renderer contracts.
- The Workbench Lab supplies data-only preset recipes and fixture placements. It does not branch authoring behavior on a concrete theme ID.
- Theme Library remains the preset selection and comparison surface. It does not gain authoring controls.
- The five authoring Widgets share one device-local draft, one validation result, one last-valid applied target, and one persistence owner.
- Theme changes keep the existing mounted Workbench tree. Widget and Panel identities do not change when a theme changes.
- The background image asset remains target or host data. Theme Canvas controls its presentation, not its URL or product semantics.

## Current failures

The current `settings.custom-theme` type renders one large `ThemeSettings.svelte` component with two internally different user interfaces. Scene selects a `compact` presentation while Settings selects `full`. The branches expose different controls, actions, status, and composition even though they write to one host controller. Shared state has therefore hidden a duplicated user-facing implementation.

The full branch also uses ordinary form sizing rather than the compact Widget typography and spacing contract. Labels and values render around 18 pixels, the color plane consumes roughly 150 pixels of height, and the stacked controls create a surface much taller than an ordinary Widget.

Theme draft projection changes semantic theme colors but only replaces the first solid canvas layer. Deep Current places an opaque image above that solid and retains literal overlay-gradient colors, so canvas edits appear ineffective. Ash & Amber resolves semantic gradient colors once while constructing the preset, then retains those resolved literals during later draft edits. Its ordinary surfaces respond while the background image overlay remains frozen.

Existing tests assert that both branches share a controller, but they also encode the compact/full divergence and do not assert that authored palette or canvas treatment changes reach every image-overlay layer.

## Widget identities and responsibilities

### `settings.custom-theme` — Custom Theme

This existing type becomes a concise overview and action Widget. It shows the active preset label, dirty/saved state, aggregate diagnostic count, and the last operation status. It owns Reset and Save draft. It contains no color plane, material range, canvas range, or ambient instrument.

### `settings.theme-colors` — Theme Colors

This Widget shows the six canonical roles: Canvas, Glass, Chrome, Ambient, Text, and Source. It owns role selection, the saturation/value plane, hue, exact hexadecimal input, RGB channels, and Eyedropper integration. Invalid raw color input remains visible and recoverable while the controller retains the last valid applied target.

### `settings.theme-materials` — Theme Materials

This Widget owns the four bounded material controls: Glass Density, Bar Opacity, Selected Strength, and Frost Level. It is the only authoring Widget placed on Scene by default, and that Scene instance renders the exact same component as the Settings instance.

### `settings.theme-canvas` — Theme Canvas

This Widget owns four bounded canvas controls:

- **Image Strength:** opacity applied to authorable image layers. It is disabled with a clear unavailable state when the active target has no image layer.
- **Overlay Strength:** multiplier applied to authorable overlay-gradient opacity.
- **Gradient Direction:** the angle used by authorable linear overlay gradients.
- **Vignette Strength:** multiplier applied to authorable vignette or reading-veil layers.

The overlay colors themselves come from the authored semantic palette. Changing Canvas, Glass, Chrome, Ambient, or Source recompiles any overlay stops that reference those roles.

### `settings.theme-ambient` — Ambient Light

This Widget owns the existing two-dimensional ambient position instrument plus Radius and Power. It uses the shared ambient profile and accessibility/capability policy. Reduced-motion and reduced-transparency vetoes remain controller/compiler concerns rather than renderer branches.

## Shared authoring state

All five renderers consume one authoring port exposed through the host context. The port supplies:

- the current editable draft, including invalid recoverable input;
- the last valid editable draft;
- the last valid applied theme target;
- aggregate diagnostics, dirty state, and saving state;
- slice-specific edit commands for colors, materials, canvas, and ambient;
- Reset and Save commands.

The controller is the sole authoritative draft owner. A Widget may keep transient interaction state such as the selected color role or an input focus target, but it must not keep an authoritative clone of the complete draft. When one placement edits a value, every mounted instance observes the same next authoring snapshot immediately.

Diagnostics have both a path and an owning slice. Each element Widget shows diagnostics for its slice. Custom Theme shows the aggregate diagnostic state. A rejected edit updates the recoverable editable draft and diagnostics without replacing the last valid applied target.

Selecting another preset activates that preset's last valid draft or seeded default. Dirty drafts for other presets remain recoverable for the session, preserving the current controller behavior.

## Draft and canvas authoring contracts

The persisted theme draft advances to a version that includes a bounded canvas-treatment record:

```ts
interface ThemeCanvasDraft {
  imageStrength: number;      // integer 0..100
  overlayStrength: number;    // integer 0..100
  gradientAngle: number;      // integer 0..359
  vignetteStrength: number;   // integer 0..100
}
```

Each data-only Lab preset supplies a canvas-authoring profile containing:

- a semantic canvas layer recipe;
- authorable image, overlay, and vignette layer groups;
- deterministic defaults for the four canvas controls.

Theme projection first applies authored semantic colors, then resolves the semantic canvas recipe against the resulting palette, then applies the bounded canvas treatment to its declared layer groups. The result remains an ordinary resolved `ThemeTargetBundle` for the existing compiler. Themes without a declared layer group ignore that treatment safely, and the corresponding control reports unavailable. No code may select behavior by `deep-current`, `pom-neutral`, `bunny`, `ash-amber`, or another concrete preset ID.

Deep Current's Lab-specific Atmospheric image composition and Ash & Amber's image composition both move to semantic authoring profiles. Their overlay gradients therefore respond to the same palette and canvas-treatment projection as every other target.

## Typography, density, and containment

The element Widgets use the established compact Workbench hierarchy instead of ordinary application-form sizing:

| Role | Size / line height |
| --- | --- |
| Section heading | 11px / 14px |
| Primary control label and value | 10px / 14px |
| Secondary label and coordinate | 9px / 12px |
| Metadata | 8px / 11px |
| Input and button text | 10px / 14px |

Typography flows through semantic font roles and theme data. The sizes above describe the shared authoring Widget recipe; no concrete theme selector may override the component structure or create a separate scale.

Range controls retain at least a 44-pixel keyboard/touch hit target while painting the target's thin semantic track and thumb. The color plane uses a compact 96-pixel minimum height rather than the current oversized surface. Labels, values, and controls use compact gaps and do not repeat scope prose already communicated by the Widget title and metadata.

Every Widget owns one understandable task and fits its declared geometry without document-level horizontal overflow. If a constrained Widget needs vertical scrolling, the Widget content is the single keyboard-reachable scroll owner; controls and status text must remain inside its visible bounds after scrolling. Focus indicators, field names, diagnostics, and unavailable states remain visible in normal, reduced-transparency, forced-colors, and coarse-pointer environments.

## Default placement

### Settings

Appearance and Accessibility retains its three-lane layout. Its default authoring placements are:

| Lane 1 | Lane 2 | Lane 3 |
| --- | --- | --- |
| Theme Library | Theme Colors | Theme Canvas |
| Custom Theme | Theme Materials | Ambient Light |

Reading Layout, Sound and Motion, and Accessibility follow beneath the corresponding lanes. All five authoring Widgets remain ordinary movable Widgets.

### Scene

The old Scene Custom Theme monolith is replaced by one Theme Materials instance in the same left-side authoring location. It is not grouped with hidden authoring surfaces and receives no Scene-specific configuration. Custom Theme, Theme Colors, Theme Canvas, and Ambient Light remain available through the Catalog if a user chooses to add them.

## Persistence and layout migration

Existing saved theme drafts and Workbench layouts must be upgraded without deleting unrelated user state.

- A valid persisted draft v1 migrates to the new version by retaining its colors, materials, and ambient values and seeding canvas treatment from the active preset's declared defaults.
- A persisted Settings `settings.custom-theme` instance retains its identity and placement but renders the new Custom Theme overview/action surface.
- The four new Settings element instances are inserted exactly once into Appearance and Accessibility at their default lanes and orders when absent.
- The old default Scene `settings.custom-theme` instance is replaced by a `settings.theme-materials` instance in the same visible placement. Its old compact presentation configuration is removed.
- User-created placements of `settings.custom-theme` remain Custom Theme overview/action Widgets; they are not silently converted to Theme Materials.
- Unrelated Widgets, placements, grouping, floating geometry, sub-panel order, collapsed state, and user Panels remain unchanged.

The migration is deterministic and idempotent. Loading and saving the already-upgraded state produces no further layout change.

## Error and unavailable behavior

- Schema, contrast, asset, or canvas-authoring failures keep the last valid applied target.
- Raw invalid color input remains editable and visible in every Theme Colors placement.
- Save is disabled while aggregate diagnostics exist. Reset restores the active target's seeded draft across all five Widgets.
- A target without an image layer disables Image Strength without disabling overlay, vignette, or ambient editing that the target supports.
- Eyedropper denial or unavailability changes status text but never changes a color.
- Storage failure preserves the in-memory draft and reports the failure in Custom Theme.
- Accessibility and device capability policy may reduce or veto an applied visual effect without mutating the user's authored value.

## Verification

Implementation is complete only when tests prove:

1. Each Widget type has one renderer and produces identical semantic DOM and controls in Scene, Settings, Catalog-added, grouped, docked, and floating placements. No `compact` or `full` authoring presentation branch remains.
2. Unit tests cover the new draft schema, v1 migration, bounded canvas controls, semantic canvas resolution, layer-group treatment, immutability, invalid input, contrast retention, and targets without images.
3. Layout tests cover clean state, existing flat Settings state, the previous Scene monolith, user-created Custom Theme placements, insertion exactly once, unrelated-state preservation, and migration idempotence.
4. Component tests cover slice synchronization, diagnostics, Reset, Save, unavailable Image Strength, Eyedropper behavior, and shared state across multiple mounted instances.
5. Browser tests edit every color, material, canvas, and ambient control and observe the corresponding live compiled result. Deep Current and Ash & Amber must visibly and structurally recolor their image-overlay gradients.
6. Browser tests assert the approved font sizes and line heights, compact color-plane height, actual 44-pixel interaction rectangles, keyboard reachability, single scroll ownership, and no overflow at wide desktop, phone portrait, short landscape, desktop-site mobile, and 200-percent zoom-equivalent sizes.
7. Visual evidence covers all five Widgets in all four themes, the default Scene Theme Materials placement, the complete Settings layout, normal and reduced transparency, and the supplied oversized-regression geometry.
8. `npm.cmd run check` passes without refreshing unrelated screenshot fixtures or weakening tolerances.

