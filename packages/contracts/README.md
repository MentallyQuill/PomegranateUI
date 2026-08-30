# @pomegranate-ui/contracts

Framework-neutral JSON-safe data, command, event, capability, persistence, and runtime schema contracts. This package has no UI framework or DOM authority.

Public IDs remain strings when serialized but reject blank or padded input. Raw commands, manifests, state, and layout snapshots cross versioned Zod schemas before entering toolkit handlers. UI-owned configuration accepts finite, acyclic JSON data only.

Theme contracts accept exact `pomegranate.ui.theme.v1` and
`pomegranate.ui.theme.v2` inputs. V2 owns bounded named material and shape
palettes, the complete stable Pom part recipe inventory, range-control
geometry, ordered canvas descriptors, declared local assets, and accessibility
policy data. It accepts no CSS, selectors, markup, scripts, executable
expressions, or remote asset URLs. Resolution and CSS compilation remain owned
by `@pomegranate-ui/theme`; see [theme authoring](../../docs/theme-authoring.md).

Additive target contracts keep art-direction owners separate:

- `ThemeDefinitionV3` owns semantic colors, typography, materials, shapes,
  recipes, controls, and declared local assets.
- `CanvasDefinition` owns one to twelve validated background-composition
  layers.
- `AmbientProfile` owns bounded light position, radius, power, and optional
  motion.
- `ThemeTargetBundle` atomically associates those owners under one matching
  lower-case target ID.

The exact V1 and V2 schemas remain compatibility contracts. Target contracts
reject arbitrary CSS, executable fields, remote asset URLs, unknown keys,
owner-ID drift, non-finite controls, and cross-owner data.

Theme authoring crosses the strict `ThemeDraft` and `PersistedThemeDraft`
schemas. Drafts contain exactly six `#RRGGBB` semantic inputs and four integer
material controls from zero through one hundred. Persisted drafts pair one
matching ambient profile with one base target and reject CSS, markup, scripts,
remote URLs, unknown roles, and owner-ID drift. Browser storage remains a host
adapter behind the framework-neutral `ThemeDraftStorage` interface.
