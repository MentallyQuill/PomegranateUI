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
  fixture('settings.connections', 'credentials', 'Global host · inference routes', [['Director', 'Connected'], ['Narrator', 'Connected'], ['Characters', '6 routes'], ['Latency', '742 ms']], 'Connection status is host-owned; stored credentials are never exposed to the Widget.', [], TASK),
  fixture('settings.model-assignments', 'assignments', 'Global host · assignment owner', [['Default', 'OpenAI · GPT-4.1 mini'], ['Director', 'OpenAI · GPT-5.2'], ['Characters', 'Follows Default'], ['Narration', 'Needs attention']], 'One Settings owner holds the live role table; this Widget keeps one recoverable draft.', ['Save assignments'], DRAFT),
  fixture('settings.theme', 'theme', 'This device · preset library', [['Current', 'Deep Current'], ['Presets', '4 semantic previews'], ['Custom draft', 'Device-local']], 'Selects complete presets only; authoring belongs to Theme Settings.', ['Open Theme Settings'], DRAFT),
  fixture('settings.custom-theme', 'system', 'This device · one recoverable Theme draft', [['Color roles', '6 semantic values'], ['Materials', '4 bounded controls'], ['Ambient', 'Position · radius · power']], 'Invalid input remains editable while the last valid semantic target stays applied.', ['Reset', 'Save draft'], DRAFT),
  fixture('settings.accessibility', 'accessibility', 'This device · accessibility owner', [['Contrast', 'Standard · device'], ['Text scale', '100% · device'], ['Reduced motion', 'Uses system'], ['Focus visibility', 'Standard · device'], ['Reading support', 'Off · device']], 'Changes apply immediately on this device; Reset opens a consequence review.', ['Reset accessibility settings'], DRAFT),
  fixture('settings.maintenance', 'maintenance', 'Global host · maintenance owner', [['Updates', 'Current · alpha 9.8'], ['Checkpoint storage', 'Needs review · 2 legacy'], ['Memory search', 'Needs repair · 7 vectors'], ['Diagnostics', 'Healthy · redacted export'], ['Host session', 'Full panel section · not detachable']], 'Maintenance tasks share one action lease; Host session remains a separate protected review destination.', ['Check for updates'], TASK),
  fixture('settings.prompt-editor', 'prompt', 'Global host · settings-prompts owner', [['Preset', 'Host Default · built-in'], ['Sheets', '4 prompt sheets'], ['Draft', 'Saved · read-only'], ['Active', 'Host Default']], 'One shared recoverable draft owns prompt edits. Saving changes a preset; Use changes the active preset.', ['Add preset', 'Open focused editor'], DRAFT),

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
  fixture('systems.promise-ledger', 'system', 'Active Story · retained commitments', [['Open threads', '3'], ['Active', 'Find the drowned observatory'], ['Held', 'Keep the western rail watched']], 'The active Story owns retained promises; this projection does not invent or commit them.'),
  fixture('systems.attire', 'document', 'Present frame · attire', [['Wearers', '3'], ['Garments', '9'], ['Selected', 'Mara · oilskin coat']], SYSTEM, ['Stage attire change'], DRAFT),
  fixture('systems.genre-style', 'system', 'Active Story · four settings owners', [['Style Guide', 'Configured'], ['Story language', 'Installed'], ['Player Authority', 'World author'], ['Condition Policy', 'On']], 'Four independent owners return four independent receipts; Story language never changes the host interface language.', ['Open owner'], DRAFT),
  fixture('systems.dialogue-agency', 'system', 'Active Story · behavior ceilings', [['Dialogue', 'Responsive'], ['Agency', 'Character-led'], ['First reactor', '1']], SYSTEM, ['Review changes'], DRAFT),
  fixture('systems.offscreen-life', 'progress', 'Active Story · ceiling', [['Level', 'Reactive'], ['Character-agent opt-ins', '1'], ['Due plans', '2']], 'The canonical rung is a ceiling, never an instruction, and uses engine vocabulary unchanged.', ['Change ceiling']),
  fixture('systems.living-world', 'system', 'Active Story · world floors', [['Routine residue', 'On'], ['Scheduled consequences', '2'], ['Place obligations', '1']], 'World facts never become knowledge without a carrier or route.', ['Open controls']),
  fixture('systems.institutions-charter', 'archive', 'Active Story · Charter registry', [['Institutions', '2'], ['Bodies', '18'], ['Upkeep due', '1']], 'Charter is explicit opt-in; the live Scene remains authority for registered cast positions.', ['Open Builder'], DRAFT),
  fixture('systems.institution-diagnostics', 'telemetry', 'Selected institution · host evidence', [['Epoch', '17'], ['Registry revision', '6'], ['Last landing', 'Committed']], 'Host-only diagnostics are evidence surfaces and never enter any cognition payload.'),
  fixture('systems.background-life', 'progress', 'Active Story · Scene Life', [['Scene Life', 'Off'], ['Max reactors', '1'], ['Forced handoffs', '0']], SYSTEM, ['Review controls']),
  fixture('systems.character-relationships', 'relationships', 'Mara Venn · directed judgments', [['Mara → Ferryman', 'Wary · 3 evidence'], ['Ferryman → Mara', 'Respectful · 2 evidence'], ['Universal score', 'None']], 'Read-only directed projections; there is no universal reputation score.'),
  fixture('systems.memory-browser', 'archive', 'Active Story · retained memories', [['Selected memory', 'The bell gallery promise'], ['Sources', '2 committed turns'], ['Recall status', 'Available to Mara']], 'The engine owns stored memories and retrieval eligibility; this view can stage notes without changing what any Character knows.', ['Open source turns'], DRAFT),
  fixture('systems.character-private-history', 'document', 'Mara Venn · private history', [['Entries', '7 retained'], ['Selected', 'The western rail'], ['Visibility', 'Mara only']], 'Private Character history stays within its declared subject and never becomes player-visible Story fact without an authorized route.', ['Review selected entry'], TASK),
  fixture('systems.persona-private-history', 'document', 'Aven Rook · private history', [['Entries', '4 retained'], ['Selected', 'Reservoir descent'], ['Visibility', 'Persona only']], 'Private Persona history remains scoped to the active identity; adopting an entry requires a deliberate reviewed action.', ['Review selected entry'], TASK),
  fixture('systems.dramatic-irony', 'relationships', 'Active Story · knowledge differences', [['Mara knows', 'The gate code changed'], ['Aven knows', 'The ferryman kept a copy'], ['Shared knowledge', 'The lower stair is flooded']], 'This projection compares authorized knowledge sets; it does not teach facts to Characters or insert them into the transcript.', ['Open evidence']),
  fixture('systems.multiplayer-invites', 'roster', 'Active Story · guest access', [['Active players', '1 host'], ['Pending invites', '1 expires tomorrow'], ['Guest seats', '2 available']], 'The host owns identity, consent, and access decisions; an invitation grants only the reviewed Story role and duration.', ['Review pending invite'], TASK),
  fixture('systems.frames', 'versions', 'Active Story · frame history', [['Present frame', 'Bell Gallery'], ['Saved frames', '9'], ['Branch point', 'Reservoir landing']], 'Committed frames remain engine-owned snapshots; selecting one for inspection does not rewind the active Story.', ['Compare frames'], DRAFT),
  fixture('systems.whos-where', 'roster', 'Present frame · known locations', [['Bell Gallery', 'Mara · Aven'], ['Western rail', 'Old Ferryman'], ['Unknown', 'Ilyan Reed']], 'Locations appear only when the active perspective is authorized to know them; unknown positions stay unknown.', ['Open visible location']),
  fixture('systems.paradox-fixed-points', 'relationships', 'Active Story · continuity constraints', [['Fixed point', 'The first bell rang at midnight'], ['Open paradox', 'Two keys at the west gate'], ['Review queue', '1 continuity choice']], 'The continuity owner records constraints and reviewed resolutions; this surface cannot silently rewrite committed frames.', ['Review continuity choice'], TASK),

  fixture('settings.group.account-access', 'archive', 'Global Settings · account and access', [['Provider credentials', '3 configured'], ['Connections', '2 healthy'], ['Access review', 'No pending changes']], 'This overview links to the shared owners for credentials and access; it never reads back secrets or commits changes itself.', ['Open account controls']),
  fixture('settings.group.ai-models', 'archive', 'Global Settings · AI and models', [['Assignments', '4 roles'], ['Default model', 'Configured'], ['Routing', 'One rule needs review']], 'This group summarizes independent model owners; each destination keeps its own recoverable draft and validation.', ['Open model assignments']),
  fixture('settings.group.appearance-accessibility', 'archive', 'This device · appearance and accessibility', [['Theme', 'Deep Current'], ['Reading layout', 'Comfortable'], ['Motion', 'Reduced']], 'Device presentation owners remain independent and apply only reviewed preferences to this device.', ['Open appearance controls']),
  fixture('settings.group.story-content', 'archive', 'Global Settings · Story defaults and content', [['Content profile', 'Balanced'], ['Narrator examples', '3 saved'], ['Living World', 'Reactive']], 'Defaults affect future eligible work only; active Story owners receive changes through their declared settings paths.', ['Open Story defaults']),
  fixture('settings.group.data-extensions-maintenance', 'archive', 'Global Settings · data and extensions', [['Installed extensions', '2 enabled'], ['Host updates', 'Current'], ['Diagnostics', 'Ready']], 'Maintenance, extension, and data owners keep separate consequences and receipts; this overview starts no work by itself.', ['Open maintenance']),
  fixture('settings.group.advanced', 'archive', 'Global Settings · advanced controls', [['Prompt preset', 'Host Default'], ['Raw Story data', 'Read-only'], ['Raw clothing data', 'Protected']], 'Advanced destinations preserve their own validation and review boundaries; opening this group never bypasses safeguards.', ['Open advanced controls']),
  fixture('settings.reading-layout', 'theme', 'This device · reading layout', [['Text width', 'Comfortable'], ['Line spacing', 'Relaxed'], ['Transcript density', 'Standard']], 'Reading preferences are device-local and do not alter stored Story prose or another reader’s layout.', ['Save reading layout'], DRAFT),
  fixture('settings.sound-motion', 'accessibility', 'This device · sound and motion', [['Interface sounds', 'On'], ['Animation', 'Reduced'], ['Autoplay ambience', 'Ask first']], 'Sound and motion preferences apply on this device; media permission and active playback remain separate runtime decisions.', ['Save sound and motion'], DRAFT),
  fixture('settings.content', 'system', 'Global Settings · content defaults', [['Intensity', 'Moderate'], ['Excluded themes', '2'], ['Review mode', 'Before applying']], 'Content preferences are staged as defaults and cannot rewrite committed Story material or another participant’s boundaries.', ['Review content changes'], DRAFT),
  fixture('settings.add-ons', 'archive', 'Global host · add-on overview', [['Installed', '2'], ['Enabled', '1'], ['Updates available', 'None']], 'The host owns installation and capabilities; this overview exposes no extension data until its permissions allow it.', ['Manage installed add-ons'], DRAFT),
  fixture('settings.raw-story-data', 'document', 'Active Story · guarded raw data', [['Revision', '42 committed'], ['Sections', '8 typed records'], ['Draft', 'No raw changes']], 'The typed Story owner remains authoritative; raw edits require validation, a consequence review, and an explicit commit.', ['Review raw Story data'], TASK),
  fixture('settings.default-model', 'assignments', 'Global host · default inference model', [['Provider', 'Default connected provider'], ['Model', 'Balanced text model'], ['Used by', '2 inherited roles']], 'The default model is one shared setting; role-specific assignments can override it without duplicating credentials.', ['Save default model'], DRAFT),
  fixture('settings.memory-search-model', 'assignments', 'Global host · memory search route', [['Provider', 'Local Engine'], ['Model', 'text-embedding-small'], ['Index compatibility', 'Ready']], 'Changing the search model stages a compatibility check; existing memory data remains untouched until review succeeds.', ['Review model change'], DRAFT),
  fixture('settings.response-limit', 'assignments', 'Global host · response budget', [['Default limit', '1,200 tokens'], ['Narration override', '1,800 tokens'], ['Characters', 'Follow default']], 'Limits are upper bounds for eligible model calls, not promises about response length or fictional progress.', ['Save response limits'], DRAFT),
  fixture('settings.openrouter-routing', 'assignments', 'Global host · OpenRouter policy', [['Routing mode', 'Price and latency'], ['Allowed providers', '3'], ['Fallbacks', '2 ordered']], 'Routing policy selects among explicitly allowed providers; it never exposes keys or changes a role assignment silently.', ['Review routing policy'], DRAFT),
  fixture('settings.scene-backdrops', 'backdrop', 'Global Settings · backdrop defaults', [['Automatic selection', 'On'], ['Readability veil', 'Automatic'], ['Saved sources', '4']], 'Backdrop defaults guide future visible turns; the active Scene owner decides current media and preserves foreground readability.', ['Save backdrop defaults'], DRAFT),
  fixture('settings.room-ambience', 'ambience', 'Global Settings · ambience defaults', [['Autoplay', 'Ask first'], ['Default volume', '35%'], ['Crossfade', '4 seconds']], 'Ambience defaults do not start playback; the active room and device permission remain authoritative at runtime.', ['Save ambience defaults'], DRAFT),
  fixture('settings.story-reading-layout', 'theme', 'This device · Story reading preferences', [['Stage width', 'Comfortable'], ['Paragraph spacing', 'Relaxed'], ['History grouping', 'By turn']], 'These preferences change only Story presentation on this device and never modify transcript content.', ['Apply Story layout'], DRAFT),
  fixture('settings.story-sound', 'ambience', 'This device · Story sound', [['Narration cues', 'On'], ['Scene ambience', 'Ask first'], ['Output device', 'System default']], 'Story sound preferences remain separate from media permission, current playback, and room ambience ownership.', ['Save Story sound'], DRAFT),
  fixture('settings.accessibility-controls', 'accessibility', 'This device · live accessibility controls', [['Contrast', 'Enhanced'], ['Focus indicators', 'Strong'], ['Reduced motion', 'On']], 'Accessibility changes apply immediately on this device while the shared Settings owner retains the reviewed preference.', ['Save accessibility controls'], DRAFT),
  fixture('settings.content-preferences', 'system', 'Global Settings · content preference draft', [['Profile', 'Balanced'], ['Boundaries', '2 explicit'], ['Affected defaults', 'New Stories only']], 'A reviewed preference update changes eligible defaults only; active Story content and participant choices remain intact.', ['Review preference update'], TASK),
  fixture('settings.narrator-voice', 'document', 'Global Settings · narrator examples', [['Examples', '3 saved'], ['Selected', 'Quiet observational'], ['Draft', 'One revised paragraph']], 'Examples guide eligible narration without becoming Story facts; the shared draft must be saved before use.', ['Save narrator examples'], DRAFT),
  fixture('settings.living-world-controls', 'system', 'Active Story · Living World controls', [['Ceiling', 'Reactive'], ['Scheduled consequences', '2'], ['Routine residue', 'On']], 'Controls set explicit ceilings and floors; the engine remains responsible for committed world state and causal routes.', ['Review Living World changes'], DRAFT),
  fixture('settings.installed-extensions', 'archive', 'Global host · installed extensions', [['Atlas Clock', 'Enabled'], ['Trail Notes', 'Disabled'], ['Updates', 'None available']], 'The host owns extension lifecycle and capabilities; disabling an extension preserves its data until a reviewed removal.', ['Review extension status'], DRAFT),
  fixture('settings.install-extension', 'wizard', 'Global host · extension install draft', [['Source', 'Local reviewed package'], ['Publisher', 'Example contributor'], ['Capabilities', 'Story read · local storage']], 'Nothing installs until source identity, requested capabilities, and consequences are reviewed and accepted by the host.', ['Review installation'], TASK),
  fixture('settings.host-updates', 'maintenance', 'Global host · update coordinator', [['Installed', 'Alpha 9.8'], ['Available', 'Alpha 9.9'], ['Checkpoint', 'Ready']], 'The maintenance owner creates a checkpoint and reports one durable receipt; checking for updates changes no runtime state.', ['Review host update'], TASK),
  fixture('settings.checkpoint-storage', 'maintenance', 'Global host · checkpoint storage', [['Checkpoints', '12 retained'], ['Storage used', '1.8 GB'], ['Oldest', '24 days ago']], 'Checkpoint records are host-owned recovery data; this view reports retention without deleting or compacting anything.', ['Open retention policy']),
  fixture('settings.memory-search-repair', 'maintenance', 'Global host · memory search repair', [['Affected records', '7'], ['Last healthy index', 'Today 08:14'], ['Repair', 'Ready for review']], 'Repair work operates on the search index only; committed Story records remain authoritative and recoverable.', ['Review repair plan'], TASK),
  fixture('settings.diagnostics', 'telemetry', 'Global host · diagnostic snapshot', [['Runtime', 'Healthy'], ['Providers', '2 reachable'], ['Sensitive values', 'Redacted']], 'Diagnostics collect bounded host evidence with credentials and private Story text redacted before export.', ['Capture diagnostic snapshot']),
  fixture('settings.prompt-preset-editor', 'prompt', 'Global Settings · prompt preset workspace', [['Preset', 'Host Default'], ['Sheets', '4 ordered'], ['Draft', 'One unsaved change']], 'One shared draft owns preset edits; saving updates the preset while activation remains a separate deliberate action.', ['Review prompt draft', 'Save preset'], DRAFT),
  fixture('settings.raw-clothing-data', 'document', 'Active Story · guarded attire data', [['Wearers', '3'], ['Garments', '9 typed records'], ['Draft', 'No raw changes']], 'Typed attire state remains authoritative; raw edits require schema validation and consequence review before commit.', ['Review raw attire data'], TASK),

  fixture('ext:atlas:campaign-clock', 'progress', 'Active Story · adopter-provided clock', [['Clock', 'Floodgate opens'], ['Progress', '3 of 6 segments'], ['Last change', 'Turn 42']], 'The extension owns its clock record; the host supplies placement and capabilities without treating progress as engine time.', ['Review clock change'], TASK),
  fixture('ext:trail:location-notes', 'document', 'Bell Gallery · adopter-provided notes', [['Notes', '4 saved'], ['Selected', 'Cracked western window'], ['Draft', 'One local edit']], 'The extension owns these notes; they do not become Lore or Story facts unless an adopter-defined action explicitly promotes them.', ['Save location note'], TASK),
  fixture('ext:mythic:settings', 'system', 'Installed extension · adopter settings', [['Mode', 'Quiet prompts'], ['History retention', '30 days'], ['Draft', 'No changes']], 'The extension owns its configuration values while the host owns capability grants, placement, and lifecycle controls.', ['Review extension settings'], TASK)
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
