<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte';
  import type { WidgetManifest, WidgetShape } from '@pomegranate-ui/contracts';
  import type { CatalogController, CatalogState, CatalogUtility } from '@pomegranate-ui/core';
  import type { WidgetRendererRegistry } from '@pomegranate-ui/svelte';
  import type { LabHostContext } from '../mockup/host-context.js';
  import {
    catalogPreviewLabel,
    createCatalogGridController,
    type CatalogGridController
  } from './CatalogGridController.js';
  import CatalogWidgetPreview from './CatalogWidgetPreview.svelte';

  let {
    catalog,
    rendererRegistry,
    hostContext,
    instanceCounts = {},
    oncreate,
    onplace,
    class: className = ''
  }: {
    catalog: CatalogController;
    rendererRegistry: WidgetRendererRegistry<LabHostContext>;
    hostContext: LabHostContext;
    instanceCounts?: Readonly<Record<string, number>>;
    oncreate: (manifest: WidgetManifest) => void;
    onplace?: (manifest: WidgetManifest, result: HTMLElement) => void;
    class?: string;
  } = $props();

  const categories = [
    ['story', 'Story'],
    ['library', 'Library'],
    ['systems', 'Systems'],
    ['settings', 'Settings'],
    ['extensions', 'Extensions']
  ] as const;
  const utilities: readonly [CatalogUtility, string][] = [
    ['favorites', 'Favorites'],
    ['recent', 'Recent'],
    ['on-panel', 'On this Panel'],
    ['fits-layout', 'Fits this layout']
  ];

  let catalogSnapshot: CatalogState | undefined = $state();
  let dialog: HTMLDialogElement;
  let searchInput: HTMLInputElement | undefined = $state();
  let resultsElement: HTMLElement | undefined = $state();
  let gridController: CatalogGridController | undefined;
  let returnFocus: HTMLElement | null = null;

  const getResults = () => resultsElement
    ? [...resultsElement.querySelectorAll<HTMLElement>(':scope > [data-catalog-result]')]
    : [];

  $effect(() => {
    const current = catalog;
    catalogSnapshot = current.getState();
    return current.subscribe((next) => { catalogSnapshot = next; });
  });

  $effect(() => {
    if (!dialog || !catalogSnapshot) return;
    if (catalogSnapshot.open && !dialog.open) {
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      void tick().then(() => {
        searchInput?.focus({ preventScroll: true });
        gridController?.sync();
      });
    }
    if (!catalogSnapshot.open && dialog.open) {
      dialog.close();
      const target = returnFocus;
      returnFocus = null;
      void tick().then(() => target?.focus({ preventScroll: true }));
    }
  });

  $effect(() => {
    if (!catalogSnapshot?.open) return;
    catalogSnapshot.results;
    catalogSnapshot.resultMode;
    catalogSnapshot.previewWidth;
    void tick().then(() => gridController?.sync());
  });

  onMount(() => {
    gridController = createCatalogGridController({
      getScrollElement: () => resultsElement ?? null,
      getResults,
      getPreviewWidth: () => catalogSnapshot?.resultMode === 'compact' ? 420 : catalogSnapshot?.previewWidth ?? 286,
      getResultKey: (result) => result.dataset.widgetType ?? '',
      getResultShape: (result) => (result.dataset.previewShape ?? 'medium') as WidgetShape,
      getResultMeasureElement: (result) => result.querySelector('[data-catalog-result-content]') ?? result
    });
    gridController.sync();
  });
  onDestroy(() => gridController?.destroy());

  async function restack(update: () => void) {
    const anchor = gridController?.captureAnchor() ?? null;
    update();
    await tick();
    gridController?.sync();
    requestAnimationFrame(() => gridController?.restoreAnchor(anchor));
  }

  function closeCatalog() {
    catalog.close();
  }

  function toggleUtility(utility: CatalogUtility) {
    const current = catalogSnapshot?.utility;
    void restack(() => catalog.setUtility(current === utility ? null : utility));
  }

  function cancel(event: Event) {
    event.preventDefault();
    closeCatalog();
  }

  function handleDialogKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    closeCatalog();
  }

  function activateResult(event: MouseEvent | KeyboardEvent, manifest: WidgetManifest, unavailable: boolean) {
    if (unavailable) return;
    if (event instanceof KeyboardEvent && event.key !== 'Enter') return;
    const result = event.currentTarget as HTMLElement;
    if (onplace) onplace(manifest, result);
    else oncreate(manifest);
  }
</script>

<dialog
  bind:this={dialog}
  class={className}
  aria-label="Widget Catalog"
  aria-describedby="widget-catalog-scroll-status"
  data-pom-part="dialog.surface"
  data-presentation={catalogSnapshot?.presentation}
  data-result-mode={catalogSnapshot?.resultMode}
  oncancel={cancel}
  onkeydown={handleDialogKeydown}
