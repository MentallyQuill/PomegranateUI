# Authoring PomegranateUI themes

PomegranateUI themes are versioned data recipes for Pom-owned or Pom-annotated
surfaces. A theme can change materials, shapes, typography, spacing, canvas
layers, control geometry, icons, and interaction-state presentation without a
theme-specific stylesheet or a component fork.

That promise is intentionally bounded. Pom cannot safely restyle arbitrary
markup it does not understand. Adopter markup opts in through the stable
`data-pom-part` anatomy or by copying Pom's source-owned Svelte recipes. The
adopter still owns its product layout, information architecture, brand, assets,
and any visual anatomy outside the Pom contract.

## Runtime flow

```text
untrusted v1/v2 input
  -> migrateTheme
  -> resolveThemeV2 + host asset registry
  -> applyThemePolicy
  -> compileThemeBindings / compileThemeStyleSheet
  -> compileCanvasLayers
  -> adopter-owned root and Pom part markup
```

All stages are deterministic and side-effect free. The theme package does not
touch the DOM, fetch a URL, load a file, persist a preference, or keep a global
active theme. A host should compile a candidate completely and apply it
atomically only when every result succeeds.

## Version 2 anatomy

A `pomegranate.ui.theme.v2` definition contains:

- a semantic color palette;
- four typography roles and a bounded type scale;
- a spacing scale and density;
- named material recipes with an explicit reduced-transparency fallback;
- named shape recipes;
- a complete recipe for every required Pom part;
- Widget grouping, chrome, and action presentation choices;
- visible range-control geometry and its separate hit target;
- declared local assets and one semantic icon pack;
- ordered canvas layers;
- accessibility thresholds and capabilities.

Theme data never contains CSS text, selectors, markup, scripts, executable
expressions, filesystem paths, or fetched remote URLs. The compiler owns CSS
syntax and emits selectors only for the fixed Pom part inventory.

## Stable semantic parts

| Area | Parts |
| --- | --- |
| Root and chrome | `canvas.surface`, `chrome.shelf`, `chrome.context` |
| Structure | `dock.surface`, `panel.surface`, `group.surface`, `separator` |
| Widgets | `widget.surface`, `widget.header`, `widget.content`, `widget.actions`, `row.surface` |
| Controls | `field.surface`, `button.surface`, `button.icon`, `slider.input`, `slider.track`, `slider.fill`, `slider.thumb` |
| Overlays | `menu.surface`, `dialog.surface`, `floating.surface` |

Every part selects a named material and shape plus a typography role, spacing
role, overflow rule, separator treatment, elevation, and bounded state recipes.
The states are `hover`, `pressed`, `selected`, `focus`, `inactive`, and
`disabled`. They change presentation only; they cannot remove a name, action,
status, or focus target.

Annotate owned markup with the narrowest correct part:

```svelte
<article data-pom-part="widget.surface" data-pomegranate-widget={widgetId}>
  <header data-pom-part="widget.header">
    <h2>{title}</h2>
    <nav data-pom-part="widget.actions" aria-label={`${title} actions`}>
      <button data-pom-part="button.icon" aria-label="Focus Widget">...</button>
    </nav>
  </header>
  <section data-pom-part="widget.content">
    <label data-pom-part="row.surface">
      Level
      <input data-pom-part="slider.input" type="range" min="0" max="100" />
    </label>
  </section>
</article>
```

The constant stylesheet returned by `compileThemeStyleSheet()` consumes these
annotations. It never mentions a concrete theme ID. Layout CSS may still place
the article, but it should not choose a target-specific color, material, shape,
or control face.

## Resolve and compile a theme

Register application-owned assets under stable IDs, resolve the data, apply
policy, and compile the result:

```ts
import {
  applyThemePolicy,
  compileCanvasLayers,
  compileThemeBindings,
  compileThemeStyleSheet,
  resolveThemeV2,
  type ThemeAssetRegistry
} from '@pomegranate-ui/theme';
import type { ThemeDefinitionV2 } from '@pomegranate-ui/contracts';

const assets: ThemeAssetRegistry = {
  'icons.product': { kind: 'icon-pack', source: 'icons.product' },
  'image.workspace': { kind: 'image', source: '/assets/workspace.webp' }
};

export function prepareTheme(input: ThemeDefinitionV2) {
  const resolution = resolveThemeV2(input, assets);
  if (!resolution.ok) return resolution;

  const effective = applyThemePolicy(resolution.theme, {
    user: {
      reducedTransparency: matchMedia('(prefers-reduced-transparency: reduce)').matches
    },
    device: {
      backdropFilterSupported: CSS.supports('backdrop-filter', 'blur(1px)'),
      coarsePointer: matchMedia('(pointer: coarse)').matches,
      maximumBlurPx: 32
    }
  });
  const canvas = compileCanvasLayers(effective, assets);
  if (!canvas.ok) return canvas;

  return {
    ok: true as const,
    theme: effective,
    rootBindings: compileThemeBindings(effective),
    partStyleSheet: compileThemeStyleSheet(effective),
    canvas: canvas.layers
  };
}
```

