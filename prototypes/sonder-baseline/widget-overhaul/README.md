# Sonder Widget Overhaul Working Mockup

This package is the editable Phase 2 successor to the immutable Atmospheric
Workbench reference. It implements the audited Widget contracts in
`docs/design/sonder-panels-and-widgets/12_WIDGET_UX_OVERHAUL_LEDGER.md`.

The source reference remains unchanged. This working package was seeded from
the `F20C5ECA568775263D35B0F9B10562841A7B8C914EF79CD06A463D44A5FD3025`
source artifact so its docking, cancellation, persistence, offline-font, and
accessibility behavior is retained while Widgets are redesigned.

Font families and weights remain inherited from the Atmospheric Workbench.
Full-size Widget bodies use a compact reading hierarchy: 10/14 primary,
9/12 secondary, and 8/11 metadata. Module bars remain 11/14, story prose
remains 15/24, and Catalog miniatures retain their preview scale. This is a
role-specific hierarchy rather than one uniform Widget-wide font size.

Files:

- `sonder-widget-overhaul.html` — editable source-form mockup;
- `sonder-widget-overhaul-preview.html` — standalone same-origin preview;
- `sonder-widget-overhaul-regression.html` — regression harness used for every
  red/green Widget cycle;
- local font files and licences copied from the reference package.

## Panel sub-panels and Settings flow

Panels may optionally expose one row of sub-panels beneath the top shelf. A
Panel without sub-panels keeps the shelf at its original height. Creating the
first sub-panel preserves the Panel's current Widgets in an `Overview`
sub-panel and creates the requested sibling; no Widget is discarded or copied
implicitly. Sub-panels are intentionally one level deep. They cannot contain
sub-sub-panels.

Each sub-panel owns its Widget list, scroll position, order, lane assignment,
and one user-selectable layout: single column, two equal columns, three equal
columns, wide left, or wide right. Reducing the lane count appends Widgets from
removed lanes to the last surviving lane in stable order. Growing the layout
does not rebalance existing Widgets. The active sub-panel can be renamed,
duplicated, reordered, relaid out, moved, or deleted through the same visible,
context-menu, and keyboard paths.

Settings ships with six sub-panels:

- Account and Access — two equal columns;
- AI and Models — two equal columns;
- Appearance and Accessibility — three equal columns;
- Story Defaults and Content — two equal columns;
- Data, Extensions, and Maintenance — wide left;
- Advanced — one column.

Settings uses natural-height Widget modules. Individual Widgets do not own
vertical scrollbars; the active Panel surface owns the scroll and retains a
separate position for every sub-panel. At narrower widths, three lanes reduce
to two and then one without rewriting the persisted layout. On phone widths,
the tab row becomes a compact sub-panel selector while retaining the same
one-level model and layout choices.

### Theme ownership boundary

Appearance and Accessibility ships two complementary Widgets, both visible by
default in Settings:

- **Theme Library** compares and immediately selects three complete presets or
  a previously saved Custom theme. It reports the active device theme and
  Custom draft state, but contains no color, material, ambient, or canvas
  authoring controls.
- **Theme Settings** is the only authoring owner. It edits the six canonical
  color roles, four material values, ambient position/radius/intensity, and
  atmospheric/gradient canvas treatment. It also owns validation, import,
  export, reviewed reset, and Apply Custom.

Both Widgets project one device-local theme store. Selecting a Library preset
updates the Settings basis; applying a valid Custom draft updates the Library.
An invalid draft remains recoverable and cannot replace the last valid live
preview or applied theme. Neither Widget writes Story or Panel content.

Theme Settings may be moved to another Panel through normal Widget placement,
but it is not a default Scene Widget and never creates a second draft owner.

## Icon provenance

Widget-specific controls use real SVGs from the approved Minimal UI Icons
collection manifest at
`F:\git\Sonder_Engine\artifacts\minimal-ui-icons\manifest.json`. Selected
source geometry is embedded in the mockup's shared SVG sprite so the package
remains offline and color inherits from the Design Bible tokens; it is not
redrawn by Codex. The quiet Panel and Widget chrome retains the Design Bible's
typographic `+`, `−`, and `⋮` controls. Implemented Widgets add these CC0
manifest records:

