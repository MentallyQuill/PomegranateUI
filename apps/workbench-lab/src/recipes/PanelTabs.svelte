<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import type { PanelId, WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectPanelTabs, type WorkbenchStore } from '@pomegranate-ui/core';
  import PanelMenu from './PanelMenu.svelte';
  import { createTabReorderController } from './TabReorderController.js';

  let {
    store,
    onaddsubpanel,
    class: className = ''
  }: {
    store: WorkbenchStore;
    onaddsubpanel?: ((panelId: PanelId) => void) | undefined;
    class?: string;
  } = $props();

  let workbench = $state<WorkbenchState>();
  $effect(() => {
    const current = store;
    workbench = current.getState();
    return current.subscribe((next) => { workbench = next; });
  });
  const tabs = $derived(workbench ? selectPanelTabs(workbench) : []);
  let tablist = $state<HTMLElement>();

  function activate(panelId: PanelId) {
    store.dispatch({ type: 'panel.activate', panelId });
  }

  function reorder(panelId: PanelId, toIndex: number) {
    store.dispatch({ type: 'panel.reorder', panelId, toIndex });
  }

  const drag = createTabReorderController({
    getItems: () => tabs.flatMap((tab) => {
      const element = tablist?.querySelector<HTMLElement>(`[data-pomegranate-panel-tab="${CSS.escape(tab.panelIdAttribute)}"]`);
      return element ? [{ id: tab.panelId, element }] : [];
    }),
    commit: (panelId, toIndex) => reorder(panelId as PanelId, toIndex)
  });
  onDestroy(drag.destroy);

  function focusAndActivate(index: number) {
    const wrapped = (index + tabs.length) % tabs.length;
    const tab = tabs[wrapped];
    if (!tab) return;
    activate(tab.panelId);
    void tick().then(() => tablist?.querySelector<HTMLButtonElement>(`#${CSS.escape(tab.tabId)}`)?.focus());
  }

  function handleKey(event: KeyboardEvent, panelId: PanelId, index: number) {
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusAndActivate(event.key === 'Home' ? 0 : tabs.length - 1);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const offset = event.key === 'ArrowLeft' ? -1 : 1;
    if (event.ctrlKey && event.shiftKey) {
      const toIndex = Math.max(0, Math.min(tabs.length - 1, index + offset));
      reorder(panelId, toIndex);
      void tick().then(() => tablist?.querySelector<HTMLButtonElement>(`[data-pomegranate-panel-tab="${CSS.escape(panelId)}"] [role="tab"]`)?.focus());
      return;
    }
    focusAndActivate(index + offset);
  }
</script>

<div bind:this={tablist} class={className} role="tablist" aria-label="Panels">
  {#each tabs as tab, index (tab.panelId)}
    <div data-pomegranate-panel-tab={tab.panelIdAttribute} data-tab-reorder-item>
      <button
        type="button"
        data-pom-part="button.surface"
        data-tab-touch-reorder-grip
        role="tab"
        id={tab.tabId}
        aria-controls={tab.surfaceId}
        aria-selected={tab.selected}
        tabindex={tab.selected ? 0 : -1}
        onclick={() => { if (!drag.consumeClick()) activate(tab.panelId); }}
        onkeydown={(event) => handleKey(event, tab.panelId, index)}
        onpointerdown={(event) => drag.pointerDown(event, tab.panelId)}
        onpointermove={drag.pointerMove}
        onpointerup={drag.pointerUp}
        onpointercancel={drag.pointerCancel}
      >{tab.name}</button>
      {#each workbench?.panels.filter((panel) => panel.id === tab.panelId) ?? [] as panel (panel.id)}
        <PanelMenu
          {panel}
          {store}
          onaddsubpanel={() => onaddsubpanel?.(tab.panelId)}
        />
      {/each}
    </div>
  {/each}
</div>
