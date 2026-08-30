# Theme art-direction asset record

This ledger records local image assets introduced by the Workbench Lab theme
showcase. It is provenance and redistribution evidence for the repository, not
legal advice. Public deployment still requires the audit named in the theme
foundation design.

## Bunny garden canvas

| Field | Record |
| --- | --- |
| Repository path | `apps/workbench-lab/src/assets/bunny-garden-canvas.webp` |
| Purpose | Local background canvas for the Bunny flexibility target |
| Created | 2026-08-29 through the built-in OpenAI image-generation mode |
| Reference inputs | None; generated from a text-only prompt |
| Prompt summary | Wide premium Japanese gouache garden in blush, lavender, mint, apricot, and sky blue; cherry blossoms, layered hills, water, bridge, lanterns, and one small rabbit; quiet center for readable glass UI; no text, logos, borders, or interface chrome |
| Original output | PNG, 2,229,603 bytes; retained in the generation record, not shipped in this repository |
| Repository encoding | WebP, quality 88 through FFmpeg `libwebp`, 1,536 by 1,024 pixels, 131,562 bytes |
| SHA-256 | `dc3ec490521f8a8b99550aa4102b3e434b363414fde69fd4b67394960a1cea63` |
| Third-party source material | None supplied in the prompt or as a reference image |
| Human review | Accepted for the Bunny showcase after wide and compact Playwright review on 2026-08-29 |

### Rights and redistribution evidence

The image was generated specifically for this project at the repository
owner's request. OpenAI's Terms of Use, accessed 2026-08-29, state in the
"Ownership of content" section that, as between the user and OpenAI and to the
extent permitted by applicable law, the user owns Output and OpenAI assigns any
right, title, and interest it has in that Output to the user:
<https://openai.com/policies/terms-of-use/>.

The generated scene contains no supplied third-party artwork, named character,
logo, or requested living-person likeness. This record supports repository use
and redistribution of the asset; it does not remove the separate pre-deployment
review for similarity, trademarks, applicable law, and the repository's final
public license.

## Theme showcase character and Ash canvas assets

The following assets were generated specifically for the Workbench Lab on
2026-08-30 through the built-in OpenAI image-generation mode. No reference
images, third-party artwork, named franchise characters, logos, or living-person
likenesses were supplied. Each source PNG remains in the generation record and
is not shipped; the repository contains a reviewed WebP encoded at quality 88
through FFmpeg `libwebp`.

| Repository asset | Purpose and prompt summary | Source PNG | Repository encoding | SHA-256 |
| --- | --- | ---: | ---: | --- |
| `apps/workbench-lab/src/assets/pomos-character-atlas.webp` | PomOS 2-by-2 portrait atlas for Aven Rook, Mara Venn, Ilex, and the Quiet Diver; premium soft-3D editorial figures, cool blue light, clean original character design, no text or UI | 2,206,961 bytes | 1,254 by 1,254, 176,228 bytes | `60440c313115f5792f1d866ace4fe36c216a4083da3ca81240e7862e841fd995` |
| `apps/workbench-lab/src/assets/bunny-character-atlas.webp` | Bunny 2-by-2 portrait atlas for the same cast; polished pastel Japanese anime character art, small original bunny accessories, distinct silhouettes, no text or UI | 2,487,217 bytes | 1,254 by 1,254, 288,784 bytes | `be1dba3bcd5b0ed90f0fd7345adbe0a39df234c87d5563e4945e3ab3ba238651` |
| `apps/workbench-lab/src/assets/ash-amber-character-atlas.webp` | Ash & Amber 2-by-2 portrait atlas for the same cast; restrained charcoal-and-gouache treatment, warm amber rim light, graphite field, no purple, text, or UI | 2,442,208 bytes | 1,254 by 1,254, 230,058 bytes | `583553d5dbce0bee9603bb8a363b19a4ddac90b9c15fb1310c68803c23a22b84` |
| `apps/workbench-lab/src/assets/ash-amber-stage.webp` | Independent wide Ash & Amber ambient canvas; graphite industrial waterside architecture, quiet reading center, restrained amber edge light, no purple, people, text, or UI | 2,116,548 bytes | 1,536 by 1,024, 106,050 bytes | `1357519bf39c475de19c79e5ee620e852539097cb419e7fbc9f25c326fd4c5f7` |

