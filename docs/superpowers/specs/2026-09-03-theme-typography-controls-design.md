# Theme-Scoped Typography Controls Design

## Summary

Replace the redundant Settings `Reading and Layout` theme picker with `Theme Typography`, a live authoring surface for bundled, theme-scoped type choices. Theme Library remains the preset selector. Custom Theme remains the canonical draft editor, and the Theme Typography widget edits the typography portion of that same per-theme draft.

The change also makes preset thumbnails derive from their actual theme tokens and makes `Open Custom Theme` navigate to, reveal, and focus the Custom Theme widget.

## Approved theme typography

| Theme | Interface | Prose | Display | Technical |
| --- | --- | --- | --- | --- |
| Deep Current | Geist | Newsreader | Newsreader | Geist Mono |
| PomOS | Inter | Inter | Inter | Roboto Mono |
| Bunny | Nunito | Fraunces | Fraunces | Nunito |
| Ash & Amber | Source Sans 3 | Alegreya | Alegreya | Source Sans 3 |

Deep Current's current Geist / Newsreader / Geist Mono combination is unchanged. All families are shipped with the Workbench Lab; the feature never requests access to local OS fonts.

## Architecture

- Extend version 2 theme drafts with optional full typography. New drafts seed from the selected base theme; older stored drafts without typography remain valid and inherit their base theme typography.
- Project typography through the existing draft pipeline so live edits use the same validated, atomic theme application as colors, materials, toolbar, and canvas.
- Keep one draft per theme in the Lab controller and device storage. The Lab migrates the matching legacy singleton draft into a versioned per-theme key, and first activation hydrates that theme's saved draft.
- Add focused controller operations for typography roles, scale steps, and typography-only reset. A typography reset must not discard color or material edits.
- Keep the reusable recipe host-driven. The copied Theme Typography recipe receives font choices and mutations through the existing theme-authoring port rather than branching on theme IDs.
- Preserve `settings.reading-layout` as the stable widget type for compatibility while changing its visible title and implementation to Theme Typography.

## Typography surface

The widget exposes:

- bundled family selectors for Interface, Prose, Display, and Technical roles;
- the five semantic size steps (`xs` through `xl`) with ordered slider bounds;
- role-specific line-height and tracking controls;
- a live specimen showing display, prose, interface, and technical text;
- typography-only Reset and the existing Save Draft action;
- status copy that makes the active theme and per-theme scope explicit.

All controls apply immediately. The stored theme draft remains the persistence boundary already used by Custom Theme.

## Dynamic previews

Preset thumbnail CSS is generated from each compiled theme's color and shape tokens. The active preset's thumbnail is refreshed whenever its draft changes, so authoring a theme color changes its thumbnail without any theme-specific selector or hardcoded swatch palette.

## Custom Theme navigation

`Open Custom Theme` activates Settings, activates the Appearance subpanel, waits for the rendered widget, scrolls it into view, and moves focus into its first useful action. This provides visible feedback even when Settings was already active.

## Compatibility and boundaries

- Existing version 1 and version 2 stored drafts continue to decode.
- Framework-neutral theme contracts remain data-only.
- Theme switching keeps one mounted Panel and Widget tree.
- The Workbench Lab bundles and licenses all font files; adopters remain responsible for their own delivery and persistence choices.
- The generic contracts continue to accept adopter-owned font stacks, while the Workbench Lab validates edited and stored typography against its bundled role-specific catalog.
- No theme-ID CSS selectors or theme-specific component forks are introduced.

## Verification

- Contract, projection, and controller tests cover old drafts, live changes, per-theme isolation, reset behavior, and approved defaults.
- Component tests cover controls, live CSS bindings, dynamic thumbnails, and Custom Theme navigation/focus.
- Distribution tests cover copied font licenses and byte-identical built assets for every bundled font; browser tests await and identify each new loaded face.
- The full `npm.cmd run check` gate and browser suite must pass before delivery.
