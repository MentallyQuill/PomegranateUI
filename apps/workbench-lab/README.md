# Workbench Lab

An inspectable Svelte 5 consumer of the public PomegranateUI packages and source-owned recipes. It rebuilds the approved Atmospheric Workbench and Widget Overhaul direction without becoming a mandatory application shell or package authority.

The Lab owns its mock story, 94-definition Catalog fixture, Widget renderers, host context, local-storage adapter, composition, and CSS. PomegranateUI packages own versioned state, commands, layout restoration, headless Svelte bindings, and renderer conformance.

From the repository root:

```powershell
npm.cmd run dev:lab
```

The live Vite development surface is `http://127.0.0.1:5173/`. Use `npm.cmd run build` followed by `npm.cmd run preview:lab -- --host 127.0.0.1 --port 4174` to inspect the static `dist` output. Only `dist` is hostable; no deployment is configured.
