# Widget UX Overhaul Ledger

**Status:** Phase 2 implementation paused after a clean stopping point; 49 of 95 surfaces implemented

**Audit started:** 2026-08-26

**Applies to:** all 94 top-level Widget designs and the embedded Extension Turn
Inspector renderer documented by the Panels and Widgets package

## Purpose

This ledger is the correction specification and evidence record for the Widget
UX overhaul. It is intentionally separate from the first-pass design workbook:
the workbook establishes purpose, ownership, and capability; this ledger tests
each design against the actual Atmospheric Workbench mockup and turns the
findings into implementation-ready corrections.

The work has two hard-gated phases:

1. **Audit and document every Widget.** Inspect the placed Widget, focused
   treatment, Catalog result, meaningful states, and responsive projections;
   trace the real Main-branch capability and authority boundaries; record the
   failures, corrected anatomy, height contract, width behavior, and acceptance
   criteria.
2. **Implement one Widget at a time.** Only after every inventory record is
   audited, implement cycle 1, test behavior with Playwright, visually inspect
   the required states and sizes, record any remaining shortcomings, and use a
   second correction/review cycle only when the evidence requires it. No Widget
   receives more than two implementation cycles.

No mockup implementation is authorized by this ledger until the Phase 1
coverage gate reaches 95 of 95 audited surfaces: 94 top-level Widgets plus the
embedded Extension Turn Inspector renderer. Host session remains an explicit
non-Widget disposition and is checked for coverage but is not part of that
surface count.

## Frozen audit baseline

| Evidence | Frozen value |
|---|---|
| Main behavior baseline | `0c3f779935e329753c449a1910dd738cca4fb721` (`main` and `origin/main`, verified 2026-08-26) |
| Workbook baseline | `f0cd75f1eaa299b651921d37fb58e6eadb5fc1b3` on `interface` |
| Canonical editable mockup | `sonder-workbench-calibration.html`, SHA-256 `464D6CBB5B24B92576AC8F688E07FEF124D9EDE4C59F600525FC6D2BE26B9CE4` |
| Canonical rendered preview | `sonder-workbench-calibration-preview/.html`, SHA-256 `999C8D58ED65CC4C5C749040743BDC34A79AE440A4802A1B2F2852CCAEE80BD6` |
| Regression harness | `sonder-drag-regression.html`, SHA-256 `3EC9322132FC0C35CD727E958618925A7677DF421A105E143EAA6F15094FBA2C` |
| Registry count exposed by mockup | 94 top-level definitions |
| Existing structural regression result | 79 of 79 passing before this audit; not accepted as UX proof |
| Icon authority | local Minimal UI Icons artifact and manifest at `F:\git\Sonder\_Engine\artifacts\minimal-ui-icons` |

The hash freeze distinguishes an audit finding from later mockup correction.
Main is the behavioral evidence baseline, not a visual target. Maintained
interface contracts and Design Bible 2.0 remain authoritative for runtime
boundaries and visible composition respectively.

## Audit method and record contract

Every Widget record must answer all of the following before it can be marked
`Audited`:

1. What useful job does the user hire this Widget to do?
2. What behavior, state, consequence, privacy boundary, and persistence owner
   exist in Main or the maintained current interface?
3. What does the canonical mockup presently show in its placed, focused,
   Catalog, empty, loading, success, warning, failure, and destructive states,
   where those states apply?
4. Which current details are inert miniature content, generic template chrome,
   misleading status, weak hierarchy, inaccessible controls, clipped content,
   or an incomplete workflow?
5. What exact anatomy, primary action, secondary actions, feedback, and state
   transition make the Widget task-complete without duplicating authority?
6. How does it remain useful at 200 px, 286 px, and 420 px toolbar widths?
7. What is its evidence-based minimum functional height, ideal default height
   at 286 px, and maximum in-place height before focus or internal scrolling?
8. What must the Catalog miniature communicate without pretending to be the
   working control surface?
9. What functional and visual evidence will prove the correction complete?

An `Audited` record contains decisions, not placeholders. `Queued` means the
surface has not passed the Phase 1 gate and cannot be implemented.

## Shared correction rules

These rules apply unless an individual Widget record states a stricter
contract.

### Real tools, not stretched thumbnails

- A placed Widget exposes the shortest complete path for its primary job. A
  three-row status miniature stretched to fill a module is not a working
  Widget.
- Summary Widgets navigate or select; editor Widgets edit; task Widgets expose
  the current task and next valid action. They do not all inherit one generic
  description-tags-key/value-footer-action template.
- Internal ownership notes such as `GLOBAL HOST · SETTINGS-PROMPTS OWNER` and
  `Panel placement stores presentation only` belong in documentation or an
  optional About disclosure, not the normal user surface.
- Status is specific and earned: `Connected`, `2 need setup`, `Unsaved`, or
  `Update ready` may appear when authoritative state proves it. A generic
  `READY` badge is removed.
- The most important action remains visible without scrolling at the ideal
  default size. Destructive or costly actions name their consequence and use a
  review step.

### Control and icon treatment

- Use only manifest-backed SVGs from the accepted Minimal UI collection when
  an icon is appropriate. Do not draw substitutes in CSS, Unicode, or ad hoc
  SVG paths.
- Favor icons for familiar local actions such as add, edit, search, expand,
  collapse, previous, next, refresh, reveal, and overflow.
- Keep a visible label when meaning, scope, cost, privacy, or consequence would
  otherwise be ambiguous. Icon-only controls require an accessible name and a
  tooltip on hover/focus.
- Pointer targets are at least 44 by 44 CSS px. Dense visual glyphs may remain
  16-20 px inside those targets.

### Responsive semantic utility

- Acceptance is measured at the actual 200 px minimum, 286 px default, and
  420 px maximum toolbar widths, at the Widget's minimum, ideal, and maximum
  in-place heights. A desktop-wide or Focus render cannot stand in for a
  toolbar-limit review.
- Every placed projection must preserve the Widget's primary question and at
  least one Widget-specific path through its answer. A generic `Focus` launcher
  beside a few clipped facts is not a functional minimum-width Widget when its
  bounded content can be staged in place.
- Primary labels, identities, values, state, and action consequences remain
  visibly complete. They may wrap or reflow; they may not rely on ellipsis,
  arbitrary mid-word breaking, hover text, an accessible name, or hidden DOM
  copy to restore meaning that the visible surface removed.
- Responsive staging may replace overview with selected detail, but it keeps a
  visible and keyboard-operable Back path, preserves selection, and retains one
  intentional local scroll owner. It never hides the whole capability or
  leaves large unused capacity where useful bounded content belongs.
- Tests exercise the real minimum-width job and maximum-width reading path.
  They assert the visible stage, task transition, return path, complete primary
  text geometry, reachable actions, and scroll ownership. Node counts,
  `textContent`, and module-level `scrollWidth <= clientWidth` are supporting
  checks only; clipping content until the container no longer overflows is a
  failure.
- Any shared typography, header, target-size, spacing, or dock-capacity change
  invalidates prior responsive evidence for every affected Widget. Those
  Widgets must be rerendered and their task-level geometry requalified before
  they remain accepted.
- The two-iteration limit caps a Widget's scheduled correction attempts; it
  never converts an unresolved P1 responsive defect into `Passed and frozen`.
  A Widget still failing semantic utility remains failed and leaves the
  implemented count until an explicitly authorized corrective pass succeeds.

### Responsive width contract

Every top-level Widget must provide a useful projection at all toolbar widths,
even when its complete editor works best in focused mode.

| Width band | Qualification width | Required behavior |
|---|---:|---|
| Compact | 200 px | One-column priority path; labels may wrap; local secondary details collapse; no horizontal scroll or inaccessible action |
| Standard | 286 px | The Widget's canonical dock composition and the basis for its ideal default height |
| Wide | 420 px | Space is used for clearer grouping, comparisons, or inline secondary actions; content does not remain a narrow sparse column |

Focused-only complexity is not an excuse to reject toolbar placement. Its dock
projection must still expose meaningful status, selection, and a labeled
`Open focused editor` action. If editing remains safe and comprehensible in the
dock, the projection may support it directly.

### Per-Widget height contract

Uniform rows are prohibited. Each record defines:

- **minimum functional height**: the smallest useful in-place projection, not
  merely the smallest box that can render a title;
- **ideal default height at 286 px**: enough room to complete the primary job or
  reach its next explicit step without accidental clipping;
- **maximum in-place height**: the cap before the Widget uses one internal
  scroll owner, pagination, disclosure, or focused mode;
- **width response**: any legitimate change to ideal height at 200 or 420 px.

Panel layout allocates content-sized tracks from those contracts. It does not
use equal `1fr` rows. The Widget header and sticky action edge never participate
in the content scroller.

### Shared state and accessibility contract

- Loading preserves the expected shape and announces progress without claiming
  success. Empty states explain why the surface is empty and offer the next
  valid action. Failure retains the user's draft and provides a retry or safe
  exit.
- Keyboard order follows visual order. Focus is restored to the invoking
  control after menus, review sheets, and focused mode close.
- No meaning depends on color, hover, backdrop detail, or an icon alone.
- At 200% zoom and the three qualification widths, content reflows without
  document-level horizontal overflow.
- A Widget has one scroll owner per axis. Nested editors may use a deliberate
  code/text region scroller only when the surrounding Widget remains stable.

## Phase 1 coverage ledger

The order below is also the implementation order after the hard gate opens.
The six default Settings Widgets were audited first because the supplied panel
image exposed a representative system-level failure. The remaining records
retain their documented family order.

| # | Family | Widget or renderer | Phase 1 | Phase 2 at audit |
|---:|---|---|---|---|
| 1 | Settings panel | Provider Credentials | Audited | Implemented · 2 cycles · 87/87 |
| 2 | Settings panel | Model Assignments | Audited | Implemented · 2 cycles · 90/90 |
| 3 | Settings panel | Theme Library | Audited | Implemented · 3 cycles · split owner contract |
| 4 | Settings panel | Accessibility | Audited | Implemented · 2 cycles · 96/96 |
| 5 | Settings panel | Maintenance | Audited | Implemented · 2 cycles · 98/98 |
| 6 | Settings panel | Prompt Editor | Audited | Implemented · 2 cycles · 100/100 |
| 7 | Story | Transcript | Audited | Implemented · 2 cycles · 102/102 |
| 8 | Story | Composer | Audited | Implemented · 2 cycles · 104/104 |
| 9 | Story | Story and Frame Context | Audited | Implemented · 2 cycles · 106/106 |
| 10 | Story | Turn Progress | Audited | Implemented · 1 cycle · 108/108 |
| 11 | Story | Live Technical Detail | Audited | Implemented · 2 cycles · 110/110 |
| 12 | Story | Turn Inspector | Audited | Implemented · 2 cycles · 112/112 |
| 13 | Story | Turn Versions | Audited | Implemented · 2 cycles · 114/114 |
| 14 | Story | Player Condition | Audited | Implemented · 2 cycles · 116/116 |
| 15 | Story | Cast Condition | Audited | Implemented · 2 cycles · 118/118 |
| 16 | Story | Room Ambience | Audited | Implemented · 2 cycles · 120/120 |
| 17 | Story | Scene Backdrop | Audited | Implemented · 1 cycle · 122/122 |
| 18 | Story | Background Work | Audited | Implemented · 2 cycles · 124/124 |
| 19 | Library | Library | Audited | Implemented · 1 cycle · 126/126 |
| 20 | Library | Stories | Audited | Implemented · 2 cycles · 128/128 |
| 21 | Library | Characters (Library) | Audited | Implemented · 2 cycles · 130/130 |
| 22 | Library | Characters (Story) | Audited | Implemented · 2 cycles · 132/132 |
| 23 | Library | Personas (Library) | Audited | Implemented · 2 cycles · 134/134 |
| 24 | Library | Personas (Story) | Audited | Implemented · 2 cycles · 136/136 |
| 25 | Library | Lore (Library) | Audited | Implemented · 2 cycles · 138/138 |
| 26 | Library | Lorebooks (Story) | Audited | Implemented · 2 cycles · 140/140 |
| 27 | Library | New Story | Audited | Implemented · 2 cycles · 142/142 |
| 28 | Library | Character Card | Audited | Implemented · 2 cycles · 144/144 |
| 29 | Library | Story Character Card | Audited | Implemented · 2 cycles · 146/146 |
| 30 | Library | Persona Card | Audited | Implemented · 1 cycle · 148/148 |
| 31 | Library | Greetings and Quick Start | Audited | Implemented · 2 cycles · 150/150 |
| 32 | Library | Lore Entry Tree | Audited | Implemented · 2 cycles · 152/152 |
| 33 | Library | Lore Entry Editor | Audited | Implemented · 1 cycle · 154/154 |
| 34 | Library | Lorebook Details | Audited | Implemented · 1 cycle · 156/156 |
| 35 | Library | Lore Relationships | Audited | Implemented · 2 cycles · 158/158 |
| 36 | Library | Lore Generator | Audited | Implemented · 2 cycles · 160/160 |
| 37 | Library | Lived-in Location Builder | Audited | Implemented · 2 cycles · 162/162 |
| 38 | Systems | Cast | Audited | Implemented · 2 cycles · 164/164 |
| 39 | Systems | Background Presences | Audited | Implemented · 2 cycles · 166/166 |
| 40 | Systems | World State | Audited | Corrective acceptance passed · 4/4 World State contracts |
| 41 | Systems | Attire | Audited | Implemented · 2 cycles · 170/170 |
| 42 | Systems | Genre and Style | Audited | Implemented · 2 cycles · 172/172 |
| 43 | Systems | Dialogue and Agency | Audited | Implemented · 2 cycles · 179/179 |
| 44 | Systems | Off-screen Life | Audited | Implemented · 2 cycles · 181/181 |
| 45 | Systems | Living World | Audited | Implemented · 2 cycles · 2/2 focused; 187/188 full* |
| 46 | Systems | Institutions and Charter | Audited | Implemented · 2 cycles · 199/199 |
| 47 | Systems | Institution Diagnostics | Audited | Implemented · 2 cycles · 201/201 |
| 48 | Systems | Background Life / Scene Life | Audited | Implemented · 2 cycles · 203/203 |
| 49 | Systems | Character Relationships | Audited | Implemented · 2 cycles · 205/205 |
| 50 | Systems | Memory Browser | Audited | Blocked by Phase 1 gate |
| 51 | Systems | Character Private History | Audited | Blocked by Phase 1 gate |
| 52 | Systems | Persona Private History | Audited | Blocked by Phase 1 gate |
| 53 | Systems | Dramatic Irony | Audited | Blocked by Phase 1 gate |
| 54 | Systems | Promise Ledger | Audited | Blocked by Phase 1 gate |
| 55 | Systems | Multiplayer and Guest Invites | Audited | Blocked by Phase 1 gate |
| 56 | Systems | Frames | Audited | Blocked by Phase 1 gate |
| 57 | Systems | Who's Where | Audited | Blocked by Phase 1 gate |
| 58 | Systems | Time Paradox and Fixed Points | Audited | Blocked by Phase 1 gate |
| 59 | Settings group | Account and Access | Audited | Blocked by Phase 1 gate |
| 60 | Settings group | AI and Models | Audited | Blocked by Phase 1 gate |
| 61 | Settings group | Appearance and Accessibility | Audited | Blocked by Phase 1 gate |
| 62 | Settings group | Story Defaults and Content | Audited | Blocked by Phase 1 gate |
| 63 | Settings group | Data, Extensions, and Maintenance | Audited | Blocked by Phase 1 gate |
| 64 | Settings group | Advanced | Audited | Blocked by Phase 1 gate |
| 65 | Settings panel | Reading and Layout | Audited | Blocked by Phase 1 gate |
| 66 | Settings panel | Sound and Motion | Audited | Blocked by Phase 1 gate |
| 67 | Settings panel | Content | Audited | Blocked by Phase 1 gate |
| 68 | Settings panel | Add-ons | Audited | Blocked by Phase 1 gate |
| 69 | Settings panel | Raw Story Data | Audited | Blocked by Phase 1 gate |
| 70 | Settings subwidget | Connections and Credentials | Audited | Blocked by Phase 1 gate |
| 71 | Settings subwidget | Default Model | Audited | Blocked by Phase 1 gate |
| 72 | Settings subwidget | Memory-search Model | Audited | Blocked by Phase 1 gate |
| 73 | Settings subwidget | Response Limit | Audited | Blocked by Phase 1 gate |
| 74 | Settings subwidget | OpenRouter Routing | Audited | Blocked by Phase 1 gate |
| 75 | Settings subwidget | Scene Backdrops | Audited | Blocked by Phase 1 gate |
| 76 | Settings subwidget | Room Ambience | Audited | Blocked by Phase 1 gate |
| 77 | Settings subwidget | Theme Settings | Audited | Implemented with Theme Library split |
| 78 | Settings subwidget | Story Reading and Layout | Audited | Blocked by Phase 1 gate |
| 79 | Settings subwidget | Story Sound | Audited | Blocked by Phase 1 gate |
| 80 | Settings subwidget | Accessibility Controls | Audited | Blocked by Phase 1 gate |
| 81 | Settings subwidget | Content Preferences | Audited | Blocked by Phase 1 gate |
| 82 | Settings subwidget | Narrator Voice Examples | Audited | Blocked by Phase 1 gate |
| 83 | Settings subwidget | Living World Controls | Audited | Blocked by Phase 1 gate |
| 84 | Settings subwidget | Installed Extensions | Audited | Blocked by Phase 1 gate |
| 85 | Settings subwidget | Install Extension | Audited | Blocked by Phase 1 gate |
| 86 | Settings subwidget | Sonder Updates | Audited | Blocked by Phase 1 gate |
| 87 | Settings subwidget | Checkpoint Storage | Audited | Blocked by Phase 1 gate |
| 88 | Settings subwidget | Memory-search Repair | Audited | Blocked by Phase 1 gate |
| 89 | Settings subwidget | Diagnostics | Audited | Blocked by Phase 1 gate |
| 90 | Settings subwidget | Prompt Preset/Editor | Audited | Blocked by Phase 1 gate |
| 91 | Settings subwidget | Raw Clothing Data | Audited | Blocked by Phase 1 gate |
| 92 | Extensions | Extension Compact/Sidebar Shape | Audited | Blocked by Phase 1 gate |
| 93 | Extensions | Extension Full-workspace Shape | Audited | Blocked by Phase 1 gate |
| 94 | Extensions | Extension Settings Shape | Audited | Blocked by Phase 1 gate |
| 95 | Embedded renderer | Extension Turn Inspector Renderer | Audited | Blocked by Phase 1 gate |

The table now reconciles to 69 fixed Widgets (including all six Settings groups
and all eleven Settings panels), 22 eligible Settings subwidgets, three
top-level extension shapes, and one embedded renderer: 94 top-level Widgets and
95 audited surfaces in total. Coverage identity is normative and will be
mechanically rechecked against `07_WIDGET_INVENTORY.md` and the mockup registry
again before the Phase 1 gate closes.

The Phase 2 column records the gate state at the moment each row was audited.
The completed gate review near the end of this document supersedes those
historical `Blocked` cells.

Host session disposition: **not a Widget**. Signing out is a global destructive
command with no useful persistent placed state. It remains inside its canonical
Settings owner and must not enter the Catalog.

---

# Audited slice: default Settings Panel

## Cross-slice visual evidence

The canonical Settings Panel currently renders six generic modules in a 3 by 2
equal grid at 1264 by 710 px. Each slot is approximately 403 by 303 px. Each
module reports `scrollHeight: 331` inside a 301 px client box, and every primary
action is below the visible clipping boundary:

| Widget | Hidden primary action | Current button size |
|---|---|---:|
| Provider Credentials | Add connection | 83 x 28 px |
| Model Assignments | Review assignments | 103 x 28 px |
| Theme | Open Custom Theme | 105 x 28 px |
| Accessibility | Review changes | 85 x 28 px |
| Maintenance | Run diagnostics | 84 x 28 px |
| Prompt Editor | Review prompt | 80 x 28 px |

The six modules share the same description, tiny categorical chips, three
key/value rows, internal-owner footer, generic `READY` badge, overflow button,
and clipped primary action regardless of purpose. Large empty areas coexist
with unavailable actions because equal rows stretch the decorative body while
the action remains outside it.

Keyboard placement inspection found that Provider Credentials, Model
Assignments, Theme, Maintenance, and Prompt Editor may be placed only on the
Scene stage. Accessibility alone exposes left and right toolbar targets. At a
real 200 px left-toolbar width, Accessibility wraps but remains structurally
visible; at 420 px it leaves most width unused. Its 85 by 28 px primary control
is visible only after toolbar placement and remains below the 44 px target
floor. These findings establish both the clipping defect and the missing
responsive compositions.

The correction is not to squeeze six complete Settings editors back into an
equal grid. The shipped Settings Panel should follow the maintained Settings
contract: one compact group navigator and one selected detail region. Individually
placed Settings Widgets remain useful projections of the same shared owner and
draft; they never create parallel forms or save paths.

## Provider Credentials

**Audit state:** Implemented and accepted

**Purpose:** Connect, test, inspect, edit, and remove model-provider
connections without ever reading a stored secret back into the interface.

### Functional and authority evidence

Main's Settings implementation supports provider kind, display name, base URL,
write-only API key, connection/model test, prompt-cache preference, default
model selection, provider editing, and deletion. The maintained interface adds
a staged `Connect and test` flow, preserves a saved key when the key field is
left blank, and shows connection-specific test results. The server owns stored
connections and secrets; the Widget owns only disclosure, selection, and draft
presentation.

### Current failures

- `OpenAI — Connected`, `Anthropic — Not configured`, and `Local provider —
  Available` are sample status rows, not a connection-management workflow.
- The `READY` badge contradicts `Not configured` and does not identify which
  connections were tested.
- `PROVIDERS` and `CONNECTION REVIEW` look like disabled buttons but perform no
  clear task.
- The write-only secret promise is buried in an engineering footer while the
  real Add action is clipped.
- There is no empty state, add form, test-in-progress state, per-connection
  failure, edit path, delete review, or preserved-key explanation.
- The current definition cannot be placed in either toolbar.

### Overhauled anatomy and behavior

1. **Connection summary:** `3 connections · 2 usable · 1 needs setup`, derived
   from authoritative state. No generic readiness badge.
2. **Connection list:** provider icon, user-assigned name, endpoint qualifier,
   key state (`Key saved` or `No key`), last test result, and an accessible
   overflow menu for Edit, Test, and Remove.
3. **Primary action:** an add icon plus visible `Add connection` label, always
   available in the sticky action edge.
4. **Inline add/edit disclosure:** provider kind, name, endpoint, and blank
   write-only key field with the explicit sentence `Leave blank to keep the
   saved key` when editing.
5. **Connect and test:** the form's primary action. Progress remains inside the
   edited row; success reports the provider and model count; failure names the
   actionable cause without echoing credentials.
6. **Delete review:** names the connection and any roles that depend on it,
   then requires a labeled Remove action.

At 200 px, each connection is a stacked 44 px-or-taller status row; secondary
endpoint detail collapses and Edit/Test/Remove live in the row menu. At 286 px,
key state and last test remain visible. At 420 px, endpoint and separate Test
and Edit icon buttons fit inline. Add/edit may occur in place at 286-420 px; at
200 px a focused sheet provides the form without changing ownership.

### Geometry

| Contract | Value |
|---|---|
| Minimum functional height | 248 px |
| Ideal default height at 286 px | 432 px |
| Maximum in-place height | 620 px; connection list becomes the one scroller |
| 200 px width response | 392 px ideal; add/edit opens a focused sheet |
| 420 px width response | 392 px ideal; inline endpoint and actions reduce wrapping |
| Preferred focused editor | 760 x 640 px or available viewport minus shell insets |

### Catalog miniature

Show two recognizable connection rows, one tested-success mark, one needs-setup
mark, and the add icon. Do not show API-key fields, endpoints, a `READY` badge,
or working row menus in the miniature.

### Phase 2 acceptance

- Add, test, edit-with-blank-key, prompt-cache, and remove-review paths are
  keyboard-operable and backed by one owner.
- No secret appears in DOM text, status copy, logs, screenshots, or exported
  presentation state.
- Empty, testing, success, failed, preserved-key, stale, and remove-review
  states have distinct visual and announced feedback.
- The primary action is visible at default height, targets meet 44 px, and the
  200/286/420 px captures have no clipping or horizontal scroll.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic `READY` skeleton with a provider-health summary, three connection rows, explicit tested/key state, always-visible Add action, toolbar-compatible `medium` shape, the 248/432/620 px height contract, and manifest-backed Connection, Cloud, Key, Test and Edit SVGs. | New ready-surface test failed at 85/86 because the purpose-built surface and toolbar geometry did not exist, then passed at 86/86. | Default Settings Panel and ready-state hierarchy. | The visual pass found Add clipped at the inherited equal-grid height; provider controls were present but not yet staged into working add/edit/test flows. | Refine once. |
| 2 | Corrected the body-height calculation; added a bounded add/edit form, blank-to-preserve write-only key treatment, prompt-cache control, user-initiated in-row test, narrow row menu, remove dependency review, and a pinned Cancel / Connect and test edge. Corrected the preview harness to await and explicitly load its nested vendored fonts. | Focused regressions failed in turn for clipped Add, ready/editor layering, and the scrolled-away submit edge. All Provider tests and the inherited suite then passed at 87/87. | Default Settings ready and Add states; left toolbar at 200, 286 and 420 px; Catalog miniature; keyboard placement; direct Test/Edit/menu affordances. | At the inherited short Settings grid height, the connection list and editor fields correctly become their single internal scrollers; all recovery actions remain visible. No unresolved Widget defect. | Passed and frozen. |

The 200 px capture keeps one 44 px row menu and hides inline Test/Edit; 286 px
keeps key/test status readable; 420 px exposes separate manifest-backed Test
and Edit controls. The Catalog miniature contains only two synthetic status
rows and Add—no endpoints, key field, working menu or generic readiness badge.

## Model Assignments

**Audit state:** Implemented and accepted

**Purpose:** Assign the right provider/model to each Sonder role, understand
inheritance and cost-sensitive choices, and save the assignment set as one
coherent configuration.

### Functional and authority evidence

Main supports provider and model selection per role, a Default/inheritance
path, embedding model selection, sampler settings, ordered backup models, and a
single authoritative save to the agent-model assignment owner. The maintained
interface also exposes reasoning effort and preserves untouched roles and
fallback ordering. A blank specialized role follows Default; the Widget must
not silently materialize a hidden parent assignment.

### Current failures

- Three prose labels (`Primary model`, `Economy model`, `Writing model`) hide
  provider, actual model, inheritance, reasoning, backup, and save state.
- The rows are not controls, so the Widget cannot perform its stated job.
- `ROLE TABLE` and `COST CONTEXT` are inert chips, while the only action is
  clipped.
- The generic `READY` badge does not reveal missing providers, invalid models,
  unsaved changes, or inherited assignments.
- There is no shared dirty state, validation, save failure, fallback ordering,
  or consequence feedback.
- The current definition cannot be placed in either toolbar.

### Overhauled anatomy and behavior

1. **Assignment health:** a concise line such as `11 roles · 7 inherit Default
   · 1 needs attention`, with a dirty indicator only when the shared draft has
   changed.
2. **Default assignment:** pinned first because it controls every blank role.
   It shows connection, model, and reasoning effort.
3. **Role list:** searchable role rows with role purpose, `Follows Default` or
   explicit connection/model, validation mark, and a disclosure affordance.
4. **Role editor:** connection and model comboboxes, explicit `Follow Default`,
   reasoning effort, and a collapsed Advanced section for samplers and ordered
   backup models.
5. **Cost context:** contextual estimate/qualifier adjacent to the changed
   selection when authoritative pricing metadata exists; never an inert chip or
   fabricated dollar value.
6. **Sticky save edge:** `Save assignments`, disabled only when unchanged or
   invalid, plus `Discard changes` in the overflow menu.

At 200 px, roles are stacked cards showing purpose and effective assignment;
editing a role opens focused mode. At 286 px, the selected role expands inline
for provider/model/inheritance while Advanced opens focused mode. At 420 px,
role and effective assignment form two readable columns and reasoning may stay
inline.

### Geometry

| Contract | Value |
|---|---|
| Minimum functional height | 288 px |
| Ideal default height at 286 px | 528 px |
| Maximum in-place height | 680 px; role list becomes the one scroller |
| 200 px width response | 480 px ideal; editing opens focused mode |
| 420 px width response | 480 px ideal; two-column role rows |
| Preferred focused editor | 920 x 720 px or available viewport minus shell insets |

### Catalog miniature

Show a pinned Default row flowing into two specialized role rows, with one
inheritance connector and one explicit assignment. It is a diagrammatic preview
only; model menus and cost values are not interactive in the miniature.

### Phase 2 acceptance

- Default inheritance, explicit override, reasoning effort, Advanced samplers,
  backup ordering, validation, save, and discard use one shared draft.
- Untouched roles and fallbacks survive edits byte-for-byte where the server
  contract requires it.
- Loading, missing provider, unavailable model, inherited, explicit, dirty,
  saving, saved, and failed states are visually and programmatically distinct.
- The effective assignment is understandable at 200 px; the full role path is
  usable at 286 and 420 px; no action is clipped.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic three-row summary with a purpose-built assignment owner: 11 searchable roles, pinned Default, explicit and inherited effective paths, validation state, provider/model/reasoning editor, embedding-role labeling, Advanced samplers, ordered backups, cost-metadata boundary, shared Save/Discard draft, and the 288/528/680 px height contract. Added manifest-backed routing, role-list, and Save SVGs. | The two new behavior tests first failed at 87/89 because the custom surface and editor did not exist, then the complete suite passed at 89/89. | Default Settings ready/editor states; live Scene toolbar at 200, 286, and 420 px; Catalog miniature. | The visual pass found that at 200 px and 288 px high, normal-flow stacked row content could put Edit below the role list's usable viewport. | Refine once. |
| 2 | Compacted only the minimum-width composition: reduced nonessential explanatory chrome, kept the shared-owner boundary as a single truncated line, kept save feedback inline, and pinned each 44 px Edit action beside its complete role path without changing the one-column reading order. | A new minimum-contract regression failed at 89/90 on the too-tall first role row, then all tests passed at 90/90 after the correction. A real Playwright click opened Director from the corrected 200 px toolbar. | Corrected 200 px ready and editor states; 286 and 420 px ready states; default Settings editor; Catalog diagram; disabled, dirty, saving, saved and discard paths. | The short inherited Settings tile and 200 px toolbar intentionally make the role list/editor form the single internal scroller. Critical state, Edit, Done, menu, and Save remain visible. No unresolved Widget defect. | Passed and frozen. |

The 200 px surface now exposes two complete role rows with their effective path
and Edit action at the minimum height. At 286 px, inheritance and validation
stay readable without horizontal overflow; at 420 px, role identity and the
effective assignment separate into columns. The Catalog miniature keeps only
Default and two representative downstream roles, with no working menus or
fabricated cost values.

## Theme Library

**Audit state:** Implemented and accepted

**Purpose:** Compare real semantic theme previews, choose a device-local preset,
and locate Theme Settings without owning any authoring controls or changing
story data.

### Functional and authority evidence

Main provides theme previews and theme selection. Theme Library renders
semantic previews and applies the choice immediately to this device. Theme
Settings separately owns role editing, validation, live preview, material,
ambient and canvas instruments, import, export, reset, and Apply Custom. Both
project one device-local state; invalid draft values cannot replace the last
valid preview or applied theme.

### Current failures

- `Preset — Deep Current`, `Material — Instrument`, and `Custom draft — None`
  are metadata, not a meaningful visual comparison or selection control.
- The Widget gives no indication that theme is device-local and leaves stories
  untouched.
- No preset preview, selected state, instant-apply feedback, custom draft state,
  invalid state, import/export, or reset behavior is represented.
- The real Custom Theme action is clipped while the `PRESETS` and `PREVIEW`
  chips do nothing.
- The current definition cannot be placed in either toolbar.

### Overhauled anatomy and behavior

1. **Current theme line:** selected theme name plus `This device`, with a check
   icon inside the selected preview rather than a generic badge.
2. **Semantic preset previews:** each preview shows canvas, surface, primary
   text, muted text, focus, source, and danger relationships using real theme
   roles; never a decorative color strip alone.
3. **Preset selection:** selecting a preview applies it immediately, announces
   the change, and leaves story content untouched.
4. **Custom theme entry:** a distinct preview tile reports `No custom draft`,
   `Saved`, or `Unsaved`; it applies the saved Custom theme only when one exists.
5. **Theme Settings handoff:** an explicit labeled action locates the separate
   authoring owner. Theme Library contains no color, range, ambient, canvas,
   validation, import, export, reset, or apply controls.

At 200 px, presets are a one-column preview rail with snap-free vertical
scrolling. At 286 px, previews remain one column but expose name and semantic
swatches together. At 420 px, presets form a two-column grid. Authoring never
replaces or discloses inside this Widget; it remains visible in Theme Settings.

### Geometry

| Contract | Value |
|---|---|
| Minimum functional height | 264 px |
| Ideal default height at 286 px | 424 px |
| Maximum in-place height | 576 px; preset rail becomes the one scroller |
| 200 px width response | 448 px ideal for three one-column previews |
| 420 px width response | 384 px ideal for a two-column preview grid |
| Authoring handoff | Theme Settings owner; no embedded editor |

### Catalog miniature

Show three small semantic surface previews with one selected check and a
separate custom-draft tile. The miniature must make the visual nature of the
Widget obvious without functioning as a theme picker.

### Phase 2 acceptance

- Real semantic previews distinguish every preset in normal and high-contrast
  capture; selection applies to this device and does not mutate story state.
- Theme Settings valid, invalid, unsaved, imported, exported, reset, and applied
  states synchronize back without adding a second Library-owned draft.
- The selected preset and Custom entry remain operable by keyboard and touch at
  all qualification widths; the active preview never relies on color alone.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced theme metadata with three real semantic previews plus a distinct Custom tile, device-local current-theme line, non-color selected mark, instant preset application, and the 264/424/576 px height contract. Added the complete Custom owner with seven token roles, live semantic preview, grouped validation, Import, Export, reset review, and `Use this theme`. Added five manifest-backed theme/action SVGs. | Two new tests first failed at 90/92 because the semantic picker and Custom owner did not exist, then the full suite passed at 92/92. Selection was also checked against an unchanged Panel/Story snapshot. | Default Settings ready and Custom states; live Scene toolbar at 200, 286, and 420 px; Catalog miniature; invalid, imported, exported, reset, and applied Custom states. | At 420 px the two-column cards truncated preset names, and merely opening a new Custom editor marked a nonexistent draft Unsaved. | Refine once. |
