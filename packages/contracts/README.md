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
