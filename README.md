![PomegranateUI](docs/assets/pomegranateui-logo-white.png)

# PomegranateUI

**PomegranateUI — Pom for short — is a modular developer toolkit for teams building AI roleplay frontends.** It provides reusable interaction contracts and an adaptable Svelte view path for dense, stateful roleplay workspaces while leaving the actual product in the adopter's hands.

[Explore the live Workbench Lab](https://mentallyquill.github.io/PomegranateUI/)

Pom is designed for the same broad problem space as frontends such as SillyTavern: conversations, characters, lore, scenes, world state, tools, settings, and extensible workspaces. It does not depend on another frontend, copy a host product model, or replace one.

Pom is not an application frontend. It is the modular interaction layer from which a team can build one.

## What Pom provides

| Pom provides | Your frontend owns |
| --- | --- |
| Panel, Widget, and Catalog contracts | Product navigation and information architecture |
| Framework-neutral layout state and transitions | The screens, markup, and composition players see |
| Commands, events, registration, and subscriptions | Roleplay rules and domain semantics |
| Responsive and accessibility behavior contracts | Branding, visual identity, and final styling |
| Headless Svelte stores, context, renderers, and actions | Backend, model providers, authentication, and hosting |
| Editable, source-owned recipes | Saves, characters, chats, lore, and persistence adapters |
| Public conformance fixtures and test drivers | Which capabilities to adopt and how they fit together |

Pom is not a finished frontend, chatbot, model client, prompt engine, roleplay data model, backend, database, hosting platform, or fixed application shell.

## Package graph

The maintained runtime dependency path is:

```text
contracts -> layout -> core -> svelte
    |                    \
    -> theme              -> testkit (public APIs only)
```

- `@pomegranate-ui/contracts` owns JSON-safe public contracts and runtime schemas.
- `@pomegranate-ui/layout` owns framework-neutral Panel and Widget layout transitions.
- `@pomegranate-ui/core` owns registration, deterministic command dispatch, and subscriptions.
- `@pomegranate-ui/theme` validates and resolves declarative themes.
- `@pomegranate-ui/svelte` exposes headless stores, typed context, renderer registration, and focus actions.
- `@pomegranate-ui/testkit` provides public conformance fixtures and drivers.
- `registry/recipes` contains source-owned recipes: editable Svelte files that adopters copy and own.

Contracts, layout, core, and theme contain no Svelte, React, DOM, backend, or roleplay-host imports. Svelte is the maintained reference view integration, not the authority for application state or product structure.

## Explore the Workbench Lab

The Svelte Workbench Lab is Pom's demanding reference consumer. It demonstrates an AI roleplay workspace without turning that composition into Pom's product model.

Install the locked dependencies and start the development server at `http://127.0.0.1:5173/`:

```powershell
npm.cmd ci
npm.cmd run dev:lab
```

Build and inspect the static production artifact at `http://127.0.0.1:4174/`:

```powershell
npm.cmd run build
npm.cmd run preview:lab
```

The deployable, relative-base artifact is `apps/workbench-lab/dist`. GitHub Pages publishes only that directory after the cross-platform verification matrix passes. The artifact includes the project license, third-party notices, and the complete bundled-font license texts.

The Lab applies PomOS, Deep Current, Bunny, and Ash & Amber definitions to one mounted Panel and Widget tree. Theme switching is immediate and atomic. These definitions demonstrate the theme API's range; they are not bundled product branding.

## Documentation

- [Documentation index](docs/README.md)
- [What is Pom?](docs/what-is-pom.md)
- [Adoption boundary](docs/adoption-boundary.md)
- [Theme authoring](docs/theme-authoring.md)
- [Source-owned recipes](registry/recipes/README.md)
- [Workbench Lab](apps/workbench-lab/README.md)

## Project status

The source repository and Workbench Lab are public under the [MIT License](LICENSE). Packages remain private to npm and have not been published. The repository does not include or change an adopter's backend.

## Verification

Use `npm.cmd` on Windows:

```powershell
npm.cmd run test:unit
npm.cmd run typecheck
npm.cmd run test:native
npm.cmd run build
npm.cmd run check:recipes
npm.cmd run test:pack
npm.cmd run test:browser
npm.cmd run check
```

The final command runs the complete public repository gate in order.
