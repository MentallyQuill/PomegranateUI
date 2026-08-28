# @pomegranate-ui/contracts

Framework-neutral JSON-safe data, command, event, capability, persistence, and runtime schema contracts. This package has no UI framework or DOM authority.

Public IDs remain strings when serialized but reject blank or padded input. Raw commands, manifests, state, and layout snapshots cross versioned Zod schemas before entering toolkit handlers. UI-owned configuration accepts finite, acyclic JSON data only.
