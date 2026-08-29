<script lang="ts">
  import type { WidgetManifest } from '@pomegranate-ui/contracts';
  import type { CatalogController, CatalogState } from '@pomegranate-ui/core';
  import { IMPLEMENTED_SURFACE_TYPES } from '../mockup/implemented-surfaces.js';
  import { getSurfaceFixture } from '../mockup/surface-fixtures.js';

  let {
    catalog,
    oncreate,
    class: className = ''
  }: {
    catalog: CatalogController;
    oncreate: (manifest: WidgetManifest) => void;
    class?: string;
  } = $props();

  let state = $state<CatalogState>();
  $effect(() => {
    const current = catalog;
    state = current.getState();
    return current.subscribe((next) => { state = next; });
  });
</script>

{#if state?.open}
  <aside
    class={className}
    aria-label="Widget Catalog"
    data-pom-part="menu.surface"
    data-presentation={state.presentation}
    data-result-mode={state.resultMode}
  >
    <header data-pom-part="widget.header">
      <h2>Widget Catalog</h2>
      <button type="button" data-pom-part="button.icon" onclick={() => catalog.close()}>Close Catalog</button>
    </header>
    <label>
      Search Widgets
      <input
        type="search"
        data-pom-part="field.surface"
        value={state.query}
        oninput={(event) => catalog.setQuery(event.currentTarget.value)}
      />
    </label>
    <nav aria-label="Catalog display">
      <button type="button" data-pom-part="button.surface" aria-pressed={state.presentation === 'drawer'} onclick={() => catalog.setPresentation('drawer')}>Drawer</button>
      <button type="button" data-pom-part="button.surface" aria-pressed={state.presentation === 'expanded'} onclick={() => catalog.setPresentation('expanded')}>Expanded</button>
      <button type="button" data-pom-part="button.surface" aria-pressed={state.resultMode === 'visual'} onclick={() => catalog.setResultMode('visual')}>Visual</button>
      <button type="button" data-pom-part="button.surface" aria-pressed={state.resultMode === 'compact'} onclick={() => catalog.setResultMode('compact')}>Compact</button>
    </nav>
    <nav aria-label="Catalog categories">
      <button type="button" data-pom-part="button.surface" aria-pressed={state.category === null} onclick={() => catalog.setCategory(null)}>All</button>
      {#each state.categories as category}
        <button type="button" data-pom-part="button.surface" aria-pressed={state.category === category} onclick={() => catalog.setCategory(category)}>{category}</button>
      {/each}
    </nav>
    <ul aria-live="polite">
      {#each state.results as manifest (manifest.type)}
        <li
          data-widget-type={manifest.type}
          data-pom-part="row.surface"
          data-renderer-status={IMPLEMENTED_SURFACE_TYPES.has(manifest.type) ? 'implemented' : 'unavailable'}
        >
          <span class="catalog-result-title">{manifest.title}</span>
          <span class="catalog-result-purpose">{manifest.catalog?.purpose}</span>
          {#if state.resultMode === 'visual'}
            {@const fixture = getSurfaceFixture(manifest.type)}
            <div class="catalog-miniature" data-pom-part="widget.surface" data-miniature-presentation={fixture?.presentation ?? 'unavailable'} aria-label={`${manifest.title} preview`}>
              <header><i aria-hidden="true"></i><strong>{manifest.title}</strong><small>{manifest.catalog?.shape}</small></header>
              {#if fixture}
                <p>{fixture.scope}</p>
                <dl>{#each fixture.rows.slice(0, 3) as row (row[0])}<div><dt>{row[0]}</dt><dd>{row[1]}</dd></div>{/each}</dl>
              {:else}
                <p>Renderer unavailable</p>
                <small>Manifest, preview, and placement remain available.</small>
              {/if}
            </div>
          {/if}
          <button type="button" data-pom-part="button.surface" onclick={() => oncreate(manifest)}>Add {manifest.title}</button>
        </li>
      {/each}
    </ul>
  </aside>
{/if}
