# System Control Geometry and UI Artifact Cleanup Design

## Status

Approved for implementation on 2026-09-04. The approved delivery is direct integration and push to `main` after the full repository gate and rendered-browser review pass.

## Objective

Remove the reported cross-theme UI artifacts by making control topology, content-bearing control shape, selection treatment, readable foregrounds, and rail spacing explicit shared-system behavior. Themes continue to own material, color, typography, and radius values; recipes own semantic relationships; the fixed theme stylesheet interprets both without theme-ID selectors or alternate component trees.

## Constraints

- Keep one mounted Workbench, Panel, sub-panel, and Widget tree during theme changes.
- Keep every maintained theme data-only. Do not add selectors for `deep-current`, `pom-neutral`, `bunny`, or `ash-amber` IDs.
- Keep package exports backend-neutral and preserve the existing dependency direction.
- Preserve tablist, button, focus, pointer, keyboard, overflow, and accessible-name behavior.
- Preserve 44px coarse-pointer hit targets independently of smaller visual faces.
- Treat Deep Current as the selection-treatment reference, but do not preserve the reported trailing Characters separator artifact.
- Do not refresh visual authorities merely to hide unrelated drift. Every changed screenshot must be attributable to this design.

## Diagnosis

### 1. Adjacent rounded controls are rendered as unrelated bubbles

Panel tabs, sub-panel tabs, and grouped Widget tabs describe one contiguous choice set, but their theme surfaces are currently applied button by button. On rounded themes this produces colliding pills and doubled interior curves; on square themes it happens to look tolerable only because the radius is zero. Inferring a group from arbitrary DOM adjacency would incorrectly merge unrelated toolbar commands, and theme-specific CSS would duplicate the same topology decision in every preset.

The system needs an explicit joined-control contract. A semantic group declares that its members form one visual control, and each member declares whether it is the start, middle, end, or only segment. The fixed compiled stylesheet retains the theme-authored button radius on exposed outer ends, suppresses radius on interior ends, and collapses interior borders. A square theme naturally remains square because its authored radius is zero. Focused segments rise above adjacent seams so the focus ring remains complete.

Initial consumers are Panel tabs, sub-panel tabs plus Add sub-panel, grouped Widget tabs, the Characters portrait-size stepper, and true segmented selectors such as Catalog view/category choices. Unrelated shelf commands remain separate controls even when they happen to be adjacent.

### 2. Add sub-panel is owned by the whole bar instead of the tab run

The sub-panel rail shell currently grows across all available width while Add sub-panel is a sibling at the far edge. That separates the creation action from the collection it extends. Panel navigation already establishes the correct responsive behavior: the creation action follows the final tab while the run fits and remains fixed at the rail viewport edge when the tabs overflow.

The sub-panel rail shell will use the same content-sized, shrinkable geometry as Panel navigation. Add sub-panel remains outside the ARIA `tablist`, follows the last tab when the run fits, and remains immediately reachable after the clipped rail when it overflows. The tab run and Add action share joined-segment geometry without changing keyboard navigation or tab order.

### 3. Story identity is painted as highlighted blocks

The Story title and scene identifier currently set an opaque canvas-colored background on each text line. On PomOS this reads as two selection highlights rather than persistent story identity and causes the two lines to appear as unrelated blocks.

Both lines become typography-only overlays: no background fill, no box shadow used as a surrogate backdrop, and no inline highlight geometry. Their foreground is bound to the theme-authored readable Story-stage text color, with a restrained text shadow allowed only where it improves legibility without forming a rectangular field.

### 4. Essential labels use faint colors on incompatible materials

Several labels override the foreground supplied by their semantic material with the global faint token. The visible failures include the Workbench Lab subtitle, Widget header metadata such as the Characters count, and content descriptions inside Theme Library cards. A palette token can be valid in isolation and still fail after it is composited over translucent theme material and atmosphere.

Essential text will inherit the foreground of its actual material owner or use the owner’s readable muted foreground. Faint color remains limited to nonessential ornament. Browser tests will measure computed foreground against the rendered opaque background chain for the named labels in every maintained theme rather than assuming palette values guarantee contrast.

### 5. Selection underlines escape rounded controls and differ arbitrarily by surface

A universal Panel-tab pseudo-element and a Theme Library `aria-pressed` inset shadow add lower-edge lines even when a theme expresses selection through a rounded material and border. Those lines can cross curved boundaries and make selected content tiles look like tabs. Sub-panel tabs apply another independent rule.

Only actual tabs in the instrumented Deep presentation retain Deep’s contained one-pixel lower-edge indicator. Other themes express selected tabs through their compiled selected material, foreground, and border. Content tiles and toggle buttons never acquire a tab underline from `aria-pressed`; Theme Library selection uses the standard selected material plus its existing focus-colored outline/border treatment.

