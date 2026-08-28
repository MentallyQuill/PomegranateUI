# Sonder Extraction Source

## Baseline identity

- Source repository: `https://github.com/N0819/Sonder_Engine.git`
- Source branch: `interface`
- Extraction baseline: `0fb98e43f303d62c42ef5c74e6ae38126f68161d`
- Baseline selected: 2026-08-27
- Import mechanism: Git object reads through `git show`; no mapped artifact was read from the source working tree.

## Checkpoint commits

- Approved execution plan: `89e559ad7122a38797bf12ff22bdc63c236830e7`
- Canonical Workbench calibration: `4bf4b895704d3d0d79b2363a86433fedb634eb28`
- Widget-overhaul corpus: `0fb98e43f303d62c42ef5c74e6ae38126f68161d`

## Browser evidence

The baseline was exercised in the Codex In-app Browser. Its control surface did not expose an engine version, so no version is invented here. PomegranateUI's repeatable preserved lane pins `@playwright/test` `1.62.1` and records its Chromium result independently.

Before checkpointing:

- Atmospheric Workbench: `79/79 passed`.
- Widget overhaul: an initial `211/212 passed` exposed a Theme Settings focus race between concurrently running iframe contracts.
- The focused handoff contract was observed red, the owner lookup/focus was made synchronous with a deferred fallback, and the complete overhaul harness then reported `212/212 passed`.

After both source commits:

- Atmospheric Workbench: the later commit-addressed runtime capture reports `95/95 passed`, zero failure rows. This supersedes the earlier manually recorded `79/79` total.
- Widget overhaul: `212/212 passed`, zero failure rows.

From the independent PomegranateUI repository using Playwright `1.62.1` and its pinned Chromium:

- Atmospheric Workbench: `95/95 passed`.
- Widget overhaul: `212/212 passed`.

Preservation CI runs the same locked checks on Ubuntu and Windows. Its action releases are pinned to immutable commits and annotated in `.github/workflows/ci.yml`.

## Excluded working-tree state

No dirty paths remained after the three path-scoped checkpoint commits. No source artifact was removed, moved, reset, cleaned, or cut over during baseline selection.
