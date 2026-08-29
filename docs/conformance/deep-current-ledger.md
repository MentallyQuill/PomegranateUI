# Deep Current conformance ledger

**State:** Macro baseline frozen; v2 recipe migration behavior gate active

The first nine rows record differences already observed between the preserved
Atmospheric Workbench and the generic Workbench Lab. Evidence filenames are
stable outputs of the initial dual-driver scenarios.

The exact `deep-current-shell` geometry/material profile and canonical boxes
remain frozen for the separately scoped layout-fidelity work; this theme-system
migration does not rewrite them from its own output. Its active
`deep-current-shell-behavior` profile still renders both authorities at every
viewport and gates document containment, visible shell regions, horizontal
overflow on visible shell owners, composer separation, and the requested shelf
material state. Current Deep visual identity is additionally frozen by the
promoted browser snapshots.

| ID | Category | Severity | Authority | Scenario | Evidence | Diagnosis | Status | Regression | Deviation |
|---|---|---|---|---|---|---|---|---|---|
| DC-001 | structure | P1 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.report.json, dc-shell-wide.actual.png | The Lab composes a 70 px shelf plus detached context and footer bands instead of the authority's integrated 40 px shelf-toolbar-stage workbench | closed | dc-shell-wide structured profile | none |
| DC-002 | geometry | P2 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.measurements.json | At the captured wide frame the Lab uses asymmetric 346.34 px and 399.63 px columns instead of the authority's equal 282.23 px toolbar tracks | closed | dc-shell-wide structured profile | none |
| DC-003 | geometry | P1 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.overlay.png | The Lab stage begins at y 154.94 and measures 799.27 by 693.63; the authority begins at y 107 and measures 987.53 by 785 | closed | dc-shell-wide structured profile | none |
| DC-004 | geometry | P1 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.diff.png | The Lab composer is a 164.41 px tall generic Widget instead of the authority's 56 px lower-stage instrument | closed | dc-shell-wide structured profile | none |
| DC-005 | visual | P2 | Atmospheric Workbench | dc-shell-wide | dc-shell-wide.reference.png, dc-shell-wide.actual.png | The Lab lacks the image-led canvas, reading veil, portrait strip, and integrated Deep Current lighting | closed | dc-shell-wide visual review | none |
| DC-006 | behavior | P1 | Atmospheric Workbench | dc-shell-medium | dc-shell-medium.report.json | At medium width the Lab still has unequal 252.20 px and 291 px toolbars, a 70.39 px shelf, and no authority-shaped toolbar resize controls or shelf-docking seams | closed | dc-shell-medium structured profile | none |
| DC-007 | structure | P1 | Atmospheric Workbench | dc-shell-compact | dc-shell-compact.report.json | Compact authority hides both toolbars and keeps a 382 by 774 stage plus reachable composer in one viewport; the Lab stacks visible toolbars into a 1,638 px document | closed | dc-shell-compact structured profile | none |
| DC-008 | structure | P1 | Atmospheric Workbench | dc-shell-landscape-short | dc-shell-landscape-short.report.json | Short-landscape authority hides both toolbars and preserves a 796 by 279 stage; the Lab exposes both toolbars, shrinks the stage to 530.97 px wide, and grows the document to 1,081 px tall | closed | dc-shell-landscape-short structured profile | none |
| DC-009 | accessibility | P1 | Atmospheric Workbench | dc-shell-zoom-200 | dc-shell-zoom-200.report.json | At the 200 percent zoom equivalent the authority hides both toolbars within 450 px height while the Lab exposes them and grows to 1,089 px, pushing the composer out of the viewport | closed | dc-shell-zoom-200 structured profile | none |
