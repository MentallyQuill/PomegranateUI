# @pomegranate-ui/theme

`@pomegranate-ui/theme` is PomegranateUI's framework-neutral engine for
versioned, declarative theme definitions from `@pomegranate-ui/contracts`.
It validates untrusted input, migrates v1 definitions to complete v2 recipes,
resolves semantic materials and local host assets, enforces authored contrast,
applies bounded accessibility policy, and compiles deterministic bindings for
stable `data-pom-part` anatomy.
It imports neither a view framework nor a DOM API.

Resolution and compilation are deliberately side-effect free: the package does
not apply CSS, load assets, write preferences, or retain the last valid theme.
A host registers trusted local asset IDs, rejects an invalid candidate from the
literal diagnostics, and atomically applies `compileThemeBindings()` or the
complete fixed-selector output from `compileThemeStyleSheet()`.

`migrateThemeTarget()` lifts compatible v1/v2 themes into the additive v3
target envelope, where `ThemeDefinitionV3`, `CanvasDefinition`, and
`AmbientProfile` remain separate validated owners. `resolveThemeTarget()`
resolves the complete bundle or returns no partial target, and
`compileThemeTarget()` delegates to the existing policy, binding, stylesheet,
asset, and canvas compilers while adding only bounded `--pom-ambient-*`
bindings.

`compileCanvasLayers()` participates in the same activation transaction, and
`compileSliderProgress()` supplies the value-driven Chromium/WebKit range fill.
Reduced-transparency policy rewrites base and interaction-state materials, not
only the default surface.

V2 themes declare bounded material and shape palettes plus every required
semantic part. Theme data never contains CSS, selectors, HTML, scripts, URLs,
or component markup. `applyThemePolicy()` applies runtime controls, user
preferences, and device vetoes in that order; reduced transparency switches
parts to declared opaque materials and disables their blur.

The package does not bundle a branded preset, component shell, font, icon
library, storage adapter, asset loader, or network client. An adopter owns the
theme definitions used by its application, annotates compatible markup with
the documented semantic parts, registers local assets and icons, and decides
how preferences persist.

The Workbench Lab's Pom Neutral, Deep Current, and Bunny definitions are
application-owned conformance fixtures. They do not make those visual targets
mandatory for adopters.

See [Authoring PomegranateUI themes](../../docs/theme-authoring.md) for the v2
data model, semantic-part inventory, real compiler and canvas examples, asset
registration, policy order, migration guidance, external-theme proof, and the
bounded no-custom-CSS promise.