| 2 | Reflowed each 420 px two-column tile into a vertical semantic sample with its full name beneath it, while retaining the horizontal one-column tile at 200/286 px. Added an untouched `No changes · starts from Deep Current` editor state; Custom becomes Unsaved only after a real edit, import, or reset. | The focused visual-contract test failed at 92/93 for name clipping and premature dirtiness, then all tests passed at 93/93. | Corrected default Settings comparison/editor; final 200, 286, and 420 px toolbar layouts; four-tile Catalog diagram; selected state in normal contrast. | The inherited short Settings tile intentionally scrolls its preset region/editor roles while the current theme, validation, recovery actions, and device boundary remain pinned. No unresolved Widget defect. | Passed and frozen. |
| 3 | Split the former hybrid into Theme Library and Theme Settings, assigned distinct Settings owners, mounted both by default in Appearance and Accessibility, removed the default Scene copy, and replaced their private state with one observable device theme document. Library now contains preset selection plus a Settings handoff only. Settings owns six colors, four material controls, ambient light, canvas/gradient, validation, import/export, reviewed reset, and Apply Custom. Catalog placement gained real before/after shelf targets so the removed Scene shelf does not reduce placement capability. | Four split-contract tests first failed on the hybrid surface, then passed with shared preset-to-editor state, live valid previews, invalid-draft containment, and applied Custom synchronization. Legacy Scene/owner/Catalog/docking assertions were revised to the approved boundary. | Appearance and Accessibility defaults; Scene without a Theme duplicate; 200 and 420 px Theme Library; full 420 and 720 px Theme Settings; inert Catalog previews; catalog-to-toolbar placement. | Theme state remains mockup-local rather than server-persisted, which is correct for this working interaction candidate. | Passed in the current candidate harness. |

At 200 and 286 px, each preset keeps its semantic sample beside a full name and
plain-language character. At 420 px, the same presets form a two-column grid
with the sample above the untruncated name. The Catalog miniature shows all
three presets and Custom as semantic mini-surfaces; none of its tiles operate.

## Accessibility

**Audit state:** Implemented and accepted

**Purpose:** Adjust contrast, motion, scale, focus, and reading assistance for
this device with immediate, reversible feedback.

### Functional and authority evidence

The maintained experience owner provides accessibility modes and toggles,
including contrast, text scale, motion, focus, and reading behavior, with
immediate device-local application and an explicit reset/review path. These
controls share the canonical Experience draft; a separately placed Widget is a
projection of that owner, not another preference store.

### Current failures

- `Contrast — Standard`, `Text scale — 100%`, and `Reduced motion — System` are
  read-only summaries; the stated configuration task is impossible.
- Vision, Motion, and Focus appear as tiny disabled chips rather than usable
  groups or filters.
- Current versus inherited-from-system behavior is not explained, and there is
  no preview or reset consequence.
- The generic `READY` badge adds no accessibility meaning.
- The primary action is clipped in the equal grid and measures only 85 by 28
  px when toolbar placement makes it visible.
- At 200 px the existing labels wrap acceptably, but at 420 px the same narrow
  content leaves most of the module empty; this is reflow, not adaptation.

### Overhauled anatomy and behavior

1. **Immediate controls:** 44 px-or-taller rows for contrast mode, text scale,
   reduced motion, focus visibility, reading support, and any other settings
   actually owned by the Experience service.
2. **Current source:** each system-following value says `Uses system setting`;
   an explicit value says `Set for Sonder on this device`.
3. **Live sample:** a compact prose/control sample reflects text scale,
   contrast, focus, and motion changes without flashing or autoplay.
4. **Category navigation:** Vision, Motion, Focus, and Reading are real
   accessible filters only when the list requires them; otherwise use plain
   section headings rather than chip theater.
5. **Sticky actions:** immediate settings do not need a fake Review action.
   `Reset accessibility settings` opens a consequence review and restores the
   previous focus after cancellation or completion.

At 200 px, all rows stack with the control beneath the label only when needed;
the live sample follows the controls. At 286 px, labels and compact controls
share a row. At 420 px, related rows form two balanced columns while the live
sample spans the Widget. Reading order remains row-major and logical.

### Geometry

| Contract | Value |
|---|---|
| Minimum functional height | 312 px |
| Ideal default height at 286 px | 488 px |
| Maximum in-place height | 640 px; settings list becomes the one scroller |
| 200 px width response | 560 px ideal because controls stack |
| 420 px width response | 424 px ideal using two balanced columns |
| Preferred focused editor | 760 x 640 px or available viewport minus shell insets |

### Catalog miniature

Show a real high-contrast toggle row, a three-step text-scale control, and a
visible keyboard-focus sample. Do not animate the miniature or present a
working reset control.

### Phase 2 acceptance

- Each exposed setting changes the live sample and workbench immediately while
  remaining device-local and reversible.
- System-derived and explicit values, reset review, reset success, and apply
  failure are distinct and announced.
- Keyboard, touch, 200% zoom, reduced-motion, and high-contrast checks pass at
  200/286/420 px with 44 px targets and no clipped labels or controls.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic summary and fake Review action with five immediate device controls for contrast, text scale, reduced motion, focus visibility, and reading support; distinct system/explicit source copy; an immediate workbench and prose/focus sample; a pinned status/reset edge; and a bounded reset consequence review that restores focus. Established the 312/488/640 px base height contract and used the existing manifest-backed Contrast, Selected, Information, Plus, Minus, Close, and Reset SVG vocabulary. | Two new acceptance tests first failed at 93/95 because no purpose-built surface existed. After implementation and correction of a detached measurement fixture, all tests passed at 95/95, including immediate workbench application, reset/cancel focus, 44 px targets, and 200/420 px reflow. | Default Settings ready state; first live Scene toolbar placement; reset review; initial 200, 286, and 420 px responsive states. | The first toolbar visual opened the new shelf at the shell's generic 220 px basis, revealing only Contrast and part of Text Scale despite the Widget's 488 px ideal contract. | Refine once. |
| 2 | Made new and rehydrated toolbar shelves honor audited per-Widget height contracts without overriding a user's explicit splitter resize. Accessibility now selects 560 px at the 200 px toolbar minimum, 488 px at the regular width, and 464 px at 420 px for the finalized responsive composition. The wide two-column composition keeps its full live sample visible without an inner scroll, and plain Contrast labels were replaced with manifest-backed Selected/Contrast icons plus accessible text. | The shelf-height test failed at 95/96 on the inherited 262 px shelf, then failed again when requested 200 px width was incorrectly inferred from a constrained rendered width. The corrected requested-width contract and final wide/icon assertions passed with the full suite at 96/96. The later responsive audit raised the wide ideal by 40 px rather than compressing required content. | Final live Scene toolbar at 200, approximately 286, and 420 px; wide no-scroll sample; narrow single-scroller reachability; reset review; default Settings composition; inert Catalog miniature with icon-led contrast, scale stepper, and focus sample. | At 200 and regular narrow widths, controls and the sample use one intentional inner scroller while current state and Reset remain pinned. At 420 px the entire two-column control set and sample fit without that scroll. No unresolved Widget defect. | Passed and frozen. |

The Widget now distinguishes `Uses system setting` from `Set for Sonder on
this device`, changes both its synthetic sample and the workbench immediately,
and returns contrast, scale, motion, focus, and reading support to defaults only
after a focused consequence review. Its Catalog miniature is inert and contains
no reset or fabricated preference state.

## Maintenance

**Audit state:** Implemented and accepted under the responsive semantic-utility contract

**Purpose:** Understand host health and safely perform updates, checkpoint
storage work, memory-search repair, diagnostics export, and sign-out review
without confusing observation with mutation.

### Functional and authority evidence

The maintained Maintenance owner checks for Sonder updates, blocks unsafe
installation over a dirty checkout, stages an install with a restart
consequence, reports and converts checkpoint storage, reports and rebuilds
memory-search embeddings with provider-cost disclosure, prepares bounded
redacted diagnostics, and owns host-session sign-out review. Main supplies the
underlying update, checkpoint, memory, and diagnostics routes. Long-running
tasks have one owner and one polling lifecycle.

### Current failures

- `Database — Healthy` and `Last backup — Today` do not represent the actual
  maintenance domains or their actionable states.
- `Host session — Full panel section · not detachable` is internal design
  disposition presented as user status.
- `UPDATES`, `STORAGE`, `REPAIR`, and `HOST SESSION` are inert miniature tags.
- The generic `READY` badge masks update availability, dirty-checkout blocks,
  migrations, paid rebuild consequences, or diagnostics failure.
- The only visible intended action is clipped, while the potentially costly or
  destructive operations have no review staging.
- The current definition cannot be placed in either toolbar.

### Overhauled anatomy and behavior

1. **Maintenance instruments:** Updates, Checkpoint storage, Memory search, and
   Diagnostics are distinct status/action sections with real state icons and a
   one-line last-known result.
2. **One expanded task:** the section selected by the user expands to its
   details and next valid action; other sections remain compact. This prevents
   four dashboards from competing in a narrow dock.
3. **Updates:** current revision, check progress, available revision summary,
   dirty-checkout block, review, install progress, and explicit restart result.
4. **Checkpoint storage:** current format/health, conversion scope, progress,
   failure recovery, and review before conversion.
5. **Memory search:** current index/provider status, scope, estimated provider
   consequence when authoritative, rebuild review, progress, and result.
6. **Diagnostics:** preview the bounded redacted categories, then use labeled
   `Export diagnostics`; do not expose secrets or silently copy raw state.
7. **Host session:** a footer link opens the canonical sign-out review. It is
   not a detachable subwidget or a normal maintenance health row.

At 200 px, instruments are single-column accordions and only one task expands;
long operations switch that section into a stable progress view. At 286 px,
status and next action share each collapsed row. At 420 px, collapsed
instruments form a two-column overview while the active task spans the width.

### Geometry

| Contract | Value |
|---|---|
| Minimum functional height | 304 px |
| Ideal default height at 286 px | 552 px |
| Maximum in-place height | 720 px; active task body becomes the one scroller |
| 200 px width response | 600 px ideal; one task expanded |
| 420 px width response | 504 px ideal; two-column overview plus full-width task |
| Preferred focused editor | 860 x 700 px or available viewport minus shell insets |

### Catalog miniature

Show four instrument rows with distinct truthful example states: current,
update available, review required, and healthy. Include no working install,
rebuild, export, or sign-out control.

### Phase 2 acceptance

- Update, dirty-checkout, install/restart, checkpoint conversion, memory rebuild,
  redacted diagnostics export, and sign-out review preserve their existing
  server owners and consequences.
- One long task owns polling and cancellation; remounting a projection does not
  start a duplicate operation.
- Current, checking, available, blocked, reviewing, running, completed, failed,
  and stale states are visually and programmatically distinct.
- All next actions remain visible at their ideal heights, and every review flow
  works at 200/286/420 px without document overflow.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic database/backup summary with four distinct instruments—Updates, Checkpoint storage, Memory search, and Diagnostics—sharing one visible action lease and one expanded task. Added safe update checking and restart staging, checkpoint conversion review and task settlement, embeddings-provider cost disclosure before rebuild, bounded redacted diagnostics export, and a separate protected host-session sign-out review. Established the 304/552/720 px base contract plus 600 px narrow and 504 px wide ideals using manifest-backed Settings, Clock, Database, Search, Checklist, Export, Close, Information, and Selected SVGs. | Two new tests first failed at 96/98 because Maintenance was still a wide generic skeleton. The purpose-built behavior passed; the inherited blueprint gate then correctly required the preserved `Host session · Full panel section · not detachable` provenance row. With that row restored, all tests passed at 98/98. | Default Settings ready state; live 200, regular, and 420 px toolbar placements; checkpoint conversion review; memory rebuild review and cost copy; initial Catalog miniature. | The 286 px owner summary competed with its explanatory note, the 200 px meta chip clipped the Widget title, and the 420 px collapsed cards clipped Checkpoint storage and Memory search. | Refine once. |
| 2 | Reflowed the regular-width overview into a readable single column, reduced the 200 px header meta to its manifest icon so `Maintenance` stays intact, and staged collapsed 420 px instruments as icon/title/summary plus a second-line state while the active instrument continues to span both columns. No task, lease, or authority behavior changed. | New responsive visual assertions first failed at 97/98 on the truncated one-action-lease summary, then the full suite passed at 98/98 after all three responsive corrections. | Final 200 px full-instrument overview; regular-width Updates and both consequence reviews; 420 px Updates and Memory-search expanded states with untruncated collapsed titles; default Settings tile; inert four-state Catalog miniature. | The inherited short Settings tile intentionally gives the four instruments one scroller while the lease receipt and host-session review stay pinned. At each audited toolbar ideal, every instrument and next action is reachable and the 420 px overview fits without title clipping. No unresolved Widget defect. | Passed and frozen. |

The ready Widget now separates observation from mutation: each instrument names
its last-known evidence and next valid action, only a confirmed long task owns
the lease, diagnostics explicitly redact credentials, and sign out remains a
protected host-session destination rather than a fifth detachable instrument.

## Prompt Editor

**Audit state:** Audited

**Purpose:** Inspect, create, import, edit, validate, save, select, export, and
remove prompt presets without losing long drafts or pretending that a three-row
summary is an editor.

### Functional and authority evidence

The maintained Prompt owner selects presets, keeps the built-in Default preset
read-only, edits a preset name and language plus one long textarea per prompt
sheet, saves and activates a selected preset, imports, exports, and reviews
deletion. Server confirmation owns persistence and active selection. A placed
projection must share the same draft and conflict handling as the canonical
owner.

### Current failures

- `Role — Narration`, `Preset — Sonder default`, and `Draft — No changes` show
  only one sample row each and provide no inspection or editing surface.
- `PRESET RAIL`, `EDITOR`, and `DIFF` are inert chips that imply modes without
  navigation or content.
- There is no prompt-sheet list, search, long-form editor, line/dirty status,
  validation, default read-only treatment, import/export, save/use distinction,
  delete review, or draft recovery.
- The generic `READY` badge can conflict with unsaved or invalid prompt text.
- The primary action is clipped, and the current definition cannot be placed in
  either toolbar.

### Overhauled anatomy and behavior

1. **Preset rail:** active check, built-in lock, dirty indicator, Add, Import,
   Export, and reviewed Delete where allowed.
2. **Prompt-sheet navigator:** searchable list of named sheets with missing,
   changed, and validation marks. It is the useful dock projection at compact
   widths.
3. **Editor header:** preset, selected sheet, language, read-only/dirty state,
   and an icon-plus-label `Open focused editor` action.
4. **Long-form editor:** one textarea/code region for the selected sheet with a
   persistent label, logical line wrapping, accessible error references, and
   draft preservation through remounts and failed saves.
5. **Diff:** a real `Changes` view comparing the shared draft to its authoritative
   base; it appears only when changed and never replaces the editable draft.
6. **Sticky actions:** `Save preset` persists the draft; `Use selected preset`
   activates it. The separate consequences remain explicit. Delete always uses
   a named review step; Default cannot be deleted or overwritten.

At 200 px, show preset selection, prompt-sheet search/list, dirty state, and
`Open focused editor`; do not squeeze a long textarea into the rail. At 286 px,
the selected sheet may expose a compact editable excerpt plus the focused action
when at least 10 readable lines remain. At 420 px, the sheet rail and editor may
form a 120 px/content split with the editor retaining the dominant measure.
Focused mode is the canonical complete authoring composition at every width.

### Geometry

| Contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 624 px |
| Maximum in-place height | 760 px; sheet list and editor have deliberate independent axes only in the wide split |
| 200 px width response | 440 px ideal for navigator projection; editor opens focused |
| 420 px width response | 680 px ideal for split authoring |
| Preferred focused editor | 960 x 740 px or available viewport minus shell insets |

### Catalog miniature

Show a narrow preset rail, three prompt-sheet rows, and a read-only text texture
with one changed-line marker. Do not render real prompt content or a working
textarea in the miniature.

### Phase 2 acceptance

- Default read-only behavior, preset creation, selection, sheet navigation,
  long editing, validation, save, activate, import, export, diff, delete review,
  save failure, and draft recovery share one owner.
- A failed or stale save never discards the draft; conflict feedback names the
  safe next action.
- The 200 px projection is useful without pretending to be the complete editor;
  286 and 420 px states and focused mode preserve readable lines, visible sticky
  actions, keyboard order, and one intentional scroll architecture.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic three-row skeleton with a purpose-built Prompt Editor: shared preset owner, locked built-in Default, Add/Import/Export/reviewed Delete, searchable four-sheet navigator, real long-form textarea, validation, Changes comparison, separate Save and Use actions, draft recovery across projections, and a focused-editor mode. Established the 320/624/760 px base height contract plus 440 px narrow and 680 px wide ideals using only manifest-backed Settings, Add, Import, Export, Delete, Edit, Search, Save, Selected, Clock, Information, and Close SVGs. | Two new tests first failed at 98/100 on the inherited wide-only skeleton. The full workflow then passed, leaving only a measured 43.99 px primary-control height and the same narrow Focus target shortfall. | Default Settings composition; initial 200/286/420 responsive structures; built-in read-only and custom dirty/invalid/saved/active states; Changes view; delete review; first focused editor; initial Catalog miniature. | Fractional layout rounding put 44 px targets at 43.99 px. The focused module remained contained by its transformed Settings ancestor, producing a small translucent tile instead of the 960 x 740 authoring workspace. At 200 px the Saved chip competed with the title. | Refine once. |
| 2 | Raised primary targets above the rounding boundary, reparents focused mode to the workbench root and restores its exact origin on close, made the focused surface opaque and six-column, and reduced the 200 px header state to its icon so `Prompt Editor` retains priority. Behavior and ownership did not change. | Diagnostic assertions named the 43.99 px measurements before correction. The final suite passed at 100/100, including shared draft propagation, validation, async save settlement, activation, export feedback, delete cancellation focus, confirmed deletion, 200 px navigator-only reflow, and 420 px split authoring. | Final live Settings tile; real Scene toolbar placements at 200, 230, and 420 px; 960 x 740 focused editor; inert Catalog miniature with one preset and three sheet rows. | The narrow projection deliberately omits the textarea and keeps Add/Import/Export/Delete/Focus plus sheet navigation; the focused editor owns complete authoring. At 420 px the dock shelf may extend below a short viewport and uses the toolbar's intentional outer scroll rather than compressing the editor. No unresolved Widget defect. | Passed and frozen. |

The ready Widget now makes prompt ownership legible: built-in material cannot be
overwritten, custom edits survive across projections, invalid sheets block
Save, saving a preset does not activate it, and narrow docks remain useful
navigation instruments rather than unusable shrunken text editors.

---

# Audited slice: Story Widgets

## Cross-slice visual and placement evidence

Transcript and Composer are the only Story Widgets currently rendered as
purpose-specific stage surfaces. The other ten use either the generic module
template or a thin status list. The Catalog repeats the same working markup at
miniature scale, so it reads as a shrunken control surface rather than a visual
preview.

The current registry assigns Transcript, Composer, Live Technical Detail, Turn
Versions, Turn Inspector, and Scene Backdrop a two-column minimum. In the
mockup's compatibility logic that prevents all six from entering either
toolbar and also prevents the three wide workspaces from entering the shipped
Focus + support and Columns layouts, whose slots report only one column. Their
only successful added placement is a 52%-wide, 48%-high floating module over
the Scene stage. That module obscures prose and still renders only three status
rows. This is neither a useful dock projection nor a complete focused editor.

Story and Frame Context, Turn Progress, Player Condition, Cast Condition, Room
Ambience, and Background Work do enter the toolbars. Real 200 and 420 px
captures show that the markup merely stretches: long values collide at 200 px,
while a single row consumes a full 420 px line. The enclosing shelf height is
shared with its neighbor rather than chosen from the Widget's content, leaving
large dead regions. Buttons remain 28 px high.

The common state preview replaces the Widget body with generic Ready, Loading,
Empty, Unavailable, Access denied, Refresh available, Offline, and Could not
refresh overlays. It omits domain states such as Waiting for a turn, Stopping,
Rerolling with the prior version retained, Audio locked, or Generation pending.
Worse, choosing Loading prevents the Widget action menu from reopening, so the
user cannot restore Ready, move, or remove the previewed Widget. Removing a
dominant Widget from a custom Panel also fails to restore its placement slot.
Both are Phase 2 shell defects, but the corrected domain states below remain
Widget-specific.

## Transcript

**Audit state:** Audited

**Functional floor:** Main renders the active frame's full turn stream,
distinguishes player input from narration, colors committed speech safely,
marks stale and superseded prose, selects a visible turn, exposes edit/branch/
reroll/delete operations with eligibility, browses newest-turn narration
variants, shows a safe streaming preview, restores scroll, and publishes the
visible turn to Backdrop and Ambience. Server turns and mutations remain
authoritative.

**Current failures:** the default stage is visually strong but contains only a
single static sample. It has no selected-turn treatment, older/newer navigation,
version affordance, new-prose notice, stale/streaming/error state, or contextual
turn actions. The Catalog reproduces the prose block verbatim. The registry
rejects all toolbar placement, and the calibration Focus mode is not a focused
Transcript workflow.

**Overhaul:** preserve the unboxed literary stage and 650-680 px prose measure.
Give each selected turn a quiet leading marker, state line only when needed,
newest-turn version arrows, and one labeled Turn actions menu. Add a `New turn`
return affordance when the reader is reviewing history. The dock projection is
a compact chronological reader: current/selected turn identity, the player
action, a 6-10 line prose excerpt, previous/next turn icon controls, state, and
`Open reading stage`. It never reflows the canonical stage or owns a second
turn selection.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 560 px |
| Maximum in-place height | 760 px; turn stream is the one scroller |
| 200 / 420 px response | 624 px for readable stacked context / 520 px with longer excerpt |
| Dominant treatment | Fill available story stage; prose measure remains 650-680 px |

**Catalog and acceptance:** the miniature shows two literary turns, a selected
marker, and a variant indicator without real story text or working controls.
Phase 2 must prove long history, streaming-to-authoritative replacement,
selected/visible-turn publication, stale/superseded/error states, variants and
safe mutations, scroll restoration, 200/286/420 dock projection, phone/short
height, and zero prose reflow when atmosphere or surrounding Widgets change.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the single static prose sample with one shared turn-stream owner and two intentional projections: the canonical unboxed literary stage and a compact dock reader. Added three committed/superseded turns, distinct player action and narration surfaces, selected/visible-turn publication, Previous/Next/New turn navigation, variant identity, safe Edit/Branch/Reroll/Delete actions, reroll streaming with prior narration retained until authoritative replacement, reviewed deletion, and scroll restoration. Established the 320/560/760 px base contract plus 624 px narrow and 520 px wide ideals. Added manifest-backed Arrow Left and Arrow Right SVGs for chronological navigation. | Two new tests first failed at 100/102 on the inherited stage-only definition and missing dock reader. The purpose-built workflow passed; one older Catalog test then correctly rejected its legacy `.sonder-transcript` selector until the expected actual UI was updated to the new reader excerpt. The full suite passed at 102/102. | Default literary stage; newest and historical selection; reroll pending and committed Variant 2; turn-action menu and delete review; initial 200/286/420 reader fixtures; initial Catalog miniature. | The selected stage turn still read as a translucent card instead of a quiet literary marker, stage navigation exposed wide text buttons, and the Catalog miniature reduced history to one prose block rather than two distinguishable turns. | Refine once. |
| 2 | Removed the selected-turn fill while retaining its leading rule, made stage and dock Previous/Next controls icon-led, formalized the six-part stage control row, and rebuilt the inert miniature as two abstract literary turns with a selected marker and variant identity. No selection, mutation, or server-authority behavior changed. | New assertions preserve the unboxed selected treatment, 45 px icon controls, and two-turn miniature. The final suite passed at 102/102, including shared dock/stage selection, visible-turn publication, reroll replacement with prior variant retention, 200 px stacked readability, 420 px longer excerpt, and canonical-stage navigation. | Final Scene stage; final Catalog miniature; live six-, four-, and three-column containers approximating 200, 286, and 420 px; short-height outer-scroll behavior; active/historical reader states. | Historical prose is intentionally quieter until selected, and a short viewport scrolls the single chronological stream or containing toolbar rather than compressing prose. The dock reader never exposes turn mutation controls. No unresolved Widget defect. | Passed and frozen. |

Transcript now has one visible-turn owner: selecting history updates the stage,
dock reader, Backdrop, and Ambience publication together; rerolling never hides
the committed version; and the narrow reader remains a useful chronological
instrument without duplicating the literary stage.

## Composer

**Audit state:** Audited

**Functional floor:** Main owns the player draft, Enter versus Shift+Enter,
continue/send, current perspective, generation lock, stop, retry, and draft
retention while the server owns accepted input and run lifecycle.

**Current failures:** the stage shows placeholder text rather than an editable
control, `Perspective: Aven` is inert, and Continue is an oversized isolated
rectangle. It has no multiline expansion, draft/queued/sending/stopping/error
state, Stop action, retry, or accessibility feedback. The Catalog miniature is
indistinguishable from the nominal working surface, and the two-column minimum
blocks both toolbars.

**Overhaul:** use a labeled autosizing textarea, explicit perspective selector
when more than one authorized Persona exists, concise key hint, draft status,
and one stateful primary action: Continue/Send while idle, Stop while running,
Retry after a retryable failure. Preserve the draft through navigation,
remount, failed submission, and Stop. At 200 px, stack perspective, textarea,
and a full-width labeled action. At 286 px, keep the action edge visible beside
or beneath at least four text lines. At 420 px, perspective and secondary draft
status share one row while the textarea retains the width.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 176 px |
| Ideal default height at 286 px | 232 px |
| Maximum in-place height | 368 px before textarea scrolling |
| 200 / 420 px response | 288 px stacked / 208 px wide |
| Dominant treatment | Stable strip under Transcript, growing upward without moving shell controls |

**Catalog and acceptance:** the miniature shows a short input texture,
perspective mark, and Send affordance but is never focusable as an editor.
Phase 2 must prove draft restoration, composition keys, IME-safe submission,
perspective, send/continue/stop/retry, double-submit prevention, running-state
announcements, 44 px actions, all dock widths, phone keyboard staging, and no
hidden duplicate input.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the placeholder field with one shared recoverable player draft projected into the canonical Scene strip and an optional dock editor. Added a real autosizing textarea, Aven/Mara perspective selector, explicit Enter and Shift+Enter handling, IME submission guard, Continue/Send/Stop/Stopping/Retry lifecycle, one generation lease, draft retention through Stop and retryable error, and server-owned completion settlement. Established the 176/232/368 px base contract plus 288 px narrow and 208 px wide ideals. The Catalog miniature uses inert input texture and the manifest-backed Next icon rather than a working field. | Two new tests first failed at 102/104 on toolbar rejection and the missing dock projection. The first workflow passed immediately. The second exposed a test-fixture isolation assumption, then real 43.99 px perspective rounding and a 63.99 px wide textarea; after the fixture shared a draft inside one document and the physical floors were raised above rounding, the suite passed at 104/104. | Live idle Scene strip; multiline draft; running, stopping, stopped, retryable error, and retry states; first 200/286/420 responsive fixtures; initial inert Catalog miniature. | The taller functional strip overlapped Transcript's legacy 102 px bottom inset. Its primary action stretched through the full strip height. In a tall 420 px container, the wide grid stretched perspective and Continue vertically through spare space. | Refine once. |
| 2 | Moved Transcript above the Composer's true idle height, constrained the stage primary action to a 45 px instrument, and made the wide dock grid content-sized: 45 px perspective, 65 px textarea, and 65 px action with spare height left neutral. Narrow mode keeps its status and full-width primary action pinned. No draft or lifecycle behavior changed. | Added non-overlap, compact stage-action, and non-stretching wide-control assertions. The final suite passed at 104/104, including Shift+Enter, IME safety, Stop retention, explicit Retry, shared stage/dock draft, one input on the Scene, 200 px full-width action, and 420 px writing measure. | Final Scene transcript/composer composition; live six-column approximately 200 px reader; live three-column approximately 420 px reader; regular fixture; Catalog miniature; short/tall container behavior. | In a column slot taller than the ideal contract, narrow Composer intentionally leaves neutral space between the retained draft and pinned action rather than expanding the textarea beyond 116 px. No unresolved Widget defect. | Passed and frozen. |

Composer now tells the truth about both sides of its ownership boundary: the
client retains the editable draft and perspective, while accepted input and
generation state remain server-owned. Every projection edits the same draft,
and stopping or retrying never silently clears it.

## Story and Frame Context

**Audit state:** Audited

**Functional floor:** this projection follows the one active Story, Present
frame, and Transcript-published visible turn. It may open the canonical frame
owner but must not become a second Story picker or persist a Story id in Panel
state.

**Current failures:** the placed Widget spends most of its shelf on a purpose
sentence, inert `Story identity`/`Frame identity` chips, three generic rows, and
an internal persistence footer. `Open frame` is clipped at common shelf heights
and only 28 px tall. At 200 px the long frame value crowds its label; at 420 px
the same sparse row stretches across the full dock.

**Overhaul:** lead with the Story title and a small active-story mark, then the
Present frame name, frame-relative time/era where available, and visible-turn
location in one compact orientation block. Use distinct frame and visible-turn
icons from the manifest, not ornamental category glyphs. A labeled `Open
frame` action reaches the canonical owner; previous/next visible-turn controls
appear only when this projection is configured for reading navigation and
delegate to Transcript selection.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 184 px |
| Ideal default height at 286 px | 248 px |
| Maximum in-place height | 328 px |
| 200 / 420 px response | 288 px stacked / 224 px two-column context |

**Catalog and acceptance:** the miniature shows a Story title, frame chip, and
turn marker as a context diagram. Acceptance requires live Story/frame/turn
changes without remount drift, no persisted Story id, correct no-story and
single-frame states, canonical owner navigation, visible action at every width,
and no duplicate Story selection authority.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic purpose/region/ledger skeleton with one live orientation projection: active Story title and mark, Present frame plus relative time/era, Transcript-published visible turn and variant identity, a labeled canonical `Open frame` handoff, optional Previous/Next controls that delegate to Transcript, and explicit active, single-frame, and no-story states. No Story picker or Story identity was added to Panel persistence. Established the 184/248/328 px base contract plus a 320 px narrow ideal after the shared legibility correction and a 224 px wide ideal. Added manifest-backed Double Window and Bookmark SVGs for frame and visible-turn identity. | Two new tests first failed at 104/106 because the generic renderer and audited geometry did not exist. After the purpose-built module landed and stale generic assertions were brought forward to the compact authority line, the suite passed at 106/106. Coverage includes live Story/frame mutation without remount, Transcript selection publication, canonical-owner event detail, no Story id in Panel state, no-story and single-frame behavior, optional reading navigation, 44 px controls, and 200/420 px reflow. | First live 286 px left-toolbar placement; live 200 px stacked and 420 px two-column placements; selected-history update; first Catalog context diagram. | Author CSS overrode the native hidden attribute, leaving mutually exclusive Open Library visible beside Open frame. The full Widget name clipped at 200 and 286 px. Frame-era metadata relied on an implicit grid row. | Refine once. |
| 2 | Added an explicit hidden-action rule, a compact `Story Context` toolbar identity below 320 px while retaining the full name at 420 px and in the Catalog, and explicit three-row containment for frame/turn metadata. The active and no-story routes now expose exactly one safe owner action. At minimum width, familiar Previous/Next controls are icon-only with accessible names and tooltips, while the canonical owner action remains pinned below a locally scrollable orientation region. | New computed-style assertions first returned 104/106 on the visible inactive action and missing compact identity. After correction and restoration of an accidentally touched Transcript header during the refactor, the complete suite passed at 106/106. A final containment assertion and the cross-Widget legibility audit preserve all geometry and behavior at the corrected 320 px narrow ideal. | Final 286 px ideal placement; final 200 px placement while Transcript history selected Turn 41; final 420 px two-column placement at newest Turn 42; final inert Catalog miniature. No-story and single-frame DOM states were also checked in the focused browser workflow. | At tall shelf allocations above the 320 px narrow ideal, the projection intentionally leaves a quiet region between context and its one owner action rather than stretching the instruments. No unresolved Widget defect. | Passed and frozen. |

Story and Frame Context is now a projection, not a competing owner. Story,
Frames, and Transcript remain authoritative; the Widget follows their live
identity, hands frame work back to `systems.frames`, and stores no Story id in
Panel state.

## Turn Progress

**Audit state:** Audited

**Functional floor:** Main exposes accepted generation, named pipeline phases,
elapsed time, completion, cancellation/Stop, retry/resume where eligible, and
stale run rejection. It deliberately does not invent percent completion.

**Current failures:** three static rows say Stage, Completed, and Next but omit
elapsed time, run state, phase chronology, Stop/Retry, waiting/idle, and failure.
At 200 px `Interpretation · Director` collides with its label; at 420 px the
same three rows waste the shelf. The generic Loading overlay hides useful last
known progress and traps the Widget action menu.

**Overhaul:** render a compact named phase rail with completed steps, one active
step and elapsed time, and the next phase only when known. Show `Waiting for
first event`, running, stopping, retryable failure, completed, and no-active-run
as domain states. Stop is labeled and visible only while the accepted run is
cancellable; Retry/Resume names the stage it will restart. Do not show a fake
bar or percent.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 176 px |
| Ideal default height at 286 px | 264 px |
| Maximum in-place height | 352 px |
| 200 / 420 px response | 312 px stacked phases / 232 px horizontal rail |

**Catalog and acceptance:** the miniature shows three named phase marks with
one active pulse disabled under reduced motion. Acceptance requires idle,
accepted/no-event, each named phase, stopping, retryable/nonretryable failure,
complete and stale-result states; truthful elapsed time; Stop/Retry ownership;
unmount survival; and collision-free 200/286/420 captures.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the static Stage/Completed/Next rows with a six-phase Main-derived rail: Reading what you did, surroundings, character response, resolution, writing, and saving. Added one full current-phase callout, owner-reported elapsed time, completed/active/pending/failed marks, honest idle and accepted/no-event states, Stop/Stopping/Stopped settlement, pre-acceptance Retry, post-acceptance failure without a false Retry, complete and stale-result states, and one shared run owner across projections. No percentage or progressbar exists. Established the 176/264/352 px base contract plus 312 px narrow and 232 px wide ideals. Reused the manifest-backed Clock, Selected, Information, Close, and Reset icon vocabulary. | Two new tests first failed at 106/108 because the generic renderer and audited geometry did not exist. The first implementation passed the complete suite at 108/108, including all domain states, stop settlement, retry eligibility, six named phases, elapsed time, absence of percentage semantics, 44 px actions, 200 px vertical and 420 px horizontal rails, and inert three-mark miniature. A final fresh run after adding test-only state URL selection also passed at 108/108. | Live 286 px running placement; live 200 px vertical rail; live 420 px horizontal rail; retryable pre-acceptance failure and Retry action; filtered Catalog miniature. Idle, accepted/no-event, stopping, stopped, nonretryable failure, complete, and stale rejection were exercised in the focused browser suite. | Header state text intentionally collapses to its manifest icon where the 200/286 px title and action menu consume the row; the full current state remains the first body instrument and is announced. No unresolved Widget defect. | Passed and frozen; no second cycle required. |

