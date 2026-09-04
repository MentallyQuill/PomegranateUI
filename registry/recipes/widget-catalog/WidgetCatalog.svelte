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
  let dialog: HTMLDialogElement;
  $effect(() => {
    const current = catalog;
    state = current.getState();
    return current.subscribe((next) => { state = next; });
  });

  $effect(() => {
    if (!dialog) return;
    if (state?.open && !dialog.open) dialog.showModal();
    if (!state?.open && dialog.open) dialog.close();
  });

  function cancel(event: Event) {
    event.preventDefault();
    catalog.close();
  }
</script>

<dialog
  bind:this={dialog}
  class={className}
  aria-label="Widget Catalog"
  aria-describedby="widget-catalog-scroll-status"
  data-pom-part="dialog.surface"
  data-presentation={state?.presentation}
  data-result-mode={state?.resultMode}
  oncancel={cancel}
>
  {#if state?.open}
    <header data-pom-part="widget.header">
      <h2>Widget Catalog</h2>
      <button type="button" data-pom-part="button.surface" onclick={() => catalog.close()}>Close Catalog</button>
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
    <nav data-pom-control-group="joined" aria-label="Catalog display">
      <button type="button" data-pom-part="button.surface" data-pom-control-segment="start" aria-pressed={state.presentation === 'drawer'} onclick={() => catalog.setPresentation('drawer')}>Drawer</button>
      <button type="button" data-pom-part="button.surface" data-pom-control-segment="middle" aria-pressed={state.presentation === 'expanded'} onclick={() => catalog.setPresentation('expanded')}>Expanded</button>
      <button type="button" data-pom-part="button.surface" data-pom-control-segment="middle" aria-pressed={state.resultMode === 'visual'} onclick={() => catalog.setResultMode('visual')}>Visual</button>
      <button type="button" data-pom-part="button.surface" data-pom-control-segment="end" aria-pressed={state.resultMode === 'compact'} onclick={() => catalog.setResultMode('compact')}>Compact</button>
    </nav>
    <nav data-pom-control-group="joined" aria-label="Catalog categories">
      <button type="button" data-pom-part="button.surface" data-pom-control-segment={state.categories.length === 0 ? 'only' : 'start'} aria-pressed={state.category === null} onclick={() => catalog.setCategory(null)}>All</button>
      {#each state.categories as category, index}
        <button type="button" data-pom-part="button.surface" data-pom-control-segment={index === state.categories.length - 1 ? 'end' : 'middle'} aria-pressed={state.category === category} onclick={() => catalog.setCategory(category)}>{category}</button>
      {/each}
    </nav>
    <ul aria-live="polite">
      {#each state.results as manifest (manifest.type)}
        <li data-pom-part="row.surface">
          <span>{manifest.title}</span>
          <span>{manifest.catalog?.purpose}</span>
          <button type="button" data-pom-part="button.surface" onclick={() => oncreate(manifest)}>Add {manifest.title}</button>
        </li>
      {/each}
    </ul>
    <p id="widget-catalog-scroll-status" class="catalog-scroll-status">Scroll results · {state.results.length} widgets</p>
  {/if}
</dialog>
