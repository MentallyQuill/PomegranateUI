export interface WidgetSurfaceCase {
  readonly scenarioId: string;
  readonly type: string;
  readonly title: string;
  readonly presentationTitle: string;
  readonly harnessCaseFragment: string;
}

export interface CatalogCase {
  readonly scenarioId: string;
  readonly title: string;
  readonly harnessCaseFragment: string;
}

const surface = (
  scenarioId: string,
  type: string,
  title: string,
  harnessCaseFragment = title,
  presentationTitle = title
): WidgetSurfaceCase => Object.freeze({
  scenarioId,
  type,
  title,
  presentationTitle,
  harnessCaseFragment
});

export const DEEP_CURRENT_WIDGET_SURFACES: readonly WidgetSurfaceCase[] = Object.freeze([
  surface('dc-w-provider-credentials', 'settings.provider-credentials', 'Provider Credentials'),
  surface('dc-w-model-assignments', 'settings.model-assignments', 'Model Assignments'),
  surface('dc-w-theme-library', 'settings.theme', 'Theme Library'),
  surface('dc-w-accessibility', 'settings.accessibility', 'Accessibility'),
  surface('dc-w-maintenance', 'settings.maintenance', 'Maintenance'),
  surface('dc-w-prompt-editor', 'settings.prompt-editor', 'Prompt Editor'),
  surface('dc-w-transcript', 'story.transcript', 'Transcript'),
  surface('dc-w-composer', 'story.composer', 'Composer'),
  surface('dc-w-story-context', 'story.context', 'Story and Frame Context'),
  surface('dc-w-turn-progress', 'story.turn-progress', 'Turn Progress'),
  surface('dc-w-live-technical-detail', 'story.live-technical-detail', 'Live Technical Detail'),
  surface('dc-w-turn-versions', 'story.turn-versions', 'Turn Versions'),
  surface('dc-w-turn-inspector', 'story.turn-inspector', 'Turn Inspector'),
  surface('dc-w-player-condition', 'story.player-condition', 'Player Condition'),
  surface('dc-w-cast-condition', 'story.cast-condition', 'Cast Condition'),
  surface('dc-w-room-ambience', 'story.room-ambience', 'Room Ambience', 'Room Ambience', 'Scene Effects'),
  surface('dc-w-scene-backdrop', 'story.scene-backdrop', 'Scene Backdrop'),
  surface('dc-w-background-work', 'runtime.background-work', 'Background Work'),
  surface('dc-w-library', 'library.workspace', 'Library', 'Library owns one typed master-detail archive'),
  surface('dc-w-stories', 'library.stories', 'Stories', 'Stories is a compact shared Library archive'),
  surface('dc-w-characters-library', 'library.characters', 'Characters (Library)', 'Characters Library is a shared reusable-card archive'),
  surface('dc-w-characters-story', 'story.characters', 'Characters (Story)', 'Characters Story owns Story associations', 'Characters'),
  surface('dc-w-personas-library', 'library.personas', 'Personas (Library)', 'Personas Library protects primary identity'),
  surface('dc-w-personas-story', 'story.personas', 'Personas (Story)', 'Personas Story anchors one protected primary identity', 'Personas'),
  surface('dc-w-lore-library', 'library.lore', 'Lore (Library)', 'Lore Library exposes book scope'),
  surface('dc-w-lorebooks-story', 'story.lorebooks', 'Lorebooks (Story)', 'Story Lorebooks groups ownership'),
  surface('dc-w-new-story', 'library.new-story', 'New Story'),
  surface('dc-w-character-card', 'library.character-card', 'Character Card'),
  surface('dc-w-story-character-card', 'story.character-card', 'Story Character Card'),
  surface('dc-w-persona-card', 'library.persona-card', 'Persona Card'),
  surface('dc-w-greetings-quick-start', 'library.greetings-quick-start', 'Greetings and Quick Start'),
  surface('dc-w-lore-entry-tree', 'library.lore-entries', 'Lore Entry Tree'),
  surface('dc-w-lore-entry-editor', 'library.lore-entry-editor', 'Lore Entry Editor'),
  surface('dc-w-lorebook-details', 'library.lorebook-details', 'Lorebook Details'),
  surface('dc-w-lore-relationships', 'library.lore-relationships', 'Lore Relationships'),
  surface('dc-w-lore-generator', 'library.lore-generator', 'Lore Generator'),
  surface('dc-w-location-builder', 'library.lived-location-builder', 'Lived-in Location Builder'),
  surface('dc-w-cast', 'systems.cast', 'Cast', 'Cast owns four frame-qualified participants'),
  surface('dc-w-background-presences', 'systems.background-presences', 'Background Presences'),
  surface('dc-w-world-state', 'systems.world-state', 'World State'),
  surface('dc-w-attire', 'systems.attire', 'Attire'),
  surface('dc-w-genre-style', 'systems.genre-style', 'Genre and Style'),
  surface('dc-w-dialogue-agency', 'systems.dialogue-agency', 'Dialogue and Agency'),
  surface('dc-w-offscreen-life', 'systems.offscreen-life', 'Off-screen Life'),
  surface('dc-w-living-world', 'systems.living-world', 'Living World'),
  surface('dc-w-institutions-charter', 'systems.institutions-charter', 'Institutions and Charter'),
  surface('dc-w-institution-diagnostics', 'systems.institution-diagnostics', 'Institution Diagnostics'),
  surface('dc-w-background-life', 'systems.background-life', 'Background Life / Scene Life', 'Background Life coordinates two bounded owners'),
  surface('dc-w-character-relationships', 'systems.character-relationships', 'Character Relationships')
]);

export const DEEP_CURRENT_CATALOG_SCENARIOS: readonly CatalogCase[] = Object.freeze([
  Object.freeze({ scenarioId: 'dc-catalog-inventory', title: 'Catalog preserves the complete inventory', harnessCaseFragment: 'Registry exposes the complete documented Widget model' }),
  Object.freeze({ scenarioId: 'dc-catalog-search', title: 'Catalog searches identity and keywords', harnessCaseFragment: 'Catalog category and search use the complete definition registry' }),
  Object.freeze({ scenarioId: 'dc-catalog-visual-preview', title: 'Catalog exposes visual previews', harnessCaseFragment: 'Visual Catalog results are faithful miniature Widgets without action rows' }),
  Object.freeze({ scenarioId: 'dc-catalog-compact-preview', title: 'Catalog exposes compact previews', harnessCaseFragment: 'Compact mode keeps whole rows draggable and removes per-Widget actions' }),
  Object.freeze({ scenarioId: 'dc-catalog-placement-all', title: 'Catalog places every manifest identity', harnessCaseFragment: 'Every documented Widget traverses real placement, persistence, render, and removal' }),
  Object.freeze({ scenarioId: 'dc-catalog-fallback-46', title: 'Catalog retains honest unavailable fallbacks', harnessCaseFragment: 'Every registered Widget renders a distinctive safe ready blueprint' })
]);
