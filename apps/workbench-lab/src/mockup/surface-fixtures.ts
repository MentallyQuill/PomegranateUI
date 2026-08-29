import { asWidgetType, type WidgetType } from '@pomegranate-ui/contracts';

export type SurfaceState = 'ready' | 'loading' | 'empty' | 'unavailable' | 'access-denied' | 'stale' | 'offline' | 'failure' | 'dirty' | 'saving' | 'conflict' | 'success' | 'review' | 'running' | 'partial' | 'refused';
export type SurfacePresentation = 'reader' | 'composer' | 'progress' | 'telemetry' | 'versions' | 'inspector' | 'condition' | 'ambience' | 'backdrop' | 'tasks' | 'archive' | 'roster' | 'wizard' | 'document' | 'tree' | 'relationships' | 'generator' | 'credentials' | 'assignments' | 'theme' | 'accessibility' | 'maintenance' | 'prompt' | 'system';

export interface SurfaceFixture {
  readonly type: WidgetType;
  readonly presentation: SurfacePresentation;
  readonly scope: string;
  readonly rows: readonly (readonly [string, string])[];
  readonly boundary: string;
  readonly actions: readonly string[];
  readonly states: readonly SurfaceState[];
}

const STORY = 'Follows the one active Story; Panel state stores presentation, not a Story id.';
const LIBRARY = 'The Library projection owns selection and saved records; this Widget owns only its draft or view.';
const SYSTEM = 'Current typed engine state remains authoritative; representative controls stage bounded changes only.';
const SETTINGS = 'A shared Settings owner holds the live value; Panel placement stores presentation only.';
const COMMON: readonly SurfaceState[] = ['ready', 'loading', 'empty', 'unavailable', 'access-denied', 'stale', 'offline', 'failure'];
const DRAFT: readonly SurfaceState[] = [...COMMON, 'dirty', 'saving', 'conflict', 'success'];
const TASK: readonly SurfaceState[] = [...DRAFT, 'review', 'running', 'partial', 'refused'];

function fixture(
  rawType: string,
  presentation: SurfacePresentation,
  scope: string,
  rows: readonly (readonly [string, string])[],
  boundary: string,
  actions: readonly string[] = [],
  states: readonly SurfaceState[] = COMMON
): SurfaceFixture {
  return Object.freeze({
    type: asWidgetType(rawType),
    presentation,
    scope,
    rows: Object.freeze(rows.map((row) => Object.freeze([...row] as [string, string]))),
    boundary,
    actions: Object.freeze([...actions]),
    states: Object.freeze([...states])
  });
}