### 6. Rounded shelf controls have no visual breathing room

PomOS and Bunny allow rounded Panel tabs and shelf actions to occupy nearly the full shelf height. The result is a circular or pill face touching the containing bar, so the shelf no longer reads as the owner of the controls. The intended Tahoe-like relationship is a control face visibly nested inside its bar.

Non-instrumented chrome receives a shared visual inset. Fine-pointer control faces remain compact and leave at least 4px of visible bar above and below; coarse-pointer interaction targets remain at least 44px while their painted face may be smaller, or the bar grows when necessary. Deep’s flat instrumented rail remains flush because its square cells are the bar structure rather than floating faces.

### 7. Large content-bearing buttons inherit pill geometry

Theme Library preset cards are buttons, but they contain an icon, title, and multi-line description. Bunny maps ordinary button surfaces to a pill, so the cards acquire a radius based on half their large height, squeeze their text measure, and can visually clip content. The problem is semantic: an action chip and a content tile are both currently represented by the same shape role.

Content-bearing buttons receive an explicit `content-tile` shape marker. They keep the theme’s button material and interaction states but use the theme’s pane-scale radius, producing a rounded rectangle in PomOS and Bunny and a compact square/rounded rectangle in Deep and Ash. The rule is size-role based, not theme-ID based, and applies without changing the button’s semantics.

### 8. Deep Characters draws an orphaned horizontal bar

The minus and plus controls are real portrait-size actions, not a slider. Deep relocates them to the Widget’s bottom-right, reserves footer space, and gives every character row a bottom border. When the final row does not fill the Widget, its trailing border floats above the stepper and resembles a broken track.

Roster separators will exist only between rows. The final row cannot draw a trailing separator. The portrait-size actions become a compact two-segment joined stepper with a deliberate edge inset, no full-width footer rule, and unchanged three-state behavior.

## Shared Semantic Contract

The fixed semantic stylesheet recognizes two framework-neutral author markers:

- `data-pom-control-segment="start|middle|end|only"` identifies the exposed position of a member in a joined control.
- `data-pom-control-shape="content-tile"` identifies a content-bearing button whose geometry must use the pane-scale radius rather than a compact action radius.

Recipes calculate segment position from their own ordered data. Themes are not asked to encode sibling count or DOM topology. No JavaScript geometry observer is needed for corner decisions.

## Responsive Behavior

- Joined groups may overflow through their existing scroll owner; they do not wrap.
- A pinned trailing action is not part of the tablist and does not scroll away.
- At wide widths, Add sub-panel sits immediately after the last rendered tab.
- At constrained widths, the tab rail shrinks and scrolls while Add sub-panel remains at the rail’s trailing edge.
- Coarse-pointer targets stay at least 44px. Visual insets may be implemented with padding or a painted pseudo-element, but must not reduce hit area.
- Content tiles may reflow their internal grid at existing container breakpoints, but their outer radius never becomes a height-derived pill.

## Verification

### Compiler and recipe contracts

- Unit tests prove joined positions preserve only the correct outer corners and collapse only interior seams.
- Unit tests prove `content-tile` uses pane-scale radius while retaining button material/state bindings.
- Recipe checks prove the public Panel, sub-panel, Widget group, and Catalog sources emit the same semantic markers as the Lab copies where applicable.

### Browser behavior and geometry

- Panel, sub-panel, Widget group, Catalog selector, and Characters stepper members expose correct start/middle/end positions.
- Add sub-panel follows the last tab when the run fits and stays pinned beside the rail when it overflows at wide, phone portrait, short landscape, and 200%-equivalent viewports.
- Joined rounded controls have only two exposed rounded ends; Deep/Ash square or small-radius groups remain coherent.
- PomOS and Bunny shelf faces have visible top and bottom clearance while hit targets remain accessible.
- Theme Library cards contain their icon, title, and description and use a pane-scale rounded rectangle rather than a pill.
- Story title and scene identifier compute to transparent backgrounds in every theme.
- Named essential labels meet the repository’s text-contrast threshold against rendered owners in every maintained theme.
- Non-Deep selected controls have no lower-edge pseudo-element or inset underline; Deep tabs retain their one-pixel contained indicator.
- The final Characters row has no trailing border, the stepper is inset, and the portrait-size interaction remains functional.

### Final gate

Run `npm.cmd run check` from a state where ports 4173 and 4174 are confirmed free. Inspect focused screenshots for the user-provided PomOS shelf/Story/Characters composition, Bunny shelf, Bunny Theme Library, Deep Settings sub-panel rail, and Deep Characters footer before integrating and pushing `main`.

## Non-goals

- No new theme preset, theme-ID component branch, or branded application shell.
- No automatic merging of every adjacent button.
- No change to Panel/sub-panel ordering, persistence, context menus, or drag behavior.
- No npm publication.