| Purpose | Manifest source | SHA-256 |
|---|---|---|
| Provider / connection | `511728-connection-1106.svg` | `73013EFC6A48B04A6551F05F374547F0485223A1A2A40719CF4B251B123CF590` |
| Tested successfully | `511702-cloud-ok-1064.svg` | `4A6CCC82C95AFD01CE3E7057CF6D86234EEACB69B8328892C95F612C74C8296A` |
| Needs setup | `511682-cloud-close-1056.svg` | `1AC2156E729B664E6978FD7915E9CFE8B7342C6036E802A854C6A4120BA1BA51` |
| Write-only key | `512397-key-678.svg` | `84A96498F15CC4C4AD2546F335095B9EA1AA41A72094F1C62D584727A2A947A6` |
| Edit | `511904-edit-1479.svg` | `8432954452EFF72DE6B12899ED1AD7285217AAABF712C2A8F6A6349FE3826C7D` |
| Test | `512255-flash-1007.svg` | `8E2E581B68D3D4CE771ADFD724BBB1A45743C6A7D2E0AC8E8677D3A7FB589974` |
| Assignment routing | `511724-connection-pattern-1103.svg` | `8CBF40F205E4CFABCB16B4519F832E090518C1EC42E75D85EF9D8C8DA96699B6` |
| Role list | `512420-list-1508.svg` | `85E990A9332351C299A8D55A905D5CC29EB5CE53A9AC701C2187DA6C3A6BD12C` |
| Save assignments | `512792-save-item-1408.svg` | `FCC8EB4D984F714B18DCC18AB0BA037C77568E4C33F2102B6151AF322E367D96` |
| Theme / contrast | `511741-contrast-1428.svg` | `276057AAE142ACE679CC8B7C70FB6572CBF43F3A6FCD576E9D98E0D110FF69FB` |
| Selected / apply | `511868-done-1476.svg` | `05E5ACC202B7D44F22B9F78B2F76613D409DE334AA5A844D088AFFFEB8D4139C` |
| Import theme | `511878-download-1452.svg` | `58AE60F7FF90EFB4850C61E5AE8D0AC22830A483C04D7E5D85C0A32F822044B3` |
| Export theme | `511456-arrow-right-up-291.svg` | `D5C8F2E8C8A1B2AFA95A2B87749EF26D17A94CBAC329426AA9E596E10F5E795B` |
| Reset theme | `511407-arrow-repeat-235.svg` | `254AF3F64576F4D09CF04C39828E18AF79907D4D08E163B6792E135F0DACCA2C` |
| Close / cancel review | `511674-close-1511.svg` | `AA2DD5E0BA7C6F2126DDCC1366A5D11492F742FD083D390867ABEFFF9DA3140A` |
| Device/source information | `511836-directory-information-1650.svg` | `BC7CFF8E3E3BB3EE67F87A11B9BD7DBE65186F877BA6DD5F8FC8507CAC6A4904` |
| Decrease text scale | `512490-minus-1456.svg` | `B99CE5E0F646A756EE1FEF4472CAF1F07F0B7C107E6855245DA76102209D0D52` |
| Increase text scale | `512675-plus-1455.svg` | `6AD4D67B352CD3E8B4396A5A3BA9A9EE36DF87B95A0E4190F39D8AE7348DEAFD` |
| Delete custom prompt preset | `511788-delete-1487.svg` | `AE16A83FA1F83333ECC8160947F00329FEB2C02B6A5F9A60C8F058C818139752` |
| Previous turn | `511381-arrow-left-335.svg` | `5D3BAFDEC2D0E6CE47C3FC620C6AB0A2646EB26F394A9DE54B6CC6A33C128566` |
| Next turn | `511422-arrow-right-336.svg` | `D3249E93362877E0A16B4349C176409DB1FED7381B82E0BACAD714C01B4C7A13` |
| Maintenance owner | `512616-option-bar-settings-1399.svg` | `A508E2F9DA47A64D59A645EDA877F02A638BB3A32BB5855B0E44E9C631FDFB3F` |
| Updates / running lease | `511670-clock-1317.svg` | `9FDF36890D13F9264D39DA9C977C7C0FE867457A052C8A6FDCF8C83F3F03DAF4` |
| Checkpoint storage | `511777-database-system-1797.svg` | `29E49C9B996FDD0B1B8DF529B1518E955A0D9BCA90B084B2C820DE51C5DAAA02` |
| Memory-search repair | `512810-search-left-1504.svg` | `A3BCA9CCF8A8171938B4FD90A1EA549C436E67883E37477537BCAA3AE53146C7` |
| Diagnostics | `512237-fileboard-checklist-1594.svg` | `A33BC6DFA87CD49A78D00F2FA4E7725229C8070F729634FC0B13239A61C40341` |
| Present frame | `511879-double-window-1503.svg` | `4C94D3161C0C86556108991B6CCA6CC5940414E05075DB8A2D966F6E66B862FA` |
| Visible turn | `511532-bookmark-1228.svg` | `668EDE3595B9D64386CB9929AB8256A5C7B238D29C343895C8F9AF5CA4B7374A` |

Serve `docs/experiments` and open:

```text
http://127.0.0.1:8768/sonder-widget-overhaul/sonder-widget-overhaul-preview.html
http://127.0.0.1:8768/sonder-widget-overhaul/sonder-widget-overhaul-regression.html
```

This is a working candidate, not a replacement UI authority. Promotion requires
explicit Design Bible change control and new recorded hashes.
