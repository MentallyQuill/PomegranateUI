# Deep Current conformance ledger

**State:** Macro baseline open

The first seven rows record differences already observed between the preserved
Atmospheric Workbench and the generic Workbench Lab. Evidence filenames are
stable outputs of the initial dual-driver scenarios.

| ID | Category | Severity | Authority | Scenario | Evidence | Diagnosis | Status | Regression | Deviation |
|---|---|---|---|---|---|---|---|---|---|
| DC-001 | structure | P1 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.report.json, dc-shell-wide.actual.png | The Lab composes detached dashboard bands instead of one integrated shelf-toolbar-stage workbench | open | none | none |
| DC-002 | geometry | P2 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.measurements.json | The Lab starts at 271 px left and 313 px right rather than the authority's 230 px toolbars | open | none | none |
| DC-003 | geometry | P1 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.overlay.png | The center stage begins too low and is too narrow because generic context and footer bands consume the canvas | open | none | none |
| DC-004 | geometry | P1 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.diff.png | The composer is a tall 612 by 206 Widget instead of the centered 551 by 56 lower-stage instrument | open | none | none |
| DC-005 | visual | P2 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.reference.png, dc-shell-wide.actual.png | The Lab lacks the image-led canvas, reading veil, portrait strip, and integrated Deep Current lighting | open | none | none |
| DC-006 | behavior | P1 | Atmospheric Workbench | dc-shell-medium | dc-shell-medium.report.json | The macro shell lacks authority-shaped toolbar resize controls and shelf-docking seams | open | none | none |
| DC-007 | structure | P1 | Atmospheric Workbench | dc-shell-compact | dc-shell-compact.report.json | Compact layout stacks generic blocks instead of preserving reachable shelf, stage, toolbars, and composer roles | open | none | none |
