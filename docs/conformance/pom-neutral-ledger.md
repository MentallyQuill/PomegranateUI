# PomOS conformance ledger

**State:** Closed by the v2 semantic-recipe renderer and final Tahoe-informed
critic pass. The stable preset ID remains `pom-neutral`; PomOS is the public
display name. The earlier byte-hashed Pom Neutral reference remains preserved
as historical evidence rather than current art-direction authority.

## Authorities and boundary

The visual rubric uses the five user-supplied macOS 26 Tahoe images covering a
desktop, Control Center, Messages, Contacts, and Shortcuts. They govern broad
qualities: an original blue dimensional canvas, restrained system chrome,
floating continuous-rounded windows, layered translucent material, consistent
edges, thin controls, quiet typography, and functional restraint.

PomOS does not copy Apple assets, application markup, a Dock, product identity,
or decorative window controls. The shared Pom Workbench Widget inventory and
real actions remain mounted in every target.

## Frozen authority discrepancy queue

| ID | Category | Severity | Authority | Scenario | Evidence | Diagnosis | Status | Regression | Deviation |
|---|---|---|---|---|---|---|---|---|---|

## Live-testing verdict and corrections

| ID | Severity | Live finding | Root cause | Resolution | Regression owner |
| --- | --- | --- | --- | --- | --- |
| PO-101 | Substantive | Decorative stoplight dots implied controls but performed no action. | Header pseudo-content copied a platform cue with no Pom command behind it. | Remove the pseudo-content completely; action icons now come only from the semantic icon registry and retain real labels/commands. | `theme-renderer-contracts.spec.ts` rejects header pseudo-content and preserves icon art. |
| PO-102 | Blocking | Glass opacity and frost values existed but Widgets did not visibly behave like glass. | Full-screen floating structure and nested dock/Widget/content surfaces competed as backdrop owners; the canvas could also paint above content. | Keep the canvas below interaction, make docks and structural panels transparent, and assign backdrop filtering to exactly one actual Widget/floating/dialog surface. | Canvas-order, single-owner, endpoint, and reduced-transparency browser contracts. |
| PO-103 | Substantive | Subsections used unrelated opacity and flat opaque fills. | Rows lacked a stable semantic anatomy and were styled by local selectors. | Annotate rows/groups and map them through complete v2 `row.surface` and `group.surface` recipes with the same material hierarchy. | Semantic part inventory and computed-style browser checks. |
| PO-104 | Substantive | Random square corners, stacked bevels, and conflicting edge treatments made the interface incoherent. | One global radius plus legacy borders, clip paths, child rims, and theme-specific CSS all owned geometry. | Introduce named shape recipes, continuous-rounded PomOS windows, borderless structural docks, one rim/elevation owner, and no child bevel. | Border/radius/clip-path assertions and no-theme-ID source gate. |
| PO-105 | Blocking | Dock edges visibly artifacted over the wallpaper. | Docks painted their own fill, border, shadow, radius, and clipping layer. | Docks are now layout-only, fully transparent, borderless, shadowless, and non-clipping over one root canvas. | Seamless structural dock assertions for all targets. |
| PO-106 | Substantive | Range thumbs looked bulky and dated. | Native range presentation was outside the contract and the visible face doubled as the touch target. | Compile WebKit/Firefox range anatomy with a 3–4px track, 10–12px visible thumb, active fill, focus state, and a separate at-least-44px coarse-pointer hit area. | Geometry, endpoints, function, focus, and coarse-pointer tests. |
| PO-107 | Substantive | Two equally loud chrome bars read as a web dashboard. | Chrome hierarchy was hard-coded rather than a theme composition value. | PomOS selects overlay chrome, quieter context treatment, compact functional actions, and system-like typography while preserving every command. | Root composition attributes and theme-switch identity checks. |
| PO-108 | Blocking | Side windows contained large dead areas or extended below the viewport. | Fixed proportional dock rows ignored the intrinsic content needs of individual floating-window composition. | Individual stacks size to content, use compact internal rail rhythm, and fit the final Widget within the dock; unified Deep Current uses a separate functional row allocation. | Wide bounds, dead-space, all-viewport overflow, and required-action containment tests. |
| PO-109 | Substantive | Focused and floating Widgets could receive a second elevated glass layer. | Structural wrapper and inner Widget both used a surface part. | Apply `floating.surface` only to the actual floating frame and let the focused dialog own elevation while its nested Widget is transparent. | Focus/floating single-owner browser contract. |
| PO-110 | Blocking | A theme could still require Lab-specific CSS to express identity. | V1 tokens did not own semantic part material/shape/state or composition. | Migrate to complete v2 materials, shapes, parts, canvas descriptors, policy, and public fixed-selector compilation. PomOS contains data only and no target selector. | Source conformance plus external copper-terminal consumer. |

