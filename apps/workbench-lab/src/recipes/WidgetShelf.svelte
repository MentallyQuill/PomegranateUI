<script lang="ts">
  import type { WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectPanelSurface, type WorkbenchStore } from '@pomegranate-ui/core';
  let { store }: { store: WorkbenchStore } = $props();
  let state = $state<WorkbenchState>();
  $effect(() => {
    state = store.getState();
    return store.subscribe((next) => { state = next; });
  });
  const surface = $derived(state ? selectPanelSurface(state, store.registry, store.templates) : null);
  function location(frame: NonNullable<typeof surface>['widgetShelf'][number]) {
    if (frame.placement.kind !== 'shelved') return '';
    const last = frame.placement.lastVisible;
    return last.kind === 'floating' ? 'Floating layer' : `${last.regionId} / ${last.shelfId}`;
  }
</script>

<details class="widget-shelf" data-widget-shelf data-empty={(surface?.widgetShelf.length ?? 0) === 0}>
  <summary aria-label="Open Widget Shelf" data-pom-icon-action data-pom-action="open-shelf">
    <span data-pom-action-icon aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M4 7h16v12H4zM3 4h18v3H3zM9 11h6" /></svg>
    </span>
    <span data-pom-action-label>Widget Shelf</span>
    <span class="widget-shelf-count">{surface?.widgetShelf.length ?? 0}</span>
  </summary>
  <div>
    {#if surface?.widgetShelf.length}
      {#each surface.widgetShelf as frame (frame.instanceId)}
        <article>
          <span><strong>{frame.title}</strong><small>{location(frame)}</small></span>
          <button type="button" onclick={() => store.dispatch({ type: 'widget.restore', instanceId: frame.instanceId })}>Restore</button>
          <button type="button" onclick={() => window.confirm(`Delete ${frame.title}?`) && store.dispatch({ type: 'widget.delete', instanceId: frame.instanceId })}>Delete</button>
        </article>
      {/each}
    {:else}
      <p>No shelved Widgets in this Panel.</p>
    {/if}
  </div>
</details>
