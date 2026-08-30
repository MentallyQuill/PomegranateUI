# PomOS Tahoe Fidelity Delta

**Status:** Approved by the active PomOS fidelity goal on 2026-08-30.

## Purpose

Bring the existing PomOS target to a polished, original macOS 26 Tahoe-inspired standard without adding theme-ID selectors, component forks, or new semantic part IDs. The supplied Tahoe Control Center image and the Pom-native reference documents are visual direction, not artwork to copy.

This delta preserves the accepted ThemeDefinition, ThemeTargetBundle, CanvasDefinition, PresentationProfile, Panel, Widget, docking, persistence, undo, responsive, and accessibility contracts.

## Visual and interaction contract

### Responsive geometry

- The shelf, stage, side stacks, and composer remain contained by the viewport at 1440x900, 1280x720, 390x844, 844x390, and the 800x450 200-percent-zoom equivalent.
- Side-stack siblings never overlap. A stack owns its available height, and constrained content scrolls inside that owner rather than painting into the next Widget.
- Hidden narrow-layout side regions occupy no usable geometry and cannot intercept input.
- The composer stays fully visible, including its textarea and submit action, and remains aligned to the visible stage.
- Top-chrome content stays inside the shelf. Essential Panel tabs remain text; eligible secondary actions may use accessible icon presentation.

### Materials and geometry

- Grouped controls use one translucent material owner with subordinate controls expressed by separators, tonal fills, and restrained specular edges.
- Surface depth is legible through differing opacity, border, inset highlight, and shadow roles instead of uniform milky cyan cards or repeated white wireframes.
- Buttons, grouped rows, fields, and shells use a coherent continuous-rounded vocabulary. No accidental pills, clipped corners, or incompatible corner families appear in one group.
- Scene Effects is compact enough to scan as one grouped control cluster while every range input retains at least a 44px interaction target.

### Wallpaper

- The PomOS canvas remains crisp blue/cyan and forbids blur.
- The composition uses original curved luminous depth, layered arcs, and controlled light fields. It must not reproduce Apple artwork.
- Hard polygonal wedges and excessive gradient transition counts are not fidelity requirements.

### Controls, text, and accessibility

- Range rails and fills remain visibly white-toned through target-owned recipes. Hidden visual thumbs keep native geometry, pointer behavior, keyboard semantics, and an input-level focus indicator.
- Eligible secondary actions use the shared IconAction behavior and real accessible names. Navigation, tabs, primary content, and non-eligible controls retain visible text.
- Text is not clipped, microcopy remains readable, and contrast continues to satisfy the theme accessibility contract.
- Reduced-motion and reduced-transparency modes remain deterministic.

## Verification

Each repair begins with a failing behavioral or visual contract. Required evidence includes exact DOM geometry, keyboard/pointer semantics, 44px interaction targets, responsive screenshots at all named viewports, focused unit/conformance/browser gates, and the full `npm.cmd run check` gate.