>
  {#if catalogSnapshot?.open}
    <header class="catalog-head" data-pom-part="widget.header">
      <div class="catalog-title">
        <h2>Widget Catalog</h2>
        <span>Build this Panel</span>
      </div>
      <button class="catalog-close" type="button" data-pom-part="button.icon" aria-label="Close Widget Catalog" onclick={closeCatalog}><span aria-hidden="true">×</span></button>
    </header>

    <div class="catalog-search-row">
      <label class="visually-hidden" for="widget-catalog-search">Search Widgets</label>
      <input
        bind:this={searchInput}
        class="catalog-search"
        id="widget-catalog-search"
        type="search"
        data-pom-part="field.surface"
        placeholder="Search widgets…"
        autocomplete="off"
        value={catalogSnapshot.query}
        oninput={(event) => void restack(() => catalog.setQuery(event.currentTarget.value))}
      />
      {#if catalogSnapshot.resultMode === 'visual'}
        <label class="catalog-preview-control">
          <span>Preview size</span>
          <output class="catalog-preview-output" for="widget-catalog-preview-scale">{catalogPreviewLabel(catalogSnapshot.previewWidth)} · {catalogSnapshot.previewWidth} px</output>
          <input
            class="catalog-preview-scale"
            id="widget-catalog-preview-scale"
            type="range"
            min="200"
            max="420"
            step="1"
            value={catalogSnapshot.previewWidth}
            list="widget-catalog-preview-detents"
            aria-label="Preview size"
            aria-valuetext={`${catalogPreviewLabel(catalogSnapshot.previewWidth)} preview, ${catalogSnapshot.previewWidth} pixels`}
            oninput={(event) => void restack(() => catalog.setPreviewWidth(Number(event.currentTarget.value)))}
          />
          <datalist id="widget-catalog-preview-detents">
            <option value="200" label="Small"></option>
            <option value="286" label="Medium"></option>
            <option value="420" label="Large"></option>
          </datalist>
        </label>
      {/if}
      <div class="catalog-view" role="group" aria-label="Catalog view">
        <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.resultMode === 'visual'} onclick={() => void restack(() => catalog.setResultMode('visual'))}>Visual</button>
        <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.resultMode === 'compact'} onclick={() => void restack(() => catalog.setResultMode('compact'))}>Compact</button>
      </div>
    </div>

    <div class="catalog-filter-strip">
      <nav class="catalog-filters" aria-label="Widget categories">
        <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.category === null} onclick={() => void restack(() => catalog.setCategory(null))}>All</button>
        {#each categories as category (category[0])}
          <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.category === category[0]} onclick={() => void restack(() => catalog.setCategory(category[0]))}>{category[1]}</button>
        {/each}
      </nav>
      <div class="catalog-utilities" role="group" aria-label="Catalog filters">
        {#each utilities as utility (utility[0])}
          <button type="button" data-pom-part="button.surface" aria-pressed={catalogSnapshot.utility === utility[0]} onclick={() => toggleUtility(utility[0])}>{utility[1]}</button>
        {/each}
      </div>
    </div>

    <div class="active-catalog-filter" hidden data-active-catalog-filter></div>

    <div
      bind:this={resultsElement}
      class="catalog-results"
      data-catalog-results
      data-catalog-view={catalogSnapshot.resultMode}
      aria-live="polite"
    >
      {#if catalogSnapshot.results.length === 0}
        <p class="catalog-empty">No Widgets match these filters.</p>
      {:else}
        {#each catalogSnapshot.results as manifest (manifest.type)}
          {@const count = instanceCounts[manifest.type] ?? 0}
          {@const unavailable = count > 0 && manifest.catalog?.multiplicity === 'single'}
          <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role (source-faithful whole-result placement affordance contains an inert real renderer) -->
          <article
            class:catalog-result-compact={catalogSnapshot.resultMode === 'compact'}
            class:is-on-panel={unavailable}
            data-catalog-result
            data-widget-type={manifest.type}
            data-widget-category={manifest.catalog?.category}
            data-preview-shape={manifest.catalog?.shape}
            data-pom-part="row.surface"
            role="button"
            tabindex="0"
            aria-disabled={unavailable}
            aria-label={unavailable ? `${manifest.title}, already on this Panel` : `${manifest.title}, place on this Panel`}
            onclick={(event) => activateResult(event, manifest, unavailable)}
            onkeydown={(event) => activateResult(event, manifest, unavailable)}
          >
            <div class="catalog-result-content" data-catalog-result-content>
              {#if catalogSnapshot.resultMode === 'compact'}
                <span class="catalog-compact-sample" aria-hidden="true"></span>
                <span class="catalog-compact-copy"><strong>{manifest.title}</strong><span>{manifest.catalog?.category} · {manifest.catalog?.shape}</span></span>
                <span class="catalog-compact-state">{unavailable ? 'On Panel' : 'Place'}</span>
              {:else}
                <div class="catalog-widget-identity">
                  <strong>{manifest.title}</strong>
                  <span>{manifest.catalog?.purpose}</span>
                </div>
                <CatalogWidgetPreview {manifest} {rendererRegistry} {hostContext} />
                {#if count > 0}<span class="catalog-instance-state">{manifest.catalog?.multiplicity === 'single' ? 'On Panel' : `${count} here`}</span>{/if}
                {#if !unavailable}<span class="catalog-drag-hint">Place on Panel</span>{/if}
              {/if}
            </div>
          </article>
        {/each}
      {/if}
    </div>

    <footer class="catalog-foot" id="widget-catalog-scroll-status"><span>{catalogSnapshot.results.length} widget{catalogSnapshot.results.length === 1 ? '' : 's'}</span><span>Strictly active story</span></footer>
  {/if}
</dialog>
