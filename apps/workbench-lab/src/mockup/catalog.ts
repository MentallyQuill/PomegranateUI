// Lab-owned roleplay Widget Catalog fixture. This file is maintained as public demo data.

import { WidgetManifestSchema, asWidgetType, type WidgetManifest } from '@pomegranate-ui/contracts';

export const CATALOG_TOTALS = Object.freeze({
  "story": 12,
  "library": 19,
  "systems": 21,
  "settings": 43,
  "extensions": 3
} as const);

const DEFINITIONS = [
  {
    "type": "story.transcript",
    "multiplicity": "single",
    "title": "Transcript",
    "category": "story",
    "purpose": "Read the active frame turn stream, select visible history, and open safe turn actions without exposing author diagnostics.",
    "keywords": [
      "Transcript",
      "prose",
      "history",
      "scene"
    ],
    "iconKey": "category.story",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 560,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "story.composer",
    "multiplicity": "single",
    "title": "Composer",
    "category": "story",
    "purpose": "Write and send the next Story action through one retained draft and an honest generation lifecycle.",
    "keywords": [
      "Composer",
      "message",
      "input",
      "action"
    ],
    "iconKey": "category.story",
    "shape": "strip",
    "minColumns": 1,
    "geometry": {
      "minHeight": 176,
      "idealHeight": 232,
      "maxHeight": 368
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "story.context",
    "multiplicity": "single",
    "title": "Story and Frame Context",
    "category": "story",
    "purpose": "Keep the active Story, Present frame, and visible turn context legible.",
    "keywords": [
      "Story and Frame Context",
      "story",
      "frame",
      "context"
    ],
    "iconKey": "category.story",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 184,
      "idealHeight": 248,
      "maxHeight": 328
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "story.turn-progress",
    "multiplicity": "single",
    "title": "Turn Progress",
    "category": "story",
    "purpose": "Show the current pipeline stage without inventing percentage completion.",
    "keywords": [
      "Turn Progress",
      "pipeline",
      "stage",
      "progress"
    ],
    "iconKey": "category.story",
    "shape": "strip",
    "minColumns": 1,
    "geometry": {
      "minHeight": 176,
      "idealHeight": 264,
      "maxHeight": 352
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "story.live-technical-detail",
    "multiplicity": "single",
    "title": "Live Technical Detail",
    "category": "story",
    "purpose": "Inspect bounded live technical events and model activity for the current run.",
    "keywords": [
      "Live Technical Detail",
      "technical",
      "events",
      "models"
    ],
    "iconKey": "category.story",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 560,
      "maxHeight": 720
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "story.turn-versions",
    "multiplicity": "single",
    "title": "Turn Versions",
    "category": "story",
    "purpose": "Compare saved versions and stage a deliberate version change.",
    "keywords": [
      "Turn Versions",
      "version",
      "reroll",
      "compare"
    ],
    "iconKey": "category.story",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 328,
      "idealHeight": 592,
      "maxHeight": 736
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "story.turn-inspector",
    "multiplicity": "single",
    "title": "Turn Inspector",
    "category": "story",
    "purpose": "Inspect one selected turn, its eligibility, evidence, lenses, and safe actions.",
    "keywords": [
      "Turn Inspector",
      "turn",
      "evidence",
      "detail"
    ],
    "iconKey": "category.story",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 360,
      "idealHeight": 640,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "story.player-condition",
    "multiplicity": "single",
    "title": "Player Condition",
    "category": "story",
    "purpose": "Read the player body state that is currently perceptible and relevant.",
    "keywords": [
      "Player Condition",
      "body",
      "condition",
      "player"
    ],
    "iconKey": "category.story",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 208,
      "idealHeight": 320,
      "maxHeight": 432
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "story.cast-condition",
    "multiplicity": "single",
    "title": "Cast Condition",
    "category": "story",
    "purpose": "Read visible cast condition without leaking private character state.",
    "keywords": [
      "Cast Condition",
      "cast",
      "body",
      "condition"
    ],
    "iconKey": "category.story",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 368,
      "maxHeight": 576
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "story.room-ambience",
    "multiplicity": "single",
    "title": "Room Ambience",
    "category": "story",
    "purpose": "Hear and control the active room ambience with explicit playback state.",
    "keywords": [
      "Room Ambience",
      "audio",
      "sound",
      "room"
    ],
    "iconKey": "status.sound",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 216,
      "idealHeight": 312,
      "maxHeight": 456
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "story.scene-backdrop",
    "multiplicity": "single",
    "title": "Scene Backdrop",
    "category": "story",
    "purpose": "Present and control the visible-turn backdrop without duplicating its stage owner.",
    "keywords": [
      "Scene Backdrop",
      "image",
      "scene",
      "backdrop"
    ],
    "iconKey": "backdrop.image",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 224,
      "idealHeight": 328,
      "maxHeight": 448
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "runtime.background-work",
    "multiplicity": "single",
    "title": "Background Work",
    "category": "story",
    "purpose": "Report queued and completed background work without blocking the active Story.",
    "keywords": [
      "Background Work",
      "runtime",
      "queue",
      "tasks"
    ],
    "iconKey": "background.queue",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 232,
      "idealHeight": 344,
      "maxHeight": 520
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "library.workspace",
    "multiplicity": "multiple",
    "title": "Library",
    "category": "library",
    "purpose": "Browse stories, characters, personas, lore, and reusable material from one archive.",
    "keywords": [
      "Library",
      "browse",
      "stories",
      "assets"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 560,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.stories",
    "multiplicity": "single",
    "title": "Stories",
    "category": "library",
    "purpose": "Browse the story archive and open one Story without changing it implicitly.",
    "keywords": [
      "Stories",
      "story",
      "archive",
      "recent"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 248,
      "idealHeight": 432,
      "maxHeight": 600
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "library.characters",
    "multiplicity": "single",
    "title": "Characters (Library)",
    "category": "library",
    "purpose": "Browse reusable Characters and their explicit Story associations.",
    "keywords": [
      "Characters (Library)",
      "character",
      "cards",
      "reusable"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 264,
      "idealHeight": 456,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "story.characters",
    "multiplicity": "single",
    "title": "Characters (Story)",
    "category": "library",
    "purpose": "See Characters associated with the active Story without implying current-frame presence.",
    "keywords": [
      "Characters (Story)",
      "association",
      "roster",
      "cards"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 248,
      "idealHeight": 424,
      "maxHeight": 600
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "library.personas",
    "multiplicity": "single",
    "title": "Personas (Library)",
    "category": "library",
    "purpose": "Browse reusable Personas, protected primary identity, and explicit Story associations.",
    "keywords": [
      "Personas (Library)",
      "persona",
      "identity",
      "primary"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 248,
      "idealHeight": 424,
      "maxHeight": 600
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "story.personas",
    "multiplicity": "single",
    "title": "Personas (Story)",
    "category": "library",
    "purpose": "See the active Story primary Persona and bounded additional or guest identities.",
    "keywords": [
      "Personas (Story)",
      "persona",
      "primary",
      "guest"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 248,
      "idealHeight": 400,
      "maxHeight": 560
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "library.lore",
    "multiplicity": "single",
    "title": "Lore (Library)",
    "category": "library",
    "purpose": "Browse Lorebooks and their reusable or Story-local ownership.",
    "keywords": [
      "Lore (Library)",
      "lore",
      "world",
      "books"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 264,
      "idealHeight": 456,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "story.lorebooks",
    "multiplicity": "single",
    "title": "Lorebooks (Story)",
    "category": "library",
    "purpose": "Author Lorebooks attached to the active Story.",
    "keywords": [
      "Lorebooks (Story)",
      "lore",
      "story",
      "authoring"
    ],
    "iconKey": "category.library",
    "shape": "wide",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.new-story",
    "multiplicity": "single",
    "title": "New Story",
    "category": "library",
    "purpose": "Stage a new Story through explicit Character, Persona, Lore, and opening choices.",
    "keywords": [
      "New Story",
      "create",
      "story",
      "start"
    ],
    "iconKey": "category.library",
    "shape": "wide",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.character-card",
    "multiplicity": "multiple",
    "title": "Character Card",
    "category": "library",
    "purpose": "Read or edit the selected reusable Character card.",
    "keywords": [
      "Character Card",
      "character",
      "persona",
      "card"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 640,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "story.character-card",
    "multiplicity": "multiple",
    "title": "Story Character Card",
    "category": "library",
    "purpose": "Edit the selected Story Character without mutating its reusable source card.",
    "keywords": [
      "Story Character Card",
      "character",
      "story",
      "card"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 640,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.persona-card",
    "multiplicity": "multiple",
    "title": "Persona Card",
    "category": "library",
    "purpose": "Read or edit the selected reusable Persona card.",
    "keywords": [
      "Persona Card",
      "persona",
      "player",
      "card"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 740
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.greetings-quick-start",
    "multiplicity": "multiple",
    "title": "Greetings and Quick Start",
    "category": "library",
    "purpose": "Review greetings and launch a Story through the authoritative quick-start path.",
    "keywords": [
      "Greetings and Quick Start",
      "greeting",
      "start",
      "persona"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 560,
      "maxHeight": 720
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.lore-entries",
    "multiplicity": "multiple",
    "title": "Lore Entry Tree",
    "category": "library",
    "purpose": "Browse the selected Lorebook hierarchy and follow one entry.",
    "keywords": [
      "Lore Entry Tree",
      "lore",
      "tree",
      "entries"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 280,
      "idealHeight": 480,
      "maxHeight": 680
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.lore-entry-editor",
    "multiplicity": "multiple",
    "title": "Lore Entry Editor",
    "category": "library",
    "purpose": "Edit one selected Lore entry with explicit unsaved and conflict states.",
    "keywords": [
      "Lore Entry Editor",
      "lore",
      "entry",
      "editor"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 640,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.lorebook-details",
    "multiplicity": "multiple",
    "title": "Lorebook Details",
    "category": "library",
    "purpose": "Edit Lorebook identity, scope, structure, canon authority, and associations through one revisioned document owner.",
    "keywords": [
      "Lorebook Details",
      "lorebook",
      "details",
      "scope"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 560,
      "maxHeight": 720
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.lore-relationships",
    "multiplicity": "multiple",
    "title": "Lore Relationships",
    "category": "library",
    "purpose": "Inspect and edit explicit directed Lore links without confusing them with hierarchy, associations, or prose mentions.",
    "keywords": [
      "Lore Relationships",
      "lore",
      "links",
      "relationships"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 280,
      "idealHeight": 480,
      "maxHeight": 680
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "library.lore-generator",
    "multiplicity": "multiple",
    "title": "Lore Generator",
    "category": "library",
    "purpose": "Plan a durable Lore generation job, review every proposed operation, and apply accepted operations through one revision guard.",
    "keywords": [
      "Lore Generator",
      "lore",
      "generate",
      "draft"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 640,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "library.lived-location-builder",
    "multiplicity": "multiple",
    "title": "Lived-in Location Builder",
    "category": "library",
    "purpose": "Review and invoke the one additive engine-owned lived-location operation through its captured New Story, Quick Start, reusable Lore, or active Story host.",
    "keywords": [
      "Lived-in Location Builder",
      "location",
      "charter",
      "builder"
    ],
    "iconKey": "category.library",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 680,
      "maxHeight": 780
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "systems.cast",
    "multiplicity": "single",
    "title": "Cast",
    "category": "systems",
    "purpose": "Manage active Story roster membership, frame-qualified position, active/dormant state, and dialogue color without owning Condition or Attire.",
    "keywords": [
      "Cast",
      "cast",
      "characters",
      "position"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 300,
      "idealHeight": 500,
      "maxHeight": 680
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.background-presences",
    "multiplicity": "single",
    "title": "Background Presences",
    "category": "systems",
    "purpose": "Inspect recurring unregistered bodies and stage evidence-grounded, forward-only Character promotion review.",
    "keywords": [
      "Background Presences",
      "background",
      "presence",
      "promote"
    ],
    "iconKey": "background.queue",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 300,
      "idealHeight": 520,
      "maxHeight": 700
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "systems.world-state",
    "multiplicity": "single",
    "title": "World State",
    "category": "systems",
    "purpose": "Inspect present-frame structured world records and use bounded section routes without invoking the all-frame raw replacement.",
    "keywords": [
      "World State",
      "location",
      "time",
      "weather"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 620,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.attire",
    "multiplicity": "single",
    "title": "Attire",
    "category": "systems",
    "purpose": "Inspect and silently author the present-frame attire ledger by wearer, anatomical region, ordered garment layer, coverage, state, and condition.",
    "keywords": [
      "Attire",
      "clothing",
      "garment",
      "body",
      "coverage",
      "layer"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 660,
      "maxHeight": 780
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.genre-style",
    "multiplicity": "single",
    "title": "Genre and Style",
    "category": "systems",
    "purpose": "Coordinate independent Story Style Guide, Story language, Player Authority, and Condition Policy owners without implying one atomic setting.",
    "keywords": [
      "Genre and Style",
      "genre",
      "style",
      "language",
      "authority",
      "condition"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 640,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.dialogue-agency",
    "multiplicity": "single",
    "title": "Dialogue and Agency",
    "category": "systems",
    "purpose": "Configure registered-character dialogue pacing, agency, stop rules, and opening response while showing derived per-beat budgets.",
    "keywords": [
      "Dialogue and Agency",
      "dialogue",
      "agency",
      "pacing",
      "reactors"
    ],
    "iconKey": "category.story",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 300,
      "idealHeight": 560,
      "maxHeight": 700
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.offscreen-life",
    "multiplicity": "single",
    "title": "Off-screen Life",
    "category": "systems",
    "purpose": "Configure the engine-authored off-screen simulation ceiling, paid-actor cap, and composed eligibility evidence.",
    "keywords": [
      "Off-screen Life",
      "off-screen",
      "simulation",
      "ceiling",
      "actors",
      "plans"
    ],
    "iconKey": "background.queue",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 560
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.living-world",
    "multiplicity": "single",
    "title": "Living World",
    "category": "systems",
    "purpose": "Configure the four engine-owned Living World approaches while preserving requested depth separately from the currently built and permitted effective depth.",
    "keywords": [
      "Living World",
      "simulation",
      "events",
      "obligations",
      "routine",
      "antagonist"
    ],
    "iconKey": "background.queue",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 300,
      "idealHeight": 560,
      "maxHeight": 720
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.institutions-charter",
    "multiplicity": "single",
    "title": "Institutions and Charter",
    "category": "systems",
    "purpose": "Inspect and author the explicit frame-qualified Charter registry while keeping simulation, diagnostics, and lived-location generation with their engine owners.",
    "keywords": [
      "Institutions and Charter",
      "institution",
      "charter",
      "upkeep",
      "bodies",
      "posts"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 340,
      "idealHeight": 680,
      "maxHeight": 780
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.institution-diagnostics",
    "multiplicity": "single",
    "title": "Institution Diagnostics",
    "category": "systems",
    "purpose": "Load one authorized host-only, frame-qualified institution/body evidence projection without writing state or delivering diagnostics to cognition.",
    "keywords": [
      "Institution Diagnostics",
      "institution",
      "diagnostics",
      "evidence",
      "host",
      "beliefs"
    ],
    "iconKey": "status.info",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 640,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.background-life",
    "multiplicity": "single",
    "title": "Background Life / Scene Life",
    "category": "systems",
    "purpose": "Configure bounded unsheeted reactions, managed Scene Life, and the addressed-presence promotion threshold without taking ownership of global acquisition permission.",
    "keywords": [
      "Background Life / Scene Life",
      "background",
      "scene",
      "reactors",
      "promotion",
      "presence"
    ],
    "iconKey": "background.queue",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 300,
      "idealHeight": 540,
      "maxHeight": 700
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.character-relationships",
    "multiplicity": "single",
    "title": "Character Relationships",
    "category": "systems",
    "purpose": "Inspect one authorized Character mind’s directed relationship projection and latest served evidence without inventing a universal score or an edit route.",
    "keywords": [
      "Character Relationships",
      "relationship",
      "stance",
      "character",
      "private",
      "evidence"
    ],
    "iconKey": "cast.profile",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 280,
      "idealHeight": 480,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "systems.memory-browser",
    "multiplicity": "single",
    "title": "Memory Browser",
    "category": "systems",
    "purpose": "Browse only the selected Character memories visible to the authorized viewer.",
    "keywords": [
      "Memory Browser",
      "memory",
      "character",
      "browser"
    ],
    "iconKey": "category.systems",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.character-private-history",
    "multiplicity": "single",
    "title": "Character Private History",
    "category": "systems",
    "purpose": "Author private Character history inside an explicit protected scope.",
    "keywords": [
      "Character Private History",
      "character",
      "private",
      "history"
    ],
    "iconKey": "category.systems",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "systems.persona-private-history",
    "multiplicity": "single",
    "title": "Persona Private History",
    "category": "systems",
    "purpose": "Author the primary Persona private history inside its protected scope.",
    "keywords": [
      "Persona Private History",
      "persona",
      "private",
      "history"
    ],
    "iconKey": "category.systems",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "systems.dramatic-irony",
    "multiplicity": "single",
    "title": "Dramatic Irony",
    "category": "systems",
    "purpose": "Compare authorized knowledge boundaries without leaking private payloads.",
    "keywords": [
      "Dramatic Irony",
      "knowledge",
      "irony",
      "host"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "systems.promise-ledger",
    "multiplicity": "single",
    "title": "Promise Ledger",
    "category": "systems",
    "purpose": "Track locally recognized commitments, evidence, and lifecycle.",
    "keywords": [
      "Promise Ledger",
      "promise",
      "commitment",
      "ledger"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "systems.multiplayer-invites",
    "multiplicity": "single",
    "title": "Multiplayer and Guest Invites",
    "category": "systems",
    "purpose": "Review guests and stage explicit invite or revocation actions.",
    "keywords": [
      "Multiplayer and Guest Invites",
      "guest",
      "invite",
      "multiplayer"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "systems.frames",
    "multiplicity": "single",
    "title": "Frames",
    "category": "systems",
    "purpose": "Inspect and manage Story frames while keeping the Present frame explicit.",
    "keywords": [
      "Frames",
      "frame",
      "checkpoint",
      "state"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "systems.whos-where",
    "multiplicity": "single",
    "title": "Who's Where",
    "category": "systems",
    "purpose": "Read a frame-qualified roster and each body location without omniscient shortcuts.",
    "keywords": [
      "Who's Where",
      "where",
      "position",
      "roster"
    ],
    "iconKey": "category.systems",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "systems.paradox-fixed-points",
    "multiplicity": "single",
    "title": "Time Paradox and Fixed Points",
    "category": "systems",
    "purpose": "Inspect frame paradoxes and stage explicit fixed-point review.",
    "keywords": [
      "Time Paradox and Fixed Points",
      "time",
      "paradox",
      "fixed point"
    ],
    "iconKey": "category.systems",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "settings.group.account-access",
    "multiplicity": "single",
    "title": "Account and Access",
    "category": "settings",
    "purpose": "Navigate account, connection, and access settings.",
    "keywords": [
      "Account and Access",
      "account",
      "access",
      "connections"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "settings.group.ai-models",
    "multiplicity": "single",
    "title": "AI and Models",
    "category": "settings",
    "purpose": "Navigate model, routing, and response settings.",
    "keywords": [
      "AI and Models",
      "ai",
      "models",
      "routing"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "settings.group.appearance-accessibility",
    "multiplicity": "single",
    "title": "Appearance and Accessibility",
    "category": "settings",
    "purpose": "Navigate appearance, reading, sound, motion, and accessibility settings.",
    "keywords": [
      "Appearance and Accessibility",
      "appearance",
      "accessibility",
      "theme"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "settings.group.story-content",
    "multiplicity": "single",
    "title": "Story Defaults and Content",
    "category": "settings",
    "purpose": "Navigate Story defaults and content preferences.",
    "keywords": [
      "Story Defaults and Content",
      "story",
      "defaults",
      "content"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "settings.group.data-extensions-maintenance",
    "multiplicity": "single",
    "title": "Data, Extensions, and Maintenance",
    "category": "settings",
    "purpose": "Navigate data, extension, update, storage, repair, and diagnostic settings.",
    "keywords": [
      "Data, Extensions, and Maintenance",
      "data",
      "extensions",
      "maintenance"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "settings.group.advanced",
    "multiplicity": "single",
    "title": "Advanced",
    "category": "settings",
    "purpose": "Navigate advanced prompt and raw-data laboratories.",
    "keywords": [
      "Advanced",
      "advanced",
      "prompts",
      "raw data"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "settings.provider-credentials",
    "multiplicity": "single",
    "title": "Provider Credentials",
    "category": "settings",
    "purpose": "Configure provider access without displaying stored credential values.",
    "keywords": [
      "Provider Credentials",
      "provider",
      "api",
      "connection"
    ],
    "iconKey": "provider.connection",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 248,
      "idealHeight": 432,
      "maxHeight": 620
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "settings.model-assignments",
    "multiplicity": "single",
    "title": "Model Assignments",
    "category": "settings",
    "purpose": "Assign models to host roles with explicit inheritance and cost context.",
    "keywords": [
      "Model Assignments",
      "model",
      "role",
      "routing"
    ],
    "iconKey": "model.routing",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 288,
      "idealHeight": 528,
      "maxHeight": 680
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.theme",
    "multiplicity": "single",
    "title": "Theme Library",
    "category": "settings",
    "purpose": "Preview and select complete device appearance presets without authoring theme values.",
    "keywords": [
      "Theme Library",
      "color",
      "appearance",
      "preset",
      "library"
    ],
    "iconKey": "theme.contrast",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 264,
      "idealHeight": 424,
      "maxHeight": 576
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.reading-layout",
    "multiplicity": "single",
    "title": "Reading and Layout",
    "category": "settings",
    "purpose": "Configure reading density, transcript measure, and layout preferences.",
    "keywords": [
      "Reading and Layout",
      "reading",
      "layout",
      "density"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.sound-motion",
    "multiplicity": "single",
    "title": "Sound and Motion",
    "category": "settings",
    "purpose": "Configure sound, motion, and language-sensitive feedback.",
    "keywords": [
      "Sound and Motion",
      "sound",
      "motion",
      "feedback"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.accessibility",
    "multiplicity": "single",
    "title": "Accessibility",
    "category": "settings",
    "purpose": "Configure contrast, motion, scale, focus, and reading accessibility.",
    "keywords": [
      "Accessibility",
      "motion",
      "contrast",
      "readability"
    ],
    "iconKey": "theme.contrast",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 312,
      "idealHeight": 488,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.content",
    "multiplicity": "single",
    "title": "Content",
    "category": "settings",
    "purpose": "Configure host content preferences and explicit Story overrides.",
    "keywords": [
      "Content",
      "content",
      "safety",
      "story"
    ],
    "iconKey": "category.settings",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.add-ons",
    "multiplicity": "single",
    "title": "Add-ons",
    "category": "settings",
    "purpose": "Manage installed extensions through one canonical coordinator.",
    "keywords": [
      "Add-ons",
      "addons",
      "extensions",
      "install"
    ],
    "iconKey": "category.settings",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.maintenance",
    "multiplicity": "single",
    "title": "Maintenance",
    "category": "settings",
    "purpose": "Manage updates, storage, repair, diagnostics, and protected maintenance actions.",
    "keywords": [
      "Maintenance",
      "backup",
      "diagnostics",
      "storage"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 304,
      "idealHeight": 552,
      "maxHeight": 720
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "settings.prompt-editor",
    "multiplicity": "single",
    "title": "Prompt Editor",
    "category": "settings",
    "purpose": "Inspect, compare, edit, validate, save, and activate host prompt presets through one recoverable draft.",
    "keywords": [
      "Prompt Editor",
      "prompt",
      "authoring",
      "roles"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 624,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.raw-story-data",
    "multiplicity": "single",
    "title": "Raw Story Data",
    "category": "settings",
    "purpose": "Inspect raw Story data in a guarded advanced laboratory.",
    "keywords": [
      "Raw Story Data",
      "raw",
      "json",
      "story"
    ],
    "iconKey": "category.settings",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "settings.connections",
    "multiplicity": "single",
    "title": "Connections and Credentials",
    "category": "settings",
    "purpose": "Review provider connection status without showing stored secrets.",
    "keywords": [
      "Connections and Credentials",
      "connections",
      "providers",
      "credentials"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "settings.default-model",
    "multiplicity": "single",
    "title": "Default Model",
    "category": "settings",
    "purpose": "Choose the default model used by otherwise unassigned roles.",
    "keywords": [
      "Default Model",
      "default",
      "model",
      "assignment"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.memory-search-model",
    "multiplicity": "single",
    "title": "Memory-search Model",
    "category": "settings",
    "purpose": "Choose the embeddings model used for memory search.",
    "keywords": [
      "Memory-search Model",
      "memory",
      "search",
      "embeddings"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.response-limit",
    "multiplicity": "single",
    "title": "Response Limit",
    "category": "settings",
    "purpose": "Set the bounded response limit with cost and truncation context.",
    "keywords": [
      "Response Limit",
      "response",
      "limit",
      "tokens"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.openrouter-routing",
    "multiplicity": "single",
    "title": "OpenRouter Routing",
    "category": "settings",
    "purpose": "Configure OpenRouter policy without hiding provider capability constraints.",
    "keywords": [
      "OpenRouter Routing",
      "openrouter",
      "routing",
      "provider"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.scene-backdrops",
    "multiplicity": "single",
    "title": "Scene Backdrops",
    "category": "settings",
    "purpose": "Configure global Scene backdrop behavior and availability.",
    "keywords": [
      "Scene Backdrops",
      "scene",
      "backdrop",
      "image"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.room-ambience",
    "multiplicity": "single",
    "title": "Room Ambience Settings",
    "category": "settings",
    "purpose": "Configure global Room Ambience behavior without duplicating Scene playback.",
    "keywords": [
      "Room Ambience Settings",
      "room",
      "ambience",
      "sound"
    ],
    "iconKey": "status.sound",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.custom-theme",
    "multiplicity": "single",
    "title": "Custom Theme",
    "category": "settings",
    "purpose": "Review, reset, and save the one shared recoverable device theme draft.",
    "keywords": [
      "Custom Theme",
      "custom",
      "appearance",
      "draft",
      "save"
    ],
    "iconKey": "theme.contrast",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 136,
      "idealHeight": 176,
      "maxHeight": 240
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.theme-colors",
    "multiplicity": "single",
    "title": "Theme Colors",
    "category": "settings",
    "purpose": "Author the six semantic color roles in the shared device theme draft.",
    "keywords": ["Theme Colors", "semantic", "palette", "eyedropper"],
    "iconKey": "theme.contrast",
    "shape": "medium",
    "minColumns": 1,
    "geometry": { "minHeight": 400, "idealHeight": 480, "maxHeight": 520 },
    "supportedStates": ["ready", "loading", "empty", "unavailable", "access-denied", "stale", "offline", "failure", "dirty", "saving", "conflict", "success"]
  },
  {
    "type": "settings.theme-materials",
    "multiplicity": "single",
    "title": "Theme Materials",
    "category": "settings",
    "purpose": "Author glass density, bar opacity, selection strength, and frost in the shared device theme draft.",
    "keywords": ["Theme Materials", "glass", "opacity", "frost"],
    "iconKey": "theme.contrast",
    "shape": "medium",
    "minColumns": 1,
    "geometry": { "minHeight": 220, "idealHeight": 280, "maxHeight": 400 },
    "supportedStates": ["ready", "loading", "empty", "unavailable", "access-denied", "stale", "offline", "failure", "dirty", "saving", "conflict", "success"]
  },
  {
    "type": "settings.theme-canvas",
    "multiplicity": "single",
    "title": "Theme Canvas",
    "category": "settings",
    "purpose": "Author image, overlay, gradient, and vignette treatment in the shared device theme draft.",
    "keywords": ["Theme Canvas", "image", "overlay", "gradient", "vignette"],
    "iconKey": "theme.contrast",
    "shape": "medium",
    "minColumns": 1,
    "geometry": { "minHeight": 220, "idealHeight": 300, "maxHeight": 420 },
    "supportedStates": ["ready", "loading", "empty", "unavailable", "access-denied", "stale", "offline", "failure", "dirty", "saving", "conflict", "success"]
  },
  {
    "type": "settings.theme-ambient",
    "multiplicity": "single",
    "title": "Ambient Light",
    "category": "settings",
    "purpose": "Author ambient position, radius, and power in the shared device theme draft.",
    "keywords": ["Ambient Light", "position", "radius", "power"],
    "iconKey": "theme.contrast",
    "shape": "medium",
    "minColumns": 1,
    "geometry": { "minHeight": 200, "idealHeight": 260, "maxHeight": 380 },
    "supportedStates": ["ready", "loading", "empty", "unavailable", "access-denied", "stale", "offline", "failure", "dirty", "saving", "conflict", "success"]
  },
  {
    "type": "settings.story-reading-layout",
    "multiplicity": "single",
    "title": "Story Reading and Layout",
    "category": "settings",
    "purpose": "Adjust Story reading and transcript layout preferences.",
    "keywords": [
      "Story Reading and Layout",
      "story",
      "reading",
      "layout"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.story-sound",
    "multiplicity": "single",
    "title": "Story Sound",
    "category": "settings",
    "purpose": "Adjust Story sound behavior shared with the Scene runtime.",
    "keywords": [
      "Story Sound",
      "story",
      "sound",
      "audio"
    ],
    "iconKey": "status.sound",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.accessibility-controls",
    "multiplicity": "single",
    "title": "Accessibility Controls",
    "category": "settings",
    "purpose": "Adjust the live accessibility controls owned by Settings.",
    "keywords": [
      "Accessibility Controls",
      "accessibility",
      "controls",
      "contrast"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.content-preferences",
    "multiplicity": "single",
    "title": "Content Preferences",
    "category": "settings",
    "purpose": "Stage global content preferences before applying them.",
    "keywords": [
      "Content Preferences",
      "content",
      "preferences",
      "safety"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "settings.narrator-voice",
    "multiplicity": "single",
    "title": "Narrator Voice Examples",
    "category": "settings",
    "purpose": "Edit narrator voice exemplars as an explicit draft.",
    "keywords": [
      "Narrator Voice Examples",
      "narrator",
      "voice",
      "examples"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.living-world-controls",
    "multiplicity": "single",
    "title": "Living World Controls",
    "category": "settings",
    "purpose": "Adjust the active Story Living World controls through the shared owner.",
    "keywords": [
      "Living World Controls",
      "living world",
      "controls",
      "story"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.installed-extensions",
    "multiplicity": "single",
    "title": "Installed Extensions",
    "category": "settings",
    "purpose": "Review installed extension identity, status, and available host actions.",
    "keywords": [
      "Installed Extensions",
      "installed",
      "extensions",
      "addons"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.install-extension",
    "multiplicity": "single",
    "title": "Install Extension",
    "category": "settings",
    "purpose": "Stage one extension install with source identity and capability review.",
    "keywords": [
      "Install Extension",
      "install",
      "extension",
      "source"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "settings.host-updates",
    "multiplicity": "single",
    "title": "Host Updates",
    "category": "settings",
    "purpose": "Check and apply host updates through one maintenance coordinator.",
    "keywords": [
      "Host Updates",
      "host",
      "updates",
      "version"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "settings.checkpoint-storage",
    "multiplicity": "single",
    "title": "Checkpoint Storage",
    "category": "settings",
    "purpose": "Monitor checkpoint storage and its background maintenance task.",
    "keywords": [
      "Checkpoint Storage",
      "checkpoint",
      "storage",
      "database"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "settings.memory-search-repair",
    "multiplicity": "single",
    "title": "Memory-search Repair",
    "category": "settings",
    "purpose": "Monitor and start bounded memory-search repair work.",
    "keywords": [
      "Memory-search Repair",
      "memory",
      "search",
      "repair"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "settings.diagnostics",
    "multiplicity": "single",
    "title": "Diagnostics",
    "category": "settings",
    "purpose": "Capture a bounded diagnostic snapshot without exposing credentials.",
    "keywords": [
      "Diagnostics",
      "diagnostics",
      "snapshot",
      "support"
    ],
    "iconKey": "category.settings",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure"
    ]
  },
  {
    "type": "settings.prompt-preset-editor",
    "multiplicity": "single",
    "title": "Prompt Preset / Editor",
    "category": "settings",
    "purpose": "Place the shared Prompt Editor owner in a large preset workspace.",
    "keywords": [
      "Prompt Preset / Editor",
      "prompt",
      "preset",
      "editor"
    ],
    "iconKey": "category.settings",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success"
    ]
  },
  {
    "type": "settings.raw-clothing-data",
    "multiplicity": "single",
    "title": "Raw Clothing Data",
    "category": "settings",
    "purpose": "Inspect and stage raw attire edits behind guarded production prerequisites.",
    "keywords": [
      "Raw Clothing Data",
      "raw",
      "clothing",
      "attire"
    ],
    "iconKey": "category.settings",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "ext:atlas:campaign-clock",
    "multiplicity": "single",
    "title": "Campaign Clock",
    "category": "extensions",
    "purpose": "Track an owner-provided campaign clock in a compact host-governed shape.",
    "keywords": [
      "Campaign Clock",
      "clock",
      "campaign",
      "atlas"
    ],
    "iconKey": "category.extensions",
    "shape": "narrow",
    "minColumns": 1,
    "geometry": {
      "minHeight": 200,
      "idealHeight": 320,
      "maxHeight": 480
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "ext:trail:location-notes",
    "multiplicity": "single",
    "title": "Location Notes",
    "category": "extensions",
    "purpose": "Edit owner-provided location notes in the canonical Library workspace shape.",
    "keywords": [
      "Location Notes",
      "location",
      "notes",
      "trail"
    ],
    "iconKey": "category.extensions",
    "shape": "wide",
    "minColumns": 2,
    "geometry": {
      "minHeight": 320,
      "idealHeight": 600,
      "maxHeight": 760
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  },
  {
    "type": "ext:mythic:settings",
    "multiplicity": "single",
    "title": "Mythic Settings",
    "category": "extensions",
    "purpose": "Configure an installed extension through the canonical Settings shape.",
    "keywords": [
      "Mythic Settings",
      "extension",
      "settings",
      "mythic"
    ],
    "iconKey": "category.extensions",
    "shape": "medium",
    "minColumns": 1,
    "geometry": {
      "minHeight": 240,
      "idealHeight": 420,
      "maxHeight": 640
    },
    "supportedStates": [
      "ready",
      "loading",
      "empty",
      "unavailable",
      "access-denied",
      "stale",
      "offline",
      "failure",
      "dirty",
      "saving",
      "conflict",
      "success",
      "review",
      "running",
      "partial",
      "refused"
    ]
  }
] as const;

export function createCatalogManifests(): readonly WidgetManifest[] {
  return Object.freeze(DEFINITIONS.map((definition) => WidgetManifestSchema.parse({
    type: asWidgetType(definition.type),
    version: '1.0.0',
    title: definition.title,
    capabilities: definition.category === 'settings' ? ['settings.read'] : ['story.read'],
    defaultConfiguration: {},
    defaultPlacement: {
      kind: 'docked',
      regionRole: definition.category === 'story'
        ? 'stage'
        : definition.category === 'systems'
          ? 'right-instruments'
          : definition.category === 'settings'
            ? 'column'
            : 'left-instruments',
      shelfId: 'primary'
    },
    catalog: {
      category: definition.category,
      purpose: definition.purpose,
      keywords: [...definition.keywords],
      iconKey: definition.iconKey,
      shape: definition.shape,
      multiplicity: definition.multiplicity,
      minColumns: definition.minColumns,
      geometry: { ...definition.geometry },
      supportedStates: [...definition.supportedStates]
    }
  }) as WidgetManifest));
}
