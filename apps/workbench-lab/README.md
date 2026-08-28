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

Run the complete repository gate from the root with:

```powershell
npm.cmd run check
```
