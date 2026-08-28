# @pomegranate-ui/theme

`@pomegranate-ui/theme` is PomegranateUI's framework-neutral resolver for
versioned, declarative theme definitions from `@pomegranate-ui/contracts`.
It validates untrusted input, resolves semantic material roles, merges typed
overrides deterministically, reports literal diagnostics, and exposes
conformance helpers without importing a view framework or DOM API.

Resolution is deliberately side-effect free: the package does not apply CSS,
load assets, write preferences, or retain the last valid theme. A host can use
the returned diagnostics to reject an invalid candidate and keep its current
resolved value, as the Workbench Lab does for immediate atomic switching.

The package does not bundle a branded preset, component shell, font, icon
library, storage adapter, asset loader, or network client. An adopter owns the
theme definitions used by its application, maps resolved values into its own
markup and CSS, resolves local assets, and decides how preferences persist.

The Workbench Lab's Pom Neutral, Deep Current, and Bunny definitions are
application-owned conformance fixtures. They do not make those visual targets
mandatory for adopters.
