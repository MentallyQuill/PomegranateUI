# PomegranateUI Public Release Design

**Date:** 2026-08-30
**Status:** Approved for implementation

## Goal

Release PomegranateUI as a public MIT-licensed developer toolkit for AI roleplay
frontends and publish its Workbench Lab as a GitHub Pages demo. The release must
remove the current repository's Sonder-derived evidence lane and all active
dependencies on it while preserving the repository's existing Git history.

## Release boundaries

- PomegranateUI remains a developer toolkit, not a turnkey application
  frontend. Adopters continue to own branding, information architecture,
  markup, backend integration, authentication, persistence, and domain
  semantics.
- The public release includes the Pom-native packages, Svelte bindings,
  source-owned recipes, Workbench Lab, theme implementations, generic examples,
  and native test drivers.
- The current tree contains no Sonder-named path, Sonder reference in tracked
  text, imported Sonder prototype, source recording, extracted screenshot,
  provenance ledger, integration example, or active preservation dependency.
- Historical commits are not rewritten. Earlier material remains reachable in
  Git history under the license notices recorded at those commits.
- This design and its implementation plan are temporary release artifacts. They
  are committed for change control, then removed before the final current-tree
  audit because they necessarily name the material being separated.
- This release does not publish npm packages, add a backend, add a custom
  domain, or perform an adopter cutover.

## Clean separation

Remove the preserved prototype trees, imported design foundations and Widget
specifications, extraction provenance, Sonder-specific example, source import
and report tooling, old preservation plans, and tests or drivers whose authority
is an external Sonder artifact. Remove raw theme recordings and extracted
reference frames from the current tree.

Keep Pom-native theme implementations and assets whose provenance supports a
public release. The existing Workbench Lab remains the hosted demonstration.
Replace active inherited assets as follows:

- Move Geist, Geist Mono, and Newsreader into a neutral third-party font
  directory and retain their license texts.
- Replace inherited SVG Repo controls with newly authored Pom-native SVG icons.
- Remove `deep-current-stage.jpg`, whose redistribution provenance is not
  sufficiently established, and use a Pom-owned CSS or generated background.
- Retain the project-specific generated theme artwork documented as created for
  PomegranateUI without third-party reference images.

The native gate retains unit, strict type, package, build, recipe, packed
consumer, accessibility, browser interaction, and visual regression coverage.
Extraction, preservation, migration-report, and external-oracle conformance
gates are removed. The final current-tree audit requires zero case-insensitive
`sonder` matches in tracked paths and tracked text.

## Licensing

Add the standard OSI MIT License at the repository root with:

> Copyright (c) 2026 MentallyQuill

Add `"license": "MIT"` to repository-owned package metadata. Add a focused
third-party notices document for redistributed fonts and any other retained
third-party asset. The root MIT license applies to PomegranateUI-owned work;
third-party materials retain their own notices.

Update the README and canonical public documentation to describe the public
MIT-licensed toolkit, link the live demo, and remove private-incubator,
preservation-lane, and cutover language. Public-facing copy must continue to
describe PomegranateUI as infrastructure for AI roleplay frontends rather than
as its own branded frontend.

## Security and publication sequence

The repository remains private while release changes are prepared and tested.
Before changing visibility:

1. Scan the current tree and complete Git history for committed secrets.
2. Run the native-only `npm.cmd run check` locally.
3. Commit and push the release changes while the repository is private.
4. Require the Ubuntu and Windows GitHub Actions matrix to pass for the exact
   release commit.

Any credible secret finding blocks publication until the secret is removed from
the public history or revoked. A failing local or remote verification gate also
blocks the visibility change.

After the exact private commit is green, change
`MentallyQuill/PomegranateUI` to public, enable GitHub Pages with GitHub Actions
as its source, and run the verified `main` workflow for the first deployment.
The repository homepage becomes:

`https://mentallyquill.github.io/PomegranateUI/`

## GitHub Pages architecture

The existing cross-platform CI workflow remains the release authority. A Pages
job runs only for `main` in the public repository and only after the complete
Ubuntu and Windows verification matrix succeeds. It checks out and rebuilds the
same commit, uploads only `apps/workbench-lab/dist` with the native Pages
artifact action, and deploys through the `github-pages` environment with
`pages: write` and `id-token: write` permissions.

The workflow uses immutable action revisions, a Pages-specific concurrency
group, and no `gh-pages` branch. The Lab keeps Vite's relative base so assets
resolve beneath the project-site path.

## Verification and live proof

Completion requires evidence for all of the following:

- no current tracked Sonder paths or text references;
- correct MIT license detection and package metadata;
- preserved third-party notices for retained assets;
- a fresh local `npm.cmd run check` result;
- successful Ubuntu and Windows CI for the release SHA;
- public repository visibility and local/remote SHA equality;
- GitHub Pages deployment bound to the release SHA;
- HTTPS and successful asset loading at the live project URL;
- live theme switching, representative Widget interaction, responsive layouts,
  accessibility smoke checks, persisted settings, and an error-free browser
  console.

Unrelated untracked Codex recovery and attachment directories remain untouched
and must not enter release commits.