In Svelte, bind `rootBindings` to the nearest element carrying
`data-pom-theme-root`, render the canvas descriptors once beneath the Workbench,
and expose the three composition values as root data attributes. The Workbench
Lab's `ThemeCanvas.svelte`, controller, and `App.svelte` are the maintained
reference implementation.

Do not partially apply a failed candidate. Keep the previous prepared theme,
show the literal diagnostic path to the developer, and persist only the ID of a
successfully activated theme.

## Materials, glass, and single ownership

A material declares a semantic base/fallback color, opacity, backdrop blur and
color processing, border, one specular rim, bounded shadow layers, optional
registered texture, and a reduced-transparency material ID.

Assign backdrop blur to one surface in a nested stack. For example, a floating
Widget uses `floating.surface` on its actual frame; its full-screen positioning
layer remains transparent. A Widget's rows may carry different translucent
fills, but should not each create another backdrop-filter root. This avoids the
flat, cloudy result caused by nested frost and prevents edge artifacts where a
dock and child window both paint the same seam.

Range controls separate visual and input geometry. A target can use a 3px track
and 10px thumb while retaining a 44px coarse-pointer hit target. Do not enlarge
the visible thumb to satisfy touch accessibility.

## Canvas and assets

Canvas layers are ordered descriptors. Supported kinds are solid, linear,
radial, conic, four-corner, image, texture, and veil. Image and texture layers
refer only to declared asset IDs. The host maps those IDs to trusted sources;
imported theme data cannot choose a URL or path.

The root canvas is the only wallpaper owner. Docks, the stage, and Widgets may
use material fills, but cannot introduce target-specific wallpaper contours.
This keeps glass continuous and avoids seams when panels resize or disappear.

Icons follow the same rule. Theme data chooses a declared semantic icon pack;
buttons retain their real action and accessible name. Decorative window
controls are not valid substitutes for actions.

## Policy precedence

Effective material values resolve in this order:

1. theme defaults;
2. bounded runtime overrides;
3. user preferences;
4. device and accessibility vetoes.

Reduced transparency replaces translucent part materials with their declared
opaque material, forces opacity to one, and disables blur. A browser without
backdrop-filter support takes the same safe path. A device maximum clamps blur,
and coarse-pointer policy raises the slider hit target to at least the declared
accessibility minimum and 44 CSS pixels.

## Migrating version 1

`migrateTheme(input)` accepts either exact v1 or exact v2 data. A valid v2
definition is returned unchanged and frozen. A valid v1 definition is expanded
deterministically into:

- named translucent and opaque materials for every former material role;
- named `none`, `small`, `widget`, `large`, and `pill` shapes;
- a complete recipe for every v2 part;
- `individual` Widget grouping, `full` chrome, and always-visible actions;
- range geometry derived from the former border/radius/accessibility values;
- the original palette, fonts, spacing, assets, canvas, and accessibility data.

```ts
import { migrateTheme, resolveThemeV2 } from '@pomegranate-ui/theme';

const migration = migrateTheme(savedThemeJson);
if (!migration.ok) {
  console.error(migration.diagnostics);
} else {
  const resolution = resolveThemeV2(migration.theme, registeredAssets);
  // Store v2 only after your own persistence transaction succeeds.
}
```

Migration preserves a safe visual interpretation; it does not invent a refined
art direction. Authors should review the generated material ownership, define
intentional shape/state recipes, and then save the explicit v2 result.

## External-theme conformance

`tests/fixtures/external-theme.ts` is deliberately outside the Lab preset
module. It defines a square copper terminal identity, compiles through only the
public contract, and requires no stylesheet edit. Use it as the minimum proof
for a new capability: if a fourth identity requires a theme-ID selector or a
component fork, the public recipe model is missing a bounded concept.

Run the relevant gates with:

```powershell
npm.cmd exec vitest run packages/theme/src packages/contracts/src/theme.test.ts
node --test tests/unit/theme-recipes.test.mjs tests/unit/packed-consumer.test.mjs
npm.cmd run test:pack
npm.cmd run test:browser
```

## Honest limitations

- Themes do not style unannotated arbitrary markup.
- The initial continuous-rounded shape uses a conservative radius fallback,
  not a proprietary platform curve or unstable browser mask.
- The package does not include a visual editor, marketplace, remote loader,
  network client, font library, icon library, persistence adapter, or animation
  engine.
- Theme switching is immediate and atomic. Cross-theme morph animation remains
  intentionally excluded because it adds substantial transient-state and
  maintenance cost to a showcase feature.
- PomOS, Deep Current, and Bunny are Workbench Lab demonstrations, not bundled
  adopter branding or a claim that Pom is a turnkey frontend.
