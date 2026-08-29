# Deep Current Widget-Surface Conformance Implementation Plan

**Status:** Approved for autonomous execution after the interaction foundation

**Goal:** Port the 49 surfaces explicitly marked implemented in the frozen
Widget UX Overhaul ledger into Pom-owned, backend-neutral Svelte recipes and
freeze visual, functional, responsive, state, Catalog, and accessibility
evidence. Preserve discovery for all 94 Catalog identities without inventing
specialized bodies for the remaining 46 top-level Widgets.

**Authority:**

- `design/widget-specifications/sonder-panels-and-widgets/12_WIDGET_UX_OVERHAUL_LEDGER.md`
  determines the implemented boundary and per-Widget acceptance contract.
- The preserved Widget Overhaul source and `212/212` harness are immutable
  executable oracles.
- Pom owns reusable anatomy, state shells, layout, accessibility, and Svelte
  integration. Adopters own production data and domain operations.

## Hard scope gate

The 49 implemented top-level types are exactly:

- six Settings panels: Provider Credentials, Model Assignments, Theme Library,
  Accessibility, Maintenance, Prompt Editor;
- all 12 Story Widgets;
- all 19 Library Widgets; and
- 12 Systems Widgets from Cast through Character Relationships.

`settings.custom-theme` is represented through the implemented Theme Library's
split owner, not counted as a fiftieth top-level implementation. The other 46
Catalog identities retain manifest, search, preview, placement, and unavailable
renderer behavior only.

## Scenario and state matrix

Every row gets a ready scenario at standard dock width plus the smallest state
matrix that exercises its ledger-specific failure risk. `compact` means the
real 200 px dock projection; `wide` means 420 px; `focus` means the same Widget
instance in focused presentation. Every row also gets keyboard order, accessible
names, one-scroll-owner, complete-primary-label, and no-horizontal-overflow
assertions.

| # | Type | Ready scenario | Additional matrix |
|---:|---|---|---|
| 1 | `settings.provider-credentials` | `dc-w-provider-credentials` | empty, failure, focus, compact, wide |
| 2 | `settings.model-assignments` | `dc-w-model-assignments` | empty, conflict, focus, compact, wide |
| 3 | `settings.theme` | `dc-w-theme-library` | empty, dirty, focus, compact, wide |
| 4 | `settings.accessibility` | `dc-w-accessibility` | dirty, saving, coarse-pointer, compact, wide |
| 5 | `settings.maintenance` | `dc-w-maintenance` | running, partial, failure, compact, wide |
| 6 | `settings.prompt-editor` | `dc-w-prompt-editor` | dirty, saving, conflict, focus, compact, wide |
| 7 | `story.transcript` | `dc-w-transcript` | loading, empty, failure, focus, compact, wide |
| 8 | `story.composer` | `dc-w-composer` | dirty, saving, conflict, failure, focus, coarse-pointer |
| 9 | `story.context` | `dc-w-story-context` | loading, stale, unavailable, compact, wide |
| 10 | `story.turn-progress` | `dc-w-turn-progress` | loading, empty, failure, compact, wide |
| 11 | `story.live-technical-detail` | `dc-w-live-technical-detail` | loading, failure, focus, compact, wide |
| 12 | `story.turn-versions` | `dc-w-turn-versions` | empty, stale, focus, compact, wide |
| 13 | `story.turn-inspector` | `dc-w-turn-inspector` | empty, unavailable, failure, focus, compact |
| 14 | `story.player-condition` | `dc-w-player-condition` | loading, unavailable, failure, compact, wide |
| 15 | `story.cast-condition` | `dc-w-cast-condition` | loading, empty, unavailable, focus, compact |
| 16 | `story.room-ambience` | `dc-w-room-ambience` | loading, offline, failure, compact, wide |
| 17 | `story.scene-backdrop` | `dc-w-scene-backdrop` | loading, empty, failure, compact, wide |
| 18 | `runtime.background-work` | `dc-w-background-work` | loading, empty, failure, compact, wide |
| 19 | `library.workspace` | `dc-w-library` | empty, stale, failure, focus, compact, wide |
| 20 | `library.stories` | `dc-w-stories` | loading, empty, unavailable, compact, wide |
| 21 | `library.characters` | `dc-w-characters-library` | loading, empty, unavailable, compact, wide |
| 22 | `story.characters` | `dc-w-characters-story` | loading, empty, unavailable, compact, wide |
| 23 | `library.personas` | `dc-w-personas-library` | loading, empty, unavailable, compact, wide |
| 24 | `story.personas` | `dc-w-personas-story` | loading, empty, unavailable, compact, wide |
| 25 | `library.lore` | `dc-w-lore-library` | loading, empty, unavailable, compact, wide |
| 26 | `story.lorebooks` | `dc-w-lorebooks-story` | empty, dirty, conflict, focus, compact |
| 27 | `library.new-story` | `dc-w-new-story` | empty, dirty, conflict, focus, compact |
| 28 | `library.character-card` | `dc-w-character-card` | empty, dirty, saving, conflict, focus, compact |
| 29 | `story.character-card` | `dc-w-story-character-card` | empty, dirty, saving, conflict, focus, compact |
| 30 | `library.persona-card` | `dc-w-persona-card` | empty, dirty, saving, conflict, focus, compact |
| 31 | `library.greetings-quick-start` | `dc-w-greetings-quick-start` | empty, dirty, conflict, focus, compact |
| 32 | `library.lore-entries` | `dc-w-lore-entry-tree` | loading, empty, dirty, focus, compact |
| 33 | `library.lore-entry-editor` | `dc-w-lore-entry-editor` | empty, dirty, saving, conflict, focus, compact |
| 34 | `library.lorebook-details` | `dc-w-lorebook-details` | empty, dirty, conflict, focus, compact |
| 35 | `library.lore-relationships` | `dc-w-lore-relationships` | loading, empty, stale, focus, compact |
| 36 | `library.lore-generator` | `dc-w-lore-generator` | review, running, partial, refused, focus, compact |
| 37 | `library.lived-location-builder` | `dc-w-location-builder` | empty, dirty, review, running, partial, refused, focus, compact |
| 38 | `systems.cast` | `dc-w-cast` | loading, empty, dirty, conflict, compact, wide |
| 39 | `systems.background-presences` | `dc-w-background-presences` | empty, running, partial, refused, compact, wide |
| 40 | `systems.world-state` | `dc-w-world-state` | loading, empty, stale, conflict, focus, compact |
| 41 | `systems.attire` | `dc-w-attire` | empty, dirty, saving, conflict, focus, compact |
| 42 | `systems.genre-style` | `dc-w-genre-style` | empty, dirty, conflict, compact, wide |
| 43 | `systems.dialogue-agency` | `dc-w-dialogue-agency` | empty, dirty, conflict, compact, wide |
| 44 | `systems.offscreen-life` | `dc-w-offscreen-life` | loading, empty, failure, compact, wide |
| 45 | `systems.living-world` | `dc-w-living-world` | loading, empty, failure, focus, compact |
| 46 | `systems.institutions-charter` | `dc-w-institutions-charter` | empty, dirty, conflict, focus, compact |
| 47 | `systems.institution-diagnostics` | `dc-w-institution-diagnostics` | loading, empty, failure, compact, wide |
| 48 | `systems.background-life` | `dc-w-background-life` | loading, empty, failure, compact, wide |
| 49 | `systems.character-relationships` | `dc-w-character-relationships` | loading, empty, stale, focus, compact |

