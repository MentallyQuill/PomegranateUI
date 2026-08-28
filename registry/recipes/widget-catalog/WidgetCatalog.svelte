<script lang="ts">
  import type { WidgetManifest } from '@pomegranate-ui/contracts';
  import type { CatalogController, CatalogState } from '@pomegranate-ui/core';

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
  const categories = $derived(state
    ? [...new Set(state.results
        .map((entry) => entry.catalog?.category)
        .filter((value): value is string => typeof value === 'string'))].sort()
    : []);
</script>

{#if state?.open}
  <aside
    class={className}
    aria-label="Widget Catalog"
    data-presentation={state.presentation}
    data-result-mode={state.resultMode}
  >
    <header>
      <h2>Widget Catalog</h2>
      <button type="button" onclick={() => catalog.close()}>Close Catalog</button>
    </header>
    <label>
      Search Widgets
      <input
        type="search"
        value={state.query}
        oninput={(event) => catalog.setQuery(event.currentTarget.value)}
      />
    </label>
    <nav aria-label="Catalog display">
      <button type="button" aria-pressed={state.presentation === 'drawer'} onclick={() => catalog.setPresentation('drawer')}>Drawer</button>
      <button type="button" aria-pressed={state.presentation === 'expanded'} onclick={() => catalog.setPresentation('expanded')}>Expanded</button>
      <button type="button" aria-pressed={state.resultMode === 'visual'} onclick={() => catalog.setResultMode('visual')}>Visual</button>
      <button type="button" aria-pressed={state.resultMode === 'compact'} onclick={() => catalog.setResultMode('compact')}>Compact</button>
    </nav>
    <nav aria-label="Catalog categories">
      <button type="button" aria-pressed={state.category === null} onclick={() => catalog.setCategory(null)}>All</button>
      {#each categories as category}
        <button type="button" aria-pressed={state.category === category} onclick={() => catalog.setCategory(category)}>{category}</button>
      {/each}
    </nav>
    <ul aria-live="polite">
      {#each state.results as manifest (manifest.type)}
        <li>
          <span>{manifest.title}</span>
          <span>{manifest.catalog?.purpose}</span>
          <button type="button" onclick={() => oncreate(manifest)}>Add {manifest.title}</button>
        </li>
      {/each}
    </ul>
  </aside>
{/if}