Turn Progress now reports the runtime it actually receives. It names the phase,
elapsed time, and eligible next action while leaving raw event detail to Live
Technical Detail and refusing to imply a percentage the pipeline cannot know.

## Live Technical Detail

**Audit state:** Audited

**Functional floor:** Main's optional technical detail records bounded current-
run stage events and model activity, follows the exact active run, supports
autoscroll pause, and remains host-visible operational evidence that never
enters character cognition. It complements rather than duplicates Turn
Progress and the saved Turn Inspector.

**Current failures:** `8 recent`, `3 complete · 1 active`, and `18.4 s` are a
summary, not live technical detail. There is no event stream, timestamp, role,
stage, result, duration, filtering, autoscroll behavior, bounded retention, or
empty/failed event treatment. `Pause autoscroll` is clipped in some placements.
Its two-column minimum makes it impossible to place in any custom Focus +
support or Columns slot and in either toolbar; only a prose-obscuring floating
Scene module works.

**Overhaul:** the complete focused owner uses a chronological virtualized event
stream with timestamp, stage/role, concise event, duration/token/cost metadata
only when authoritative, severity filter, model-activity filter, and a sticky
Pause/Follow latest control. A selected event opens bounded details with safe
copy/export only where the existing diagnostics policy allows it. The dock
projection shows active run, current technical event, model calls, elapsed,
warning/failure count, Pause/Follow, and `Open technical detail`.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 560 px |
| Maximum in-place height | 720 px; event stream is the one scroller |
| 200 / 420 px response | 384 px summary projection / 520 px six-column event rows |
| Preferred focused editor | 920 x 700 px or available viewport minus shell insets |

**Catalog and acceptance:** the miniature shows a bounded event trace and two
model-call marks, with no real prompt or payload. Acceptance requires exact-run
binding, bounded retention, Follow/Pause, late-event/stale-run rejection,
host-only visibility, failure and offline behavior, focused and compact
projections, and proof that no technical payload reaches fiction or Panel
persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the three-number skeleton with one bounded current-run owner and two deliberate projections. The dock now reports run and turn identity, current technical event, model-call activity, elapsed time, problem count, sticky Pause/Follow state, and an explicit handoff. The focused 920 x 700 px workspace reuses that exact owner for a chronological event stream, severity and model-activity filters, selected bounded details, safe Copy summary and Export event actions, and exact-origin restoration on Close. Events are normalized to safe operational fields, reject stale run ids, and retain only the newest 12 records. Established the 320/560/720 px base contract plus 384 px narrow and 520 px wide ideals using only existing manifest-backed Clock, Selected, Information, Close, Reset, Export, and operational-detail icons. | Two new acceptance tests first failed at 108/110 because the purpose-built module and audited one-column geometry did not exist, then the full suite passed at 110/110. Coverage includes exact-run binding, stale-event rejection, 12-event retention, Pause/Follow, same-owner focus and restoration, severity/model filtering, safe Copy/Export, offline and failure evidence retention, no prompt/private payload, no technical state in Panel persistence, 200 px summary, 420 px trace, and inert Catalog anatomy. | Initial live dock at 286, 200, and 420 px; active and failure states; first focused workspace; filtered Catalog miniature. | The 200 px metric and problem rows collided, the full title clipped at minimum width, and the focused owner inherited translucent glass while five toolbar controls wrapped through a four-column grid. | Refine once. |
| 2 | Reflowed the 200 px summary into two metrics with Current and Problems spanning the full width, introduced the compact `Technical Detail` toolbar identity only below 240 px, raised the compact trace type floor, and made the focused owner an opaque operational surface with a fixed five-part toolbar. The 420 px projection keeps three readable six-column trace rows; the Catalog remains an inert three-event/two-model diagram. No event, filter, retention, or authority behavior changed. | New visual-contract assertions first returned 108/110 on the colliding 200 px layout and translucent, wrapped focused owner. After correction, the complete suite passed at 110/110. Computed-browser proof recorded 420 px requested width, a focused 919.99 x 655.99 px viewport-constrained owner, `rgba(4, 13, 13, 0.984)` background, no backdrop filter, and five same-row toolbar tracks. | Final 200 px active summary; final 420 px trace projection; final viewport-constrained focused stream and selected-event detail; final filtered Catalog miniature with three trace rows, two model marks, and zero controls. | At this 720 px-tall browser the focused contract correctly uses available viewport minus shell insets (about 656 px rather than 700 px). The event stream is its one intentional scroller. No unresolved Widget defect. | Passed and frozen. |

Live Technical Detail now exposes bounded host evidence without pretending that
operational traces are story progress, saved-turn truth, or character knowledge.
Its compact projection answers what is happening now; the focused owner answers
why, using only safe fields from the exact current run.

## Turn Versions

**Audit state:** Audited

**Functional floor:** Main stores turn and stage variants, browses variants
locally without mutation, compares content, rerolls eligible turns/stages,
branches from a turn, and activates a version only through explicit fresh
server eligibility. The selected turn is shared with Transcript and Inspector.

**Current failures:** `Saved variants 3`, `Current Variant 2`, and `No pending
change` do not let the user see, compare, or choose anything. `Version rail`
and `Comparison` are inert tags. There is no provenance, created time, active
mark, diff, preview, deliberate Use action, mutation review, or ineligible
reason. Its two-column minimum has the same only-floating placement failure as
Live Technical Detail.

**Overhaul:** provide a version rail ordered by creation with active and viewed
states kept separate, a readable preview, optional text diff against active,
and previous/next controls. `Use this version` is a distinct labeled mutation
that rechecks eligibility; browsing never mutates. Reroll stage, reroll turn,
and branch remain separate actions with scope/consequence copy. The dock
projection offers version count, viewed/active identity, excerpt, arrows, and
`Open comparison`; mutation lives in the focused owner.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 328 px |
| Ideal default height at 286 px | 592 px |
| Maximum in-place height | 736 px |
| 200 / 420 px response | 392 px navigator projection / 552 px rail-preview split |
| Preferred focused editor | 920 x 720 px or available viewport minus shell insets |

**Catalog and acceptance:** the miniature shows three version marks, one active
and one being viewed, plus a diff texture. Acceptance requires one shared
selected turn, browse-without-write, active/viewed distinction, comparison,
fresh eligibility, reroll/branch/use consequences, stale/conflict/failure
recovery, toolbar projections, and no version payload in Panel state.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the inert count rows with a purpose-built selected-turn literary owner. The shared owner carries authoritative active version and capability state while each module keeps its preview local, so browsing is reversible and only `Use this version` writes. The dock now provides turn identity, eligibility, active and viewed state, cyclic version navigation, a literary excerpt, and `Open comparison`; the same module reparents into an opaque 920 x 720 px focused workspace with Transcript-measure Newsreader prose. Restored qualified Edit input and Edit narration drafts, presentation-only narration activation, input-staleness disclosure, checkpoint-restoring Reroll review, background-owned Branch, latest-only Delete, conflict retention, authoritative Transcript refresh, and live handoff to Turn Progress/Live Technical Detail. Established the 328/592/736 px base contract plus 392 px narrow and 552 px wide ideals using existing manifest-backed Bookmark, Previous/Next, Selected, Edit, Save, Reset, Branch, Delete, Clock, and Information SVGs. | Two acceptance tests first failed at 112/114 because the custom owner and state API did not exist. The first implementation revealed a duplicate local identifier before initialization; a direct syntax check isolated it rather than treating the resulting 8/114 cascade as independent defects. After correction, one focused minimum-width assertion found a 29 px overflow caused by absolutely positioned screen-reader labels. Anchoring every hidden label inside the Widget restored accessible names and yielded 114/114. Coverage includes two-instance local-preview isolation with shared active refresh, explicit Use, literary measure/type, narration and input editing, reroll handoff, historical capability gates, single/no-version and no-turn states, scoped arrow keys, 200/420 px projections, inert Catalog, and no turn/version/draft payload in Panel persistence. | Live complete dock at 286, 200, and 420 px; historical 200 px state; active focused literary workspace; initial non-active focused preview; first Catalog miniature. | In the focused non-active state, `Use this version` wrapped below Previous because the navigator reserved only four tracks for five controls. At 200 px, the useful excerpt ended through a visibly clipped partial line. | Refine once. |
| 2 | Gave the focused version navigator five explicit tracks so Previous, count, Next, Active, and Use remain on one row, and capped the 200 px excerpt to exactly six full Newsreader lines. No preview, activation, edit, eligibility, or mutation behavior changed. | New visual assertions returned 113/114 on the partial compact line before correction. The finalized test opens a real non-active focused version and proves all five navigator children share one row; it also proves the compact excerpt is at most six integral line boxes. The complete suite passes at 114/114. | Final 200 px dock with a six-line excerpt and pinned Open comparison; preserved 286 and 420 px compositions; final non-active focused preview with same-row Use action; final filtered Catalog miniature with three distinct version marks, active/viewed separation, literary texture, and zero controls. | The focused preview deliberately leaves quiet canvas beneath short prose rather than enlarging type or duplicating versions side by side. The literary preview is its one intentional scroller. No unresolved Widget defect. | Passed and frozen. |

Turn Versions now supports exploratory literary comparison without silent story
mutation. It changes which words the Transcript presents only through a named
write, while engine evidence and step-version recomputation remain in Turn
Inspector.

## Turn Inspector

**Audit state:** Audited

**Functional floor:** Main's pipeline owner loads one saved turn and its steps,
variant eligibility, stale/incomplete state, lenses, safe edit/rerun/resume
actions, and extension-rendered step evidence. Host evidence remains
authoritative and extension output is isolated, read-only, and unable to
replace it.

**Current failures:** the floating module shows three summary rows and an
Evidence Lab sample but no step rail, stage selection, evidence sources, lens
content, eligibility reason, or safe operations. The extension block is given
more visual weight than host evidence. `Summary`, `Evidence`, and `Extension
evidence` are inert chips. The only action, Open evidence, does not expose the
Inspector's actual job. Two-column placement prevents toolbars and every custom
Panel slot.

**Overhaul:** use a left/top pipeline stage rail with completion/stale/error
marks, selected-stage summary, variant identity, eligibility explanation,
bounded evidence sources, lens tabs, and a subordinate extension-renderer
section labelled by owner. Safe Edit, Resume, and Rerun appear only for the
selected stage and always name their scope. The 200-286 px dock projection is a
turn/stage navigator with active finding and `Open Inspector`; 420 px may show
the selected evidence summary but not the full raw payload.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 360 px |
| Ideal default height at 286 px | 640 px |
| Maximum in-place height | 760 px; selected-stage body is the one scroller |
| 200 / 420 px response | 424 px navigator projection / 600 px rail-detail composition |
| Preferred focused editor | 960 x 740 px or available viewport minus shell insets |

**Catalog and acceptance:** the miniature shows a saved-turn header, stage rail,
and one contained extension mark without real evidence. Acceptance requires
all stored-turn completeness/stale/eligibility states, every safe stage action,
shared turn selection, isolated extension success/failure/fallback, keyboard
stage navigation, toolbar and focused contexts, and no leakage into cognition
or Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic three-row summary with one selected-saved-turn owner and intentional dock/focused projections. The owner now exposes nine ordered stored pipeline stages, selected/stale/warning/incomplete marks, exact turn and step-variant identity, active-versus-previewed step versions, context-derived specialist/perceiver/mind/structured/JSON lenses, plain-text evidence, engine notes, explicitly unvalidated reasoning, and extension evidence contained under its exact registered step. It restores Main's eligibility-gated Edit step, Reroll only this step, Run from here, Resume turn, and Use this step version operations with qualified drafts, conflict-safe source revisions, downstream-staleness treatment, explicit consequences, and handoff of live work to the run Widgets. The dock is a turn/stage navigator; the same module reparents into an opaque 960 x 740 px focused owner and restores its exact origin. Established the 360/640/760 px base contract plus 424 px narrow and 600 px wide ideals, using only existing manifest-backed Checklist, Selected, Information, Clock, Edit, Reset, Save, Previous/Next, and Extension SVGs. | Two acceptance tests first failed at 110/112 because the custom owner and state API did not exist, then the full suite passed at 112/112. Coverage includes complete, incomplete/resumable, blocked-by-other-frame, read-only, missing-turn, and no-materialized-step paths; ordered and keyboard-navigable stages; historical perceiver lenses; browse-without-write; explicit activation; qualified edit plus downstream staleness; all safe operations and consequence review; same-owner focus/restore; exact-step extension success/fallback; 200/420 px projections; inert Catalog; and no selected turn, step, lens, variant, evidence, or reasoning in Panel persistence. | First placed dock at the shell's 230 px starting width; initial 200 and 420 px extremes; complete focused workspace with step rail, lens/evidence viewport, subordinate Evidence Lab renderer, disclosures, and safe actions. | The populated 200 px dock still displayed its mutually exclusive empty-state message because author CSS overrode native `hidden`; the active stage label truncated unnecessarily; and the 420 px evidence side left lens, active-version, and warning context implicit. | Refine once. |
| 2 | Added an explicit hidden-state rule, tightened only the minimum-width stage navigator so `Director scopes` remains whole between two 44 px controls, raised the compact wide rail to an 8 px type floor, and added three bounded selected-evidence facts—Lens, Version, and Finding—to the 420 px projection. No stored evidence, selection, operation, eligibility, or extension authority changed. | New visual-contract assertions first returned 111/112 on the visible empty state, then all 112 tests passed with the empty state suppressed, the 200 px stage label collision-free, exactly three 420 px evidence facts, and the rail at or above the compact type floor. | Final live 200 px navigator with quiet non-stretching evidence capacity and pinned Open action; final 420 px rail/evidence split with all nine stage marks and three evidence facts; final opaque focused owner; final filtered Catalog miniature with seven stage marks, one contained extension mark, and zero controls. | The 200 px projection intentionally does not expose full raw evidence or mutation controls; its neutral vertical capacity preserves the 424 px default while keeping orientation and Open Inspector at opposite stable edges. The focused evidence viewport is the one intentional scroller. No unresolved Widget defect. | Passed and frozen. |

Turn Inspector now answers how a durable turn was produced without becoming a
second Transcript, a live trace console, or an extension-owned authority. The
dock orients; the focused owner lets the host inspect and safely act on stored
pipeline evidence.

## Player Condition

**Audit state:** Audited

**Functional floor:** the projection reads current-frame player physiology,
body-region effects, salient status, mobility and vitals permitted by the
player-facing owner. It does not rewind when Transcript browses an old turn and
does not expose author-only raw state.

**Current failures:** the Widget reduces the body to three flat rows, with
`Vitals` and `Effects` as inert chips. It lacks body-region grouping, severity,
change, missing/not-applicable state, accessible icon meaning, and a clear
current-frame anchor. The generic Ready badge is meaningless. At 200 px it is
legible but wastes nearly half its shelf; at 420 px rows stretch without adding
information.

**Overhaul:** lead with an overall condition sentence and current-frame mark,
then compact 44 px status rows for breathing, mobility, temperature/pain or
other authoritative salient signals. Group specific effects by body region
behind disclosure; use manifest icons plus text/severity, never a medical-style
gauge with invented precision. Show recent change only when the current-frame
projection supplies it. No edit action is invented.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 208 px |
| Ideal default height at 286 px | 320 px |
| Maximum in-place height | 432 px; effects list becomes the one scroller |
| 200 / 420 px response | 336 px stacked / 256 px two-column signals |

**Catalog and acceptance:** the miniature shows four labelled representative
vital signals and a calm current-frame summary, with no real measurement or
control. Acceptance requires healthy,
affected, multiple-region, missing, unavailable and changed states; exact
current-frame behavior during history browsing; no private/raw state; 200% zoom
and all dock widths; and no reliance on tint or icon alone.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic three-row sample with a read-only current-frame owner grounded in Main's `/api/chats/{cid}/vitals` contract. The projection preserves the four authoritative Air, Stamina, Satiation, and Injury semantics in engine order, inverts only Injury severity, adds a calm owner-provided summary and exact present-frame anchor, keeps authorized region effects subordinate behind disclosure, and distinguishes ready, changed, tracking-off, missing, unavailable-last-known, and no-story states. Multiple instances share one current-frame request; Transcript history browsing cannot rewind it. Tracking-off and no-story recovery route to the qualified Story Style or Library owner. Established the 208/320/432 px base contract plus 336 px narrow and 256 px wide ideals with accessible meters, text labels, no invented health score or edit authority, and only existing manifest-backed Current, Information, and Edit SVGs. | Two new acceptance tests first failed at 114/116 because the purpose-built owner and state API did not exist. Initial implementation reached 115/116 until the tracking-off recovery control met its physical target floor, then 116/116. Coverage includes the exact four-vital contract, shared request ownership, current-frame isolation during Transcript browsing, region effects, all empty/stale/change states, 200/420 px projections, inert miniature anatomy, and absence of private/raw or Panel-persisted condition data. | Live ready state at the shell's starting width, 286 px default, 200 px minimum, and 420 px maximum; changed state; tracking-off recovery; unavailable last-confirmed state; filtered Visual Catalog miniature. | At 286 px the original 44 px middle-width rows let the bottom Injury signal slip beneath the clipped vital viewport, especially when change evidence wrapped. At 420 px fixed 54 px text columns truncated “Breathing freely” and “Bruised hands.” | Refine once. |
| 2 | Kept 44 px signal rows in the narrow and wide projections, but made the non-interactive middle-width rows 35 px and raised the regular ideal to 320 px for the finalized responsive composition. Moved change evidence onto one full-width line, retained its complete current-frame meaning as an accessible label, and compacted the visible change to `Changed · stamina ↓ · injury ↑`. Rebalanced the 420 px two-column tracks and padding so every text condition remains whole while every meter retains at least 70 px. No vital semantics, current-frame authority, recovery route, or persistence boundary changed. | New visual-contract assertions first reproduced the 286 px hidden-Injury defect and the 420 px truncated-label defect. After correction, the complete regression suite passed at 116/116. The finalized checks prove all four rows precede the effects disclosure at 286 x 320, change evidence does not wrap, 200 px remains one collision-free column with its receipt inside the module, 420 px uses two columns with 70 px-or-wider meters and untruncated text labels, and the Catalog miniature has four labelled signals with zero controls or meters. | Final changed 286 px projection with all four vitals; final 420 px ready projection with whole semantic labels; preserved 200-ish tracking-off recovery; unavailable last-confirmed projection; final filtered Catalog result with four representative signals and zero controls. | The dock intentionally uses normalized relative meters because Main supplies normalized vitals; it does not expose more precision than the current owner. Specific region effects remain closed until requested. No unresolved Widget defect. | Passed and frozen. |

Player Condition now answers what the player can presently know about their
body without becoming a medical dashboard, an editor, a historical snapshot,
or a path into private character state.

## Cast Condition

**Audit state:** Audited

**Functional floor:** this read-only projection admits only visible or otherwise
authorized cast members and their observable condition. It follows the current
frame, applies correct non-player filtering, and may navigate to an authorized
owner without revealing private character state.

**Current failures:** three names and terse adjective pairs omit presence,
identity uncertainty, visible basis, salient change, long-cast navigation,
empty state, and loading/authorization distinctions. A single table line at
420 px wastes space; at 200 px name and condition can collide. `Cast rows` is an
inert chip and the generic Ready badge falsely suggests full cast knowledge.

**Overhaul:** use compact cast cards with portrait/identity mark where
authorized, current presence/location qualifier, observable condition sentence,
mobility, and an optional changed-since-last-frame mark. Search appears only for
a long authorized set; presence/severity filters remain local presentation.
Unknown identities stay unknown. A row may open the canonical visible Character
surface but never private memory or hidden condition.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 240 px |
| Ideal default height at 286 px | 368 px |
| Maximum in-place height | 576 px; cast list becomes the one scroller |
| 200 / 420 px response | 432 px stacked cards / 328 px two-column cards |

**Catalog and acceptance:** the miniature shows three anonymous representative
figures with observable status marks. Acceptance requires empty/one/many/long
cast, unknown identity, offscreen exclusion, authorization change, current-
frame updates, safe owner navigation, 200/286/420 and phone behavior, and
proof that private condition is absent from DOM and persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the inert three-row table with a purpose-built read-only current-frame owner that shares Player Condition's one frame-qualified request. It excludes the player and authorization-denied bodies before DOM construction, preserves stable story order, presents known and unknown identity honestly, and gives each visible participant one compact disclosure with current presence, observable condition sentence, salient owner-labelled vital, optional visible change, and all four authoritative vitals behind accessible meters. All/Attention and long-set Search are local presentation only; one module's filter never changes another. Added ready, changed, long, authorization-change, unavailable-last-confirmed, tracking-off, empty, loading, and no-story states. Known rows can hand off to the visible Characters (Story) owner; unknown rows never expose that action. Established the 240/368/576 px base contract plus 432 px narrow and 328 px wide ideals. Added the real manifest-backed `Profile 1335` SVG (`512690-profile-1335.svg`) for identity marks and reused manifest Search, Checklist, Information, Edit, Library, and navigation icons for controls and recovery. | Two new tests first failed at 116/118 because no Cast owner or state API existed. The implementation then exercised exact non-player/authorization filtering, unknown identity, observable fields, four-vital disclosure, local filter isolation, current-frame behavior during Transcript browsing, shared Player/Cast request ownership, owner focus, long search, authorization removal, last-known/off/empty states, 200/420 px layouts, and inert Catalog anatomy. Routing and physical-target corrections brought the complete suite to 118/118 before visual review. | Live ready set at 286, 200, and 420 px; first 420 px expanded vital disclosure and its single list scroller; long seven-person narrow set with Search; changed state; tracking-off recovery; first filtered Visual Catalog miniature. | The empty-state `Open Cast` recovery still targeted a nonexistent Systems panel even though known-person handoff had been corrected to the shipped Characters (Story) owner. | Refine once. |
| 2 | Routed both known-person and empty-cast recovery through one transient helper that activates Scene and focuses Characters (Story), without storing a selected cast id or condition in Panel state. The change preserves read-only physiology, authorization filtering, and unknown-identity behavior. | A new recovery assertion first failed at 117/118 on the nonexistent target. After the shared handoff replaced it, the full suite passed at 118/118. The browser then proved `Characters (Story)` was the focused owner after activating `Open Cast`. | Final empty-state recovery and focused Characters owner; preserved 286/200/420 compositions, expanded details, long search, tracking-off state, and final Catalog result with three Profile SVG figures and zero controls, details, or meters. | Expanded per-character vitals deliberately consume the cast list's one scroller; they do not expand the Widget or hide another Panel region. The Catalog uses anonymous labels rather than real names. No unresolved Widget defect. | Passed and frozen. |

Cast Condition now scans what the current viewer is allowed to observe without
becoming a roster editor, an omniscient health table, or a back door into
private character state.

## Room Ambience

**Audit state:** Audited

**Functional floor:** Main binds playback to the visible turn's occupant-free
room/time/weather/damage signature; resolves and caches up to three layers;
handles browser unlock, crossfade, seamless looping, page visibility, mute and
master/layer gain; supports reroll, local/search audition, full-mix room pins,
source/licence attribution, and global Settings navigation. Removing a Widget
does not stop the device atmosphere.

**Current failures:** the default right-toolbar Widget says Mix, Volume, Source,
and Playing but provides no transport, volume control, layer disclosure,
reroll, pin, search, attribution, unlock, pending, silent, or error path. At 200
px the Room Ambience and Promise Ledger tabs truncate; at 420 px the four rows
remain sparse. The Catalog miniature looks identical to the working Widget and
also returns the unrelated Room Ambience Settings result.

**Overhaul:** use a 44 px transport row with Unlock when needed, Mute/Unmute,
master volume and explicit Playing/Silent/Pending state. Show room name and up
to three layer summaries, then a Mix disclosure for per-layer gain/audition/
reroll, full-mix pin, reroll mix, source attribution, and sound browser. Keep
global source/credential setup behind a labeled `Open Ambience Settings` action.
At 200 px retain transport, room, state and master volume; at 420 px expose
layer summaries and pin inline.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 216 px |
| Ideal default height at 286 px | 312 px |
| Maximum in-place height | 456 px; mix/browser uses one deliberate subview |
| 200 / 420 px response | 368 px stacked transport / 288 px inline mix summary |

**Catalog and acceptance:** the silent miniature shows waveform/layer marks,
Playing/Mute and a pin indicator. Acceptance requires no-turn, locked, disabled,
unconfigured, cached, playing, muted, silent-with-reason, dwell, pending,
checking, reroll-retaining-prior, pinned, search/library/licence failure,
offline and superseded states; visible-turn chronology; full-mix pins; page
visibility; no autoplay; all widths; and no Transcript/Composer geometry shift.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the four inert rows with one device-atmosphere owner and a purpose-built visible-turn controller. The dock now follows Transcript chronology, identifies the visible room and turn, shares unlock/mute/master volume across projections, preserves the current audible mix during reroll, rejects superseded owners, and keeps playback alive when the Widget is removed. Added complete three-layer source/licence summaries, per-layer Mix controls, full-mix pinning, a gesture-bound Sound Browser, explicit Settings handoff, and honest locked, disabled, unconfigured, silent, dwell, pending/checking, pinned, library-failure, offline and page-hidden states. Established the 216/312/456 px base contract plus 368 px narrow and 288 px wide ideals. Added manifest-backed Muted SVG and made the waveform/layer Catalog preview inert. | Two acceptance tests first failed at 118/120 because the purpose-built state API did not exist. After implementation, owner/volume/recovery and the legacy Catalog selector exposed three focused failures; correcting the slider precision, recovery target floor, and expected actual preview yielded 120/120. Coverage includes shared playback preferences, full-mix pins, visible-turn changes, stale-result rejection, unmount survival, page visibility, explicit single checks, Sound Browser audition/use, 200/420 px projections, inert preview, and no ambience payload in Panel persistence. | Live playing projection at approximately 286 px, 200 px and 420 px; minimum-width Mix and Sound Browser; locked and pending states; first filtered Catalog miniature. | The 200 px Mix forced a horizontal scrollbar, the four main actions were compressed into one row, and locked Unlock/Mute controls initially shared the same sound symbol. | Refine once. |
| 2 | Reflowed the 200 px action rail into a 2×2 physical grid and each layer control into a two-row label/range/mute composition, removing horizontal scroll while preserving one vertical Mix scroller. Gave Unlock its own manifest-backed `Lock Open 706` SVG so it cannot be confused with Mute. No playback, chronology, pin, search, persistence, or application-owner behavior changed. | New narrow-layout assertions first failed at 118/120 on the horizontal Mix overflow and four-column action rail. A distinct-icon assertion then failed at 119/120 on the ambiguous sound symbols. After correction, the complete regression suite passed at 120/120. | Final 200 px playing and Mix projections; final locked and pending 200 px states; preserved approximately 286 and 420 px layouts; final filtered Catalog result with waveform, three layer marks, Playing/Mute and pin anatomy. | At minimum width, layer details intentionally live behind Mix and its single vertical scroller; the main projection keeps room, visible turn, transport, volume, state and four icon-led actions. No unresolved Widget defect. | Passed and frozen. |

Room Ambience now controls the one application-owned atmosphere without
duplicating audio, pretending a pending job is progress, or storing media and
visible-turn state inside Panel persistence.

## Scene Backdrop

**Audit state:** Audited

**Functional floor:** Main derives an occupant-free visual signature from the
visible room, light, time, weather, style and continuity; deduplicates/cache-
loads or commissions after dwell; decodes before dual-layer crossfade; applies
luminance-aware readability treatment; retains a prior same-room image during
reroll; rejects stale results; and releases faded textures. Settings owns model,
provider, size, enablement and continuity policy.

**Current failures:** the actual atmospheric image is visually effective but is
anonymous shell CSS rather than visibly manageable Widget ownership. Adding
the registered Scene Backdrop creates a second generic floating card over that
same image, obscuring prose and reporting three inert metadata rows. It offers
`Choose backdrop`, which misstates Main's generate/reroll/cache behavior. The
registry prohibits toolbar/control placement and custom layouts, so the user
cannot monitor or control the real stage layer without duplicating it.

**Overhaul:** keep the actual decoded image as one stage-native Widget layer,
with a quiet room/state edge shown only on focus, edit, pending, or failure.
Contextual controls are Generate, Reroll image, Check status, and Open Backdrop
Settings according to authoritative state. Removing the Widget removes the
generated layer from that Panel and leaves base atmosphere and prose intact.
Also provide a toolbar controller projection—thumbnail, visible room/turn,
cached/pending/error state, continuity, Generate/Reroll/Check, and `Focus
backdrop`—that operates the same stage owner rather than rendering a second
image.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 224 px for controller projection |
| Ideal default height at 286 px | 328 px for controller projection |
| Maximum in-place height | 448 px; stage layer always fills its assigned canvas |
| 200 / 420 px response | 376 px stacked thumbnail/actions / 288 px landscape thumbnail |
| Dominant treatment | Entire compatible story-stage backdrop behind stable literary measure |

**Catalog and acceptance:** the miniature shows representative room art,
stable reading measure and quiet state edge, never real generated media or a
working Generate action. Acceptance requires removed/recovered ownership,
visible-turn chronology, dwell/dedupe/no private polling, decode-before-swap,
same-room retention, luminance scrim, resource release, force-reroll,
controller/stage synchronization, all viewport classes, reduced motion/data/
effects, and zero prose reflow.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the duplicate generic card with one application-owned, stage-native backdrop and a synchronized toolbar controller. The stage layer now follows visible-turn chronology, derives occupant-free room signatures, retains the prior same-room image during generation or failure, waits for decoded media before an atomic swap, applies a luminance-aware veil, rejects stale owners, releases faded textures, and removes/reclaims the generated layer without disturbing base atmosphere or prose. The controller provides room/turn identity, continuity, readability, source, Focus, Generate/Reroll, Check status, Retry and Settings handoff through honest absent, dwell, pending, checking, failed, unconfigured, disabled, removed, no-turn, offline, data-saver and effects-off states. Established the 224/328/448 px base contract plus 376 px narrow and 288 px wide ideals. Added a manifest-backed image SVG and an inert CSS representative-art miniature with stable reading measure and no generated media. | Two acceptance tests first failed at 120/122 because the purpose-built owner API did not exist. The first implementation reached 121/122; increasing the compact action target to 46 px corrected its only accessibility failure. The complete harness then passed at 122/122. Coverage includes single ownership, visible-turn changes, decode-before-swap, luminance, texture release, stale rejection, reroll retention, removed/recovered ownership, stage/controller synchronization, Settings routing, 200/420 px projections, reduced preferences, inert Catalog media and zero Transcript/Composer reflow. | Live controller at approximately 200, 286 and 420 px; focused stage receipt; pending and retained-prior state; failed/retry state; filtered Catalog miniature. | No unresolved Widget defect. The focus/pending/failure receipt intentionally overlays the quiet upper stage edge and disappears without changing prose geometry. | Passed and frozen. |

Scene Backdrop now exposes one truthful owner for the generated canvas image:
the stage remains atmospheric, while the dock projection provides the controls
and state needed to understand or change it without duplicating media.

## Background Work

**Audit state:** Audited

**Functional floor:** Main had a global activity count, label, spinner and live
elapsed time; the maintained task service adds stable owner/request identity,
lifecycle, phase, optional real progress, summary/error, truthful cancellation
capability, and bounded terminal retention. Only registered host tasks and
approved providers may appear. Turn generation may project one row but Turn
Progress remains its detailed local owner.

**Current failures:** the Widget displays three sample task rows, including a
fabricated `64%`, without active count, elapsed time, task owner/destination,
cancellability, recent results, failure link, provider state, or empty state.
`Task rows` is an inert chip. The 28 px View queue action is easily clipped. At
200 px the task/status pairs collide and the footer overlaps; at 420 px the
same rows waste width.

**Overhaul:** show active count and Active/Recent only when recent results
exist. Each stable task row has name, owning destination, phase, elapsed time,
and percent only when the task supplies a determinate contract. Show Cancel
only for a current cancel capability; after activation show Cancelling until
authoritative settlement. Failures link to their owning surface or notice
without raw stacks. Provider failure is isolated. Removing the Widget never
cancels work; the top-shelf active count focuses or places this projection.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 232 px |
| Ideal default height at 286 px | 344 px |
| Maximum in-place height | 520 px; task list becomes the one scroller |
| 200 / 420 px response | 416 px stacked task metadata / 312 px two-column task rows |

**Catalog and acceptance:** the miniature shows one indeterminate phase and one
real bounded progress row plus an active count, with no timer or working Cancel.
Acceptance requires no-work, one/many, determinate/indeterminate, cancellable/
noncancellable, cancelling, complete, failed, cancelled, provider unavailable,
retention and destination-missing states; elapsed survival across remount;
provider isolation; truthful top-shelf count; all widths; and no task data in
Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the three fabricated sample rows with one application-owned task service projection and a truthful top-bar active count. Each registered task now carries stable request identity, owning destination, phase, absolute start time, elapsed time, optional determinate progress contract, current cancel capability, provider state and bounded terminal retention. Active and Recent sections appear only when populated; cancellation enters `Cancelling` until settlement; terminal failures link to their owner without raw stacks; missing destinations are inert; one provider failure cannot disable other tasks; removal never cancels work. Established the 232/344/520 px base contract plus 416 px narrow and 312 px wide ideals. Added manifest-backed queue, stop and destination-link SVGs and an inert miniature with one indeterminate and one bounded row. | Two acceptance tests first failed at 122/124 because the purpose-built task API did not exist. The implementation reached 123/124; correcting phase priority over summary text exposed the real queued phase, and rendering `Cancelling` instead of stale determinate progress produced 124/124. Coverage includes shared ownership, stale-owner rejection, remount elapsed survival, truthful top count/focus, no-work, active/recent, determinate/indeterminate, cancellable/noncancellable/cancelling, complete/failed/cancelled, provider isolation, destination loss, retention, 200/420 px reflow, inert preview and zero task data in Panel persistence. | Live mixed queue at approximately 230, 200 and 420 px; active cancellation receipt; first filtered Catalog miniature. | The first Stop collection glyph resembled an add/box control at dock scale, and the Catalog grid stretched its two representative rows through the full preview height. | Refine once. |
| 2 | Replaced manifest `Stop 950` with the clearer manifest `Stop 977` square-stop glyph and changed the Catalog miniature from flexible-height task tracks to one centered compact queue group. No task lifecycle, routing, retention, elapsed, cancellation or persistence behavior changed. | New icon-identity and miniature-spacing assertions first failed at 123/124. After the visual correction, the complete regression harness passed at 124/124. | Final 200 px active and cancelling states; preserved 420 px two-column task layout; final centered filtered Catalog miniature. | At 200 px, destination actions intentionally collapse to icon-led targets while destination names remain in row metadata; the one vertical task-list scroller owns overflow. No unresolved Widget defect. | Passed and frozen. |

