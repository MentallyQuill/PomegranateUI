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
authority scenarios remain green. The promoted visual paths are
`wide-pom-neutral.png`, `compact-pom-neutral.png`, and the PomOS material stress
captures under `tests/browser/__screenshots__/native-workbench-visual.spec.ts-snapshots`.