All four assets were accepted after original-resolution inspection and wide and
compact Playwright review on 2026-08-30. They use the same rights and
redistribution basis described above; a separate pre-deployment similarity,
trademark, applicable-law, and final-license review still applies.

## Existing Deep Current canvas

`apps/workbench-lab/src/assets/deep-current-stage.jpg` predates this change. Its
current repository evidence remains commit `8e994e8190da409033f9ef4b47e3d9592d0c5156`,
102,048 bytes, SHA-256
`e77ae630edaa409086e303c0cf580ed5105d81c4e9ad8f749b086eeb2530683b`.
This entry records its identity without retroactively inventing source or
license facts that are not present in the repository history.

## Ash & Amber recording authority

`design/theme-targets/ash-amber/sonderui-rw2-1-t80.png` is a reviewed visual
reference extracted from `SonderUI_RW2_1.mp4` at exactly 80.000 seconds. It is
design evidence for the Ash & Amber target; it is not a runtime canvas, an
application implementation, or permission to redistribute the complete
recording.

| Field | Record |
| --- | --- |
| Source recording SHA-256 | `56F84670C2A4B1318BD26A9A482790AE93C49387D47A6D6A4AF7C470C635A889` |
| Source stream | 1,920 by 1,280 pixels, 60 fps, 101.682 seconds |
| Extraction timestamp | 80.000 seconds |
| Reference PNG | `design/theme-targets/ash-amber/sonderui-rw2-1-t80.png` |
| Reference PNG SHA-256 | `6403A7BCFD8F43195FA42C5D9715CC79964C8B7569F47C22FDEEFD1B89804997` |
| Reviewed qualities | Muted charcoal and plum glass, warm brown title bars, restrained amber source accent, low-density atmospheric stage |

The deterministic extraction command is:

```powershell
ffmpeg -hide_banner -loglevel error -ss 80.000 -i 'SonderUI_RW2_1.mp4' -frames:v 1 -c:v png 'sonderui-rw2-1-t80.png'
```

The repository retains the extracted frame and its strict manifest only. The
full MP4 remains external to the repository and outside this asset record's
redistribution claim.

## Deep Current recording authority

`design/theme-targets/deep-current/recordings/reference.json` locks eleven
reviewed UI states from the two `SonderUI_RW2` recordings. Ten extracted frames
live beside that manifest; the eleventh reuses the independently locked Ash &
Amber frame above. They are immutable visual and workflow evidence for the
shared Atmospheric composition, recording-visible Widgets, docking states, and
theme authoring. They are not runtime canvases or permission to redistribute
either recording.

| Source | SHA-256 | Stream |
| --- | --- | --- |
| `SonderUI_RW2.mp4` | `5E188EF5866BB82AEA25653AF4FEA6161E36596F760EB00E6FEDF42B2675E011` | 1,920 by 1,280 pixels, 60 fps |
| `SonderUI_RW2_1.mp4` | `56F84670C2A4B1318BD26A9A482790AE93C49387D47A6D6A4AF7C470C635A889` | 1,920 by 1,280 pixels, 60 fps |

The manifest records the exact timestamp, repository-relative PNG path,
SHA-256, and authority purpose for every frame. The deterministic extraction
shape is:

```powershell
ffmpeg -hide_banner -loglevel error -ss 52.000 -i 'SonderUI_RW2.mp4' -frames:v 1 -c:v png 'rw2-t52.png'
```

The complete reviewed timestamp set is `52`, `59`, `67`, `76`, and `84`
seconds from `SonderUI_RW2.mp4`; `2`, `14`, `26`, `39`, `60`, and `80` seconds
from `SonderUI_RW2_1.mp4`. The repository does not retain either MP4.