Background Work now reports real host operations without pretending that every
task has a percentage, turning provider trouble into a global outage, or tying
task lifetime to a removable Panel projection.

# Audited slice: Library and authoring Widgets

## Cross-slice visual and ownership evidence

- The Library Panel currently opens as one oversized `Library` summary beside
  `Character Card` and `Lore Entry Tree` summaries. All three use the same
  heading, prose, tag chips, three key/value rows, footer note, and clipped
  28 px action pattern. The composition communicates catalog taxonomy, not an
  archive or authoring workflow.
- Visual inspection covered all nineteen Catalog definitions plus default,
  docked, wide/floating, 200 px and 420 px toolbar contexts where their declared
  placement allowed it. Compact Modules collide or truncate at 200 px and
  merely stretch at 420 px. Workspace Widgets cannot enter a one-column slot;
  they become roughly half-screen floats over the Scene and still render only
  the generic summary.
- Main supplies substantially richer behavior through `app.js`, `editors.js`,
  `lorebooks.js`, and `components.js`: archive projections, reusable-versus-
  story association, lossless document editing, Quick Start, Lore hierarchy,
  generation review, and lived-location generation. Those are the functional
  floor; the legacy presentation is not.
- Library selection is typed shared runtime state. Panel layout may remember
  presentation, but never resource ids, server documents, relationships,
  generated output, or drafts. One qualified owner holds each recoverable
  draft. A second mounted projection joins or locates that owner rather than
  creating an independent last-write-wins editor.
- Every destructive action names its target and consequence, then supplies
  bounded undo where the backend contract permits it. Selecting a row is not a
  mutation and does not silently navigate to Scene. Focused authoring uses one
  scroll owner, a stable Back/Save bar, exact return-state restoration, and a
  clear distinction between `Saved to Library` and `Draft saved on this
  device`.
- The current Lore routes do not provide a safe revision token. Independent
  writable Entry, Details, Relationship, and story-card surfaces require a
  conditional-write contract or one serialized edit lease. Until that seam is
  real, they render read-only truth and never imply safe saving.
- Two-column height values below describe the wider 420 px projection; the
  200 px value is intentionally taller because controls and metadata stack.

## Library

**Audit state:** Audited

**Functional floor:** the canonical Library archive owns category, story scope,
search, sorting, filters, selection and scroll; presents Stories, Characters,
Personas and Lore without conflating reusable sources with story-qualified
copies; and owns create, import, export, archive, restore and delete. A bounded
`/api/library` projection and canonical hash reject stale actions.

**Current failures:** the dominant Widget shows three example counts and an
`Open Library` action, leaving most of its canvas blank. There is no archive
toolbar, result ledger, selection detail, association state, empty/error
distinction, keyboard list, lifecycle operation, or useful response to width.
It behaves like a launcher to the experience it is supposed to be.

**Overhaul:** make the dominant surface a real master-detail archive. The
header carries icon-led category tabs, search, scope and filter disclosure.
The result ledger uses compact rows with ownership, associations, modified
state and a 44 px More menu; selection reveals an adjacent or staged detail
with `Open`, `Open in Scene` when meaningful, association and lifecycle
actions. At 200 px it becomes a useful summary/launcher projection; at 420 px
it supports category + selected-detail staging. Focus mode supplies the full
two-pane archive without inventing a second data owner.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 560 px |
| Maximum in-place height | 760 px; results become the one scroller |
| 200 / 420 px response | 420 px summary/launcher / 600 px staged archive |
| Focused treatment | 960 x 720 px master-detail archive |

**Catalog and acceptance:** the miniature shows category icons, four truthful
representative rows and one selected detail, with no active actions. Acceptance
requires loading/refresh/error/empty/filter-empty, reusable/story-owned scope,
stable selection, stale-hash rejection, create/import/export, archive/undo/
restore/delete, explicit Scene navigation, keyboard/touch operation, all dock
widths, focused mode, and no archive data in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the count-and-launcher skeleton with the shared Library archive owner that later compact archive Widgets can reuse. The dominant projection now provides four icon-led categories, search, ownership scope, a keyboard listbox with ownership/association/activity metadata and 46 px More menus, synchronized selected detail, explicit Open/Open in Scene, create/import/export, archive with bounded Undo, restore and archived-only delete. All writes are qualified by the canonical archive hash; stale actions refresh instead of mutating. Loading, refreshing with last-good data, error, empty and filter-empty are distinct. Established the 320/560/760 px base contract, 420 px narrow summary, 600 px wide staged archive and a 960 × 720 focused master-detail owner. The inert miniature carries four category icons, four representative rows and selected detail without archive controls. | Two tests first failed at 124/126 because the shared Library API did not exist. The first complete implementation exposed two preview-only regressions: a hidden focused-close button remained interactive and an icon-only preview lacked enough recognizable content. Removing the control and adding bounded selected-detail copy produced 126/126. Coverage includes typed shared selection, keyboard navigation, touch target floors, stale-hash rejection, archive/undo, create/import/export, explicit Scene navigation, exact focus return, all load/empty states, ownership filtering, 200/420 px response, focused geometry, inert miniature and presentation-only Panel persistence. | Shipped Library panel; 200 px summary/launcher; 420 px staged archive; 960 × 720 focused master-detail; expanded row lifecycle menu; filtered Catalog miniature. | The result ledger intentionally retains empty breathing room when only two records match; its list remains the one archive scroller and does not stretch rows to fill the canvas. No unresolved Widget defect. | Passed and frozen. |

Library now behaves as the archive itself rather than a launcher: selection,
filters, lifecycle state and drafts stay with one owner while each Panel keeps
only its presentation.

## Stories

**Audit state:** Audited

**Functional floor:** this compact archive projection lists real Stories with
title, frame/activity metadata and lifecycle state. It can select, open detail,
open the Story in Scene, start New Story, export, archive and undo through the
shared Library owner.

**Current failures:** three static rows and `Story list`/`Open selected` expose
neither selection nor an open target. Long titles collide with metadata at 200
px; 420 px adds blank horizontal space. Loading, empty, archived, error,
current-story and stale-action states are absent.

**Overhaul:** use a compact navigable ledger with explicit selected and current
markers, last activity, frame count/status and an icon More menu per row. The
primary footer action changes truthfully between `Open details` and `Open in
Scene`; New Story is an icon-led secondary action. Filters and archived state
live behind one disclosure at narrow width.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 248 px |
| Ideal default height at 286 px | 432 px |
| Maximum in-place height | 600 px; story ledger scrolls |
| 200 / 420 px response | 480 px stacked rows / 392 px denser rows |

**Catalog and acceptance:** show three distinct story rows, current/archived
marks and a selected detail hint. Prove error versus empty, long titles, current
Story, stale action, archive/undo, explicit navigation, keyboard/touch, all
widths and safe presentation-only persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the static story summary with a compact projection of the shared Library owner. It now provides search, disclosed archived filtering, a keyboard listbox, explicit selected/current/archived marks, frame and activity metadata, row More menus, archive/Undo/restore/delete/export lifecycle paths, truthful `Open details` versus `Open in Scene`, New Story, canonical-hash stale-action refusal, and 248/432/600 px base geometry with 480 px narrow and 392 px wide ideals. The inert miniature shows three Story rows, current/archived marks and selected detail with no live controls. All visible icons resolve through the Minimal UI manifest. | Two new tests first failed at 126/128 because no purpose-built Stories API existed. The first implementation reached 127/128; its archived fixture hid Restore in a closed overflow menu. Opening the recovery menu in the archived state produced 128/128. Coverage includes shared selection, truthful navigation, 44 px row actions, archive/Undo, New Story, error/empty/archived/long/stale states, 200/420 px response, inert miniature and presentation-only persistence. | Ready state at 230 px; 200 px stacked ledger; 420 px two-column ledger; archived recovery menu; long-title containment; filtered Catalog miniature. | The failure state still rendered stale archive rows and navigation below its recovery callout, and the true empty state had no direct creation action. | Iterated. |
| 2 | Made error and empty modes exclusive body owners: archive search, rows and footer actions are hidden during either dedicated state. Failure now exposes only Retry and an assurance that nothing changed; empty exposes one direct icon-led New Story action. Added regression assertions against visually interactive stale controls. | The new edge-state assertions deliberately returned 127/128 before the repair. The corrected selectors, explicit test hooks and empty-state creation path restored 128/128. | Error at 230 px; empty at 230 px; compared against the first-cycle error capture to confirm stale rows/actions were removed. | No unresolved Widget defect. | Passed and frozen. |

Stories now behaves as a compact archive rather than an ambiguous launcher. It
can inspect and operate on shared Story records without ever changing the
current Story implicitly.

## Characters (Library)

**Audit state:** Audited

**Functional floor:** this is the reusable Character archive projection. It
shows association and owner state, supports selection, create/import/duplicate/
export/archive, and opens the one reusable Character Card owner. It does not
fetch or reproduce the full sheet in every row.

**Current failures:** the summary rows omit portrait/identity, associations,
source state, dormancy, selection, empty/error and lifecycle actions. `Reusable
cards` and `Open card` are labels without an actionable model, and narrow rows
collapse names into right-aligned values.

**Overhaul:** render avatar/identity marks, name, concise role, story-association
count and reusable/source status in selectable cards. The selected card exposes
Open, add to Story when a target exists, Duplicate, Export and icon More for
archive. Search and association filters appear only when useful; missing-source
and dormant records remain explicit.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 264 px |
| Ideal default height at 286 px | 456 px |
| Maximum in-place height | 640 px; character ledger scrolls |
| 200 / 420 px response | 520 px stacked cards / 416 px two-column cards |

**Catalog and acceptance:** representative cards show portrait marks,
association counts and one dormant/missing-source case. Prove add/remove
association ownership, lifecycle actions, stale selection repair, error versus
empty, long names, keyboard/touch, all widths and no sheet data in layout.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic three-row blueprint with a projection of the shared Library record and Story-association owner. It renders compact portrait/initial marks, name and role, reusable versus Story-owned origin, association count, dormant state and source health without fetching sheet content. Search, association scope, keyboard selection, Open card owner handoff, Add/Remove current-Story association, Duplicate-without-associations, export, create, import, archive and bounded Undo are real. All writes reject a stale archive hash. Added exclusive error/empty recovery, stale-selection repair, long-name containment, 264/456/640 px base geometry, 520 px narrow and 416 px wide ideals, and an inert three-card miniature using manifest-backed Profile and action SVGs. | Two tests first failed at 128/130 because no specialized projection or API existed. The complete first implementation passed 130/130, covering shared selection, Story association mutation, owner-correct Open, duplicate/export/create/import, archive/Undo, no full sheet payload, Panel-persistence exclusion, error/empty/stale/long states, keyboard/touch, 200/420 px response and inert preview anatomy. | Ready at 230 px; 200 px stacked cards; 420 px two-column ledger; error recovery; empty create/import paths; long-name fixture; filtered Catalog miniature. | At 200 px the count badge displaced most of the Widget title. A Character already in the active Story appeared as an active-looking button with no behavior. | Iterated. |
| 2 | Collapsed only the count text—not the identity—at minimum width, preserving the full accessible Widget title. Replaced the inert membership button with a non-interactive icon-led status instrument while keeping Add as the real action for an unassociated selection. | Two new assertions deliberately reduced the suite to 128/130. After the responsive header and semantic status corrections, all 130/130 passed. | Final 200 px header and associated selection actions; error and empty states; long-name state; final Catalog miniature. | The ledger intentionally scrolls while selection and lifecycle actions remain fixed. Full Character sheet fields remain in the separate Card owner. No unresolved Widget defect. | Passed and frozen. |

Characters (Library) now answers which reusable card is selected, where it is
used, whether its source is healthy, and what operation will occur—without
confusing archive membership with current-frame Cast or duplicating the sheet.

## Characters (Story)

**Audit state:** Audited

**Functional floor:** this projection lists Characters associated with the
active Story, their reusable or story-owned origin, and association state. It
can open the reusable or Story Character Card and attach/detach according to
server capability. It is distinct from Cast, which reports current-frame
presence and observable condition.

**Current failures:** three generic names imply a cast list, hide association
origin and make no distinction between attached-but-offscreen and current
presence. There is no no-Story, loading, detached, source-missing or stale-Story
state, and `Open card` does not identify which card.

**Overhaul:** show Story association cards with origin badge, concise role and
source health. The selected action says `Open Story version` or `Open reusable
card`; detach is an explicit More action with consequences. An Add action opens
the reusable Character chooser without pretending to edit Cast or presence.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 248 px |
| Ideal default height at 286 px | 424 px |
| Maximum in-place height | 600 px; association list scrolls |
| 200 / 420 px response | 480 px stacked cards / 384 px two-column cards |

**Catalog and acceptance:** show attached reusable, story-owned and missing-
source examples. Prove no-Story, attach/detach, Story switch invalidation,
origin-correct card navigation, strict non-overlap with Cast, all widths and no
Story id or association data in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the shipped Scene roster summary and generic Catalog blueprint with a Story-association projection backed by the shared Library records. Attached cards show portrait mark, concise role, reusable versus Story-owned origin and source health; they deliberately omit current-frame presence and condition. Selection opens the origin-correct reusable or Story Character Card. Detach lives behind the row menu with explicit retention consequences; Add opens the reusable-card chooser and changes Story membership only. No-Story, recently detached and Story-revision-invalidated states are distinct. Added 248/424/600 px base geometry, 480 px narrow and 384 px wide ideals, keyboard/touch behavior and an inert three-example miniature using manifest-backed Profile/action icons. The legacy default Scene instance is upgraded to this owner during composition. | Two tests first failed at 130/132. The initial integration exposed two expected suite assumptions tied to removed legacy roster controls and its old preview text/selector; those contracts were updated to the specialized design. Removing Cast/presence terminology from the association body kept the semantic separation literal. All 132/132 then passed, covering owner-correct Open, shared detach/add mutations, consequence review, no-Story/detached/stale-Story states, keyboard/touch, 200/420 px response, inert preview, shipped Scene replacement and Panel-persistence exclusion. | Shipped ready state at 230 px; 200 px stacked cards; 420 px two-column cards; expanded detach consequence; Add chooser; no-Story and stale-Story recovery states. | Chooser mode inherited an oversized generic heading and left the prior selected-card Open action visible while the chooser owned the body. | Iterated. |
| 2 | Gave chooser copy the compact Atmospheric Workbench typography and made chooser mode exclusive in the footer: the selected-card action is removed and replaced by a truthful Close chooser action until a candidate is chosen or the task is cancelled. | A new assertion deliberately produced 131/132 before the correction. The revised chooser restored 132/132. | Final 420 px chooser; no-Story and stale-Story states; preserved 200/default/420 ready compositions and detach review. | Sparse Story associations deliberately leave breathing room below their compact cards. Cast remains the separate authority for bodies actually present in a frame. No unresolved Widget defect. | Passed and frozen. |

Characters (Story) now makes attachment and card origin explicit without
presenting association as physical presence or silently mutating a reusable
source.

## Personas (Library)

**Audit state:** Audited

**Functional floor:** this reusable Persona archive identifies primary versus
additional Persona semantics and supports selection, create/import/duplicate/
export/archive plus opening the one Persona Card owner. The primary Persona
cannot be detached through a generic association action.

**Current failures:** generic rows do not identify primary status, story use,
source health, selection or available actions. The Widget is visually
indistinguishable from Characters despite a materially different player-
identity contract.

**Overhaul:** use Persona-specific identity cards with primary crown/user icon,
additional status, association count and a concise identity excerpt. The
selected toolbar owns Open, Add to Story where valid, Duplicate/Export and
More; impossible primary detach never appears. Filters remain staged at 200 px.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 248 px |
| Ideal default height at 286 px | 424 px |
| Maximum in-place height | 600 px; Persona list scrolls |
| 200 / 420 px response | 480 px stacked cards / 384 px two-column cards |

**Catalog and acceptance:** show primary, additional and unassociated examples.
Prove primary protection, lifecycle and association actions, error/empty,
source loss, keyboard/touch, all widths and safe persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Built a Persona-specific projection on the shared Library owner rather than recoloring Characters. Cards use manifest-backed Profile marks and a distinct favorite/primary instrument, concise identity excerpts, primary/additional/unassociated semantics, Story-use count and source health. The primary row's menu contains an explicit protection instrument and export only—generic detach and archive never appear. Additional Personas may attach/detach; selected identities open the one Persona Card owner, duplicate without primary status or Story associations, export, archive/Undo, create and import. Added error/empty/source-loss/long states, 248/424/600 px base geometry, 480 px narrow and 384 px wide ideals, keyboard/touch handling and an inert three-identity miniature. | Two tests first failed at 132/134 because no specialized Persona owner existed. The complete implementation passed 134/134, covering primary protection, add/remove association, owner-correct Open, non-primary duplicate, lifecycle, create/import, safe persistence, error/empty/source loss/long identity, 200/420 px response, keyboard/touch and inert preview anatomy. | Ready at 230 px; 200 px staged filters and stacked cards; 420 px two-column identity ledger; expanded primary-protection menu; source-loss state; error and empty recovery states. | The unassociated identity rendered `Unassociated · Unassociated · Source current`, repeating one fact in adjacent semantic slots. | Iterated. |
| 2 | Collapsed unassociated evidence to one identity-state label plus source health while preserving association counts for primary and additional identities. | A new assertion deliberately reduced the suite to 133/134. The corrected evidence hierarchy restored 134/134. | Corrected source-loss ledger; final error/empty recovery states; preserved width extremes and primary-protection menu. | The primary Persona remains changeable only in its Story Persona owner; the archive projection intentionally explains but does not bypass that boundary. No unresolved Widget defect. | Passed and frozen. |

Personas (Library) now treats player identity as a protected semantic role—not
another generic row—while still providing a useful reusable-document archive.

## Personas (Story)

**Audit state:** Audited

**Functional floor:** this compact active-Story projection shows the primary
Persona and any additional/guest Personas, opens their reusable documents, and
supports only real attach, detach or guest handoff capabilities.

**Current failures:** the summary does not identify the active/primary player
identity, guest handoff, association origin or what an empty list means. The
same three-row treatment makes a player-identity decision look like passive
metadata.

**Overhaul:** anchor the primary Persona as a visually stable card and list
additional/guest entries beneath it. Actions are Open card, Add Persona, Hand
off guest where supported, and Detach only for detachable entries. No-Story,
no-primary and no-additional are separate, plainly worded states.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 248 px |
| Ideal default height at 286 px | 400 px |
| Maximum in-place height | 560 px; additional Personas scroll |
| 200 / 420 px response | 456 px stacked / 368 px primary-plus-list |

**Catalog and acceptance:** show one primary and two additional/guest rows.
Prove distinct empty states, primary invariants, handoff/attach/detach, Story
switch, long identity text, all widths and presentation-only persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the passive three-row summary with an active-Story identity projection: one favorite-marked, protected primary card spans the hierarchy; additional and guest identities sit beneath it with explicit source and capability evidence. Added reusable-card Open, additional-Persona chooser, consequence-reviewed detach, capability-gated guest handoff, distinct no-Story/no-primary/no-additional/stale/long states, 248/400/560 px geometry, 456 px narrow and 368 px wide ideals, keyboard/touch behavior and an inert one-primary/two-secondary miniature. | Two tests first failed at 134/136 because no specialized Story Persona projection existed. The implementation reached 136/136, proving primary invariants, guest handoff, attach/detach shared-owner updates, reusable-owner Open, Story revision refresh, all empty states, long text, 200/420 px response, touch targets, persistence exclusion and inert Catalog anatomy. | Ready at the default toolbar width; 200 px stacked identity ledger; 420 px primary-plus-two composition; selected guest with the handoff capability and three-action footer. | The no-primary `Repair primary` action only changed an invisible local status string and did not hand work to any owner. | Iterated. |
| 2 | Replaced the inert repair callback with an explicit `library.personas` owner handoff carrying Story identity and `repair-primary` intent. | A new assertion deliberately reduced the suite to 135/136. The owner handoff restored 136/136. | Rechecked the primary hierarchy and narrow/wide compositions; the repair path is now evidence-backed by the same owner-event seam used by document Open actions. | Primary replacement remains deliberately outside this projection; the Widget opens the reusable Persona owner instead of mutating protected identity locally. No unresolved Widget defect. | Passed and frozen. |

## Lore (Library)

**Audit state:** Audited

**Functional floor:** this reusable Lore archive projection lists books with
origin, associations, canon/disabled state and modified metadata. It can select,
attach/detach to the active Story, open the canonical Lore workspace, export,
archive, and begin a lived-location flow when the host context is valid.

**Current failures:** static title/value rows hide hierarchy, scope, Story
association, canon state, selection and valid destinations. `Lore collection`
and `Open lore` provide no protection against opening or mutating the wrong
owner.

**Overhaul:** use compact book rows with book icon, title, origin/scope,
association count, canon/disabled mark and selected state. The action bar names
Open Lore, Attach/Detach, Export and More; `Build lived-in location` appears
only with an executable context and explains attach-then-generate when needed.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 264 px |
| Ideal default height at 286 px | 456 px |
| Maximum in-place height | 640 px; book list scrolls |
| 200 / 420 px response | 520 px stacked books / 416 px two-column books |

**Catalog and acceptance:** show reusable, attached/canon and disabled books.
Prove error versus empty, attach/detach, Story switching, source removal,
capability-gated lived-location launch, keyboard/touch, all widths and no book
or selection data in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced static title/value rows with a shared-owner Lore archive: manifest-backed book marks, scope, canon/disabled/source evidence, active-Story association, selection, search/scope filtering and keyboard/touch navigation. Added owner-correct Open, reusable attach/detach, Export, More/Archive/Undo, capability-gated lived-location handoff, attach-then-build guidance, error/empty/source-loss/detached/stale/long states, 264/456/640 px geometry, 520 px narrow and 416 px wide ideals, and an inert reusable/canon/disabled miniature. | Two tests first failed at 136/138 because no Lore archive projection existed. The complete implementation passed 138/138, covering shared-owner association and lifecycle changes, correct document and builder destinations, Story refresh, source-loss gating, error/empty recovery, long text, 200/420 px response, keyboard/touch, safe persistence and inert Catalog anatomy. | Ready at 230 px; 200 px stacked books; 420 px two-column book ledger; reusable attached-book action set; canon and disabled/source-missing evidence; executable builder capability. | `Build lived-in location` and `Attach to build` preserved their meaning but truncated at minimum/default width and wrapped awkwardly in the four-action wide footer. | Iterated. |
| 2 | Kept the full accessible names and tooltips while shortening the visible, icon-led labels to `Build location` and `Attach first`. | Two new width-safety assertions deliberately reduced the suite to 136/138. The compact labels restored 138/138 without weakening owner or capability assertions. | Rechecked the 420 px reusable-book footer and the default/minimum compositions; the builder action now remains readable as one compact icon-led control. | Story-owned books deliberately omit attach/detach, disabled or source-missing books deliberately omit generation, and authoring remains in the canonical Lore destinations. No unresolved Widget defect. | Passed and frozen. |

## Lorebooks (Story)

**Audit state:** Audited

**Functional floor:** the active-Story Lore workspace distinguishes canon,
attached reusable, story-owned, disabled and inherited books; navigates the
hierarchy; and coordinates selection with Tree, Editor, Details, Relationships,
Generator and lived-location tools.

**Current failures:** a floating summary over the Scene shows three book names
but no hierarchy, ownership, retrieval state, selected entry, action or safe
authoring path. It cannot dock in the toolbar despite needing to coordinate the
other Lore Modules.

**Overhaul:** provide a dock projection with ownership-grouped book rows,
hierarchy disclosure, enablement and selected-entry context; at 420 px this
becomes a staged book/tree workspace. Focus mode supplies book navigation,
entry tree and detail destination without duplicating their document owners.
Attach, detach, enable, create, generator and lived-location actions are
capability-gated and icon-led.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 600 px |
| Maximum in-place height | 760 px; hierarchy becomes the one scroller |
| 200 / 420 px response | 420 px book projection / 560 px staged hierarchy |
| Focused treatment | 960 x 720 px Lore workspace |

**Catalog and acceptance:** show ownership groups and one shallow hierarchy.
Prove every ownership/retrieval state, no-Story, selection coordination,
structural refresh, attach/enable actions, focused Back restoration, all widths
and zero selected ids/tree data in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the floating three-name summary with an active-Story Lore workspace: Story-local, attached reusable and inherited ownership groups; canon/enabled/disabled/source-missing retrieval evidence; selectable shallow hierarchy; coordinated book/entry selection; owner-routed Entry, Details and Relationships actions; attach/detach, source recovery, enable, generator, lived-location, Add and Story-owned Create capabilities. Added distinct no-Story/stale-structure/long states, 320/600/760 px base geometry, a 480 px narrow ideal after the shared legibility correction and a 560 px wide ideal, a 960×720 focus contract and inert ownership/hierarchy miniature. At 200 px, secondary Details, generation, build, detach, and create commands yield to the primary entry, Add, Focus, and any required recovery action. | Two tests first failed at 138/140 because no specialized active-Story Lore workspace existed. The implementation reached 140/140, covering ownership/retrieval states, cross-instance selection, safe destinations, source and enable gates, attach/detach/create, generator/build handoffs, structural refresh, 200/420 px response, focus/Back, persistence exclusion and inert Catalog anatomy. The later global legibility traversal confirms the narrow projection retains its complete grouped-book region without shrinking type. | Default 278 px center workspace; 420 px staged book/tree layout; initial 200 px projection; first focused 960 px rendering. | The inherited `minColumns: 2` contract let Catalog offer only the center canvas, contradicting the required dock projection. At 200 px, three separate action groups consumed 213 px and left 128 px for books. The nominal 960 px focus remained clipped by its dock ancestor, transparent, retained a redundant Focus action, and used an oversized Back control. | Iterated. |
| 2 | Made the wide editor one-column-placement eligible while preserving its staged and focused geometry. Consolidated actions into one responsive three/four-column grid, reducing the 200 px footer to 163 px and restoring 178 px for grouped books. Focus now portals temporarily to the Workbench root, uses a 91%-opaque heavy surface, exposes a compact 28 px Back control, removes redundant Focus, and restores the exact dock position and selection on Back. | Dock-eligibility, narrow-density, focus-portal and focused-surface assertions each failed before their corresponding correction; the final suite passes 140/140. | Actual left-toolbar placement at 420 px with two-pane staging; actual 200 px dock with two visible ownership rows and compact icon-led actions; final 960×688 viewport-bounded focus with opaque surface, full book/tree workspace and compact Back. | Inherited books remain read-only, source-missing books route to recovery, and selected hierarchy state stays outside Panel persistence. No unresolved Widget defect. | Passed and frozen. |

## New Story

**Audit state:** Audited

**Functional floor:** this recoverable creation workflow offers Describe, Use
Library and Start Blank routes, then premise, Persona, Characters, Lore, lived
location and review. It previews consequences before creation, captures one
qualified draft owner, and cleans up or exposes a recovery path after partial
creation failure.

**Current failures:** the current wide float contains only Mode, Persona and
World rows plus `Create story`; it offers no route choice, staged inputs,
validation, review, creation progress, partial-failure recovery or meaningful
small-width design. Floating it over prose makes a high-attention flow compete
with the active Story.

**Overhaul:** make this a focused stepper with compact resume projection in a
toolbar. Use icon + text route choices, a visible step label, Back/Continue,
recoverable device draft, source pickers that retain exact selection, and a
review ledger naming all attachments and public/private lived-location
consequences. `Create Story` appears only in Review; success offers explicit
Open Scene, while partial failure preserves the created id and cleanup path.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 600 px |
| Maximum in-place height | 760 px; step body is the one scroller |
| 200 / 420 px response | 420 px resume/step summary / 560 px current step |
| Focused treatment | 960 x 740 px creation workflow |

**Catalog and acceptance:** the miniature shows three routes and a six-step
progress rail, never a working Create action. Prove every route, validation,
draft recovery, exact Back, review-before-create, duplicate-submit guard,
partial cleanup/recovery, success, phone/short-height/focus, and no creation
draft or future Story id in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the inert `Mode / Persona / World` float with three icon-led entry routes and a six-step device-owned draft for Premise, Persona, Characters, Lore/lived location, Opening and Review. Added required-field validation, exact source selection, autosave/resume, clear-draft consequence review and cancel, Review-only Create, explicit Background Work creation, created-id-preserving partial failure with retry/cleanup, success/Open Scene, 320/600/760 px base geometry, 420/560 px responsive ideals, a 960×740 portal focus with Back restoration, and an inert three-route/six-step miniature. | Two tests first failed at 140/142 because no specialized creation workflow existed. The complete implementation passed 142/142, covering all routes, required validation, exact source retention, lived-location public/private consequences, device autosave, background/success destinations, draft persistence exclusion, resume/clear, partial recovery, 200/420 px response, focus/Back and inert Catalog anatomy. | Three-route picker at the true 200 px dock; current-step and vertical progress composition at 420 px; saved-draft resume projection at 200 px; focused Step 4 Lore/lived-location workspace at 960×688 with opaque surface and compact Back. | The fresh route picker visually accented Use Library before the user chose it, and Start Blank silently inserted a premise—both implied decisions the user had not made. | Iterated. |
| 2 | Removed the premature route accent so all three starting paths are neutral, and made Start Blank genuinely empty so the same explicit premise validation remains in force. | Two route-semantics assertions deliberately reduced the suite to 140/142. The corrected neutral/empty behavior restored 142/142. | Rechecked the 200 px three-route dock projection; Describe, Use Library and Start Blank now share equal visual weight until selection. | Creation remains qualified in Review, created identities survive partial finalization, and device drafts stay outside Panel persistence. No unresolved Widget defect. | Passed and frozen. |

## Character Card

**Audit state:** Audited

**Functional floor:** this is the single lossless reusable Character document
owner: semantic sections, explicit save, revision/conflict handling,
recoverable local draft, unknown-field preservation, generation preview,
duplicate/export/archive and exact Back restoration. It does not own live
mood, memories, body state or Story associations.

**Current failures:** the dockable summary exposes Name, Role and Source only.
There are no editable fields, sections, draft/save/conflict state, validation,
unknown fields, generation review or owner identity. At 200 px it is a cramped
launcher; at 420 px it is still mostly empty.

**Overhaul:** dock mode is a truthful document navigator/summary with owner,
revision, draft state, section progress and Focus editor. A 420 px compact
editor may edit one staged section; focused mode presents the full one-scroll
document with persistent Back, discard, save and status bar. Generated text or
appearance is always previewed and accepted into the same draft.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 640 px |
| Maximum in-place height | 760 px; section body is the one scroller |
| 200 / 420 px response | 420 px navigator/summary / 600 px compact editor |
| Focused treatment | 860 x 720 px document editor |

**Catalog and acceptance:** show semantic section icons, revision and device-
draft state with inert sample fields. Prove load/saved/dirty/saving/validation/
conflict/offline/source-removed, draft recovery, lossless unknown fields,
preview-before-save, shared owner across mounts, exact Back, all widths and no
document/draft in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the generic Name/Role/Source summary with one lossless reusable Character document owner. Five semantic sections share one device draft across mounts; identity and prose fields support explicit validation/save with revision completion, recovered draft, conflict/offline/source-removed states, unknown-field retention, preview-before-accept generation, duplicate/export/archive/Undo and a portal-based focused editor with exact Back restoration. Added 320/640/760 px base geometry, 420/600 px narrow/wide ideals, an 860×720 focus contract and an inert five-section miniature using only manifest-backed icons. | Two purpose-built tests first failed at 142/144 because no Character Card owner API existed. The initial implementation reached 143/144; the 200 px contract exposed its editor instead of a navigator-only summary. Hiding the editor below 240 px restored 144/144. Coverage includes every named recovery state, shared draft, validation, generation acceptance, explicit saving/revision completion, lossless unknown fields, lifecycle actions, 200/420 px response, exact Back, inert preview and Panel-persistence exclusion. | Default Library support column; actual 220 px right-toolbar navigator at 420 px height; 316 px compact editor at 640 px height; focused 860×688 editor. | At 316 px the five section labels were compressed into a truncated horizontal strip even though enough width existed for a compact editor. | Iterated. |
| 2 | Moved the compact-editor breakpoint to 300 px and converted the section control into a 116 px icon-led vertical rail, preserving the navigator-only projection at 200 px and the full focused document. | A new 320 px section-rail assertion deliberately reduced the suite to 143/144. The corrected breakpoint and rail restored 144/144. | Rechecked the actual 316 px right-toolbar composition: full section names, one selected section editor, intact actions and no horizontal collision. The 220 px summary and 860×688 focus remain unchanged. | Live mood, memories, body state and Story associations remain intentionally outside this reusable document owner. No unresolved Widget defect. | Passed and frozen. |

## Story Character Card

**Audit state:** Audited

**Functional floor:** this shared editor targets the selected Character's
Story-qualified effective sheet while preserving its reusable source and live
runtime ledgers. Save is pipeline-guarded, selection is invalidated on Story
switch, and safe writability requires revision or a serialized lease.

**Current failures:** the generic floating card does not identify active Story,
selected Character, reusable origin, Story override, running-pipeline guard or
read-only prerequisite. It looks like the reusable Character Card and could
invite an unsafe last-write-wins assumption.

**Overhaul:** reuse the Character editor anatomy with an unmistakable `Story
version` context bar, Story title, reusable origin link and read-only/safe-edit
status. Dock mode is summary/navigation; compact editing appears only where the
lease contract and width permit it. Exclude rename/rekey and cross-Story target
controls. Saving names the Story owner and never changes runtime mood, memory,
relationships or body state.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 640 px |
| Maximum in-place height | 760 px; editor body scrolls |
| 200 / 420 px response | 420 px owner summary / 600 px compact editor |
| Focused treatment | 860 x 720 px qualified document editor |