## Final PomOS visual review

The 1440x900 render now reads as a restrained blue desktop workspace rather
than a pale dashboard. One layered blue canvas remains visible through the
rounded menu/context chrome, independent side windows, transcript, and
composer. Panels use a single soft edge/rim/shadow vocabulary. Rows share the
parent material hierarchy without nested frost. The center stays intentionally
quiet so the story is dominant.

At 640x900 and 390x844, the side docks withdraw while the theme selector,
active Panel, transcript, composer, and required controls remain reachable.
Touch hit targets expand without enlarging the visible slider face. Reduced
transparency produces opaque readable windows with no backdrop blur.

Remaining differences from Tahoe are intentional Pom boundaries: the
Workbench is a roleplay-toolkit demonstration, all chrome actions are real, the
canvas and icons are original, and Pom does not counterfeit a macOS desktop or
application.

| Rubric | Blocking | Substantive | Result |
| --- | ---: | ---: | --- |
| Identity and canvas continuity | 0 | 0 | Pass |
| Glass hierarchy and reduced-transparency fallback | 0 | 0 | Pass |
| Edge, radius, rim, and shadow consistency | 0 | 0 | Pass |
| Chrome, typography, icon, and control coherence | 0 | 0 | Pass |
| Widget function, focus, persistence, and overlays | 0 | 0 | Pass |
| Wide, compact, phone, and coarse-pointer composition | 0 | 0 | Pass |

The executable `pn-scene-wide`, `pn-scene-compact`, and `pn-catalog-wide`
authority scenarios retain the historical reference for identity, structure,
accessibility, and evidence capture. They deliberately do not freeze the
superseded reference's literal colors or radii; the v2 computed-style contracts
and promoted snapshots own current art-direction regression. The promoted
visual paths are `wide-pom-neutral.png`, `compact-pom-neutral.png`, and the PomOS
material stress captures under
`tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots`.

## Round 8 — Tahoe fidelity and short-height closure

The latest screenshot audit found shared layout defects that were most visible
in PomOS: short side stacks could outgrow their rows, the composer could lose
usable space at compact and zoom-equivalent sizes, chrome actions could cross
the shelf edge, and Scene Effects lacked one explicit grouped-material owner.
The same pass also replaced the faceted canvas with an original curved luminous
composition, strengthened the translucent material hierarchy, unified the
continuous-rounded geometry, and made eligible actions iconographic through the
generic presentation-profile content mode.

The repairs remain reusable: stack and scroll ownership are shared Workbench
behavior, `group.surface` and `button.icon` are existing semantic parts, and
presentation-sensitive geometry selects the generic `actions.content` value.
There are no PomOS/theme-ID selectors, component forks, or semantic-part
vocabulary additions. Text-mode themes retain their preserved action geometry.

Browser contracts now measure shelf descendants, side-stack siblings and
internals, transcript/composer containment, deterministic scroll movement,
44-pixel range and icon-action targets, native slider thumb geometry, focus,
keyboard and pointer behavior, grouped-material ownership, readable metadata,
accessible icon names, and atomic switching back to a text-action target.

### Round 8 responsive evidence hashes

| Snapshot | Viewport | SHA-256 |
| --- | --- | --- |
| `wide-pom-neutral.png` | 1440x900 | `8bd35fc0a96a768f6314bee550967ec0130630f98af53eb9257837482f2eee19` |
| `short-desktop-pom-neutral.png` | 1280x720 | `a1dff25099ea00f23db46d5fa185a64f96a318366b7c39f60906cca276e1a854` |
| `compact-pom-neutral.png` | 390x844 | `992e2b0278a1fcb691038d3815dbd55196f633432055f33b31e11ce026a049ed` |
| `short-landscape-pom-neutral.png` | 844x390 | `dedaa1eb2eb8eb445e001417bbf44fce969640aa563bf2571d541739a7a356fa` |
| `zoom-200-pom-neutral.png` | 800x450 | `94d7e8cd75b2b34179d541334f36a92484c8459e64fcb78eb0e1129c95ce556c` |
