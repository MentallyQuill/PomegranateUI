# Adoption boundary

[Documentation index](README.md) · [What is Pom?](what-is-pom.md) · [Project README](../README.md)

Pom succeeds only if a team can adopt reusable UI behavior without surrendering ownership of its AI roleplay product. This document makes that boundary explicit.

## Two owners, one integration

| Concern | Pom owns | The adopter owns |
| --- | --- | --- |
| UI capabilities | Panel, Widget, catalog, command, event, and accessibility contracts | Which capabilities exist in the product and who can use them |
| Layout | Valid states, deterministic transitions, persistence envelopes, and responsive behavior contracts | Default arrangement, screen composition, breakpoints beyond the contract, and product navigation |
| Rendering | Renderer registration and headless view bindings | Visible markup, content hierarchy, styling, animation, icons, and brand |
| Data | Schemas for Pom's public inputs and explicit adapter boundaries | Characters, messages, lore, scenes, campaigns, settings, and every domain rule |
| Persistence | Layout storage interfaces, validation, and migration envelopes | Databases, files, account sync, save formats, retention, and recovery policy |
| Runtime | UI state orchestration and subscriptions | Backend services, model providers, prompt assembly, generation, streaming, and tool execution |
| Security | Safe parsing at Pom's public package boundary | Authentication, authorization, secrets, tenancy, content policy, and network security |
| Quality | Public test drivers, conformance fixtures, and preserved interaction evidence | Product acceptance criteria, end-to-end host tests, deployment checks, and support commitments |

The integration between those owners is explicit. Host and domain data enters through adapters; Pom packages never reach into a frontend's backend or infer its private state.

## A typical adoption flow

Consider a team building a SillyTavern-class roleplay frontend with a transcript, composer, character inspector, lore browser, scene state, and settings.

1. The frontend defines its own character, message, lore, and generation models.
2. It chooses Pom Widget capabilities for the surfaces that should be docked, floated, focused, hidden, or discovered through a catalog.
3. It creates a framework-neutral Pom store and registers the available Widget types.
4. Its adapters project domain state into renderer inputs and translate user intent back into host-owned commands.
5. If it uses Svelte, it exposes the store through `@pomegranate-ui/svelte` and registers product renderers.
6. It copies useful recipes, then changes their markup and styling as ordinary application source.
7. It supplies layout storage and migration behavior appropriate to its accounts and saves.
8. It runs Pom's public conformance checks alongside its own backend and end-to-end tests.

Pom never needs to own the frontend's character schema or call its model provider. The adopter never needs to reimplement Pom's layout transition rules merely to change the product's visual design.

## SillyTavern and other existing frontends

SillyTavern is an example of the application category Pom is designed around, not a declared integration target in the current repository. Using Pom inside SillyTavern or another established host would require a separately designed adapter and host integration tranche.

That distinction prevents accidental promises:

- Pom does not currently claim drop-in SillyTavern compatibility.
- Pom does not reproduce SillyTavern's extension API or data structures.
- Pom does not require a new frontend to follow SillyTavern's information architecture.
- An eventual adapter would translate between two authorities; it would not make either project the other's internal model.

## Source ownership and customization

Pom's Svelte package is headless. It supplies reactive access to public toolkit state, renderer registration, typed context, and interaction behavior that necessarily touches the DOM. It does not supply routes or an application shell.

Visible reference UI lives in `registry/recipes` as copy-owned source. After copying, the adopter can:

- change semantic elements while preserving the required accessibility contract;
- combine or split components;
- replace styling and design tokens;
- add product-specific controls and content;
- connect different renderers; and
- retire a recipe in favor of its own implementation.

The public tests are the portability mechanism. They describe the observable contract that a custom implementation must retain without requiring the adopter to import Pom internals.

## Backend neutrality

Pom packages accept validated public data and explicit host context. They do not import Sonder server code, assume a SillyTavern server, select an AI provider, or store roleplay-domain state.

An adopter may connect a local backend, a hosted service, an existing roleplay server, or several providers. That choice remains outside Pom as long as the adapter satisfies the public UI contract.

## Current non-goals

The current repository does not include:

- npm package publication;
- a production documentation site;
- a production hosting stack;
- a SvelteKit application;
- a SillyTavern adapter;
- a Sonder Engine cutover; or
- a production-ready theme package.

Each would require its own approved scope. None is implicit in adopting the current toolkit.