## Task 1: Mechanically freeze the 49-type boundary

**Files:**

- Create `apps/workbench-lab/src/mockup/implemented-surfaces.ts`
- Create `apps/workbench-lab/src/mockup/implemented-surfaces.test.ts`
- Modify `tests/unit/repository-boundary.test.mjs`

**Red:** Require exactly 49 unique type IDs, exact family totals
`settings:6`, `story:12`, `library:19`, `systems:12`, and exact title parity
with ledger rows 1-49. Reject any specialized renderer registration outside
that set except the existing explicit generic fallback.

**Green:** Export a frozen, source-owned implemented-surface registry that
references the existing 94 manifests but does not parse preserved files at
runtime.

## Task 2: Add shared Widget anatomy and deterministic state shell

**Files:**

- Create `apps/workbench-lab/src/recipes/WidgetAnatomy.svelte`
- Create `apps/workbench-lab/src/recipes/WidgetStateSurface.svelte`
- Create `apps/workbench-lab/src/mockup/surface-fixtures.ts`
- Modify `apps/workbench-lab/src/recipes/WidgetFrame.svelte`
- Modify `apps/workbench-lab/src/styles.css`
- Add component and browser tests

**Red:** Require instrument, summary, module, and workspace anatomy; explicit
loading/empty/unavailable/access-denied/stale/offline/failure plus
dirty/saving/conflict/success/review/running/partial/refused states where the
manifest declares them; non-color-only status; retained drafts on failure; and
one deliberate scroll owner.

**Green:** Build Pom-generic anatomy and state recipes. Keep synthetic evidence
in Lab fixtures, not packages. State selection is test/demo presentation and is
never persisted as adopter data.

## Task 3: Conform the six Settings surfaces

**Scenarios:** rows 1-6

**Files:**

- Replace `apps/workbench-lab/src/mockup/renderers/SettingsWidget.svelte`
  with purpose-specific Settings renderers under
  `apps/workbench-lab/src/mockup/renderers/settings/`
- Modify renderer registration and scoped styles
- Add focused tests before each renderer