**Catalog and acceptance:** show `Story version`, origin and read-only/revision
state. Prove no-Story/not-attached/source-missing, Story invalidation, pipeline
guard, revision prerequisite, shared draft, reusable/runtime preservation,
exact Back, all widths and no qualified ids or sheet in layout.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Built a dedicated Story-qualified Character document owner rather than cloning the reusable editor. Its context bar identifies `Story version`, active Story and reusable origin; five semantic sections share one qualified draft; safe editing is backed by Story revision plus a serialized lease; rename/rekey and cross-Story targeting are absent. Save completion changes only the Story version while regression snapshots prove the reusable document and runtime mood, memory, body and relationship ledgers are byte-preserved. Loading, dirty/saving/conflict/offline, no-Story, not-attached, source-missing, Story-invalidated, pipeline-running and revision-required states have explicit owners. Added the audited 320/640/760 px base, 420/600 px responsive ideals, 860×720 focus and inert qualified-owner miniature using manifest-backed icons. | Two tests deliberately failed at 144/146 before the specialized API existed. The first implementation reached 146/146, covering shared draft, revisioned save, reusable/runtime preservation, unsafe-state gates, selection invalidation, 200/420 px response, exact Back, inert preview and zero qualified ids or sheet content in Panel persistence. | True 220 px right-toolbar owner summary; first 316 px compact editor; 860×688 focused editor; initial pipeline-running projection. | The module reused `.sonder-story-character-card`, an older roster-row class, so CSS turned the document into a three-column participant card and reduced the body from 316 px to 213 px. After separating that class, the new origin/lease row occupied the flexible track and left only 142 px for the editor. At 220 px, the disabled Save control still lacked a plainly visible pipeline reason. | Iterated. |
| 2 | Gave the document a collision-free module class, shortened its narrow context title, made its body retain the full host width, and defined the Story-specific workspace as context / origin+lease / flexible editor / footer. The compact stage now receives 467 px at the audited 640 px shelf height. Pipeline-running, revision-required and conflict writability evidence is warning-emphasized; the narrow pipeline state says `Pipeline running · Read-only` beside a truly disabled Save. | Full-width body, minimum useful editor-track height and explicit pipeline-guard text were each added as failing assertions before their corrections. The final harness passes 146/146. | Final actual 316 px right toolbar with full vertical section rail and Story context editor; 860×688 focused editor; final actual 220 px pipeline-running summary with visible reason and disabled Save. | Runtime state remains deliberately outside this editor; Story change clears selection instead of retargeting silently. No unresolved Widget defect. | Passed and frozen. |

## Persona Card

**Audit state:** Audited

**Functional floor:** the one reusable Persona document owner provides
lossless sections, revision/conflict, recoverable draft, explicit save,
Additional fields, appearance preview, duplicate/export/archive and exact Back.
It excludes Character-only psychology, greetings and Quick Start.

**Current failures:** the current float is the same generic Name/Role/Source
summary used for Character documents. It hides primary/additional context,
editor state, section semantics, validation and document ownership, while its
large canvas obscures Scene content.

**Overhaul:** use player-identity language and Persona-specific section icons in
the shared document shell. Dock mode shows identity excerpt, primary/additional
association context, revision and draft state; 420 px can stage one section;
focused mode is the complete editor. Association actions remain in Persona
archive Widgets, never inside the document.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 600 px |
| Maximum in-place height | 740 px; editor body scrolls |
| 200 / 420 px response | 408 px identity summary / 568 px compact editor |
| Focused treatment | 840 x 700 px document editor |

**Catalog and acceptance:** show Persona-labelled sections, primary context and
device-draft state. Prove correct section exclusion, lossless fields, conflict,
preview-before-save, shared owner, association non-ownership, exact Back, all
widths and safe persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Reused the proven lossless document shell with a distinct Persona owner and player-identity vocabulary. The primary/additional identity summary carries Story-use count and revision; Identity, Player voice, Appearance, Story defaults and Additional fields share one recoverable device draft. Appearance generation is preview-only until explicit Accept. Validation/save, conflict/offline/source removal, unknown-field retention, duplicate/export/archive/Undo and exact portal Back are owned here, while greetings, Quick Start, psychology and all Story-association mutations are structurally absent. Added 320/600/740 px base geometry, 408/568 px narrow/wide ideals, an 840×700 focus override and inert five-section primary-Persona miniature using manifest-backed icons. | Two purpose-built tests deliberately failed at 146/148 before implementation. The first implementation passes 148/148, covering shared draft, preview-before-save, explicit saving/revision completion, unknown fields, lifecycle Undo, every recovery state, 200/420 px response, exact Back, inert preview, association non-ownership and Panel-persistence exclusion. | Actual 220 px right-toolbar identity summary at 408 px height; actual 316 px compact Appearance editor with generated preview and Accept/Discard; final 840×688 focused Appearance document with persistent actions. | Persona associations remain in Personas archive Widgets, and greeting/Quick Start behavior remains with its dedicated Widget. No unresolved Widget defect. | Passed and frozen. |

## Greetings and Quick Start

**Audit state:** Audited

**Functional floor:** this surface authors the selected reusable Character's
opening messages inside that Character's shared draft, previews generation,
and starts a Story from a real saved greeting with an explicit Persona and
optional Lore/known-state/lived-location choices. A dirty Character must save
successfully before Story start.

**Current failures:** the float reports Character, Greeting and Persona as
three values with no greeting list/editor, draft owner, generation preview,
validity, save-before-start boundary, lived-location disclosure, start progress
or retry state. `Quick start` implies immediacy while hiding consequential
choices.

**Overhaul:** stage `Greetings` and `Start Story` views under one shared
Character owner. Greetings provides excerpts, selected state, add/reorder/
delete, editing and preview-only generation. Start Story shows Persona,
greeting, Lore/known state, language and lived-location disclosure, then a
review. The primary action says `Save and start Story` when dirty; failed start
retains saved Character, choices and retry path.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 560 px |
| Maximum in-place height | 720 px; active subview scrolls |
| 200 / 420 px response | 408 px selected greeting summary / 536 px staged editor |
| Focused treatment | 820 x 680 px greeting/start workflow |

**Catalog and acceptance:** show two greeting excerpts, one selected Persona
and an inert `Save and start Story` label. Prove shared Character draft,
no-Character/no-Persona/no-greeting, generation recovery, save-before-start,
failed-start retry, lived-location disclosure, all widths and no duplicate
document owner or start choices in Panel layout.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the three-value launcher with two explicit subviews under the reusable Character owner. Greetings supplies selectable excerpts, one shared editor, add/reorder/delete, preview-only generation and acceptance; every edit updates the existing Character Card draft rather than minting another owner. Start Story stages Persona, saved greeting, Lore, known state, language and lived-in-location choice with public-place/private-recipient disclosure. Dirty launch becomes `Save and start Story`; only successful Character save advances to starting. A failed start preserves the saved Character and all launch choices for Retry; success exposes Open Scene. Added no-Character/no-Persona/no-greeting/generation-failure/offline/failed-start states, 320/560/720 px base geometry, 408/536 px narrow/wide ideals, 820×680 focus and an inert two-greeting/Persona/start miniature using manifest-backed icons. | Two contract tests deliberately failed at 148/150 before the specialized owner existed. The implementation passes 150/150, covering shared Character draft, list operations, generation preview, all explicit choices, lived-location disclosure, save-before-start, failed-start retry, success destination, recovery states, 200/420 px response, exact Back, inert preview and zero document/start-choice persistence. | Actual 220 px selected-greeting navigator at 408 px height; actual 316 px Start Story view with all choices and disclosure fitting in 385 px without scrolling; 820×680 focused workflow. | At 220 px the full `Greetings and Quick Start` header clipped after `Qu`, making the paired workflow identity ambiguous. | Iterated. |
| 2 | Kept the full Widget name for Catalog, metadata, title and accessible label, but changed the placed icon-led header to `Greetings + Start`, which fits the minimum toolbar without weakening meaning. | A narrow-header assertion deliberately reduced the suite to 149/150. The corrected accessible/visible identity restored 150/150. | Final actual 220 px right-toolbar navigator with complete `Greetings + Start` identity, both greeting excerpts, subview controls and Focus. | Greeting mutations remain reusable Character-draft operations; launch choices remain transient workflow state. No unresolved Widget defect. | Passed and frozen. |

## Lore Entry Tree

**Audit state:** Audited

**Functional floor:** this navigates the selected Lorebook hierarchy and owns
structural selection, filtering, expansion, keyboard tree focus, create root/
child/sibling, move/reorder, promote/demote, and opening the Entry Editor.
Structural writes capture book, entry, parent/order and revision.

**Current failures:** the current Widget flattens three paths into generic rows;
there is no real depth affordance, expansion, selection, filter, keyboard tree,
structural action, conflict, missing-parent or repair state. At 200 px path and
value collide, while at 420 px depth remains visually ambiguous.

**Overhaul:** render an ARIA tree with real indentation, disclosure icons,
selected row, entry-type mark and filtered ancestor context. A compact icon
toolbar provides create/move/promote actions with labels/tooltips; pointer drag
is optional and always has keyboard/Move-dialog parity. Refresh preserves the
old tree until replacement succeeds and repairs selection explicitly if moved
or removed.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 280 px |
| Ideal default height at 286 px | 480 px |
| Maximum in-place height | 680 px; tree is the one scroller |
| 200 / 420 px response | 560 px staged tree/actions / 440 px broader tree |

**Catalog and acceptance:** show five nodes, three levels and one selection.
Prove ARIA tree navigation, pointer/keyboard parity, create/move/reorder,
structure conflict, error versus empty/filter-empty, missing parent, selection
repair, touch, all widths and no book/entry ids or tree data in layout.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced flat path/value rows with a shared revisioned Lore hierarchy. Five synthetic nodes render depth-first as a three-level ARIA tree with selection, expansion, keyboard navigation and ancestor-preserving filter. The icon toolbar owns create root/child/sibling, Move dialog, promote and demote; every structural operation records book, entry, parent, order and source revision. Refresh keeps the last good tree on failure, successful replacement repairs a removed selection explicitly, missing-parent state owns Repair, and Open Entry targets the selected editor owner. Added error/empty/filter-empty/conflict/refreshing states, 280/480/680 px base geometry, 560/440 px narrow/wide ideals and an inert five-node hierarchy miniature using manifest-backed icons. | Two tests deliberately failed at 150/152 before the specialized tree existed. The first implementation passes 152/152, covering five nodes/three levels, shared selection, Arrow navigation, filtered ancestor context, create/move/promote/demote revision capture, editor destination, stale-tree retention, missing-parent repair, selection repair, 200/420 px containment, inert preview and Panel-persistence exclusion. | Actual 220 px right-toolbar tree with icon-only six-action toolbar and visible three-level indentation; first actual 316 px tree and Move dialog. | At 316 px, the CSS widened the structural toolbar to six columns, truncating every action label into an ambiguous fragment even though two rows fit comfortably. | Iterated. |
| 2 | Retained the three-column/two-row toolbar through every supported left/right toolbar width; the six-column form is now reserved for surfaces at least 480 px wide. | A maximum-toolbar column-count assertion deliberately reduced the suite to 151/152. The corrected breakpoint restored 152/152. | Final actual 316 px right-toolbar tree: full Root, Child, Sibling, Move, Promote and Demote labels in two 30 px rows, 247 px tree viewport, five nodes and selected depth-2 entry. | Pointer drag remains optional; every structural move has the tested keyboard/touch Move dialog. No unresolved Widget defect. | Passed and frozen. |

## Lore Entry Editor

**Audit state:** Audited

**Functional floor:** this single recoverable draft edits title, keys,
category, substantial content, canon lock, importance, aliases, scope,
knowledge rules, relations and source notes while preserving unknown fields.
Save is conditional/serialized; delete names entry and child/relationship
consequences. Generator remains a separate plan/review/apply owner.

**Current failures:** the floating summary shows Title, Keys and Content as
one-line values, with no editable prose, semantic sections, draft/revision,
validation, conditional conflict, new-unsaved state, delete consequence or
source-moved handling. It obscures Scene prose and cannot function in the
toolbar.

**Overhaul:** dock mode is selected-entry/draft summary plus Focus editor. At
420 px one semantic section can be staged; focus mode provides the full one-
scroll document and stable Back/Save bar. Content remains primary, retrieval
and scope metadata are disclosed compactly, Additional fields are lossless,
and `Not yet saved` differs visibly from device-saved and Library-saved.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 640 px |
| Maximum in-place height | 760 px; editor body scrolls |
| 200 / 420 px response | 420 px entry summary / 600 px compact section editor |
| Focused treatment | 900 x 720 px document editor |

**Catalog and acceptance:** show title, retrieval keys, content field and Draft
marker. Prove no-entry/loading/new/saved/dirty/saving/conflict/validation/
removed/read-only/offline, lossless draft recovery, delete consequence, tree
coordination, no immediate-write generator shortcut, all widths and safe
persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the one-line Title/Keys/Content summary with a single lossless Entry document owner. Content, Retrieval, Scope & knowledge, Relations & source and Additional fields share one revisioned device draft; substantial content remains the primary section. `Not yet saved`, device draft and Library-saved provenance are distinct. Generator only records a handoff to its plan/review/apply owner and cannot mutate content. Delete opens a named review with child and relationship effects. Clean Tree selection reloads the matching document, while a dirty/saving/conflict editor stages a visible pending selection instead of overwriting work. Added no-entry/loading/new/saved/dirty/saving/conflict/validation/removed/read-only/offline/recovered states, 320/640/760 px base geometry, 420/600 px narrow/wide ideals, 900×720 focus and inert five-section Draft miniature using manifest-backed icons. | Two tests deliberately failed at 152/154 before the specialized editor existed. The first implementation passes 154/154, covering shared draft, substantial content, generator non-mutation, revision/unknown-field save, named deletion consequences, clean versus dirty Tree coordination, every provenance/recovery state, 200/420 px response, exact Back, inert preview and Panel-persistence exclusion. | Actual 220 px right-toolbar Entry summary and five-section navigator at 420 px height; actual 316 px compact Content editor with 422 px section body and 300 px deletion review; final 900×688 focused document with substantial content, Generator handoff and stable Save/Delete. | Tree switching deliberately waits behind dirty work; Generator remains a separate plan/review/apply Widget. No unresolved Widget defect. | Passed and frozen. |

## Lorebook Details

**Audit state:** Audited

**Functional floor:** this edits selected-book metadata, scope, parent,
inheritance and ordering; creates siblings/children; exports; makes or clears
canon; and deletes only after naming subtree and Story-association effects.
Every structural write refreshes the shared tree.

**Current failures:** title, scope and parent appear as inert rows without
origin, canon, inherited/disabled, revision, draft, valid-parent, structure
conflict or destructive consequence. The generic float looks writable but has
no safe concurrency contract.

**Overhaul:** use an ownership banner and semantic Details, Structure and
Advanced sections inside the shared document shell. Dock mode shows owner,
canon/association, parent and revision/read-only status; 420 px stages one
section; focus mode owns editing. Canon and delete use explicit consequence
dialogs; Additional preserves unknown metadata.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 560 px |
| Maximum in-place height | 720 px; editor body scrolls |
| 200 / 420 px response | 408 px owner summary / 536 px compact editor |
| Focused treatment | 840 x 680 px book editor |

**Catalog and acceptance:** show title, origin/scope, parent, canon and Draft.
Prove all ownership states, safe save prerequisite, structure/tree refresh,
canon authority, invalid parent/conflict, subtree warning, source removal, all
widths and no book data in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the inert metadata rows with one lossless, revisioned Lorebook document owner. Details, Structure and Advanced share a device draft with origin, Story scope/association, valid parent, inheritance, ordering, canon authority and unknown metadata. Save is revision-qualified and invalid parents block it. Child/sibling creation, export, canon changes and removal retain selected-book identity; every structural or authority write refreshes the shared Entry Tree. Canon and deletion open named consequence reviews, missing reusable sources can be cleared without discarding Story data, and no-book/loading/saved/dirty/saving/conflict/validation/invalid-parent/read-only/offline/source-missing/removed states are explicit. Added 320/560/720 px base geometry, 408/536 px narrow/wide ideals, an 840×680 focused owner and an inert three-section Draft miniature using manifest-backed icons. | Two purpose-built tests deliberately failed at 154/156 before the specialized owner existed. The first implementation reached 155/156; exposing the Tree's already-visible refresh receipt through the read-only inspection snapshot completed the authority proof. The full harness passes 156/156, covering shared-draft propagation, revision/unknown-field save, structural Tree refresh, export identity, all recovery states, invalid-parent save guard, source removal, canon and subtree consequences, 200/420 px response, exact focus Back, inert preview and Panel-persistence exclusion. | Actual 220 px right-toolbar owner summary and three-section navigator at 408 px; actual 316 px compact Details editor at its 560 px default; final 840×680 focused document and 824 px-wide canon consequence review with no overflow. | Focus mode deliberately retains quiet document canvas when the selected section is short; Structure and Advanced use the same bounded editor body. No unresolved Widget defect. | Passed and frozen; no second cycle required. |

## Lore Relationships

**Audit state:** Audited

**Functional floor:** this inspects and edits explicit directed Lore links—type,
target, label, notes, weight, bidirectionality and retrieval-follow state—
without confusing hierarchy, Story associations or prose mentions for links.

**Current failures:** three generic related-item rows omit direction, type,
follow, target scope, selection and editing. Fetch failure currently looks like
an empty list, while narrow values collide and the 420 px version wastes the
space needed to clarify link direction.

**Overhaul:** use directed relationship rows with source/target arrows, type,
label and Follow mark. Selecting or creating opens one staged editor with
explicit Save/Delete and target validation. An optional small one-link diagram
may clarify direction but never becomes a force graph. Preserve prior rows
during refresh and distinguish `No relationships` from failure.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 280 px |
| Ideal default height at 286 px | 480 px |
| Maximum in-place height | 680 px; relationship list/editor stages |
| 200 / 420 px response | 560 px list-then-editor / 440 px split list/detail |

**Catalog and acceptance:** show three directed rows with type and Follow mark.
Prove direction semantics, empty/error, new/dirty/saving/conflict, invalid or
missing target, unavailable scope, delete, source removal, safe revision
prerequisite, keyboard/touch, all widths and no link draft in layout.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced three ambiguous related-item rows with one selected-entry relationship owner. Three explicit directed records show source, arrow, target, semantic type and retrieval Follow state; selection opens one revisioned editor for target, type, label, notes, weight and follow behavior. New, edit, save and named delete operate on the selected explicit link only. Loading, ready, refreshing-with-last-good, error-with-last-good, true empty, new, dirty, saving, conflict, invalid target, missing target, unavailable scope, source-missing and read-only states are distinct. Added 280/480/680 px base geometry, 560/440 px narrow/wide ideals, a one-column list-then-editor minimum projection, two-column wide staging and an inert three-link diagram built from manifest-backed navigation/link icons. | Two purpose-built tests deliberately failed at 156/158 before the specialized owner existed. The first implementation reached 157/158 and proved direction semantics, shared-draft propagation, revisioned save, invalid-target rejection, delete, source removal, stale truth, empty/error distinction, keyboard navigation, responsive staging, inert preview and Panel-persistence exclusion. | Actual 220 px right-toolbar list-then-editor composition; actual 316 px split list/detail composition. | Fractional scaling left nominal 44 px actions just below the target floor, and the first wide split compressed endpoint identity. | Corrected in cycle 2. |
| 2 | Raised relationship actions to a stable 46 px floor, introduced a complete compact `Lore Links` placed identity below 240 px, widened the 420 px list allocation, and separated every source and target onto its own directed line while preserving the full accessible/Catalog name. | New assertions deliberately returned 157/158 on the missing compact identity and undivided endpoints. The corrected suite passes 158/158; final computed geometry records 45.99 px actions, a 132 px list pane at actual 316 px toolbar width, two endpoint children per row and no horizontal overflow. | Final actual 220 px projection with complete `Lore Links` identity and readable source/target lines; final actual 316 px split with 132 px directed list, selected relationship editor and pinned 46 px actions. | The compact list intentionally abbreviates long endpoint names visually but exposes each on its own line and repeats the complete selected pair in the adjacent diagram/editor. No unresolved Widget defect. | Passed and frozen. |

## Lore Generator

**Audit state:** Audited

**Functional floor:** generation plans a durable job, reports real progress,
then presents proposed books, entries and links for per-operation accept/reject
before one explicit, revision-guarded Apply. Generation itself writes nothing;
another launch locates the existing owner/job.

**Current failures:** Mode, Depth and Status plus `Generate lore` conceal the
essential review/apply boundary. There is no target, validation, job identity,
restoration, determinate/indeterminate progress, proposal ledger, partial
result, source-change guard, cancellation or failure truth. The float covers
Scene content and cannot survive as a workflow.

**Overhaul:** use Plan, Review and Apply stages with one stable job/status bar.
Plan owns target/depth/timeout/permission choices. Review lists each proposed
operation with type icon, destination, change summary and accepted state.
Apply alone mutates, then reports applied/refused items individually. Resume is
owner-driven; Check status replaces idle polling; discard confirms retirement
of unapplied work. Toolbar mode is status/resume only.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 640 px |
| Maximum in-place height | 760 px; current stage owns one scroll |
| 200 / 420 px response | 420 px job/status projection / 600 px staged workflow |
| Focused treatment | 920 x 720 px plan/review/apply workspace |

**Catalog and acceptance:** show Plan → Review → Apply and six mixed-acceptance
proposal rows, with no animation or working Generate. Prove no-write-before-
Apply, durable restoration, no polling, real progress, per-op decisions,
revision guard, partial/refused apply, discard, duplicate-launch locate, all
viewports and zero job/output in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced Mode/Depth/Status and a premature Generate action with one durable Plan → Review → Apply job owner. Plan captures the selected Lorebook, source revision, brief, depth, timeout and draft-only permission. Running exposes determinate or indeterminate host progress and user-initiated Check status; another launch locates the stable job instead of duplicating it. Review owns six typed operation rows with explicit destinations and mixed per-operation acceptance. Only Apply can write, and only against the captured revision; completion records applied, skipped and refused results individually. Restore, validation, cancellation, failure, offline, stale-source, complete, partial, refused and confirmed-discard states retain honest job authority. Added 320/640/760 px base geometry, 420/600 px narrow/wide ideals, a 920×720 focus portal and an inert six-proposal three-stage miniature using manifest-backed icons. | Two purpose-built tests deliberately failed at 158/160 before the specialized workflow existed. The first implementation passes 160/160, proving zero writes during Plan/generation/Review/applying, stable job identity, duplicate-launch locate, zero polling, explicit status checks, real progress, six mixed decisions, revision rejection, partial Apply, restoration, cancellation, discard retirement, 200/420 px staging, exact Back, inert preview and Panel-persistence exclusion. | Actual 220 px running job/status projection; actual 316 px six-row Review ledger; viewport-constrained 920×688 focused Review workspace with all six operations and pinned Apply/Discard actions. | At minimum width, the long runtime-state chip compressed the Widget identity to two characters. | Corrected in cycle 2. |
| 2 | Collapsed only the minimum-width header-state text to its manifest-backed status icon; the full job state remains the first body instrument and retains live announcement value. | A new compact-header assertion deliberately returned 159/160. The corrected suite passes 160/160 and records the full `Lore Generator` identity fitting its header, a 0.99 px visually-hidden state label and no module overflow. | Final actual 220 px running projection with complete title, stable job id, real progress and four icon-led owner actions; preserved 316 px and focused Review workspaces. | Toolbar mode deliberately leaves neutral space beneath the bounded job/progress instrument instead of exposing plan or review controls. No unresolved Widget defect. | Passed and frozen. |

## Lived-in Location Builder

**Audit state:** Audited

**Functional floor:** this captures a place brief, history horizon, language
where applicable, and per-Character route/guidance/known-private disclosure,
then invokes the one engine-owned generation operation through New Story,
Quick Start, reusable Lore or active-Story host context. It never simulates the
world in the browser and never replaces existing institutions.

**Current failures:** Place, Horizon and Characters rows plus `Build location`
hide host context, Story/Lore target, routes, guidance, public/private effects,
review, attach-then-generate, pipeline guard, progress, partial failure and
additive-only result. A large generic float over Scene provides neither useful
editing nor trustworthy consequences.

**Overhaul:** begin with an explicit context banner naming the captured host and
what execution will do. If only one route is viable, omit a redundant mode
choice. Stage Brief, History, Character routes and Review; the review names
Story, Lore attachment, resident-card exposure, private-history delivery and
additive generation. Host-owned draft recovery, captured owner, pipeline guard
and partial cleanup follow that host's contract. Success summarizes the created
institution and next destination without inventing a browser-side map.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 680 px |
| Maximum in-place height | 780 px; current step owns one scroll |
| 200 / 420 px response | 440 px context/resume projection / 640 px staged builder |
| Focused treatment | 960 x 740 px builder/review workspace |

**Catalog and acceptance:** show a named context, brief, horizon, two Character
routes and Review—never invented residents. Prove all four host modes, direct
single route, stale owner, attach-then-generate, New Story cleanup inheritance,
additive-only result, public/private disclosure, pipeline/offline/partial-
failure states, all viewports and no browser simulation or draft in layout.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced Place/Horizon/Characters rows and an unsafe generic Build action with one captured-host workflow over the production `generate_lived_location` operation. New Story, Quick Start, reusable Lore and active Story hosts carry exact identity and owner revision. Brief, History, Character routes and Review share one host-owned draft; a single viable execution route suppresses redundant choice. Two named Character routes expose guidance plus public resident/private-history effects. Review names the Story, Lore attachment, resident-card delivery, private history and additive-only preservation before execution. Reusable Lore enforces attach-then-generate, stale/pipeline/offline owners block execution, New Story inherits cleanup, and partial/success results name the created institution, preserved institution count and next destination without drawing a browser map or inventing residents. Added 320/680/780 px base geometry, 440/640 px narrow/wide ideals, a 960×740 focus portal and an inert four-stage/two-route miniature using manifest-backed icons. | Two purpose-built tests deliberately failed at 160/162 before implementation. The first implementation reached 161/162, proving all four host modes, shared draft, single-route suppression, Character disclosures, named Review, exactly one production invocation, additive/partial results, every recovery/guard state, attach-then-generate, cleanup inheritance, focus return, inert preview and Panel-persistence exclusion. | Actual 220 px running context/resume projection; initial 420 px staged fixture and focus geometry. | Minimum toolbar authoring was visually clipped but remained a layout participant instead of a true status-only projection. | Corrected in cycle 2. |
| 2 | Made the minimum authoring workspace truly absent from layout and converted Brief, History, Routes and Review from passive labels into 46 px keyboard/touch buttons with `aria-pressed` state. Kept the compact visible `Location Builder` identity while retaining the full accessible/Catalog name. | The responsive correction restored 162/162; a subsequent stage-navigation assertion deliberately returned 161/162 until the four controls became real buttons. The final suite passes 162/162 and records four 45.99 px controls, exact active-state semantics, a 960×688 viewport-constrained focus, 445 px Review surface and no overflow. | Final actual 220 px captured Active Story/job projection; final actual 316 px Review with Story, Lore, private-history and additive receipts; final 960×688 focused Review with keyboard/touch stage navigation and pinned Generate. | Focus Review intentionally retains quiet canvas below four bounded consequence receipts. No unresolved Widget defect. | Passed and frozen. |

# Audited slice: Story-System Widgets

## Cross-slice visual, authority, and placement evidence

- All twenty-one Catalog previews were inspected individually. Each one uses
  the same prose/tags/three-row/card-footer skeleton regardless of whether the
  real purpose is roster management, a five-rung ceiling, a protected editor,
  a host diagnostic, or a destructive fixed-point change. The repetition
  erases consequence, privacy, and task hierarchy.
- The default Scene gives compact dock slots to World State and Promise Ledger.
  At 200 px their tab labels and values truncate; at 420 px their rows simply
  lengthen. The current World State is only four metrics and the Promise Ledger
  incorrectly labels subjective remembered promises `Active`/`open`.
- Cast was placed and inspected at 200 and 420 px. At 200 px the title tab,
  description and selected name truncate and its 28 px action is crowded; at
  420 px the same three values occupy a mostly empty shelf. Other one-column
  Modules inherit the same failure. Their redesigns below alter row anatomy and
  staging rather than stretching this template.
- Attire was placed as a representative two-column editor. It became a roughly
  half-screen float over the Transcript yet still showed only Wearers,
  Garments and Selected. World State, Genre and Style, Dialogue and Agency,
  Institutions, diagnostics, protected histories, and paradox authoring share
  this wide/floating mismatch unless a specific compact projection is added.
- Runtime authority remains split even where the UI groups controls. Dialogue
  and Agency, Off-screen Life, and Background Life merge distinct slices of one
  dialogue document; Living World has one shared Scene/Settings owner; Genre
  and Style coordinates four owners and reports four receipts. Partial writes
  never become a green aggregate `Saved` badge.
- `World State` is not permission to replace all raw world rows. Cast, Attire,
  conditions, private histories, frames and institutions retain specialized
  owners. Host diagnostics, private memories, subjective relationships and
  paradox evidence never enter guest/player projections, model cognition, or
  Panel persistence.
- Catalog miniatures use synthetic, non-private data and inert affordances.
  Icons come from the approved Minimal UI manifest; privacy, consequence and
  status still have adjacent text, and color is never their sole carrier.

## Cast

**Audit state:** Audited

**Functional floor:** manage the active Story roster: attach a reusable
Character, set active/dormant state, position them in a current-frame room or
off screen, select automatic/pinned dialogue color, and open their Story
Character Card. Row mutations capture Story/frame/Character, serialize only
conflicts, reload server truth, and name arrival/departure or silent-position
consequences.

**Current failures:** Registered, Present and Selected counts are not a roster.
There are no people, portraits, rooms, active/dormant state, color, row busy/
failure, source-missing, no-Story or pipeline-guard states. `Open selected
Character` appears below a generic note and at 200 px the selected name collides
with its label. At 420 px most of the shelf is unused.

**Overhaul:** use compact participant cards with identity mark, active/dormant,
current frame/location, source health and dialogue-color swatch. Selecting a
row stages actions; Position uses a room/off-screen chooser, Dormant names the
departure consequence, and Attach delegates reusable discovery to Characters
(Story). Keep Condition and Attire out. Busy/error state stays on its row and
does not freeze unrelated participants.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 300 px |
| Ideal default height at 286 px | 500 px |
| Maximum in-place height | 680 px; roster becomes the one scroller |
| 200 / 420 px response | 560 px stacked cards / 440 px two-column cards |

**Catalog and acceptance:** show four synthetic people with location, activity
and color marks. Prove attach/dormant consequences, frame-qualified position,
automatic color, row busy/error restoration, missing source/room, pipeline
guard, strict association/condition/attire boundaries, all widths, keyboard/
touch, and no roster data in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced Registered/Present/Selected counters with four complete Story participant cards carrying identity mark, active/dormant state, Present-frame room or Off screen, source health, automatic/pinned color mode and resolved swatch. One shared selection stages frame-qualified Position, named dormant/restore consequence, explicit or automatic color and Story Character Card handoff. Attach delegates reusable discovery to Characters (Story). Every mutation captures Story, revision, frame and Character, marks only its row busy, reloads accepted server truth, or retains last truth with a row-local error; unrelated participants remain interactive. Loading, error-with-last-truth, empty, no-Story, pipeline guard, source-missing and missing-room states are explicit. Condition, Attire and private state are structurally absent. Added 300/500/680 px base geometry, 560/440 px narrow/wide ideals, one roster scroller and an inert four-person miniature using approved manifest icons. | Two purpose-built tests deliberately failed at 162/164 before implementation. The first implementation reached 163/164; consequence copy was then made explicit enough to prove departure and silent-position semantics. The suite passed 164/164, covering shared/keyboard selection, qualified position, dormant settlement, automatic color, owner handoffs, row isolation/error restoration, host guards, missing source/room, 200/420 px response, inert preview and Panel-persistence exclusion. | Actual 220 px stacked roster with 3.5 visible 76 px cards and one roster scroller; initial actual 316 px two-column roster. | Activity text consumed most of each narrow two-column card, truncating names to initials; the Automatic color label also collapsed to a text fragment. | Corrected in cycle 2. |
| 2 | Converted activity into a compact 5 px semantic badge, reduced only the two-column portrait/gap/swatch geometry, preserved complete identity and evidence lines, and made Automatic color a manifest-backed icon-led action with its full accessible name and tooltip. Touch targets remain 46 px. | A participant-fit assertion deliberately returned 163/164 until all four names fit; a second icon-action assertion held the gate red until the truncated text became visually hidden. The final harness passes 164/164. Computed proof records all four names with `scrollWidth <= clientWidth`, 5 px activity badges, a 0.99 px hidden Automatic label, complete accessible name and no module overflow. | Final actual 220 px stacked cards with readable names/status and clean icon-led color action; final actual 316 px two-column cards with Mara Venn, Ilex, Old Ferryman and Sable Wake intact. | At minimum width the fourth card is reached through the roster's intentional single scroll; selection actions remain pinned. No unresolved Widget defect. | Passed and frozen. |

## Background Presences

**Audit state:** Audited

**Functional floor:** inspect recurring unsheeted bodies with first/last turn,
dialogue/mention evidence and promotion eligibility; prepare an owner-qualified
Character draft; review sheet, starter memories, aliases, membership, position,
attire and recognition; then confirm the only write. Promotion is forward-only
and cleans future background aliases without rewriting past turns.

**Current failures:** Tracked, In earshot and `1 candidate` hide the identities
and evidence necessary to review promotion. There is no eligibility reason,
draft task, collision warning, recoverable review, confirmation consequence,
stale-presence or partial-failure state. The compact card looks like telemetry
even though the action can mint a permanent Character.

**Overhaul:** list presence rows with stable engine label, current/last room,
first/last seen turn, evidence counts and explicit eligible/not-yet reason.
`Prepare promotion` registers a Background Work task, then opens a staged review
with editable result, per-line memories, collision/alias warnings and exact
target. Confirm is visually dominant only in Review; Cancel retains or
discards the qualified draft explicitly.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 300 px |
| Ideal default height at 286 px | 520 px |
| Maximum in-place height | 700 px; presence list/review stage owns scroll |
| 200 / 420 px response | 600 px list-then-review / 468 px list plus detail |

