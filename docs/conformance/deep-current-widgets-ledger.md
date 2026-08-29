# Deep Current Widget surface conformance ledger

**State:** Widget and Catalog baseline frozen

The Widget lane cites an exact passing case from the immutable Widget Overhaul
`212/212` harness, renders the preserved ready surface through its public test
API, and independently renders the corresponding Pom-owned Lab surface. No
surface discrepancy is waived. The frozen lane contains 49 reviewed ready
surfaces and six Catalog scenarios. The historical `dc-catalog-fallback-46`
scenario ID is retained for continuity; the complete 94-entry manifest now has
49 implemented renderers and 45 honest unavailable-renderer fallbacks.

The Widget oracle continues to gate content, behavior, accessibility, dark
surface treatment, outer-border intent, and compact geometry. Literal header
separator presence is retained in captured evidence but is no longer compared:
the v2 semantic recipe deliberately owns one consistent tonal header treatment,
while the preserved Widget prototype varies that detail between surfaces.
Current header consistency and artifact prevention are gated by the recipe
browser suite instead.

| ID | Category | Severity | Authority | Scenario | Evidence | Diagnosis | Status | Regression | Deviation |
|---|---|---|---|---|---|---|---|---|---|
