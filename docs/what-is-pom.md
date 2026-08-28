# What is Pom?

[Documentation index](README.md) · [Adoption boundary](adoption-boundary.md) · [Project README](../README.md)

PomegranateUI — Pom — is a modular UI toolkit for building AI roleplay frontends. It gives frontend teams reusable contracts and interaction machinery for complex roleplay workspaces while preserving their freedom to design the application, connect any suitable backend, and define their own roleplay model.

## The problem Pom addresses

AI roleplay frontends are rarely just a transcript and a text box. A mature experience may need characters, personas, lore, world state, scenes, inventories, notes, generation controls, extensions, settings, and several ways to arrange all of them. Those surfaces need to remain accessible, responsive, persistable, and internally consistent even when adopters compose them differently.

Projects such as SillyTavern make this problem space recognizable. Pom targets that class of application, but it is not tied to SillyTavern's code, extension APIs, backend, terminology, or information architecture.

Pom extracts the reusable UI problem from the product problem:

- **Pom handles reusable interaction contracts.** Panels, Widgets, catalogs, layout transitions, commands, events, focus behavior, and conformance tests can be implemented once and exercised consistently.
- **The adopter builds the roleplay product.** The frontend decides what players see, what its entities mean, where data comes from, how it is saved, and how the experience is branded.

## The building blocks

| Layer | Responsibility | What it deliberately avoids |
| --- | --- | --- |
| Contracts | JSON-safe schemas, capability declarations, events, commands, and persistence envelopes | Host-specific domain objects and unvalidated public input |
| Layout | Deterministic Panel and Widget placement transitions | DOM access, rendering, and product navigation |
| Core | Registration, command dispatch, subscriptions, and orchestration | Backend state, authentication, and roleplay semantics |
| Svelte | Readable stores, typed context, renderer registration, and necessary focus actions | SvelteKit, routes, loaders, server modules, and branded application markup |
| Recipes | Reference Svelte composition for common workspace surfaces | Ownership after copying; adopters can rewrite the visible source |
| Testkit | Public fixtures, drivers, and conformance checks | Private package imports and adopter implementation details |

The maintained view path is `contracts -> layout -> core -> svelte`. The first three layers are framework-neutral. Teams that do not use Svelte can consume those packages directly and provide their own view binding, while Pom maintains Svelte as its reference integration.

## Modular by design

Pom does not require an all-or-nothing adoption. A frontend can:

- use layout contracts without adopting the reference recipes;
- register only the Widget types relevant to its experience;
- replace every visible element while retaining tested state transitions;
- connect existing character, chat, lore, or campaign data through explicit adapters;
- provide its own storage implementation and migration policy;
- embed Pom-managed surfaces inside an existing frontend; or
- build a new workspace around the complete contract set.

The recipes are source-owned rather than an opaque branded shell. Copying a recipe creates ordinary application source that the adopter can restructure, restyle, or replace. Pom retains authority over the behavior contract and tests, not over the adopter's final markup.

## What Pom is not

Pom is not a complete frontend waiting for a logo and API key. It does not provide:

- an AI model provider or inference API;
- prompting, context assembly, retrieval, or lore selection;
- canonical character, message, campaign, or save formats;
- authentication, accounts, databases, or hosting;
- application routes or navigation;
- a mandatory visual theme or brand;
- a SillyTavern-compatible backend or extension runtime; or
- a universal compiled component set for every JavaScript framework.

Those are application and ecosystem decisions. Pom defines a narrower, reusable boundary: how modular workspace surfaces declare capabilities, move through layout states, communicate, render through an adopter, and prove their behavior.

## Relationship to the reference work

Sonder Engine is Pom's first demanding consumer and the source of the preserved baseline. Its prototypes and design records are evidence that Pom's contracts cover a real AI roleplay workspace. They are not a hidden Sonder data model inside Pom, and Sonder server code is prohibited from Pom packages and examples.

The Svelte Workbench Lab rebuilds the approved reference direction as an inspectable consumer. It demonstrates one composition of Pom; it does not define the only composition.

## Current maturity

Pom is currently a private incubator. Its packages have not been published to npm, the theme package remains reserved, production hosting is outside the present scope, and no Sonder cutover has occurred. The repository's tests, packed-consumer checks, and preserved browser evidence establish the current development boundary; they are not a claim of a finished public release.