**Catalog and acceptance:** show three evidence rows and one `Review promotion`
marker, never a generated sheet. Prove task handoff, evidence revision,
recoverable review, collision warning, forward-only confirmation, alias cleanup,
past-turn preservation, policy boundary, all widths and no private draft in
Catalog or Panel data.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced Tracked/In-earshot counters and the premature Promote action with three stable recurring-presence rows carrying current/last room, first/last turn, dialogue/mention evidence, evidence revision and an explicit eligible/not-yet reason. Prepare creates an exact presence/revision-qualified Background Work task and writes no Character. The returned Review owns the fixed target, editable Character name, empty opening-message rule, per-line first-person memory seeds, card warning, Story membership, frame position, opening attire and mutual-recognition consequences. Collision and stale evidence block Confirm; recovered Review offers Resume or Discard; partial failure retains both qualified draft and tracked presence. Confirmation alone writes once, starts agency next turn, records zero past-turn changes and removes every future alias of the same body. Automatic-promotion policy is shown separately from manual Review availability. Added 300/520/700 px base geometry, 600/468 px narrow/wide ideals and an inert three-evidence-row Catalog miniature using approved manifest icons. | Two focused tests deliberately failed at 164/166 before the specialized owner existed. The first implementation then passed 166/166, covering shared/keyboard selection, evidence and eligibility, Background Work handoff, zero writes before Confirm, editable memories, Story/presence/evidence revision qualification, one forward-only write, past-turn preservation, alias cleanup, every recovery/guard state, policy separation, touch targets, responsive staging, inert preview and Panel-persistence exclusion. | Actual 220 px list-first Catalog with three complete rows and pinned Prepare/Refresh actions; initial actual 316 px Review; synthetic 420 px list-plus-detail workspace. | At the actual 316 px toolbar maximum, the initial two-pane split compressed both presence names and the consequence Review into narrow columns. | Corrected in cycle 2. |
| 2 | Moved the list-plus-detail breakpoint to 360 px. Every supported left/right toolbar width now uses an explicit Catalog → focused Review transition, while wider placements retain the simultaneous list and detail workspace. Restored the pre-existing Character Card breakpoint after the scoped responsive edit exposed an accidental neighboring selector change. | A new 316 px assertion deliberately returned 165/166 on the cramped split. After the correction, the complete harness passes 166/166, including the restored Character Card responsive contract. | Final actual 316 px focused Review with full target identity, complete editable fields, four consequence receipts, warning and one internal scroller; preserved actual 220 px Catalog and 420 px split workspace. | The focused Review intentionally removes the evidence list at toolbar widths; its exact presence name, evidence turns and evidence revision remain pinned at the top of Review. No unresolved Widget defect. | Passed and frozen. |

## World State

**Audit state:** Audited

**Functional floor:** inspect and author bounded structured records for the
current frame—Rooms, Entities, Placements, Standing Conditions and other typed
domains. The existing all-frame raw `/world` replacement remains a named
maintenance escape hatch, not the Widget's save path. Until conditional bounded
routes exist, normal editing is read-only.

**Acceptance-audit failure:** the first specialized implementation had the
right bounded world functionality but still failed its placed projection. At
200 px it hid the typed-section workspace, broke the Story identity into
fragments, clipped orientation facts, and reduced the Widget to a generic
Focus launcher. At 420 px it compressed orientation into four clipped columns,
truncated section/record meaning, and underused the available width.

**Overhaul:** preserve a compact orientation header and expose the typed-section
path in every placement. At 200 px, a two-by-two icon-led section navigator
replaces itself with the selected record detail and a visible Back control. At
420 px, orientation uses two readable columns above a section rail and record
detail. Primary meaning wraps only at word boundaries; secondary facts and
counts disclose progressively. Unsupported domains remain read-only and link
to `Open Raw Story Data` with the all-frame overwrite consequence. Empty allows
Add first record.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 620 px |
| Maximum in-place height | 760 px; section/record body scrolls |
| 200 / 420 px response | 400 px staged section path / 580 px rail-plus-detail workspace |
| Focused treatment | 900 x 720 px structured world editor |

**Catalog and acceptance:** show a synthetic room/entity summary and
`Structured view`, never raw JSON. Prove current-frame scope, no whole-world
write, typed validation/conflict, first record, specialized-owner protection,
normalized reload, pipeline guard, all viewports and safe persistence.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced Location/Time/Weather/Frame rows masquerading as a world editor with a current-frame orientation instrument and four typed sections: Rooms, Entities, Placements and Standing Conditions. Each section carries count, salient summary, stable records and an explicit owner/capability boundary. The default projection is read-only because Main exposes only an all-frame raw replacement; Placements delegates to Cast. A simulated bounded capability can stage one Story/frame/section/record-qualified typed draft, enforce validation, retain conflict drafts, guard a running pipeline and reload normalized server truth while recording zero whole-world writes. Empty supports a bounded first-room flow. Raw Story Data requires a consequence review that names replacement of every stored key across present and all frames, then opens the maintenance owner without invoking it. Added 320/620/760 px base geometry, 400/580 px narrow/wide ideals, a 900×720 focus portal, exact Back and an inert room/entity `Structured view` miniature using approved manifest icons. | Two focused tests deliberately failed at 166/168 before the specialized renderer existed. The first implementation passed its authority/behavior slices and the full 168/168 after the preview contract was updated from the retired effects miniature. Coverage proves shared/keyboard section selection, current-frame orientation, read-only default, specialized-owner handoff, explicit all-frame raw consequence, zero raw writes, bounded typed qualification, normalized reload, first record, invalid/conflict/pipeline guards, responsive staging, focus return, inert preview and Panel-persistence exclusion. | Initial actual 220 px default Scene placement and actual 316 px section workspace; 420 px split fixture; 900×720 focused section records. | The live default Scene still displayed the inherited four-row World State even though newly rendered and Catalog instances used the specialized surface. | Corrected in cycle 2. |
| 2 | Replaced the default legacy World State mount through `createWorldStateModule`, converging default, placed, preview and focus entry paths on one renderer. The bootstrap retains the existing Widget identity and placement while adopting the structured current-frame UI. | A live-default assertion deliberately returned 167/168 on the legacy mount. The corrected full harness passes 168/168 and the default Scene now matches `[data-world-state-widget]`. | Final actual 220 px default orientation projection with Focus/Raw Data pinned; final actual 316 px four-section navigator; final focused records/detail with read-only bounded-route notice and disabled Save. | At minimum width the default-height projection intentionally leaves quiet capacity between orientation and pinned actions instead of exposing a partial editor. No unresolved Widget defect. | Passed and frozen. |
| Corrective acceptance audit | Applied the new responsive semantic-utility contract to the previously frozen Widget. The compact projection now keeps the full Story identity, four complete primary orientation values, four icon-led typed-section choices, selected detail, one local scroller and a manifest-backed Back control. The wide projection now uses a readable two-column orientation grid, a 170 px minimum section rail and wrapping record content. `navigation.previous` and `navigation.next` remain the accepted manifest SVGs; no shell, toolbar, navigation or Composer selector changed. | The two new tests first failed together at 206/208 on the exact defects: the 200×320 fixture hid/starved typed sections and the 420×580 fixture compressed orientation into four clipped columns. All four World State contracts pass in the fresh 210-test harness. The aggregate is 203/210 because seven concurrent failures name Theme Library/Settings, Turn Versions, Off-screen Life, Settings ownership and the Custom Theme preview—not World State. | Actual 200 px dock with complete Story/orientation facts and a two-by-two section navigator; actual 420 px dock with two-column orientation and rail-plus-detail workspace; exact hidden fixtures at 200×320 and 420×580. Evidence: `evidence/world-state-compact-corrected.png` and `evidence/world-state-wide-corrected.png`. | The compact projection intentionally moves counts and summaries behind section selection so complete section names and 44 px targets survive. The wide rail/detail regions scroll independently only where their bounded content exceeds the height. No unresolved World State defect. | Passed and frozen under the corrected contract. |

## Attire

**Audit state:** Audited

**Functional floor:** inspect and silently author the current-frame attire
ledger by wearer, garment, body region, layer order, worn/open/loosened/removed
state, condition, attachment, coverage and beneath relationships. One draft
saves the ledger and reloads normalized `wearing/state/regions` before Saved.

**Current failures:** Wearers, Garments and a selected coat do not expose the
ledger or allow an edit. There is no wearer navigator, region anatomy, layer
order, garment state, draft, validation, pipeline guard, normalization or
silent-fiction consequence. As a float, its large empty card obscures the
Transcript; it has no useful 200–420 px projection.

**Overhaul:** dock mode shows selected wearer, coverage silhouette, salient
layers, draft/read-only state and Focus. At 420 px it stages wearer navigation
beside one region/layer editor; focus mode exposes all semantic regions and an
Advanced lossless JSON disclosure. Reorder has buttons/keyboard parity with
drag. Save is guarded, reloads normalization, and states that changes affect
future visibility/prompts without narrating an action.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 660 px |
| Maximum in-place height | 780 px; region/layer editor scrolls |
| 200 / 420 px response | 420 px wearer/coverage summary / 620 px staged editor |
| Focused treatment | 900 x 740 px attire workspace |

**Catalog and acceptance:** show two abstract wearer silhouettes with region/
layer marks, not clothing art. Prove every region/state, layer order, lossless
Advanced, empty first wearer, draft recovery, invalid coverage, pipeline guard,
normalization reload, all viewports and no attire/draft in layout.

### Phase 2 implementation evidence

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Replaced the inert Wearers/Garments/Selected summary with a specialized present-frame attire owner. The dock projection names the selected wearer, maps covered/partial/exposed anatomy, and lists salient garment layers. The complete workspace exposes two wearers, all eight runtime regions in anatomical order, outermost-first layers, explicit worn/loosened/open/removed state, garment condition, zoned torso coverage, attachment-without-coverage semantics, beneath facts, reorder buttons and Alt+Arrow parity. One shared draft is qualified by Story, revision, Frame and wearer; Save represents the actual whole-ledger PUT, guards invalid coverage and a running pipeline, retains recoverable/conflicting work, and reloads normalized `wearing`, `state` and `regions`. The receipt explicitly says silent authoring changes future visibility/prompts without narrating an event. Added empty/no-Story/loading/error/offline/read-only states, first-wearer creation, exact focused Back, Advanced lossless runtime JSON, 320/660/780 px base geometry, 480/620 px narrow/wide ideals after the shared Widget legibility correction, 900×740 focus, and an inert two-silhouette Catalog preview using approved manifest icons. | Two purpose-built tests deliberately failed at 168/170 before the renderer existed. Cycle 1 reached 170/170, proving shared and keyboard wearer selection, every semantic region, ordered layers and keyboard parity, state/condition/zoned coverage edits, attachments, qualified one-ledger save, zero pre-settlement writes, server normalization, silent consequence copy, recovery/conflict/invalid/pipeline states, first wearer, 200/316/420 px staging, focused Advanced JSON, exact return, inert preview and Panel-persistence exclusion. | Actual 220 px right toolbar, actual 316 px right toolbar, 420 px fixture and 900×740 focus portal. | At 220 px the compact projection occupied only a small middle card and left most of its default height unused. In Focus, the dense region/layer editor inherited glass too transparent to separate its controls from the Story and right dock below it; the Back action was present but not visually dependable. | Corrected in cycle 2. |
| 2 | Turned the minimum-width projection into a height-aware coverage instrument: its abstract silhouette, complete coverage count and five salient layers now use the available vertical capacity instead of a one-row miniature. Added a scroll floor that keeps at least several layers visible. Focus now receives an opaque ambient shield and blur, reserves header space for a visible icon-led Back control, removes the redundant bottom Focus action and gives Save the full action row. | Tightened the responsive test to require five layer records, a substantial coverage silhouette, a minimum useful projection/layer viewport, an opaque focused background, a visible 60+ px Back action and no redundant Focus control. The final full browser harness passes 170/170. | Final actual 220 px coverage/layer projection with three layers immediately visible and the rest in one local scroller; final actual 316 px eight-region navigator; final 900×740 focus showing wearer rail, all-region rail, selected torso layers, state/condition/coverage editor, full-width Save and visible Back. | No unresolved Widget defect. | Passed and frozen. |

## Genre and Style

**Audit state:** Audited

**Functional floor:** coordinate four real owners: Style Guide (genre, tone,
weather, Director/Mapping notes, avoid guidance), Story language, Player
Authority, and Condition Policy including atomic starter-vitals seeding. Each
section has its own draft, save receipt and refresh.

**Current failures:** Genre, Narration and Survival seeding flatten four
services into three values and imply one atomic setting. Language-pack impact,
authority consequences/history, condition seeding/preservation, owner-specific
errors and partial Save all are absent. The wide empty float offers no viable
compact workflow.

**Overhaul:** show four owner tiles with icon, status, concise current value and
Open. At 420 px stage one section; focus mode presents all sections with a
receipt ledger. `Save all` is an orchestrator and reports each result rather
than collapsing partial success. Language distinguishes Story/model from host
UI. Enabling condition names frame and seeded participants; disabling never
claims to delete records.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 640 px |
| Maximum in-place height | 760 px; active owner section scrolls |
| 200 / 420 px response | 420 px owner/status summary / 600 px staged section |
| Focused treatment | 900 x 720 px four-owner editor |

**Catalog and acceptance:** show four compact owner cells, not three metrics.
Prove independent receipts, partial truth, missing language pack, authority
history/consequence, condition seed/preservation, normalized reload, active-run
constraints, draft recovery, all viewports and safe persistence.

### Phase 2 implementation evidence

| Cycle | Implemented correction | Functional evidence | Visual evidence | Remaining problem | Disposition |
|---|---|---|---|---|---|
| 1 | Replaced the inert Genre/Narration/Survival summary with a specialized coordinator for four actual service owners: Style Guide, Story Language, Player Authority and Condition Policy. Each owner now has a manifest-icon tile, concise accepted value, shared keyboard selection, its own draft, route-qualified operation and normalized or failed receipt. Style exposes genre, tone, the closed weather ceiling, Director/Mapping notes and avoid guidance while naming its prompt-only boundary. Language distinguishes stored/effective/installed pack identity, Story/model output and the separately owned host interface language. Authority renders the engine-served three-rung grant ladder plus change history and no-op semantics. Condition names the chat-global toggles, Present-frame seed target, seeded participants, idle/atomic enabling and record-preserving disabling. Save owner writes one route; Save all orchestrates only dirty owners and retains accepted truth beside a failed draft, with isolated Retry failed. Added loading, error, empty, no-Story, dirty, recovered-draft, saving, partial, conflict, pipeline-running, missing-pack, normalized, offline and read-only states; 320/640/760 px base geometry, 420/600 px narrow/wide ideals, 900×720 focus; and an inert four-owner Catalog miniature using approved manifest icons. | Two purpose-built tests deliberately failed at 170/172 before the specialized owner existed. Cycle 1 passed 172/172, proving owner order and shared/keyboard selection; normalized style editing; Story/revision/route/frame/turn qualification; zero pre-settlement writes; language ownership; authority grants/history; condition seed/preserve semantics; partial Save all and isolated retry; recovery/guard states; 200/316/420 px staging; Focus/Back; inert preview; and exclusion of service values and drafts from Panel persistence. | Actual 220 px right toolbar, actual 316 px right toolbar and 900×720 Focus portal. | At 220 px the four-column receipt ledger and inactive owner/all-save controls read as tiny broken controls beneath an otherwise useful owner projection. In Focus, the flexible grid row was assigned to status, creating a large empty band above the four real owner sections. | Corrected in cycle 2. |
| 2 | Reduced the minimum-width projection to four complete owner cards plus one clear Focus action; receipts and mutation controls remain available in the staged editor rather than collapsing into miniatures. Reassigned Focus geometry to context, compact status, a flexible two-by-two owner workspace, receipt ledger and action row; stretched both owner rows through the recovered height so the surface has no dead band. | Tightened the responsive test to require the receipt ledger and inactive saves to leave the 200 px projection, retain 44 px visible targets, keep a sub-60 px Focus status band and reserve at least 250 px for the four-owner workspace. The final complete browser harness passes 172/172. | Final actual 220 px four-owner summary with a single full-width Focus action; final actual 316 px owner rail plus one complete Style Guide editor; final 900×720 Focus with balanced Style, Language, Authority and Condition sections, four receipt cells, visible Back and owner/all-save actions. | No unresolved Widget defect. | Passed and frozen. |

## Dialogue and Agency

**Audit state:** Implemented and accepted

**Functional floor:** edit the dialogue-config slice for pacing, min/max lines,
variance, autonomy, NPC initiative, NPC-to-NPC dialogue, stop rules, silence,
opening reactors 1–12 and isolated reactors. Preserve unknown keys, coordinate
unsaved sibling slices, reload server clamps, and show derived call budgets as
read-only consequences.

**Current failures:** Dialogue, Agency and First reactor expose none of the real
controls or their dependencies. There is no validation, next-turn semantics,
shared-document conflict, clamp result or derived budget. `First reactor` also
misnames the configurable opening-reactor count.

**Overhaul:** group Pacing, Agency, Stop rules and Opening response with compact
icon disclosures. Dependent controls leave the focus order when unavailable.
Show a plain-language derived budget and `Applies to next turn` during a run.
One shared merge service saves only this slice, preserves other drafts/unknown
keys and visibly reports server normalization.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 300 px |
| Ideal default height at 286 px | 560 px |
| Maximum in-place height | 700 px; active group scrolls |
| 200 / 420 px response | 400 px status/group summary / 520 px staged controls |
| Focused treatment | 820 x 680 px behavior editor |

**Catalog and acceptance:** show autonomy/pacing, opening-reactor control and
derived budget. Prove exact slice ownership, min/max validation, clamp, future-
key preservation, sibling-draft coordination, next-turn semantics, all widths
and absence of Background/Living fields.

### Phase 2 implementation evidence

| Cycle | Implemented correction | Functional evidence | Visual evidence | Remaining problem | Disposition |
|---|---|---|---|---|---|
| 1 | Replaced the inert Dialogue, Agency and First reactor rows with one specialized active-Story editor for the owned `dialogue_config` slice. The Widget now stages Pacing, Agency, Stop rules and Opening response; validates minimum/maximum lines; exposes the server-derived 1/1 through 12/18 round/call budget; disables isolated opening reactions until more than one opening reactor exists; qualifies every save by Story, Story revision, document revision and route; omits derived fields so the server recalculates them; preserves accepted unknown keys, off-screen sibling fields and an unsaved sibling draft; and writes only after accepted settlement. Added ready, loading, error, no-Story, dirty, invalid, saving, normalized, active-run, conflict and offline states, next-turn copy, Retry/Reload recovery, 300/560/700 px base geometry, 400/520 px narrow/wide ideals, an 820×680 Focus editor and an inert four-signal Catalog miniature built only from approved manifest icons. | Two purpose-built acceptance tests failed before the specialized owner existed. Cycle 1 then passed 179/179, proving owned-field and request qualification, zero pre-settlement writes, normalization, conflict and active-run handling, unknown/sibling preservation, derived budgets, dependency/focus behavior, 200/286/420 px staging, Focus/Back, inert preview and exclusion of values and drafts from Panel persistence. | Actual 220 px and 284 px right-toolbar placements, actual 410 px maximum toolbar placement, Catalog preview and 820 px Focus portal. | At 220 px the full title and revision competed for the header, while the context sentence wrapped word by word. At 284 px the context, status and receipt bands consumed too much of the editor. At 410 px the three short pacing fields wrapped to two rows. | Corrected in cycle 2. |
| 2 | Introduced the truthful compact title `Dialogue` and `R42` revision only below 240 px; reduced the 200–399 px context, status and receipt bands to one 30 px evidence row apiece while retaining their full accessible labels; and kept all three pacing fields on one row at 400 px and above. The final component uses the Atmospheric Workbench's compact per-component hierarchy with 44 px interactive targets. | The final complete browser harness passes 179/179 after the responsive corrections. | Final actual 220×400 summary with four complete group cards and one Focus action; final actual 284×560 staged editor with 30 px context/status/receipt rows and a 298 px editor viewport; final actual 410×520 rail/editor with no horizontal overflow; final 820×680 Focus view with all four groups visible together, balanced height, visible Back and actions, and independent group scrolling. | No unresolved Widget defect. | Passed and frozen. |

## Off-screen Life

**Audit state:** Implemented and accepted

**Functional floor:** select the canonical inert → deterministic → reactive →
stochastic → character_agent simulation ceiling and paid-actor cap 0–12; show
built status, permitted consequence/cost, requested versus effective ceiling,
Living World requirement and Character-level opt-in boundary. A ceiling never
promises that work will occur.

**Current failures:** Level, opt-in count and due-plan count conceal the ladder,
cap, availability, effective clamp, cost and explanatory distinction between
permission and instruction. The generic `Eligible plans` tag looks like an
action but is not. No dirty/save/conflict or next-turn state exists.

**Overhaul:** use a vertical five-rung radio ladder with engine vocabulary,
short descriptions, built/unavailable marks and requested/effective indicators.
Current Main declares all five rungs built; the Widget still obeys each
server-provided built flag so a future unavailable rung cannot masquerade as live.
Place actor cap and eligible-count evidence below it; zero explains that paid
ticks stop without erasing the ceiling. Save through only its shared
dialogue-config slice and link Character opt-in to the card owner.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 240 px |
| Ideal default height at 286 px | 420 px |
| Maximum in-place height | 560 px; ladder remains unscrolled at default |
| 200 / 420 px response | 480 px vertical ladder / 380 px ladder plus evidence |
| Focused treatment | 820 x 640 px ceiling and eligibility editor |

**Catalog and acceptance:** show selected rung, actor cap and eligible-now
evidence. Prove all five exact engine rungs, ceiling-not-instruction, dynamic
built flags while current Main reports all five built, clamp/dependency, zero
cap, no candidate, Character opt-in boundary, shared save, next-turn state, all
widths and safe persistence.

### Phase 2 implementation evidence

| Cycle | Implemented correction | Functional evidence | Visual evidence | Remaining problem | Disposition |
|---|---|---|---|---|---|
| 1 | Replaced Level, Character-agent opt-ins and Due plans with a specialized active-Story editor for the two-field Off-screen Life slice. It renders the server-ordered `inert`, `deterministic`, `reactive`, `stochastic`, `character_agent` ladder; current Main built marks; cumulative consequence and cost; a 0–12 actor cap; explicit ceiling-not-instruction language; read-only opt-in, private-reason, eligible-now and maximum-call evidence; Living World antagonist-ceiling and Character-card handoffs; and the exact two-call Character/Director split for a paid full-agent tick. Saves are Story, Story-revision, document-revision, route and owned-field qualified, preserve unknown accepted keys and an unsaved Dialogue and Agency sibling draft, and write only after settlement. Added ready, loading, error, no-Story, dirty, cap-zero, saving, normalized, active-run, conflict, offline, no-candidates and server-marked-unbuilt states; 240/420/560 px base geometry, 480/380 px narrow/wide ideals, an 820×640 Focus editor and a manifest-icon Catalog miniature. | Two purpose-built tests failed at 179/181 before the specialized owner existed. Cycle 1 passed 181/181 after implementation, proving exact rung order and shared selection, current built evidence, composed Character-agent gates and cost, zero-cap semantics, two-field save ownership, unknown/sibling preservation, normalization, operational states, dynamic unbuilt handling, 200/316/420 px layouts, Focus/Back, inert Catalog preview and exclusion of service truth/drafts from Panel persistence. | Catalog card; actual 220×480 compact placement; actual 284×420 default placement; actual 410×380 maximum placement; 820×640 Focus; and focused Character-agent dirty state. | At compact and default widths the full ladder was visible, but the actor cap sat below the long detail scroller. The primary bound could not be inspected or changed without scrolling past status and consequence copy. | Corrected in cycle 2. |
| 2 | Added a persistent `Paid actors per epoch` control directly beneath Story context for every placement below 400 px and synchronized it with the same shared draft. The full consequence panel retains its cap at 400 px and Focus while the compact duplicate leaves rendering and focus order there. This preserves all five rungs and the one intentional detail scroller without hiding the highest-impact bound. | Tightened the responsive acceptance test first; it failed at 180/181 because no persistent cap existed. The final complete browser harness passes 181/181 and proves the compact cap is visible with a 44 px target at 200 and 316 px, then absent rather than duplicated at 420 px. | Final actual 190×480 minimum placement with compact title, Story revision, persistent cap, five-rung ladder and Focus; final actual 286×420 default with the same complete decision surface; final 410×380 two-column ladder/consequence view with no duplicate cap or horizontal overflow; final 820×640 Focus with all five rungs, cost, eligibility gates, handoffs, Back and actions; Character-agent state shows 2 opted in, 1 private reason, 1 eligible now and 2 maximum calls. | No unresolved Widget defect. | Passed and frozen. |

## Living World

**Audit state:** Implemented and accepted

**Functional floor:** configure the four built autonomous-world approaches—
routine residue, scheduled consequences, places that owe a history, and the
antagonist ladder—with requested Off/Floor/Ceiling, built status, required
off-screen ceiling, effective depth and cost. Scene and Settings join one
active-Story owner; all defaults are Off. Facts still reach minds only through
witnessing or physical information routes.

**Current failures:** three On/count rows imply a monitor rather than four
editable approaches and hide defaults, requested/effective differences,
off-screen clamps, cost and unbuilt status. The current medium registry role can
dock, but at compact width the generic rows do not explain consequences; the
Settings alias risks looking like a second global owner.

**Overhaul:** render four approach rows with a real three-state selector,
requested/effective marker, short consequence/cost copy and dependency link.
At 200 px show status and stage one approach; at 420 px expose all four compactly.
One shared draft/save receipt follows the active Story and never falls back to
the first Library Story. A boundary note says that a fired event is fact, not
broadcast knowledge.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 300 px |
| Ideal default height at 286 px | 560 px |
| Maximum in-place height | 720 px; approach detail is the one scroller |
| 200 / 420 px response | 600 px staged approaches / 500 px four-row editor |
| Focused treatment | 900 x 700 px complete four-approach editor |

**Catalog and acceptance:** show all four approaches with requested/effective
and cost marks. Prove no-Story/no fallback, all-Off default, mixed/clamped/
unbuilt states, shared Settings owner, next-turn semantics, information-route
boundary, all widths and no world state in Panel persistence.

### Phase 2 implementation evidence

| Cycle | Implemented correction | Functional evidence | Visual evidence | Remaining problem | Disposition |
|---|---|---|---|---|---|
| 1 | Replaced the inert three-row monitor with one specialized active-Story editor for all four exact engine approaches: `routine_residue`, `scheduled_consequence`, `place_obligations`, and `antagonist_ladder`. Each row keeps requested Off/Floor/Ceiling separate from the highest currently built and Off-screen-Life-permitted effective depth; unbuilt and unpermitted ceilings remain declarable rather than becoming disabled lies. The shared `story-living-world` draft is qualified by Story, Story revision, document revision and `/living_world` route, persists exactly four approach keys, omits `offscreen_life`, and writes only after accepted settlement. Added ready, loading, error, no-Story, all-Off, dirty, saving, normalized, active-run, conflict, offline, clamped and unbuilt states; Reload/Retry recovery; next-turn copy; the fact-not-knowledge witness/carrier/route boundary; 300/560/720 px base geometry, 600/500 px narrow/wide ideals, 900×700 Focus and a four-cell inert Catalog miniature using approved manifest icons. | The two new purpose-built contracts failed at the red gate while all 181 established checks passed. After implementation, the ownership/save contract passed and the responsive contract identified nominal 44 px controls rendering at 43.99 px under fractional browser scaling. | Actual 220 px toolbar placement, 286 px default staging, 410 px wide toolbar, 900×700 Focus, and focused clamped state. | The real target-size shortfall was below the contract by a fractional pixel. At 410 px the requested/effective suffix could consume the approach label. Focus showed the lower two approach editors only after scrolling and left a third action column empty once Focus itself was hidden. | Corrected in cycle 2. |
| 2 | Raised only Living World controls to a 46 px CSS minimum so their transformed browser box remains at least 44 px; moved each rail status beneath its approach label; changed the focused depth controls into compact three-way segments; and let Save/Discard fill the focused action row. All four complete approach editors now fit together without losing the detailed requested/effective and authority evidence. | Both Living World contracts pass. The complete current browser harness is 187/188; its sole remaining failure is `Library and Settings defaults render different Widget compositions`, which belongs to the concurrently edited Settings/sub-panel shell and does not name or exercise Living World. No prior Widget, typography, icon, placement, persistence, Composer, toolbar, or message-box check fails in this snapshot. | Final actual 220×600 placement preserves all four labels and one complete staged editor; final 410×500 placement exposes rail plus detail without horizontal overflow; final 900×700 Focus shows all four two-by-two editors, Back, full action width and the information-route boundary; the clamped capture visibly retains antagonist ceiling while running floor. Evidence: `evidence/living-world-standard.png`, `evidence/living-world-focus.png`, and `evidence/living-world-clamped.png`. | No unresolved Living World defect. The one external full-suite failure remains owned by the concurrent non-Widget shell task. | Passed and frozen. |

\* The 187/188 full-suite snapshot is not represented as a green aggregate: the
one failing check is the concurrently edited Library/Settings default
composition. Living World is green in both of its focused contracts, and this
slice did not edit toolbar, message-box, navigation, dock-shell, or generic
shell selectors.

## Institutions and Charter

**Audit state:** Implemented and accepted

**Functional floor:** inspect and configure explicit frame-qualified Charters:
resident bodies, posts, clocks, upkeep, markets, obligations, orders, directed
judgments and Character-history routes. Counts come from authoritative body
state; structured Charter routes own supported edits. The lived-location
builder is a handoff, not duplicated simulation.

**Current failures:** Institutions, Bodies and Upkeep due omit the registry,
selection, warnings, body/post structure, clocks, obligations, edit authority,
frame identity and background landing state. The generic wide float hides the
fact that Charter is explicit opt-in and could be stale against an author edit.

**Overhaul:** dock mode lists institutions with type icon, body/post/upkeep
counts, warning mark, frame and last landing. Selection stages Overview,
Residents, Posts, Clocks/Upkeep, Economy, Obligations and History sections; only
supported fields become editable. Focus mode supplies registry-detail
navigation. `Open Lived-in Location Builder` carries selected Lore/context and
never creates a browser-side institution.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 340 px |
| Ideal default height at 286 px | 680 px |
| Maximum in-place height | 780 px; institution ledger/detail owns scroll |
| 200 / 420 px response | 440 px registry summary / 640 px staged detail |
| Focused treatment | 960 x 740 px Charter workspace |

**Catalog and acceptance:** show two synthetic institutions, counts and one
warning without real names. Prove frame query, actual body shape, no-institution,
stale landing, structured write/conflict, builder handoff, no browser
simulation, selected-missing repair, all viewports and safe persistence.

### Phase 2 implementation evidence

| Cycle | Implemented correction | Functional evidence | Visual evidence | Remaining problem | Disposition |
|---|---|---|---|---|---|
| 1 | Replaced the Institutions/Bodies/Upkeep summary with one specialized present-frame registry owner. It lists two normalized Charter items from `items[key].state`, derives bodies/posts/upkeeps from the authoritative nested maps, names window, `clock_hours`, last elapsed, last epoch and warnings, and stages Overview, Residents, Posts, Clocks, Economy, Obligations and History without duplicating the separate Diagnostics Widget. Overview edits only supported window and priority fields while preserving the whole versioned registry. PUT is qualified by Story, Story revision, frame, registry revision and `/charters?frame_id=3`, writes only after accepted settlement, reloads normalized truth plus warnings, and never advances a runtime tick. Added explicit-opt-in, empty, loading, error, no-Story, dirty, saving, normalized, conflict, pipeline-running, offline, stale-landing, selected-missing and warning states; stale work names the frame/base-turn/epoch/registry landing guard and author-edit precedence. The Lived-in Location Builder control captures Story, frame, Lore and selected institution as a handoff without invoking generation. Added 340/680/780 px base geometry, 440/640 px narrow/wide ideals, 960×740 Focus, and an inert two-institution manifest-icon miniature. | Both purpose-built contracts failed at the red gate while 196 established/concurrent checks passed. Cycle 1 then passed the registry/authority contract and the original responsive contract inside a 198/199 full run; the one external failure belonged to the concurrently changing shell. Tests prove canonical item order, shared selection, seven sections, actual nested counts, warning/clock/landing evidence, full-registry draft preservation, zero pre-settlement writes and runtime ticks, accepted reload, builder handoff, 14 operational states, 200/286/420 px staging, Focus/Back, inert preview and no registry/draft data in Panel persistence. | Actual 220×440 compact placement, 286×680 default staging, 410×640 wide toolbar and 960×740 Focus. | Compact and wide registry counts could consume the institution-name column. The 410 px detail header collapsed its title to a word-per-line strip. Focus section labels wrapped unnecessarily, and the 410 px seven-button section grid consumed four rows, leaving only 5 px for the selected detail. | Corrected in cycle 2. |
| 2 | Assigned registry identity, counts, warning and landing evidence to explicit grid rows; moved wide detail evidence below its title while retaining a two-column Focus header; shortened only the visible `Clocks` and `Duties` labels while preserving accessible `Clocks and upkeep` and `Obligations`; tightened Focus tab spacing; and changed the 400 px section selector into one horizontally scrollable 46 px instrument row. The selected detail now receives at least 80 px and measured 145.8 px in the final browser contract. | The new identity-width, Focus-tab-height, navigator-height and detail-height assertions failed before correction. The final complete browser suite passes 199/199, including both Charter contracts and all concurrently added toolbar, sub-panel, Composer/message-box, placement, persistence, icon and typography checks. | Final compact render keeps both institution names, nested counts, warning and landing evidence visible; final 410 px render gives the registry names 121 px, detail title 215 px, a 55.6 px discoverable section rail and 145.8 px selected content; final Focus shows both institutions, all seven single-row sections, editable normalized fields, engine-owned landing boundary, Back and full-width actions. Evidence: `evidence/institutions-charter-compact.png`, `evidence/institutions-charter-wide.png`, and `evidence/institutions-charter-focus.png`. | No unresolved Widget defect. | Passed and frozen. |

## Institution Diagnostics

**Audit state:** Audited

**Functional floor:** give an authorized host read-only, frame-qualified
structured evidence for one institution/body: warnings, commitments, economy,
decisions, history, refused interventions, featured-resident histories, private
life/beliefs and judgments. Full evidence/raw JSON stays a lazy closed
disclosure and never feeds cognition.

**Current failures:** Epoch, revision and last landing are not diagnostics.
There is no institution/body selector, warning ledger, structured sections,
empty/error distinction, malformed-section state, host gate or visible privacy
boundary. Its wide blank float can look like a general system-status card.

**Overhaul:** dock mode is a host-only evidence summary with captured frame,
selected institution/body, warnings and load-on-demand action. At 420 px stage
one structured section; focused mode adds section navigation and lazy full
evidence. Every surface is explicitly read-only. Permission denial prevents
private content from mounting at all, rather than merely covering it visually.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 640 px |
| Maximum in-place height | 760 px; evidence body scrolls |
| 200 / 420 px response | 400 px gated summary / 600 px staged evidence |
| Focused treatment | 980 x 720 px diagnostic workspace |

**Catalog and acceptance:** use synthetic counts/warnings only. Prove host-only
non-mount, frame/institution/body filtering, load on demand, empty/error,
malformed section, lazy full evidence, zero guest/cognition/localization/Panel
leakage, all viewports and readable plain text.

### Implementation evidence

