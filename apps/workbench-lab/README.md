# Workbench Lab

An inspectable Svelte 5 consumer of the public PomegranateUI packages and source-owned recipes. It rebuilds the approved Atmospheric Workbench and Widget Overhaul direction without becoming a mandatory application shell or package authority.

The Lab owns its mock story, 94-definition Catalog fixture, Widget renderers, host context, local-storage adapter, composition, and CSS. PomegranateUI packages own versioned state, commands, layout restoration, headless Svelte bindings, and renderer conformance.

Its Theme Settings Widget applies Pom Neutral, Deep Current, or Bunny to the same mounted Workbench state. Each preset is a complete Lab-owned declarative definition resolved through `@pomegranate-ui/theme`; the Lab compiles semantic values into its own CSS and persists only the selected preset ID. Switching is immediate rather than animated. Invalid definitions and unavailable required local assets keep the last valid theme active.

The presets demonstrate range without turning the Lab into a turnkey Pom frontend. Adopters own their markup, layout, brand, assets, CSS bindings, and preference storage. The Lab does not include an editor, remote loading, npm publication, public hosting, or Sonder cutover.

From the repository root:

```powershell
npm.cmd run dev:lab
```

The live Vite development surface is `http://127.0.0.1:5173/`. Use `npm.cmd run build` followed by `npm.cmd run preview:lab` to inspect the static `dist` output at `http://127.0.0.1:4174/`. Only `dist` is hostable; no deployment is configured.

The Atmospheric Workbench owns macro layout, material, and responsive authority. The Widget Overhaul owns Widget inventory, geometry, Catalog, and audited state behavior. Run the frozen Deep Current macro loop or retain one scenario's evidence with:

```powershell
npm.cmd run test:conformance:unit
npm.cmd run test:conformance:deep-current
npm.cmd run test:conformance
npm.cmd run inspect:conformance -- --scenario dc-shell-wide
```

These commands exercise the same immediate, atomic theme switch and the same mounted Workbench tree. The static artifact boundary remains `apps/workbench-lab/dist`; the Lab does not publish packages or cut Sonder over.

Run the complete repository gate from the root with:

```powershell
npm.cmd run check
```
