# @pomegranate-ui/core

Framework-neutral Widget registration, stable instances, deterministic commands, events, and subscriptions. Rendering and backend authority remain outside this package.

The registry copies and freezes admitted manifests. The store parses raw commands, applies one atomic layout transition, emits one immutable event, and uses subscription semantics compatible with React's external-store contract. Public dispatch never throws.
