# Atmospheric convergence ledger

This append-only ledger records source-backed corrections that make the Deep Current Workbench match the reviewed Atmospheric authority. Candidate screenshots never become expected truth.

## Authority

- Source fragment SHA-256: `38878d2cf8a86f5e879faba4b41a214e4293f22ed755975023e02c962d61b913`
- Normalized 1920-by-1280 authority image SHA-256: `4aad4c20a3fa9dcf1658ef634f7fd9e75a30883d2b64e00a59b67b3adbb5f4d0`
- Normalization: hide only the calibration rail, remove the host body margin, and size the Workbench window to the viewport.
- Public boundary: the repository carries a reviewed Pom-native rendered authority and extracted user-owned display assets, not the retired host-specific source tree.

## Round 000 - rejected remote-main candidate

Status: open

The candidate lacks the image-led stage and four portraits, uses 334/335-pixel docks instead of 286 pixels, renders a 46-pixel header instead of 40 pixels, shows the wrong right-hand Widget composition, and exposes a multi-button placement rail rather than one restrained actions trigger.

First fail-closed report:

- pixel mismatch ratio: `0.9979121907552083`;
- structural similarity: `0.33667824330357854`;
- high-contrast mismatch pixels: `28235`;
- maximum geometry delta: `499px`;
- missing default Widgets: World State and Promise Ledger;
- image layer count: `0`;
- loaded portrait count: `0`;
- placement rail count after hover: `1`;
- restrained actions trigger count: `0`.

The exact browser gate is expected to fail until these structural mismatches are corrected.