| Cycle | Corrections applied | Playwright evidence | Visual evidence | Remaining shortcomings | Disposition |
|---:|---|---|---|---|---|
| 1 | Replaced the generic Epoch/revision/landing summary with one specialized, host-only diagnostic projection. The Widget captures Story, Story revision and Present frame; selects an institution and optional resident; performs exactly one frame/institution/body-qualified diagnostics GET; and stages Overview, Warnings, Commitments, Economy, History, Private life and Beliefs as read-only structured evidence. Full JSON remains an unmaterialized closed disclosure until the host opens it. Scope changes invalidate loaded private evidence instead of showing a stale projection. Added loading, loaded, valid-empty, error, permission-denied, no-Story, no-institution, no-body, malformed-section, offline and frame-changed states; denied access does not mount institution, body, private or raw nodes. The operation records zero writes, cognition deliveries and localization payloads, while Panel persistence receives none of the selection or evidence. Added 320/640/760 px base geometry, 400/600 px narrow/wide ideals, 980×720 Focus and an inert synthetic three-signal Catalog miniature using manifest-backed icons. | Both purpose-built contracts failed at the red gate. The first implementation brought the complete current harness to 201/201, covering the exact diagnostics route, one shared load owner, every structured section and directional belief surface, lazy raw materialization, scope invalidation, all recovery/access states, 200/286/420 px response, Focus/Back, inert preview and no Panel/private/cognition/localization leakage. | Actual 320 px floating placement and initial 980×720 Focus inspection over the live Scene. | A real floating placement retained its inline `left` coordinate when reparented for Focus, so the 980 px surface could begin 190 px outside the viewport even though the isolated fixture passed. The compact values observed in the visual audit remained supplementary state and scope metadata. | Corrected in cycle 2. |
| 2 | Made the diagnostics Focus rule override saved floating `left` and `top` coordinates only while focused. Back still restores the unchanged inline placement. Added a regression that reproduces real floating coordinates, proves the complete Focus rectangle stays inside the viewport and retains all seven sections/raw evidence, and separately preserves visible operational controls. No toolbar, message-box/Composer, navigation, Panel shell or shared dock selector changed. | The new floating-coordinate assertion deliberately reduced the suite to 200/201 before correction. The final complete browser harness passes 201/201, including all concurrent toolbar, message-box/Composer, Panel, placement, persistence, icon and shared Widget contracts. | Final compact and centered Focus renders: `evidence/institution-diagnostics-compact.png` and `evidence/institution-diagnostics-focus.png`. Focus shows institution/resident scope, a seven-section navigator, structured evidence, closed lazy JSON, the cognition/privacy boundary, zero-write receipt, Back and Refresh. | No unresolved Widget defect. | Passed and frozen. |

## Background Life / Scene Life

**Audit state:** Audited

**Functional floor:** configure unsheeted reaction and managed Scene Life via
Off/Ambient/Full, `max_managed` 1–8, `max_reactors` 1–3 and an addressed-
presence promotion threshold 0–99. This coordinates background config plus one
dialogue-config slice; global Content separately owns automatic-acquisition
permission and Background Presences owns manual review.

**Current failures:** Scene Life, max reactors and forced handoffs omit the
three modes, dependency-driven controls, managed cap, information/cost risks,
global permission, promotion threshold and partial two-document save. `Forced
handoffs` is misleading because directed/addressed reactions are engine gates,
not a user-authored quota.

**Overhaul:** lead with the three-mode selector and concise consequence copy.
Only applicable caps enter focus order; Off explains individually selected
reactions, while Ambient/Full disclose managed cost and Full's directed-line
risk. Promotion shows threshold, global-permission status and `may generate a
permanent Character, at most one per beat`. Save reports both owner receipts
and never masks partial success.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 300 px |
| Ideal default height at 286 px | 540 px |
| Maximum in-place height | 700 px; active-mode detail scrolls |
| 200 / 420 px response | 400 px status/mode summary / 520 px full controls |
| Focused treatment | 820 x 680 px Scene Life editor |

**Catalog and acceptance:** show Off/Ambient/Full, applicable cap and promotion
eligibility. Prove exact ranges, dependencies/focus order, global permission,
threshold zero, two receipts/partial failure, next-turn state, manual-promotion
boundary, all widths and safe persistence.

### Implementation evidence

| Cycle | Corrections applied | Playwright evidence | Visual evidence | Remaining shortcomings | Disposition |
|---:|---|---|---|---|---|
| 1 | Replaced the misleading Scene Life/Max reactors/Forced handoffs summary with one specialized Active Story editor. The three explicit modes mirror Main: Off keeps only the per-presence reactor cap 1–3; Ambient exposes the managed cap 1–8 and states that the manager receives only legitimately shared information while directed lines are withheld; Full exposes the same cap and names the audience-tagged directed-line/divergence risk. Irrelevant controls do not mount. The addressed-turn threshold is bounded 0–99 and composes with, but cannot change, Content's global automatic-acquisition permission. Eligibility says the engine **may** generate a permanent Character, at most one per beat, and hands manual review to Background Presences. Save sends the complete three-field `background_config` PUT and an exact one-key `dialogue_config.promote_after_addressed` PUT, settles them independently, preserves the draft and accepted sibling receipt on partial failure, and retries only the failed owner. Active-run edits explicitly apply next turn. Added no-Story, loading, Off, Ambient, Full, global-off, threshold-zero, eligible, dirty, saving, partial, conflict, active-run, offline and error states; 300/540/700 px base geometry, 400/520 px narrow/wide ideals, 820×680 Focus and an inert synthetic mode/cap/promotion miniature using manifest-backed icons. | Both purpose-built contracts failed at 201/203 before the specialized inspection API existed. The first implementation exercised exact routes and bounded bodies, one shared draft across mounts, independent two-owner receipts, partial retry, all dependency/state contracts, 200/286/420 px response, Focus/Back, inert preview and Panel-persistence exclusion. The first all-suite run exposed one collateral Background Presences target failure: unqualified `.sonder-background-*` rules matched that frozen Widget. Scoping every new rule beneath `.sonder-background-life` restored the complete suite to 203/203 without changing Background Presences. | Actual initial 320×300 floating placement and 820×680 Focus over the live Scene. | At the real 300 px minimum, context, boundary and receipt bands consumed the body; the mode rail, applicable cap/promotion summary and Focus action collapsed out of view even though taller width fixtures passed. | Corrected in cycle 2. |
| 2 | Added a height-aware minimum projection: compact Story and mode status, three 46 px mode controls, applicable cap plus promotion-gate summary, and one full-width Focus action. Boundary and detailed receipts yield only at the 300 px minimum; the 400/540/520 px dock ideals and Focus keep complete consequences, numeric controls, handoffs, owner receipts and actions. Added a browser assertion requiring a 92 px-or-taller minimum mode instrument, visible compact summaries and a 44 px Focus target. | The new minimum-height assertion deliberately reduced the suite to 202/203. After the responsive correction and one missing inspection marker were fixed, the final complete browser harness passes 203/203, including all toolbar, message-box/Composer, Panel/sub-panel, placement, persistence, icon, shared Widget and frozen Background Presences contracts. | Final compact and Focus renders: `evidence/background-life-compact.png` and `evidence/background-life-focus.png`. Compact mode shows Off/Ambient/Full, the Full managed cap, truthful ineffective promotion gate and Focus; Focus shows both bounded owner controls, the Content/manual-review handoffs, authority boundary, write receipt, Back and actions. | No unresolved Widget defect. | Passed and frozen. |

## Character Relationships

**Audit state:** Audited

**Functional floor:** read one selected Character's private holder→subject
stances—trust, familiarity, valence, fear, respect, suspicion, last turn,
salient evidence and notes. There is no lawful edit route and no universal
reputation score; raw scalar editing would break append-only evidence.

**Current failures:** two sample phrases and `Universal score: None` establish
direction but omit axis values, evidence source, last turn, selection, empty/
error/access states and owner navigation. The wide row/value template is hard
to scan at 200 px and wastes the comparative space available at 420 px.

**Overhaul:** show target cards with explicit `Holder → Subject`, neutral
text-plus-meter axes, last change and evidence count. Selection opens an
evidence summary or source link if addressable. Filters sort by target, recent
change or an axis; none imply a global score. Access denial prevents private
content from mounting and no edit control appears.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 280 px |
| Ideal default height at 286 px | 480 px |
| Maximum in-place height | 640 px; relationship list scrolls |
| 200 / 420 px response | 560 px stacked axes / 440 px cards with axis grid |

**Catalog and acceptance:** use synthetic directed rows and two neutral axis
meters. Prove every served field, read-only authority, no universal score,
empty/error/detached/missing-target/access-denied, frame refresh, evidence link,
all widths and no private relationship data in preview or persistence.

### Implementation evidence

| Cycle | Correction implemented | Test and browser evidence | Remaining issue | Decision |
|---:|---|---|---|---|
| 1 | Replaced the sample phrases and universal-score placeholder with a purpose-built, private, read-only holder→subject projection for the selected Character mind. The Widget now uses Main's exact `GET /api/chats/{cid}/characters/{ch}/relationships` contract, renders all six served axes plus last interaction turn, salient event and notes, preserves explicit direction, shares target selection between placements and offers a source handoff without inventing an edit route or persisting private content. It covers no-Story, no-selection, detached, loading, empty, ready, missing-target, permission-denied, stale, offline and error states. Permission denial does not mount private rows. The catalog miniature is inert and synthetic. Geometry is 280/480/640 px with 560/440 px narrow/wide ideals. | The two purpose-built contracts failed at 203/205 before the specialized inspection API existed, then the first implementation restored 205/205. The tests prove the exact read route and complete served field set, zero writes, read-only authority, shared selection, evidence handoff, all state boundaries, inert preview, 200/286/420 px response and Panel-persistence exclusion. An actual compact browser render exposed a height defect not visible in the width fixtures. | At the real 280–300 px placement, context, authority and receipt bands consumed the stance workspace; target choices remained but the selected axes collapsed below the usable area. | Corrected in cycle 2. |
| 2 | Added a height-aware minimum projection that preserves the compact type hierarchy. At 340 px and below, context, authority, receipt and redundant state copy yield; two target choices remain; the selected stance becomes the Widget's one bounded scroller; and Refresh stays reachable. All six axes remain available through that scroller, while taller placements retain full context, evidence and receipt detail. Removed the redundant early responsive rule so every Character Relationships override remains widget-local and cascade-adjacent to its base rules. | A new 280 px assertion deliberately reduced the suite to 204/205 by requiring target choices, selected stance axes and Refresh to remain usable. After the responsive correction, the final complete browser harness passes 205/205, including protected toolbar, message-box/Composer, Panel/sub-panel, placement, persistence, icon and shared Widget contracts. Final compact render: `evidence/character-relationships-compact.png`. | No unresolved Widget defect. | Passed and frozen. |

## Memory Browser

**Audit state:** Audited

**Functional floor:** for one authorized Character mind, search/filter,
inspect, add/edit/archive/delete, import/export, consolidate, preview exact
agent context, and rebuild missing earlier summary eras without crossing the
mind/frame firewall. Long operations have durable Background Work ownership;
archive and permanent delete are distinct.

**Current failures:** Episodes, Beliefs and Selected are a misleading summary of
a large private workspace. There is no ledger, provenance, frame/turn/category,
search, draft, archive, destructive confirmation, import firewall, context
preview, consolidation exclusions, era repair or task state. A wide float over
Scene is especially inappropriate for private, high-density content.

**Overhaul:** toolbar mode shows selected mind, authorization, counts, active
filter/task and Focus. The focused workspace has compact search/filter,
chronological ledger, selected detail/editor and owner action rail under one
scroll strategy. Import begins with preview and foreign-player-name review;
export names private-data exposure. Consolidation lists protected exclusions;
earlier-era rebuild says it does not move the live cursor.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 340 px |
| Ideal default height at 286 px | 680 px |
| Maximum in-place height | 780 px; memory ledger/detail owns scroll |
| 200 / 420 px response | 420 px owner/task summary / 640 px staged browser |
| Focused treatment | 1000 x 740 px private-memory workspace |

**Catalog and acceptance:** show synthetic redacted rows and provenance, never
private content. Prove no-selection/access gate, lexical/semantic search,
empty/filter-empty, draft/conflict, archive/delete, import firewall, private
export, protected consolidation, exact context preview, earlier-era semantics,
task survival, all viewports and zero memory/task/id persistence.

## Character Private History

**Audit state:** Audited

**Functional floor:** edit Story-qualified `content`, `about`, and exact
`known_by` recipients for one attached Character through the draft/lease shared
with Story Character Card. Saving the empty list shadows reusable fallback and
must name that consequence; no fake reset is offered. Checkpoint restoration
may change the Story-local history.

**Current failures:** Entries, Selected and Draft do not show source
inherited/local, recipient scope, content, shared owner, safe-write prerequisite,
empty-shadow consequence or checkpoint change. The card claims `Edited` in a
Catalog example without exposing a real draft and can leak the shape of private
data through an ordinary preview.

**Overhaul:** dock mode is a protected owner/source summary with redacted entry
count, draft/lease state and Focus. At 420 px stage entry list then protected
editor; focus mode shows full content, About and recipient chips with explicit
Save. Empty-local confirmation explains reusable shadowing. Invalid recipients,
checkpoint refresh and read-only pending-revision remain visible states.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 580 px |
| Maximum in-place height | 720 px; entry list/editor owns scroll |
| 200 / 420 px response | 408 px protected summary / 552 px staged editor |
| Focused treatment | 840 x 700 px protected editor |

**Catalog and acceptance:** use synthetic redacted entries and recipient chips.
Prove shared Story Character owner, inherited/local/empty semantics, exact
known-by filter, invalid recipient, checkpoint change, revision gate, draft
recovery, access denial, all widths and no private content/ids in preview or
Panel persistence.

## Persona Private History

**Audit state:** Audited

**Functional floor:** edit the active Story's primary Persona private-history
override with `content`, preserved `about`, and exact `known_by` recipients. The
server currently has no Persona id, so additional Personas are not writable.
The owner is shared with any Story setup surface; empty shadows reusable
fallback and reroll/checkpoint restore intentionally preserves this override.

**Current failures:** the same Entries/Selected/Draft card used for Character
history hides the primary-only constraint, source, About, recipient firewall,
shared owner, empty-shadow warning, revision prerequisite and reroll behavior.
It could falsely imply that an additional Persona selection is an editable
target.

**Overhaul:** use the protected editor shell with an unmistakable `Primary
Persona` context banner. Dock mode shows owner, inherited/local source,
redacted count and draft/lease status. The staged/focused editor preserves
About and exact recipient chips; it labels additional Persona selection
unsupported rather than retargeting. Empty confirmation and reroll-preserved
status use adjacent plain text.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 560 px |
| Maximum in-place height | 700 px; entry list/editor owns scroll |
| 200 / 420 px response | 400 px primary-owner summary / 536 px staged editor |
| Focused treatment | 820 x 680 px protected editor |

**Catalog and acceptance:** use synthetic redacted content and a primary marker.
Prove primary-only truth, missing/changed primary, preserved About, known-by
firewall, inherited/local/empty warning, reroll preservation, revision gate,
shared draft, all widths and no private data in preview/persistence.

## Dramatic Irony

**Audit state:** Audited

**Functional floor:** a host-only read projection of non-archived, non-
`witnessed` Character memory: who holds it, heard/told/read/inferred provenance,
turn/frame, gist, and a link to the qualified Memory Browser. It is neither
player-known truth nor proof that a belief is false.

**Current failures:** Viewer, Compared mind and Divergences frame the Widget as
a two-mind truth comparison, conflicting with Main's actual unshared-memory
projection. There are no rows, provenance, chronology, access gate, missing
source or error/empty state. `Divergences` overclaims objective comparison.

**Overhaul:** rename the body label `Unshared character knowledge`; list newest-
first synthetic-safe rows with holder, provenance, time/frame and concise gist.
Selection opens the authorized Memory Browser owner. Filters may narrow holder
or provenance but never add `true`, `false`, or objective World comparison.
Denied hosts receive no private DOM content.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 260 px |
| Ideal default height at 286 px | 460 px |
| Maximum in-place height | 620 px; knowledge list scrolls |
| 200 / 420 px response | 520 px stacked provenance / 420 px denser rows |

**Catalog and acceptance:** use redacted unshared-knowledge rows, not secrets.
Prove provenance semantics, no objective/player-known claim, read-only host
gate, empty/error/source-missing, Memory Browser link, all widths and zero
private data in Catalog, guest DOM or Panel persistence.

## Promise Ledger

**Audit state:** Audited

**Functional floor:** read oldest-first, non-archived `category=promise`
memories across authorized Character minds. These are remembered promises, not
Charter commitments or a deduplicated objective contract tracker. The Widget
does not infer promisor, recipient, open/kept/broken status or merge minds.

**Current failures:** the placed card says `Chronological commitments`, `Active`
and `3 open`, turning subjective memory rows into false lifecycle truth. It
omits holder, turn, duplicates, provenance, source link, empty/error and host
gate. Its tab truncates beside Room Ambience at 200 px.

**Overhaul:** title the body `Remembered promises`; show holder, turn/frame when
available, gist and Memory Browser link. Similar-looking rows remain separate
with their holder visible. No status chip appears unless it is literally part
of the memory content, and even then it is quoted rather than normalized. A
compact count may say `3 remembered`, never `open`.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 240 px |
| Ideal default height at 286 px | 420 px |
| Maximum in-place height | 580 px; promise list scrolls |
| 200 / 420 px response | 480 px stacked rows / 380 px concise chronology |

**Catalog and acceptance:** show synthetic remembered rows with holder/turn.
Prove chronological subjective rows, duplicates retained, no Charter or status
inference, host privacy, empty/error/source-missing, owner link, all widths and
safe persistence.

## Multiplayer and Guest Invites

**Audit state:** Audited

**Functional floor:** attach additional reusable Personas and let the host
create, reveal/copy once, inspect, revoke or expire guarded guest invitations.
The single-use code lives 30 minutes, guest token 24 hours, only hashes rest on
the server, redemption is atomic/rate-limited, and any revealed URL is
ephemeral live service state—not browser or Panel storage.

**Current failures:** Host, guest count and pending count provide no Persona
rows, attachment state, expiry, connected/revoked status, invite review, secure
one-time result, public-sharing prerequisite, row busy state or detach
consequence. The generic Ready badge is especially misleading for access and
security state.

**Overhaul:** list each additional Persona with attachment/grant status,
connected indicator and expiry. Row actions are Create invite, Copy while live,
Revoke and Detach; each has a captured busy lease and consequence-labeled
review. Revealed URL/code sits in a transient guarded callout and clears on
expiry, revoke, Story change or unmount. Before external sharing, show the
actual public-tunnel/host readiness requirement. Primary Persona has no row
mutation.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 280 px |
| Ideal default height at 286 px | 500 px |
| Maximum in-place height | 660 px; guest list scrolls |
| 200 / 420 px response | 580 px stacked secure rows / 440 px row/action grid |

**Catalog and acceptance:** show two synthetic Personas and Pending/Connected,
never a URL/code. Prove lifetimes, ephemeral clearing/no storage, busy/double-
submit, atomic redemption evidence, revoke/detach, public-sharing unavailable,
primary boundary, guest isolation, all widths and safe persistence.

## Frames

**Audit state:** Audited

**Functional floor:** list/open Present and declared diegetic past/future/other
frames, and create a frame through a recoverable draft/review containing label,
ordinal, kind, travelers and nonexistent cast plus continuity consequences.
There is no edit/delete route; engine-created `spatial` is not a user choice.

**Current failures:** Present, checkpoint count and branch count neither list
frames nor match the real declared-frame creation workflow. Checkpoints and
branches are conflated with frame identity; travelers, recognition, current
marker, review, validation and busy state are absent. The registry's compact
medium role has no corresponding staged design.

**Overhaul:** show an ordered frame rail with Present pinned, relationship icon,
ordinal, current marker, traveler/nonexistent counts and Open. Create begins a
staged draft, excludes `spatial`, reviews knowledge/recognition/frame-state
consequences and disables double submit. Compact mode shows rail/current and
resumes draft; focused mode provides rail plus creation detail. Do not expose
edit/delete or Persona stationing.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 300 px |
| Ideal default height at 286 px | 560 px |
| Maximum in-place height | 700 px; frame rail/detail owns scroll |
| 200 / 420 px response | 400 px current/resume summary / 520 px staged rail |
| Focused treatment | 840 x 680 px frame workspace |

**Catalog and acceptance:** show Present plus two ordered frames and continuity
counts. Prove open via shared Story context, Present-only/multiple/current,
draft/review, participant change, pipeline/paradox guards, spatial exclusion,
no edit/delete/stationing, all viewports and no frame/create draft in layout.

## Who's Where

**Audit state:** Audited

**Functional floor:** station each attached additional Persona in Present or a
declared frame without editing frames, attachments or invites. Immediate PUT
captures source/target; failure reloads authoritative stationing. Unattached or
removed targets, active pipeline and movement into/out of the relevant active-
paradox frame are rejected without global overblocking.

**Current failures:** the current rows show Character-like names and rooms,
despite the real contract being additional Persona → frame stationing. The
description calls it a body-location roster and risks an omniscient tracker.
There are no selectors, row busy/reload, primary exclusion, target removal or
scoped paradox blocker.

**Overhaul:** retitle the body `Additional Persona stationing`; pair each
Persona identity with a frame-labelled combobox and precise current→target
review. Busy state is row-local; failure restores from server. A blocked icon
has adjacent text naming the relevant paradox or pipeline. No rooms, registered
Characters, primary Persona or general location tracking appear.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 240 px |
| Ideal default height at 286 px | 420 px |
| Maximum in-place height | 600 px; Persona rows scroll |
| 200 / 420 px response | 500 px stacked selectors / 380 px inline rows |

**Catalog and acceptance:** show three synthetic Persona→frame rows and one
blocker. Prove exact source/target, server reload after failure, removed frame/
detached Persona, scoped paradox block, pipeline guard, primary/attachment/
frame-edit exclusions, all widths and safe persistence.

## Time Paradox and Fixed Points

**Audit state:** Audited

**Functional floor:** configure paradox policy (mode, escalation, toll radius),
author fixed-point anchors (entity, label, required-exists, optional frame/mode),
and inspect active frame-qualified paradoxes with severity and consequences.
Writes require Review; removing an anchor confirms material consequences. No
generic Resolve exists without a runtime route.

**Current failures:** counts for Paradoxes, Fixed points and Affected frames
hide policy, anchors, frame/severity/mode, destructive consequences, blockers,
privacy and review. The wide generic float looks like passive diagnostics even
though toll may decay memory confidence and hazard/warden modes may mutate
world state.

**Overhaul:** split Policy, Fixed Points and Active Paradoxes under one captured
Story/frame owner. Anchor rows show entity/frame/mode and More; add/edit uses a
staged draft and explicit Review, while removal has a named consequence dialog.
Paradox rows show severity, operative frame, mode, effect and links to Frames/
Who's Where blockers. Host-only diagnostic detail never enters cognition or a
guest DOM. Toolbar mode is status/review-resume only.

| Geometry contract | Value |
|---|---|
| Minimum functional height | 320 px |
| Ideal default height at 286 px | 640 px |
| Maximum in-place height | 760 px; active section owns one scroll |
| 200 / 420 px response | 420 px policy/alert summary / 600 px staged editor |
| Focused treatment | 920 x 720 px paradox workspace |

**Catalog and acceptance:** show synthetic policy, two anchors and one severity
row. Prove every route field, no-story/empty/one/many, validation, review,
destructive confirmation, source change, scoped pipeline/station/branch
blockers, no invented Resolve, host/privacy boundary, all viewports and safe
persistence.

# Audited slice: remaining Settings Widgets

## Cross-slice visual and ownership evidence

- All six Settings groups, five remaining panels, and twenty-two eligible
  subwidgets were inspected in the frozen Catalog. Except for the live Custom
  Theme miniature, they all use the generic three-row skeleton. Navigation,
  immediate device preference, recoverable server draft, background task,
  secret-bearing connection, and destructive raw-data lab are therefore
  visually indistinguishable.
- Settings groups are summary/navigation Modules. They read already-loaded
  projections, start no discovery, network check, poll, or draft, and mutate
  nothing. Their rows must look and act like destinations—not disabled setting
  values. Locating an already-placed owner takes precedence over mounting a
  duplicate.
- Settings panels compose member owners in the maintained group/detail model.
  Eligible subwidgets are movable instruments of those owners, not independent
  copies. Shared drafts, live controls, polls and action leases remain singular
  when both parent and child placements exist.
- Immediate device controls say `Applied on this device`; explicit server
  drafts say `Unsaved`, `Saving`, or `Saved to host`; background tasks show a
  durable phase; Review actions state consequences before mutation. `Ready` is
  not a universal status.
- At 200 px, the current title/value pairs truncate and action bars are commonly
  below the visible card. At 420 px, the same three rows stretch across blank
  space. The height contracts below use narrow staged summaries and broader
  inline controls; focused authoring is reserved for tasks that genuinely need
  it.
- Secrets are write-only and disappear from the DOM after save. Raw Story,
  clothing, prompt text, extension code, diagnostic event text and private
  content never appear in Catalog examples or Panel persistence.

## Account and Access

**Audit state:** Audited

**Functional floor:** summarize already-known provider count/health and default-
model presence, then navigate to Provider Credentials. It performs no network
test or secret read and owns no editor.

**Current failure and overhaul:** Connections, Access and Attention are generic
metrics with no member destination or health meaning. Replace them with one
provider-health sentence and an icon-led `Provider credentials` destination
row with unavailable/problem text. Activation locates an existing owner or
opens canonical Settings detail.

| Geometry | Contract |
|---|---|
| Height | 144 px minimum; 216 px ideal at 286; 300 px maximum |
| 200 / 420 px | 260 px stacked summary / 176 px inline destination |

**Acceptance:** loading/no providers/configured/problem/member unavailable,
zero discovery side effect, no secret, locate-before-open, keyboard/touch and
presentation-only collapse persistence.

## AI and Models

**Audit state:** Audited

**Functional floor:** summarize the loaded Default assignment and explicit/
inherited role counts, then navigate to Model Assignments. It owns no model
discovery, routing editor or draft.

**Current failure and overhaul:** `8 of 13`, Configured and `2 roles` do not
explain default inheritance or expose the only destination. Use a model icon,
literal Default value or `No default model`, bounded inherited/explicit counts,
and a `Model assignments` destination row. Do not imply that missing default is
a fetch error.

| Geometry | Contract |
|---|---|
| Height | 144 px minimum; 216 px ideal; 300 px maximum |
| 200 / 420 px | 260 px stacked / 176 px inline destination |

**Acceptance:** loading/no default/assigned/unavailable, exact inheritance
language, no discovery/save, locate-before-open and accessible collapse.

## Appearance and Accessibility

**Audit state:** Audited

**Functional floor:** summarize current theme, reading size/density, sound/
effects and accessibility overrides from versioned device preferences; navigate
in maintained order to Theme, Reading and Layout, Sound and Motion, and
Accessibility.

**Current failure and overhaul:** Theme, Text scale and Motion omit half the
group, have no navigation affordance, and make a summary look editable. Use a
semantic theme swatch and four compact destination rows with current summaries,
override marks and chevrons. Never preview or reset from the group.

| Geometry | Contract |
|---|---|
| Height | 240 px minimum; 340 px ideal; 440 px maximum |
| 200 / 420 px | 420 px stacked destinations / 300 px two-column destinations |

**Acceptance:** standard/custom, muted/reduced/off, override/migration states,
stable order, live owner updates, no independent state, zoom, keyboard/touch.

## Story Defaults and Content

**Audit state:** Audited

**Functional floor:** summarize the global Content boundary for preferences,
narrator voice and Living World defaults/ceilings, then navigate to the one
Content panel. It never projects or mutates an active Story.

**Current failure and overhaul:** Profile, example count and Story override
count blur global defaults with live Story state. Use three plain-language
global-scope summary lines and one `Content` destination row; an active-Story
indicator may say that overrides are handled inside Content but exposes no
values here.

| Geometry | Contract |
|---|---|
| Height | 160 px minimum; 232 px ideal; 320 px maximum |
| 200 / 420 px | 276 px stacked / 192 px inline destination |

**Acceptance:** loaded/unavailable/member missing, explicit global-default
language, no active-Story fallback/draft and accessible locate/open.

## Data, Extensions, and Maintenance

**Audit state:** Audited

**Functional floor:** summarize already-loaded extension and maintenance state
and navigate to Add-ons or Maintenance. Rendering starts no extension load,
update discovery, storage scan, repair, diagnostic capture, poll, or lease.

**Current failure and overhaul:** three health/count rows hide the two
destinations and may imply fresh checks. Use Add-ons and Maintenance destination
rows with known status/attention marks and a timestamp/`Not checked` qualifier
where required. Safe mode and failures get adjacent text.

| Geometry | Contract |
|---|---|
| Height | 192 px minimum; 280 px ideal; 380 px maximum |
| 200 / 420 px | 340 px stacked / 240 px paired destinations |

**Acceptance:** loading/none/mix/safe-mode/failure/attention/member unavailable,
zero background work, locate-before-open and safe collapse persistence.

## Advanced

**Audit state:** Audited

**Functional floor:** provide explicitly technical navigation to Prompt Editor
and Raw Story Data using only loaded Settings and active-context summaries. Raw
Story Data stays visible but says `Open a Story first`; no fallback Story or raw
fetch occurs.

**Current failure and overhaul:** prompt count and raw-data prerequisite values
look like editable settings and do not communicate risk or destination. Use
two technical destination rows with code/document icons, host-only label,
active preset/Story availability and a restrained risk note. No raw content is
shown.

| Geometry | Contract |
|---|---|
| Height | 192 px minimum; 280 px ideal; 380 px maximum |
| 200 / 420 px | 340 px stacked / 240 px paired destinations |

**Acceptance:** Story/no-Story/preset unavailable/member unavailable, no fetch/
draft, no silent Story selection, locate-before-open and accessible risk copy.

## Reading and Layout

**Audit state:** Audited

**Functional floor:** own story text size, density, supported measure/line-
height and Full/Reduced/Off effects with a synthetic prose preview. Device
selections apply immediately; overlapping large story text/roomy controls bind
the Accessibility keys. Reset is bounded to reading and names overlaps.

**Current failure and overhaul:** three static values offer no controls,
preview, reflow, effect tier, ownership overlap, persistence failure or reset.
Use semantic segmented/range controls, a non-private live prose sample, inline
`Applied on this device` receipts, and a reviewed `Reset reading`. At narrow
width the sample follows controls; at 420 px it can sit beside them.

| Geometry | Contract |
|---|---|
| Height | 300 px minimum; 560 px ideal; 700 px maximum |
| 200 / 420 px | 400 px status/locate projection / 520 px controls + preview |
| Focused | 820 x 680 px Settings detail |

**Acceptance:** all sizes/densities/effects, Accessibility override, migrated
fallback, persistence failure, exact reset, preview reflow, 200% zoom, keyboard
and one shared device owner.

## Sound and Motion

**Audit state:** Audited

**Functional floor:** own story volume, mute, turn-complete chime and host
interface language. The sound instrument is the same Scene atmosphere runtime;
Preview chime requires a gesture. Language has explicit Apply, fresh server
confirmation and `Applies after reload`. Motion/effects only link to Reading
and Layout.

**Current failure and overhaul:** Interface sound, Motion and Narration language
mix device sound, another panel's motion owner and host interface language;
`Narration language` is the wrong scope. Use a volume/mute row, chime toggle/
capability-safe preview, `Interface language` selector with separate Apply
receipt, and a destination row for motion/effects.

| Geometry | Contract |
|---|---|
| Height | 300 px minimum; 520 px ideal; 660 px maximum |
| 200 / 420 px | 400 px owner/status projection / 480 px staged controls |
| Focused | 800 x 660 px Settings detail |

**Acceptance:** normal/muted/locked/preview unavailable, language dirty/save/
failure/reload, offline/device failure, one Scene mixer, gesture-safe audio,
separate persistence scopes and no duplicate motion switches.

## Content

**Audit state:** Audited

**Functional floor:** compose three scope-labelled owners: global Content
Preferences, global Narrator Voice Examples, and active-Story Living World.
Global preference save, voice draft and Story draft retain distinct receipts;
no open Story yields an unavailable section, never first-Library fallback.

**Current failure and overhaul:** Profile, override and Ready flatten three
owners into a false atomic panel. Use three owner sections with global/active-
Story banners, concise current state and Locate/Open. Focus mode stages the
selected member; parent status is a receipt ledger that can say `Some settings
changed—reload server truth` rather than invent rollback.

| Geometry | Contract |
|---|---|
| Height | 340 px minimum; 640 px ideal; 760 px maximum |
| 200 / 420 px | 420 px scope/status summary / 600 px staged member |
| Focused | 920 x 720 px composed Settings detail |

**Acceptance:** independent loading/draft/save/failure states, no Story/no
fallback, retained child drafts, fresh projections, partial truth, responsive
staging and one owner per member.

## Add-ons

**Audit state:** Audited

**Functional floor:** own the installed-extension listing/action coordinator
and shared install draft: enable/disable, safe mode, faults, declared access,
trust review, check/update, install disabled, reload registration, and remove
files while retaining Story data. Parent and child placements share listing,
polls, leases and teardown.

**Current failure and overhaul:** Installed, Enabled and Updates omit every
extension row, capability/trust state and consequential action. Use a compact
installed ledger with identity icon, version, enable/load/fault/update/trust
marks and row More menu; Install is a staged subview. Review precedes code
access, changed-code update and removal. Errors remain row-local and safe mode
is persistent text, not tint.

| Geometry | Contract |
|---|---|
| Height | 340 px minimum; 660 px ideal; 780 px maximum |
| 200 / 420 px | 420 px coordinator summary / 620 px staged ledger |
| Focused | 960 x 720 px extension workspace |

**Acceptance:** load/error/empty/safe-mode/all lifecycle states, repeated trust
review, disabled install, registration reload, stale list, one coordinator,
failure isolation, all viewports and no code/content in preview or layout.

## Raw Story Data

**Audit state:** Audited

**Functional floor:** a contained Advanced lab for whole-world and Present-
frame raw clothing JSON. The user explicitly selects the open Story; drafts are
Story/frame/revision/kind qualified. Save requires valid schema, idle pipeline,
review of exact replacement domains, conditional revision, server normalization
and authoritative Story/Scene refresh.

**Current failure and overhaul:** Story, Frame and `Read-only until reviewed`
do not provide a tree, typed preview, target chooser, editor, safety gates,
replacement review, conflict or normalization evidence. The Catalog preview is
too content-like for a private destructive lab. Keep this focused Settings-only
surface: left domain tree, explicit target bar, redacted/typed preview, editor,
finding list and stable Review/Save bar. Raw Clothing can only locate its exact
section until all write prerequisites exist.

| Geometry | Contract |
|---|---|
| Height | 340 px minimum; 680 px ideal; 780 px maximum |
| 200 / 420 px | 420 px unavailable/locate summary / 640 px staged read-only view |
| Focused | 960 x 740 px contained lab; no free float |

