# @pomegranate-ui/layout

Framework-neutral Panel ordering, docked and floating Widget placement, normalization, persistence envelopes, and migrations.

Every transition is atomic: rejection returns the original state object, while acceptance increments its revision once. Persistence uses `pomegranate.ui.layout.v1`, deterministic JSON, strict cross-reference validation, and adopter-supplied asynchronous storage.