export const SURFACE_FIXTURES: ReadonlyMap<WidgetType, SurfaceFixture> = new Map([
  fixture('settings.provider-credentials', 'credentials', 'Global host · provider owner', [['OpenAI', 'Tested today · Key saved'], ['Anthropic', 'Needs setup · No key'], ['Local Engine', 'Available · No key required']], 'Saved keys stay on the host and are never read back into the interface.', ['Add connection'], TASK),
  fixture('settings.model-assignments', 'assignments', 'Global host · assignment owner', [['Default', 'OpenAI · GPT-4.1 mini'], ['Director', 'OpenAI · GPT-5.2'], ['Characters', 'Follows Default'], ['Narration', 'Needs attention']], 'One Settings owner holds the live role table; this Widget keeps one recoverable draft.', ['Save assignments'], DRAFT),
  fixture('settings.theme', 'theme', 'This device · preset library', [['Current', 'Deep Current'], ['Presets', '3 semantic previews'], ['Custom draft', 'No custom draft']], 'Selects complete presets only; authoring belongs to Theme Settings.', ['Open Theme Settings'], DRAFT),
  fixture('settings.accessibility', 'accessibility', 'This device · accessibility owner', [['Contrast', 'Standard · device'], ['Text scale', '100% · device'], ['Reduced motion', 'Uses system'], ['Focus visibility', 'Standard · device'], ['Reading support', 'Off · device']], 'Changes apply immediately on this device; Reset opens a consequence review.', ['Reset accessibility settings'], DRAFT),
  fixture('settings.maintenance', 'maintenance', 'Global host · maintenance owner', [['Updates', 'Current · alpha 9.8'], ['Checkpoint storage', 'Needs review · 2 legacy'], ['Memory search', 'Needs repair · 7 vectors'], ['Diagnostics', 'Healthy · redacted export'], ['Host session', 'Full panel section · not detachable']], 'Maintenance tasks share one action lease; Host session remains a separate protected review destination.', ['Check for updates'], TASK),
  fixture('settings.prompt-editor', 'prompt', 'Global host · settings-prompts owner', [['Preset', 'Sonder Default · built-in'], ['Sheets', '4 prompt sheets'], ['Draft', 'Saved · read-only'], ['Active', 'Sonder Default']], 'One shared recoverable draft owns prompt edits. Saving changes a preset; Use changes the active preset.', ['Add preset', 'Open focused editor'], DRAFT),

  fixture('story.transcript', 'reader', 'Active frame · shared visible-turn owner', [['Current turn', '42 · Variant 1 of 1'], ['Selected turn', '42 · newest'], ['State', 'Committed']], 'The server owns committed turns and mutations. Transcript publishes one visible-turn selection to Backdrop and Ambience.', ['Open reading stage']),
  fixture('story.composer', 'composer', 'Active Story · one shared player draft', [['Perspective', 'Aven Rook'], ['Draft', 'Retained locally'], ['Submission', 'Ready']], 'The client owns the recoverable draft; the server owns accepted input and generation lifecycle.', ['Send action'], DRAFT),
  fixture('story.context', 'system', 'Active Story · Present frame', [['Story', 'The Water Remembers'], ['Present frame', 'Reservoir descent'], ['Visible turn', '42']], STORY, ['Open frame']),
  fixture('story.turn-progress', 'progress', 'Current run · turn 43', [['Stage', 'Character responses'], ['Completed', 'Interpretation · Director'], ['Next', 'Narration']], STORY),
  fixture('story.live-technical-detail', 'telemetry', 'Current run · bounded detail', [['Events', '8 recent'], ['Model calls', '3 complete · 1 active'], ['Elapsed', '18.4 s']], 'Technical events are host-visible runtime evidence and never enter character cognition.', ['Pause autoscroll'], DRAFT),
  fixture('story.turn-versions', 'versions', 'Selected turn · 42', [['Saved variants', '3'], ['Current', 'Variant 2'], ['Draft', 'No pending change']], STORY, ['Compare', 'Use selected version'], DRAFT),
  fixture('story.turn-inspector', 'inspector', 'Selected saved turn · 42', [['Stored variant', 'Variant 2'], ['Eligibility', 'Saved · complete'], ['Evidence', '3 host-visible sources']], 'Turn Inspector reads stored evidence; extension output is isolated and cannot replace host evidence.', ['Open evidence'], DRAFT),
  fixture('story.player-condition', 'condition', 'Current frame · player body', [['Breathing', 'Steady'], ['Mobility', 'Unrestricted'], ['Salient effect', 'Cold hands']], 'Shows current frame physiology only; selected-turn browsing does not rewind the body.'),
  fixture('story.cast-condition', 'condition', 'Current frame · visible cast', [['Mara Venn', 'Tired · mobile'], ['Old Ferryman', 'Guarded · steady'], ['Ilyan Reed', 'Cold · listening']], 'Only visible or otherwise authorized condition reaches this projection.'),
  fixture('story.room-ambience', 'ambience', 'Visible turn · Bell Gallery', [['Rain on glass', '42%'], ['Reservoir hum', '28%'], ['Bell resonance', 'Muted']], STORY, ['Pause ambience']),
  fixture('story.scene-backdrop', 'backdrop', 'Visible turn · Bell Gallery', [['Backdrop', 'Reservoir windows'], ['Continuity', 'Inherited from turn 41'], ['Contrast veil', 'Automatic']], 'Backdrop continuity follows the visible turn while foreground readability remains host-owned.', ['Choose backdrop']),
  fixture('runtime.background-work', 'tasks', 'Global runtime · non-blocking', [['Lore index', 'Complete'], ['Checkpoint compaction', 'Running · 64%'], ['Charter advance', 'Queued']], 'Background work reports status only and cannot claim fictional completion before commit.', ['View queue']),

  fixture('library.workspace', 'archive', 'Global Library · all material', [['Stories', '12'], ['Characters and Personas', '38 · 6'], ['Lorebooks', '7']], LIBRARY, ['New Story'], DRAFT),
  fixture('library.stories', 'archive', 'Global Library · Stories', [['Story', 'The Water Remembers'], ['Status', 'Active · turn 42'], ['Updated', 'Today']], LIBRARY, ['Open Story']),
  fixture('library.characters', 'archive', 'Global Library · Characters', [['Selected', 'Mara Venn'], ['Associations', '3 Stories'], ['Card status', 'Reusable']], LIBRARY, ['Open card']),
  fixture('story.characters', 'roster', 'Active Story · Characters', [['Mara Venn', 'Present · focused'], ['Old Ferryman', 'Present · guarded'], ['Ilyan Reed', 'Nearby · listening']], STORY, ['Open Story card']),
  fixture('library.personas', 'archive', 'Global Library · Personas', [['Selected', 'Aven Rook'], ['Associations', '2 Stories'], ['Primary use', 'The Water Remembers']], LIBRARY, ['Open Persona']),
  fixture('story.personas', 'roster', 'Active Story · Personas', [['Primary', 'Aven Rook'], ['Guest Persona', 'None'], ['Perspective', 'First person']], STORY, ['Open Story Persona']),
  fixture('library.lore', 'archive', 'Global Library · Lore', [['Lorebooks', '7'], ['Reusable', '5'], ['Story-local', '2']], LIBRARY, ['Open Lorebook']),
  fixture('story.lorebooks', 'archive', 'Active Story · Lorebooks', [['Attached', '2'], ['Story-local', 'Drowned Observatory'], ['Selection', 'The pale threshold']], LIBRARY, ['Edit selected'], DRAFT),
  fixture('library.new-story', 'wizard', 'New Story · staged workflow', [['Character', 'Mara Venn'], ['Persona', 'Aven Rook'], ['Opening', 'Greeting 2']], 'Nothing is created until the final reviewed launch uses the authoritative new-Story path.', ['Review and create'], DRAFT),
  fixture('library.character-card', 'document', 'Reusable Character · Mara Venn', [['Identity', 'Mara Venn'], ['Role', 'Cartographer'], ['Draft', 'No changes']], LIBRARY, ['Edit card'], DRAFT),
  fixture('story.character-card', 'document', 'Story Character · Mara Venn', [['Source card', 'Mara Venn · reusable'], ['Story overrides', '2'], ['Draft', 'No changes']], 'Story overrides never mutate the reusable Character source card.', ['Edit Story copy'], DRAFT),
  fixture('library.persona-card', 'document', 'Reusable Persona · Aven Rook', [['Identity', 'Aven Rook'], ['Voice', 'Measured'], ['Draft', 'No changes']], LIBRARY, ['Edit Persona'], DRAFT),
  fixture('library.greetings-quick-start', 'wizard', 'Mara Venn · greetings', [['Greetings', '4'], ['Selected', 'Greeting 2'], ['Persona', 'Aven Rook']], 'Quick Start launches through the same lived-location and turn-zero production path as New Story.', ['Start Story'], DRAFT),
  fixture('library.lore-entries', 'tree', 'Drowned Observatory · entry tree', [['Entries', '24'], ['Selected', 'The pale threshold'], ['Depth', '3 levels']], LIBRARY, ['New entry'], DRAFT),
  fixture('library.lore-entry-editor', 'document', 'Lore entry · The pale threshold', [['Status', 'Story-local'], ['Tokens', '186'], ['Draft', 'Edited']], LIBRARY, ['Review draft', 'Save entry'], DRAFT),
  fixture('library.lorebook-details', 'document', 'Lorebook · Drowned Observatory', [['Scope', 'Story-local'], ['Entries', '24'], ['Association', 'The Water Remembers']], LIBRARY, ['Save details'], DRAFT),
  fixture('library.lore-relationships', 'relationships', 'Selected Lore entry · relationships', [['Parents', '1'], ['Children', '3'], ['Cross-links', '2']], LIBRARY, ['Edit links'], DRAFT),
  fixture('library.lore-generator', 'generator', 'Drowned Observatory · generation draft', [['Brief', 'Planned floodgate history'], ['Candidates', '3'], ['Adoption', 'Review required']], 'Generated prose remains a draft until the user explicitly adopts selected entries.', ['Generate draft', 'Review candidates'], TASK),
  fixture('library.lived-location-builder', 'generator', 'Active Story · location generation', [['Source Lore', 'Drowned Observatory'], ['Registry slice', 'New institution only'], ['Pre-simulation', 'Awaiting review']], 'This is the sole visible owner of lived-location generation and calls the production operation once.', ['Review build'], TASK),

  fixture('systems.cast', 'roster', 'Active Story · Present frame', [['Registered cast', '4'], ['Present', '2'], ['Selected', 'Mara Venn']], SYSTEM, ['Open selected Character'], DRAFT),
  fixture('systems.background-presences', 'roster', 'Active Story · background bodies', [['Tracked', '6'], ['In earshot', '2'], ['Promotion review', '1 candidate']], 'A background presence stays a body in a room; promotion is staged and reviewable.', ['Review promotion'], TASK),
  fixture('systems.world-state', 'system', 'Active Story · typed state', [['Location', 'Bell Gallery'], ['Story time', '11:42 PM'], ['Weather', 'Cold rain']], 'Normal view is typed and read-only; safe editors open only for fields with explicit commit owners.'),
  fixture('systems.attire', 'document', 'Present frame · attire', [['Wearers', '3'], ['Garments', '9'], ['Selected', 'Mara · oilskin coat']], SYSTEM, ['Stage attire change'], DRAFT),
  fixture('systems.genre-style', 'system', 'Active Story · four settings owners', [['Style Guide', 'Configured'], ['Story language', 'Installed'], ['Player Authority', 'World author'], ['Condition Policy', 'On']], 'Four independent owners return four independent receipts; Story language never changes the host interface language.', ['Open owner'], DRAFT),
  fixture('systems.dialogue-agency', 'system', 'Active Story · behavior ceilings', [['Dialogue', 'Responsive'], ['Agency', 'Character-led'], ['First reactor', '1']], SYSTEM, ['Review changes'], DRAFT),
  fixture('systems.offscreen-life', 'progress', 'Active Story · ceiling', [['Level', 'Reactive'], ['Character-agent opt-ins', '1'], ['Due plans', '2']], 'The canonical rung is a ceiling, never an instruction, and uses engine vocabulary unchanged.', ['Change ceiling']),
  fixture('systems.living-world', 'system', 'Active Story · world floors', [['Routine residue', 'On'], ['Scheduled consequences', '2'], ['Place obligations', '1']], 'World facts never become knowledge without a carrier or route.', ['Open controls']),
  fixture('systems.institutions-charter', 'archive', 'Active Story · Charter registry', [['Institutions', '2'], ['Bodies', '18'], ['Upkeep due', '1']], 'Charter is explicit opt-in; the live Scene remains authority for registered cast positions.', ['Open Builder'], DRAFT),
  fixture('systems.institution-diagnostics', 'telemetry', 'Selected institution · host evidence', [['Epoch', '17'], ['Registry revision', '6'], ['Last landing', 'Committed']], 'Host-only diagnostics are evidence surfaces and never enter any cognition payload.'),
  fixture('systems.background-life', 'progress', 'Active Story · Scene Life', [['Scene Life', 'Off'], ['Max reactors', '1'], ['Forced handoffs', '0']], SYSTEM, ['Review controls']),
  fixture('systems.character-relationships', 'relationships', 'Mara Venn · directed judgments', [['Mara → Ferryman', 'Wary · 3 evidence'], ['Ferryman → Mara', 'Respectful · 2 evidence'], ['Universal score', 'None']], 'Read-only directed projections; there is no universal reputation score.')
].map((entry) => [entry.type, entry]));