Implement shared-owner projections for provider connection health, assignment
ladder, Theme Library/custom-theme split, live accessibility controls,
maintenance task leases, and prompt preset/editor draft. Secrets are
write-only; summary groups never mutate; primary actions remain visible.

## Task 4: Conform all 12 Story surfaces

**Scenarios:** rows 7-18

**Files:** purpose-specific renderers under
`apps/workbench-lab/src/mockup/renderers/story/`, fixture/state modules, styles,
and focused tests.

Preserve visible-turn identity across Transcript, Versions, Inspector,
ambience, and backdrop. Keep Composer as the lower-stage input owner. Separate
friendly progress from technical detail. Conditions use bounded synthetic
vitals; background work exposes current task and safe next action.

## Task 5: Conform all 19 Library surfaces

**Scenarios:** rows 19-37

**Files:** purpose-specific renderers under
`apps/workbench-lab/src/mockup/renderers/library/`, a bounded shared selection
fixture, styles, and focused tests.

Filtered Library Widgets share one synthetic projection. Card/editor Widgets
share selection and qualified draft state without sharing production data.
Lore Generator and Lived-in Location Builder remain separate bounded task
owners with review-before-apply and partial/refused receipts.

## Task 6: Conform the 12 implemented Systems surfaces

**Scenarios:** rows 38-49

**Files:** purpose-specific renderers under
`apps/workbench-lab/src/mockup/renderers/systems/`, fixture/state modules,
styles, and focused tests.

Preserve read-only/typed authority boundaries. World State and Attire have no
raw replacement shortcut. Institutions links to the location builder rather
than duplicating it. Character Relationships remains a readable stance
projection with a bounded compact scroller.

## Task 7: Preserve all 94 Catalog identities

**Scenarios:**

- `dc-catalog-inventory`
- `dc-catalog-search`
- `dc-catalog-visual-preview`
- `dc-catalog-compact-preview`
- `dc-catalog-placement-all`
- `dc-catalog-fallback-46`

**Files:**

- Modify `apps/workbench-lab/src/recipes/WidgetCatalog.svelte`
- Modify `apps/workbench-lab/src/mockup/catalog.ts`
- Modify `tests/browser/native-workbench.spec.ts`
- Modify conformance drivers/specs

**Red:** Require exact totals Story 12, Library 19, Systems 21, Settings 39,
Extensions 3; exact unique types; search by name and keyword; safe visual and
compact previews; compatible pointer/keyboard/touch placement; singleton
unavailability; and a truthful `Renderer unavailable` placed fallback for each
of the other 46 types.

**Green:** Preview data comes from manifests and bounded catalog fixtures.
Never register a specialized body for a fallback type and never imply its
production capability is implemented.

## Task 8: Add independent surface conformance drivers

**Files:**

- Create `tests/conformance/widget-manifest.ts`
- Create `tests/conformance/drivers/reference/widget-overhaul-surfaces.ts`
- Create `tests/conformance/drivers/workbench-lab/widget-surfaces.ts`
- Create `tests/conformance/specs/deep-current-widgets.spec.ts`
- Create `tests/conformance/baselines/deep-current-widgets.json`
- Create `docs/conformance/deep-current-widgets-ledger.md`
- Modify unit conformance tests

Each driver independently establishes Panel, placement, Widget type, demo
state, width, and focus. Evidence includes screenshot, geometry, computed
tokens, visible text roles, functional trace, accessible names, scroll owners,
and overflow. A missing type/state/control must be setup failure, not a passing
empty comparison.

## Task 9: Iterate and freeze Deep Current Widgets

Work in the ledger's implementation order. For each surface:

1. run its ready scenario and smallest state matrix;
2. record every material mismatch before editing;
3. fix shared anatomy only when all affected frozen surfaces are rerun;
4. fix renderer-local behavior/style otherwise;
5. close ledger rows only with a named regression; and
6. stop after two renderer-local correction cycles unless a P0/P1 remains,
   which stays explicit rather than being waived by iteration count.

Deep Current freezes only with all 49 ready scenarios, their stated matrices,
the six Catalog scenarios, twelve interaction scenarios, five macro scenarios,
and both preserved harnesses green, with zero unresolved P0/P1 or unapproved
P2 discrepancies.

```powershell
npm.cmd run test:conformance:unit
npm.cmd run test:conformance:deep-current
npm.cmd run test:browser
npm.cmd run test:native
npm.cmd run typecheck
npm.cmd run build
npm.cmd run check:extraction
npm.cmd run report
git diff --check
```

Commit only after the frozen evidence is current:

```powershell
git add apps/workbench-lab tests docs/conformance package.json
git commit -m "feat(lab): conform Deep Current Widgets"
```

Only then author the Neutral/Bunny reference and execution plan. It must reuse
this frozen semantic matrix and add a structural regression that rejects
theme-ID branches in the component tree.