**Acceptance:** no-Story/no fallback, explicit target, load/draft/parse/schema/
review/conflict/pipeline/normalized states, whole-world consequence, Present-
only clothing, privacy, keyboard editor, no raw preview/persistence and no
ordinary draggable placement.

## Connections and Credentials

**Audit state:** Audited

**Functional floor:** list provider kind/name, endpoint, configured-secret state
and last explicit check; share Provider Credentials' recoverable connection
draft, Test action and fresh Settings projection. Secret fields are write-only:
blank preserves, replacement never reads back, and Clear appears only with a
real reviewed server operation.

**Current failure and overhaul:** Connected, Available and Never displayed omit
provider rows, endpoints, edit/test, draft, capability and failure evidence.
Use provider-logo/connection rows with configured/not-configured status, last-
checked qualifier and row actions. A staged editor shows endpoint and an empty
password input labelled `Leave blank to preserve`; remove it from the DOM after
save. Tests are always user initiated.

| Geometry | Contract |
|---|---|
| Height | 300 px minimum; 520 px ideal; 680 px maximum |
| 200 / 420 px | 400 px provider summary / 500 px list + staged editor |

**Acceptance:** empty/configured/editing/preserve/replace/clear review/test/
conflict/offline, one owner, no automatic test or secret readback/persistence,
retained draft, fresh projection and all widths.

## Default Model

**Audit state:** Audited

**Functional floor:** choose provider/model for exactly the `default` role and
show how many roles inherit it. It shares Model Assignments' draft; discovery is
suggestion evidence and free entry remains where accepted. There is no hidden
Director fallback.

**Current failure and overhaul:** Default, inherited and explicit counts are
passive rows with no selector, provider, availability, dirty state or save
relationship. Use a compact provider/model combobox, inheritance count with
`View roles`, capability/unverified text and shared draft receipt.

| Geometry | Contract |
|---|---|
| Height | 200 px minimum; 280 px ideal; 380 px maximum |
| 200 / 420 px | 340 px stacked selector / 240 px inline selector |

**Acceptance:** unset/selected/unverified/unavailable/no-provider, shared dirty/
save/conflict, exact inheritance and keyboard/touch selection.

## Memory-search Model

**Audit state:** Audited

**Functional floor:** choose embeddings provider/model and report vector-index
compatibility. Saving never starts repair; a stale result links to the one
Memory-search Repair owner and names possible paid work.

**Current failure and overhaul:** Provider, model and Current are not controls
and hide index impact. Use provider/model selection, compatibility evidence and
an index-status callout. After a change show `Rebuild recommended` plus Locate
Repair, never an automatic task or generic Save success.

| Geometry | Contract |
|---|---|
| Height | 220 px minimum; 320 px ideal; 420 px maximum |
| 200 / 420 px | 380 px stacked / 280 px selector + index status |

**Acceptance:** unset/current/stale/unverified/provider unavailable, dirty/
save/conflict, assignment-versus-repair separation, fresh projection, paid-call
copy and responsive keyboard use.

## Response Limit

**Audit state:** Audited

**Functional floor:** set exact maximum output tokens in the server range
1024–128000, validate before save, report normalization and state `Applies to
the next model call`. It promises neither prose length nor cost.

**Current failure and overhaul:** a sample number, vague `Medium` ceiling and
Off warning do not enable adjustment or explain bounds/timing. Use a numeric
input with step buttons, exact min/max hint, contextual token mark and validation
message. Cost/truncation copy is descriptive, not a traffic-light score.

| Geometry | Contract |
|---|---|
| Height | 180 px minimum; 240 px ideal; 320 px maximum |
| 200 / 420 px | 300 px stacked input / 220 px inline input |

**Acceptance:** default/valid/below/above/saving/conflict/failure/normalized,
no silent coercion, next-call timing, fresh projection and accessible numeric
semantics.

## OpenRouter Routing

**Audit state:** Audited

**Functional floor:** for an OpenRouter connection, edit ordered provider
preferences, allow/deny slugs, privacy/data policy and pinning while preserving
server ordering. Other provider kinds show Not applicable and a locate action.
Contradictions block Save and identify exact entries.

**Current failure and overhaul:** Price then latency, fallback and capability
gate omit every real field, order and selected-connection context. Use a
connection banner, reorderable provider list with button/keyboard parity,
allow/deny token fields, pin and privacy sections, plus a live contradiction
list. Discovery suggests slugs but never replaces free entry.

| Geometry | Contract |
|---|---|
| Height | 300 px minimum; 540 px ideal; 700 px maximum |
| 200 / 420 px | 400 px applicability summary / 520 px staged editor |
| Focused | 820 x 680 px routing editor |

**Acceptance:** not-applicable/empty/dirty/invalid/discovery unavailable/save/
conflict/removed connection, all server fields/order, capability gating, shared
owner and accessible reordering.

## Scene Backdrops

**Audit state:** Audited

**Functional floor:** configure generation provider/model, enablement and
continuity policy only. Scene Backdrop owns visible-turn image, Generate/Reroll
and contextual state. Invalid/unconfigured capability blocks enabling; save is
one revision-qualified transaction.

**Current failure and overhaul:** Enabled, source and runtime-owner rows provide
no model/config controls or readiness. Use an enable switch, provider/model
comboboxes, continuity selector and readiness checklist. A destination row
locates the Scene controller but shows no image or prompt. Unsupported state
explains exactly which capability is missing.

| Geometry | Contract |
|---|---|
| Height | 240 px minimum; 360 px ideal; 480 px maximum |
| 200 / 420 px | 420 px stacked controls / 320 px compact form |

**Acceptance:** off/ready/unconfigured/unsupported/dirty/save/conflict/provider
removed, validated enable, atomic intent, fresh projection, runtime split and
no Story media in Settings or Catalog.

## Room Ambience

**Audit state:** Audited

**Functional floor:** configure Local-folder or Freesound source, relevant
folder/API secret, enablement and licence policy. This is distinct from Story
Room Ambience playback and room descriptive data. Blank secret preserves;
reviewed Clear requires a route; secret input leaves DOM after save.

**Current failure and overhaul:** Enabled, default volume and runtime-owner
misstate the contract: volume is device sound, while this owner needs source,
credential and licence. Use source segmented control, conditional folder or
secret fields, licence selector and readiness checklist; link the Story player
without duplicating transport.

| Geometry | Contract |
|---|---|
| Height | 260 px minimum; 420 px ideal; 560 px maximum |
| 200 / 420 px | 460 px staged source form / 380 px compact form |

**Acceptance:** off/local ready/missing/Freesound ready/missing/licence refusal/
source change/save/conflict, secret safety, enable guard, fresh projection, no
Story-data overlap and all widths.

## Theme Settings

**Audit state:** Implemented and accepted in the working mockup

**Functional floor:** remain the only authoring owner for the six canonical
color roles, glass density, bar opacity, selection strength, frost, Ambient
Light position/radius/intensity, and atmospheric/gradient canvas treatment.
Color selection and the shared hex field converge on one validated draft.
Preview is reversible; Apply Custom validates and persists to the shared device
theme; reset edits the draft only; import/export never creates another owner.

**Implemented overhaul:** the former live Scene Custom Theme and the Settings
Theme hybrid are no longer independent surfaces. Theme Settings ships beside
Theme Library in Appearance and Accessibility, and both observe one device
document. Six labeled swatches select the shared hex field; four material
ranges, the ambient instrument, and atmospheric/gradient controls write the
same recoverable draft. Invalid color text exposes `Needs fixes`, disables
Apply, and leaves the last valid live preview active. Import, Export, reviewed
Reset, and Apply Custom provide explicit feedback. The Widget can be moved to
another Panel but does not ship as a duplicate Scene default.

| Geometry | Contract |
|---|---|
| Height | 360 px minimum; 640 px ideal; 760 px maximum |
| 200 / 420 px | 700 px staged narrow editor / 600 px two-column editor |
| Placement | Appearance and Accessibility by default; movable, single owner |

**Acceptance:** six canonical colors, four material controls, ambient position,
radius and intensity, atmospheric/gradient canvas, valid/invalid device draft,
live preview, apply/reset/import/export feedback, last-valid rollback, one
shared draft, Library synchronization, Catalog preview, responsive layout and
keyboard ambient access.

## Story Reading and Layout

**Audit state:** Audited

**Functional floor:** move the Reading and Layout owner into a compact
instrument for story text size, density and Full/Reduced/Off effects beside a
synthetic prose sample. Accessibility overlaps are the same device keys and
update both surfaces immediately.

**Current failure and overhaul:** Measure, prose size and rhythm are passive and
omit density, effects, preview, override and persistence truth. Use compact
segmented controls, a redacted reflow sample and an Accessibility-owned override
note. At 200 px stage controls then sample; at 420 px show them together. Reset
locates the full bounded action rather than inventing another reset owner.

| Geometry | Contract |
|---|---|
| Height | 240 px minimum; 380 px ideal; 520 px maximum |
| 200 / 420 px | 440 px controls-then-sample / 340 px side-by-side sample |

**Acceptance:** all values/effect tiers, immediate receipt, Accessibility
override/migration/failure, same owner as panel, reduced motion, 200% zoom and
keyboard operation.

## Story Sound

**Audit state:** Audited

**Functional floor:** control story volume, mute and turn-complete chime through
the single atmosphere runtime shared by Scene and Settings. Preview chime needs
a user gesture and disappears when unavailable.

**Current failure and overhaul:** Ambience On, cues Low and Connected are
statuses, not a mixer; they omit volume, mute, chime and browser lock. Replace
with icon-led Mute, accessible volume slider, chime switch/Preview and explicit
runtime/lock status. A second placement moves/focuses the owner rather than
creating synchronized controls.

| Geometry | Contract |
|---|---|
| Height | 200 px minimum; 280 px ideal; 380 px maximum |
| 200 / 420 px | 340 px stacked controls / 240 px inline transport |

**Acceptance:** normal/muted/chime/locked/preview unavailable/runtime unavailable/
device failure, one live mixer, gesture safety, reset integration, range
semantics and compact reflow.

## Accessibility Controls

**Audit state:** Audited

**Functional floor:** expose Accessibility Mode plus solid surfaces, contrast,
color-independent markers, reduced motion/canvas, focus, large interface/story
text and roomy controls. Granular overrides recompute Mode; Reading overlaps
are shared keys. The broad Reset remains in full Accessibility.

**Current failure and overhaul:** High contrast, reduced motion and focus omit
most controls and have no switches, mixed Mode, forced-platform or failure
state. Use an icon-and-switch list grouped Vision, Motion, Focus and Scale with
plain-language current/applied status. Narrow view stages groups; 420 px uses
two columns. `Locate reset` is the only reset action.

| Geometry | Contract |
|---|---|
| Height | 300 px minimum; 520 px ideal; 680 px maximum |
| 200 / 420 px | 600 px one-column controls / 480 px two-column groups |

**Acceptance:** Mode on/off/mixed, every key, forced OS/migration/device failure,
shared owner, no color-only meaning, 44 px targets, strong focus, zoom/reflow
and safe reset split.

## Content Preferences

**Audit state:** Audited

**Functional floor:** edit adult-story content, underneath descriptions,
recurring-extra promotion and affect habituation in one shared global draft with
consequence copy. Reset changes draft only; Save is explicit. Transactional
intent and partial reconciliation are truthful until the route is atomic.

**Current failure and overhaul:** Profile, intensity and Draft neither identify
the four settings nor expose consequences or controls. Use four plainly named
switch/select rows, each with an info disclosure and future-beat timing, plus a
stable Reset draft/Save bar. Partial result lists which values changed after
fresh server reload; failure retains compare/retry draft.

| Geometry | Contract |
|---|---|
| Height | 300 px minimum; 500 px ideal; 640 px maximum |
| 200 / 420 px | 580 px stacked consequences / 460 px compact rows |

**Acceptance:** all four settings/copy, clean/dirty/save/conflict/partial/
failure/normalized/offline, shared panel draft, no false rollback and all
widths/accessibility.

## Narrator Voice Examples

**Audit state:** Audited

**Functional floor:** author server-limited exemplar passages in ARIA tabs with
one visible textarea, retained owner-qualified draft, explicit Save and fresh
projection. Copy states every saved passage guides every narrator call and is
not story fact. Clear all is a reviewed draft action.

**Current failure and overhaul:** count, selected label and Edited hide all
passages, limits, tab navigation, content consequence, conflict and leave
protection. Dock mode shows slots, selected name, validation/draft state and
Focus without content. At 420 px stage one editor; focused mode provides tabs,
textarea, findings and stable Save. Catalog never shows authored text.

| Geometry | Contract |
|---|---|
| Height | 320 px minimum; 580 px ideal; 720 px maximum |
| 200 / 420 px | 400 px slot/draft summary / 540 px staged editor |
| Focused | 820 x 680 px exemplar editor |

**Acceptance:** empty/dirty/device draft/limits/save/conflict/clamped legacy/
offline, trimming blank entries, retained draft, full tab keyboard model, leave
gate, privacy and all viewports.

## Living World Controls

**Audit state:** Audited

**Functional floor:** edit the active Story's four Living World approaches at
Off/Floor/Ceiling through the exact owner shared with the Story Widget. Rows
show requested, built, permitted/effective and cost; All off is a reviewed draft
action. No active Story means unavailable, never fallback.

**Current failure and overhaul:** three On rows omit the fourth approach,
requested/effective distinction, tiers, cost, clamp, draft and Story identity.
Reuse the four-row System Widget anatomy with a prominent active-Story banner
and shared-draft location. At 200 px show status/resume; at 420 px edit rows.
Fresh reload follows the normalized response.

| Geometry | Contract |
|---|---|
| Height | 320 px minimum; 580 px ideal; 720 px maximum |
| 200 / 420 px | 400 px Story/status summary / 540 px four-row editor |
| Focused | 820 x 700 px Living World editor |

**Acceptance:** no-Story/no fallback, all four definitions, clamp/unbuilt/policy,
Story change, shared draft/receipt, All-off review, carrier boundary, all
viewports and safe persistence.

## Installed Extensions

**Audit state:** Audited

**Functional floor:** list installed extensions with enable, safe mode, load/
fault, declared access/trust and update state; share Add-ons' listing, polls,
row leases, teardown and registration reload. Enable or changed-code update
reviews access; remove names file deletion and retained Story data.

**Current failure and overhaul:** Installed/Enabled/Fault-retired counts contain
no extension identities, states or actions and duplicate Add-ons visually. Use
compact rows with package icon, name/version, load/enable/trust/update chips and
row More. Selected detail explains declared capabilities. Compact mode stages
review; focused mode can locate the full Add-ons ledger without a second owner.

| Geometry | Contract |
|---|---|
| Height | 320 px minimum; 580 px ideal; 720 px maximum |
| 200 / 420 px | 420 px coordinator summary / 540 px extension rows |
| Focused | 860 x 700 px installed ledger |

**Acceptance:** loading/error/empty/enabled/disabled/fault/safe mode/check/update/
enable/remove/reload failure/stale/offline, repeated trust review, one
coordinator, row isolation, all widths and no extension code in preview/layout.

## Install Extension

**Audit state:** Audited

**Functional floor:** accept a supported source, validate it, preview package
identity and declared access, review untrusted-code consequences, then land the
extension disabled without registering runtime/browser code. One recoverable
source draft and action lease are shared with Add-ons.

**Current failure and overhaul:** Source, Awaiting validation and Review
required are sample statuses, not a flow; they omit input, validation evidence,
identity/capability disclosure, consequence review and disabled result. Use
Source → Validate → Review → Install stages with a stable owner bar. Review
shows identity/version/capabilities and exact source; install is unavailable
until validation passes and prevents double submit.

| Geometry | Contract |
|---|---|
| Height | 240 px minimum; 400 px ideal; 540 px maximum |
| 200 / 420 px | 480 px staged flow / 360 px source + review summary |

**Acceptance:** empty/device draft/validating/malformed/hostile/refused/review/
installing/disabled result/duplicate/conflict/cleanup/offline, shared retained
draft, atomic landing, no registration and no real path in Catalog/layout.

## Sonder Updates

**Audit state:** Audited

**Functional floor:** perform an explicit remote Check and, if safe, review/
install one update through a single coordinator. Nothing checks on mount.
Install names checkout mutation, dirty-worktree refusal, service interruption
and restart requirement; work survives Widget unmount.

**Current failure and overhaul:** Current/Available/Today falsely imply a recent
check and offer no action, source, version detail or safety state. Use a version
summary with `Not checked`/timestamp, icon-led Check, release detail disclosure,
and full-width Review update only when available. Dirty/refused and restart-
required are textual terminal states, never a generic Ready badge.

| Geometry | Contract |
|---|---|
| Height | 240 px minimum; 360 px ideal; 480 px maximum |
| 200 / 420 px | 420 px stacked review / 320 px version + action |

**Acceptance:** unchecked/checking/error/current/available/dirty/refused/review/
install/failure/restart/version changed, no automatic network work, one lease,
background continuity and accessible confirmation.

## Checkpoint Storage

**Audit state:** Audited

**Functional floor:** inspect checkpoint compatibility and explicitly start a
resumable conversion. Review says rollback-history storage is rewritten, Story
content is not re-embedded/deleted, converted entries are skipped and failed
equivalence checks remain untouched. One task/poll owner survives placements.

**Current failure and overhaul:** counts and `Task lease: Idle` omit compatibility,
legacy scope, conversion consequence, progress, resumability and equivalence
result. Use a storage/compatibility summary, bounded evidence counts, Review
conversion, then a determinate task row with phase/progress and Background Work
link. Do not show internal lease vocabulary.

| Geometry | Contract |
|---|---|
| Height | 260 px minimum; 420 px ideal; 560 px maximum |
| 200 / 420 px | 460 px stacked evidence / 380 px evidence + task |

**Acceptance:** checking/error/none/current/legacy/review/running/partial/
equivalence refused/failed/completed, one task/poll, resumability, unmount
survival, no false deletion/re-embedding claim and all widths.

## Memory-search Repair

**Audit state:** Audited

**Functional floor:** inspect vector-index compatibility and explicitly rebuild
when stale. Review names selected embeddings model/provider, possible paid
calls, asynchronous work and preservation of Story/memory records. Assignment
changes only recommend repair; they never auto-start it.

**Current failure and overhaul:** Current, zero missing vectors and Idle expose
neither model compatibility nor a review/task flow. Use an index-evidence
summary with model identity and `Current`, `Stale`, or `Model missing`; Review
rebuild precedes Start. The task row shows queued/running/partial/provider error
and links Background Work. Assignment change during run is explicit.

| Geometry | Contract |
|---|---|
| Height | 260 px minimum; 420 px ideal; 560 px maximum |
| 200 / 420 px | 460 px stacked evidence / 380 px evidence + task |

**Acceptance:** checking/error/current/stale/missing/review/queued/running/
partial/provider failure/completed/model changed, paid consent, no automatic
start, one task owner, memory preservation and unmount survival.

## Diagnostics

**Audit state:** Audited

**Functional floor:** describe and download a bounded, redacted interface-event
snapshot. It is not a server-log viewer or repair tool. Preview contains only
event count, time range and redaction policy; credentials and request bodies
are excluded and event text never enters Catalog or Panel data.

**Current failure and overhaul:** Database health, provider reachability and
Credentials Redacted describe a health dashboard the real service does not
own. Replace with snapshot scope, known event count/time range, policy version
and user-initiated Prepare/Download. An info disclosure explains exclusions;
there is no repair or raw preview.

| Geometry | Contract |
|---|---|
| Height | 190 px minimum; 260 px ideal; 360 px maximum |
| 200 / 420 px | 320 px stacked / 230 px concise scope + action |

**Acceptance:** ready/no events/preparing/exported/failure/unavailable/policy
changed, accurate non-server language, redaction, bounded scope, no automatic
capture, keyboard download and zero diagnostic content persistence.

## Prompt Preset/Editor

**Audit state:** Audited

**Functional floor:** movable large-workspace placement of the exact Prompt
Editor owner: preset/language, fragment-aware sheets, named Save, Activate,
validated Import preview, selected-only Export and confirmed Delete. Default is
read-only; long draft is recoverable/revisioned and survives moving.

**Current failure and overhaul:** Preset, Role and No changes provide no rail,
sheet editor, fragments, validation, active/selected distinction, draft,
conflict or action. Treat compact placement as owner/status/Focus only. At 420
px stage preset rail then current sheet metadata; full editing is focused with
one scroll, persistent Back/Save, findings and diff. Locating an existing Prompt
Editor never mounts another draft.

| Geometry | Contract |
|---|---|
| Height | 340 px minimum; 700 px ideal; 780 px maximum |
| 200 / 420 px | 420 px owner/draft summary / 660 px staged workspace |
| Focused | 1000 x 740 px Prompt workspace |

**Acceptance:** Default/custom/active/dirty/device draft/findings/save/conflict/
activate/import/export/delete/external change, one owner/draft/action leases,
exact move/locate behavior, keyboard tabs and no prompt content in preview or
Panel persistence.

## Raw Clothing Data

**Audit state:** Audited

**Functional floor:** inspect—and only after all prerequisites, edit—the active
Story's Present-frame raw attire JSON as the same qualified owner/section as Raw
Story Data. Save must be Story-targeted, idle, revision-conditional, reviewed,
normalized and followed by authoritative reload/Scene refresh; it re-derives
wearing/state/regions and never implies arbitrary-frame support.

**Current failure and overhaul:** Wearer count, Read-only and typed owner do not
offer a safe inspection or explain why editing is unavailable. Use a Present-
frame/Story banner, prerequisite checklist, redacted tree summary and `Open in
Raw Story Data`. Only when every server seam exists does focused mode reveal the
JSON editor, findings and replacement Review. It never becomes a phone or
toolbar float.

| Geometry | Contract |
|---|---|
| Height | 320 px minimum; 640 px ideal; 760 px maximum |
| 200 / 420 px | 400 px prerequisite/locate summary / 600 px staged read-only view |
| Focused | 900 x 720 px Advanced section; no compact write |

**Acceptance:** no-Story/load/redacted/read-only/draft/parse/schema/review/
conflict/pipeline/Story changed/normalized, Present-only truth, re-derivation,
shared owner, safety gate, keyboard editor and no raw data in Catalog/layout.

# Audited slice: extension host shapes and embedded renderer

## Cross-slice host evidence

- The Catalog exposes three representative products—Campaign Clock, Location
  Notes, and Mythic Settings—but the design target is the dynamic host shape,
  not those examples. Availability comes only from installed, enabled,
  successfully registered owners with validated manifests/adapters.
- Current samples inherit the generic three-row shell. Campaign Clock can dock
  but offers only a small 28 px action and no visible trust/fault/context state;
  Location Notes becomes a large empty float over the Scene without an editor;
  Mythic Settings shows Mode/Schema/Owner but no settings draft or lifecycle.
- The host owns outer header, owner/version/trust disclosure, geometry, focus/
  Back, unavailable/fault placeholder, action confirmation and teardown. The
  extension owns only its contained body and declared state/actions. Owner-
  prefixed CSS may consume public tokens but cannot rewrite host/root styles.
- The Catalog never mounts extension code. It uses a host-generated miniature
  unless a bounded synthetic renderer is explicitly validated. Disabled,
  removed, updated, fault-retired or schema-invalid owners execute no code; a
  persisted placement becomes a host placeholder with Open Add-ons and Remove
  placement.
- The native contract must validate owner-namespaced immutable type/version,
  context/selection, role, geometry/responsive modes, multiplicity/instance
  key, state schema/migration/persistence, actions/tasks/consequences, lifecycle
  teardown and declared trust/access before insertion.

## Extension Compact/Sidebar Shape

**Audit state:** Audited

**Functional floor:** host a durable bounded status/tool surface with one clear
purpose, semantic empty/loading/error/unavailable states, declared context and
selection, host-owned owner/trust/overflow chrome, and task-service handoff.
There is no assumed permanent legacy sidebar.

**Current failures:** Campaign Clock's Clock/Segments/Owner rows and `Advance
clock` neither demonstrate a real segment control nor context loss, busy state,
capability, owner version/trust, disabled/fault placeholder or teardown. Its
generic paragraph/note consume scarce 200 px width while the primary action is
below the information and under target size.

**Overhaul:** the host header shows semantic extension icon, title, compact
owner/version badge and More (About, Locate settings, Remove). The body receives
a validated frozen context and must provide a `compact-200` responsive mode to
be eligible for the minimum toolbar; otherwise placement is unavailable there
and offers Focus/Locate. Host shells render loading, no context, unavailable,
fault and retired states. Actions use 44 px icon/text controls and declared
consequence/task metadata.

| Geometry | Contract |
|---|---|
| Height | 200 px host minimum; 320 px ideal at 286; 560 px maximum |
| 200 / 420 px | 380 px declared compact stack / 280 px inline bounded tool |
| Width exception | Manifests above 200 px are truthfully incompatible with the minimum dock |

**Catalog and acceptance:** host miniature is icon/title/purpose/owner/status
with synthetic data and no extension execution. Prove context loss, one-live
instance, async task survival, disable/re-enable, teardown, update/schema
migration, three-fault retirement, placeholder actions, 200/286/420, zoom,
keyboard/touch and owner CSS containment.

## Extension Full-workspace Shape

**Audit state:** Audited

**Functional floor:** contain a substantial extension destination/editor under
its canonical Scene, Library, Settings or Add-ons affinity. The host owns outer
focus/Back, placement, fault/unavailable treatment and Escape; owner-qualified
drafts/tasks/actions declare schema, migration and consequence. It creates no
fourth primary destination.

**Current failures:** Location Notes floats over the Scene with Location, count
and Draft but no notes, selection context, editor, Save, conflict, owner/trust,
Back or failure handling. The same card could be mistaken for host Library
content and its placement ignores the declared Library affinity.

**Overhaul:** compact placement is a context/owner/draft/task summary with
`Focus workspace`; at 420 px it may stage owner-declared sections; the real
workspace opens in host focus with canonical destination breadcrumb, one scroll
owner, stable Back/action bar and host confirmation for destructive actions.
Selection changes are captured/rejected by owner key. Disable/update destroys
the mount and leaves a host placeholder without erasing migrated draft state or
extension-owned data.

| Geometry | Contract |
|---|---|
| Height | 320 px minimum; 640 px ideal; 780 px maximum |
| 200 / 420 px | 400 px owner/context summary / 600 px staged workspace |
| Focused | 960 x 720 px validated extension workspace |

**Catalog and acceptance:** host-generated synthetic summary only. Prove
destination affinity, no/invalid context, lazy load, draft/conflict/task,
selection change, action leases, migration, disable/update/remove teardown,
retired placeholder, sync/async fault isolation, theme/CSS contract, all
viewports and accessibility.

## Extension Settings Shape

**Audit state:** Audited

**Functional floor:** adapt an enabled extension's settings under Add-ons/
Settings with one owner, draft, save service, leases and projection shared by
panel and placed module. Mount is lazy; scanning Add-ons or Catalog executes no
extension code. Disabled/retired owners never run. Large/dangerous settings can
declare contained-only.

**Current failures:** Mythic Settings' Mode/Schema/Owner rows show no controls,
version/trust, draft, Save, conflict, migration, disabled/fault state or Add-ons
affinity. `Review settings` is a vague 28 px action and the sample mounts in a
Scene toolbar as if it were an ordinary Story tool.

**Overhaul:** host header always shows owner/version/trust and Settings
affinity. A compact validated schema form uses host control primitives and one
Save bar; custom bodies stay contained. At 200 px show owner/current/attention
and Locate; at 420 px stage safe fields. Contained-only definitions offer Locate
instead of drag. Disable/update tears down immediately; re-enable mounts only
after manifest and state-schema validation.

| Geometry | Contract |
|---|---|
| Height | 280 px minimum; 480 px ideal; 640 px maximum |
| 200 / 420 px | 360 px owner/status + Locate / 440 px staged settings |
| Focused | 820 x 680 px when manifest permits focused authoring |

**Catalog and acceptance:** host-generated settings identity only. Prove lazy
mount, Add-ons scope, clean/dirty/save/conflict, one owner, disabled/update/
migration/fault/retired/removed, contained-only disposition, teardown, all
widths and no settings read or code execution in Catalog.

## Extension Turn Inspector Renderer

**Audit state:** Audited; embedded only, never a Catalog Widget

**Functional floor:** render one owner + exact step key + renderer-version
projection inside its Turn Inspector step row using the Inspector's exact saved
turn/frame/variant. Default is read-only. It may expose only owner-qualified
actions supported by the Inspector contract; core rerun/activate/delete remain
host-owned. Disable/fault swaps to safe stored JSON/text without erasing history.

**Current failures:** the current Evidence Lab sample correctly shows owner and
read-only stored projection, but it is a generic nested rectangle with a small
`Open evidence` action. It does not visibly demonstrate exact step/renderer
version, loading/unavailable/fault fallback, host-versus-extension action
boundary, reflow, or the fact that it is not an independently placeable card.

**Overhaul:** nest the renderer beneath the owning step header with an extension
icon, owner/version disclosure and `Stored variant N` context inherited from
Inspector. The host supplies loading, unavailable, failed/retired and safe raw-
fallback shells plus a 44 px action area. The body gets a fresh contained root
and frozen stored projection—never active/latest fallback, unsafe HTML or host
DOM access. Its edge treatment is subordinate to the step, not a second Widget
frame.

| Embedded geometry | Contract |
|---|---|
| Height | 96 px minimum; 160 px ideal; 320 px before internal expand/scroll |
| Narrow response | One-column metadata/body/actions inside Inspector; no horizontal overflow |
| Independent placement | None: no Catalog, drag, miniature or multiplicity contract |

**Acceptance:** exact saved variant/context, owner/version, read-only default,
supported action boundary, load/unavailable/fault, safe historical fallback,
disable/update teardown, other-step isolation, Inspector keyboard/zoom/reflow,
and proof no top-level definition/placement exists.

## Phase 1 gate review — passed

The audit-first gate passed on 2026-08-26. Phase 2 implementation may begin.

| Gate check | Evidence | Result |
|---|---|---|
| Coverage rows | 95 rows; ordinals are unique and contiguous 1–95 | Pass |
| Audit records | 95 `Audit state: Audited` records | Pass |
| Required record anatomy | Every audited block contains failure diagnosis, overhaul, geometry/height, and acceptance evidence | Pass |
| Queue | 95 Audited; 0 Queued | Pass |
| Fixed mockup registry | 91 built-ins: 12 Story, 19 Library, 21 Systems, 39 Settings | Pass |
| Extension top-level shapes | 3 representative registered shapes; 94 top-level Catalog Widgets total | Pass |
| Embedded disposition | 1 Turn Inspector renderer, explicitly outside the Catalog | Pass |
| Inventory reconciliation | 69 fixed non-subwidget Widgets + 22 eligible Settings subwidgets + 3 extension shapes + 1 embedded renderer | Pass |
| Host session disposition | Retained as full Maintenance content; excluded from Widget count | Pass |
| Markdown integrity | `git diff --check` clean for this ledger | Pass |

The mockup's original external editable path disappeared during Phase 1 while
the localhost preview remained available. Its live page stayed the visual
baseline. Before the first implementation edit, the target artifact must be
resolved against the now-present repository copy without overwriting concurrent
work; the frozen baseline hashes in this document remain the comparison source.

## Phase 2 ordered implementation plan

### Artifact and isolation

- Preserve the hash-identified Atmospheric Workbench reference unchanged.
- Create a successor source, preview wrapper and regression harness under
  `docs/experiments/sonder-widget-overhaul/`, seeded from the current committed
  reference so the cancellation, docking, offline-font and persistence fixes
  remain intact.
- Serve the `docs/experiments` root locally so reference and successor can be
  opened at identical viewports for side-by-side comparison.
- Use the approved Minimal UI manifest at
  `F:\git\Sonder_Engine\artifacts\minimal-ui-icons`; copy only selected source
  SVGs into the successor package with licence/provenance, and never synthesize
  replacement glyphs.
- Keep the successor source data synthetic and its runtime self-contained. Main
  supplies behavior truth; this mockup demonstrates states and interaction but
  does not call production APIs.

### Exact sequence

Implementation follows coverage rows 1–95 without parallel Widget edits. The
first six Settings panels establish shared control, row, receipt, draft and
task patterns; later Widgets may reuse those proven primitives without changing
the already-frozen Widget unless the whole-mockup regression exposes a real
regression. The embedded renderer is row 95 and is implemented only inside
Turn Inspector.

For each row:

1. Add one focused regression that expresses the next missing behavior or
   geometry contract and run it against the unchanged successor until it fails
   for that reason.
2. Implement only that Widget's anatomy, representative states, responsive
   modes, icon mapping, placement/default-height metadata and Catalog miniature.
3. Run the focused regression and existing suite to green.
4. Playwright-check the real placed Widget at 200, 286 and 420 px where dockable,
   plus focused/wide, phone, short-height, Catalog Visual/Compact and keyboard
   placement contexts that apply. Capture screenshots and inspect them.
5. Record cycle 1 evidence and remaining shortcomings in this ledger.
6. If a concrete gap remains, add/update the focused regression so it fails,
   make one correction pass, rerun and reinspect, then record cycle 2. If no gap
   remains, mark cycle 2 `Not needed`. No Widget receives a third correction
   cycle without a new change-control decision.
7. Freeze that Widget record and advance to the next row.

Shared regression checks run after every Widget: Catalog search/category/count,
pointer and keyboard placement, drag cancellation restoration, docking/tab
state, toolbar resizing, default-height restoration, state preview recovery,
focus/Back behavior, ARIA names/focus order, reduced motion, no horizontal
overflow, persistence boundaries and icon-manifest integrity.

### Phase 2 completion gate

Phase 2 completes only when every row has a green evidence table, no more than
two cycles, and the whole successor passes the regression harness and visual
qualification against the frozen reference at matching viewports. Completion
does not silently promote the successor to canonical Design Bible authority;
that remains explicit change control.

## Phase 2 evidence template

This table will be copied into each Widget record only after the Phase 1 gate
opens. It records observations, not ceremony.

| Cycle | Implementation change | Playwright evidence | Visual contexts inspected | Remaining shortcomings | Result |
|---|---|---|---|---|---|
| 1 | Not started; Phase 1 gate passed | Not run | Not inspected | Not assessed | Ready |
| 2 | Used only if cycle 1 records a gap | Not run | Not inspected | Not assessed | Conditional |

Final acceptance additionally requires a whole-mockup regression covering
placement by pointer and keyboard, docking and tab groups, min/max toolbar
widths, per-Widget default heights, focused mode, phone and short-height
staging, Catalog Visual and Compact results, state restoration, shared draft
ownership, accessibility, icon-manifest integrity, self-contained preview
operation, and side-by-side comparison with the canonical Design Bible state.