export function getSurfaceFixture(type: WidgetType): SurfaceFixture | undefined {
  return SURFACE_FIXTURES.get(type);
}

export function resolveSurfaceState(value: unknown, fixture: SurfaceFixture): SurfaceState {
  return typeof value === 'string' && fixture.states.includes(value as SurfaceState)
    ? value as SurfaceState
    : 'ready';
}

export const SURFACE_STATE_COPY: Readonly<Record<Exclude<SurfaceState, 'ready'>, readonly [string, string]>> = Object.freeze({
  loading: ['Loading current state', 'The last committed view remains in place while this owner refreshes.'],
  empty: ['Nothing here yet', 'The owner is available, but there is no current record for this scope.'],
  unavailable: ['Owner unavailable', 'This surface cannot reach its declared owner right now.'],
  'access-denied': ['Access not available', 'The host did not grant the capability required for this view.'],
  stale: ['Showing retained evidence', 'A newer revision exists; review it before making a change.'],
  offline: ['Working offline', 'Committed evidence remains readable and unsafe actions are paused.'],
  failure: ['Could not refresh', 'The retained view and any draft are preserved. Try again when ready.'],
  dirty: ['Unsaved draft', 'Changes remain on this device until they are reviewed and saved.'],
  saving: ['Saving reviewed changes', 'The action is in progress; this draft remains recoverable.'],
  conflict: ['Revision changed', 'Compare the current owner revision before retrying this draft.'],
  success: ['Changes saved', 'The authoritative owner accepted the reviewed update.'],
  review: ['Review required', 'Confirm the bounded consequences before starting this operation.'],
  running: ['Operation in progress', 'One durable task owner is reporting current committed progress.'],
  partial: ['Partially completed', 'Completed work is retained and the remaining scope can be resumed.'],
  refused: ['Operation not started', 'A prerequisite or provider declined the reviewed operation.']
});
