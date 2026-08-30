<script lang="ts">
  import type { PanelId, WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectPanelTabs, type WorkbenchStore } from '@pomegranate-ui/core';
  import PanelMenu from './PanelMenu.svelte';

  let {
    store,
    class: className = ''
  }: {
    store: WorkbenchStore;
    class?: string;
  } = $props();

  let state = $state<WorkbenchState>();
  $effect(() => {
    const current = store;
    state = current.getState();
    return current.subscribe((next) => { state = next; });
  });
  const tabs = $derived(state ? selectPanelTabs(state) : []);

  function activate(panelId: PanelId) {
    store.dispatch({ type: 'panel.activate', panelId });
  }

  function reorder(panelId: PanelId, toIndex: number) {
    store.dispatch({ type: 'panel.reorder', panelId, toIndex });
  }

  function handleKey(event: KeyboardEvent, panelId: PanelId, index: number) {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const offset = event.key === 'ArrowLeft' ? -1 : 1;
    reorder(panelId, Math.max(0, Math.min(tabs.length - 1, index + offset)));
  }
</script>

<div class={className} role="tablist" aria-label="Panels">
  {#each tabs as tab, index (tab.panelId)}
    <div data-pomegranate-panel-tab={tab.panelIdAttribute}>
      <button
        type="button"
        data-pom-part="button.surface"
        role="tab"
        id={tab.tabId}
        aria-controls={tab.surfaceId}
        aria-selected={tab.selected}
        tabindex={tab.selected ? 0 : -1}
        onclick={() => activate(tab.panelId)}
        onkeydown={(event) => handleKey(event, tab.panelId, index)}
      >{tab.name}</button>
      <button
        type="button"
        data-pom-part="button.icon"
        aria-label={`Move ${tab.name} left`}
        disabled={tab.moveLeftDisabled}
        onclick={() => reorder(tab.panelId, index - 1)}
      >←</button>
      <button
        type="button"
        data-pom-part="button.icon"
        aria-label={`Move ${tab.name} right`}
        disabled={tab.moveRightDisabled}
        onclick={() => reorder(tab.panelId, index + 1)}
      >→</button>
      {#each state?.panels.filter((panel) => panel.id === tab.panelId) ?? [] as panel (panel.id)}
        <PanelMenu {panel} {store} />
      {/each}
    </div>
  {/each}
</div>
