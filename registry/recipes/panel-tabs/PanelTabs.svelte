<script module lang="ts">
  import type { PanelId as ContractPanelId } from '@pomegranate-ui/contracts';

  export type PanelTabContextSource = 'pointer' | 'keyboard';

  export interface PanelTabActivationRequest {
    readonly panelId: ContractPanelId;
    readonly anchor: HTMLElement;
  }

  export interface PanelTabContextRequest extends PanelTabActivationRequest {
    readonly source: PanelTabContextSource;
  }

  export interface PanelTabReorderRequest {
    readonly panelId: ContractPanelId;
    readonly invokingTab: HTMLElement;
  }
</script>

<script lang="ts">
  import { tick } from 'svelte';
  import type { PanelId, WorkbenchState } from '@pomegranate-ui/contracts';
  import { selectPanelTabs, type WorkbenchStore } from '@pomegranate-ui/core';

  let {
    store,
    onactivate,
    oncontextrequest,
    onreorderrequest,
    class: className = ''
  }: {
    store: WorkbenchStore;
    onactivate?: ((request: PanelTabActivationRequest) => void) | undefined;
    oncontextrequest?: ((request: PanelTabContextRequest) => void) | undefined;
    onreorderrequest?: ((request: PanelTabReorderRequest) => void) | undefined;
    class?: string;
  } = $props();

  let workbench = $state<WorkbenchState>();
  let tablist = $state<HTMLElement>();
  $effect(() => {
    const current = store;
    workbench = current.getState();
    return current.subscribe((next) => { workbench = next; });
  });
  const tabs = $derived(workbench ? selectPanelTabs(workbench) : []);

  function tabElement(panelId: PanelId) {
    return tablist?.querySelector<HTMLButtonElement>(
      `[data-pomegranate-panel-tab="${CSS.escape(panelId)}"] [role="tab"]`
    );
  }

  function revealInRail(tab: HTMLElement) {
    if (!tablist) return;
    const railRect = tablist.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const tabLeft = tabRect.left - railRect.left + tablist.scrollLeft;
    const tabRight = tabRect.right - railRect.left + tablist.scrollLeft;
    const maximum = Math.max(0, tablist.scrollWidth - tablist.clientWidth);
    if (tabLeft < tablist.scrollLeft) tablist.scrollLeft = Math.max(0, Math.min(tabLeft, maximum));
    else if (tabRight > tablist.scrollLeft + tablist.clientWidth) {
      tablist.scrollLeft = Math.max(0, Math.min(tabRight - tablist.clientWidth, maximum));
    }
  }

  function reveal(panelId: PanelId, focus = false) {
    void tick().then(() => {
      const tab = tabElement(panelId);
      if (!tab) return;
      if (focus) tab.focus();
      revealInRail(tab);
    });
  }

  function activate(panelId: PanelId, anchor: HTMLElement, focus = false) {
    if (onactivate) onactivate({ panelId, anchor });
    else store.dispatch({ type: 'panel.activate', panelId });
    reveal(panelId, focus);
  }

  function context(event: MouseEvent | KeyboardEvent, panelId: PanelId, source: PanelTabContextSource) {
    if (!oncontextrequest) return;
    event.preventDefault();
    const tab = tabs.find((candidate) => candidate.panelId === panelId);
    if (!tab) return;
    oncontextrequest?.({ panelId: tab.panelId, anchor: event.currentTarget as HTMLElement, source });
  }

  function focusAndActivate(index: number) {
    if (!tabs.length) return;
    const wrapped = (index + tabs.length) % tabs.length;
    const tab = tabs[wrapped];
    const anchor = tab ? tabElement(tab.panelId) : undefined;
    if (tab && anchor) activate(tab.panelId, anchor, true);
  }

  function handleKey(event: KeyboardEvent, panelId: PanelId, index: number) {
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      context(event, panelId, 'keyboard');
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusAndActivate(event.key === 'Home' ? 0 : tabs.length - 1);
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    focusAndActivate(index + (event.key === 'ArrowLeft' ? -1 : 1));
  }

  function requestReorder(event: MouseEvent) {
    const active = tabs.find((tab) => tab.selected) ?? tabs[0];
    if (!active || !onreorderrequest) return;
    onreorderrequest({
      panelId: active.panelId,
      invokingTab: tabElement(active.panelId) ?? event.currentTarget as HTMLElement
    });
  }
</script>

<div class="panel-tab-rail-shell" data-tab-rail-shell style="min-width: 0; width: 100%; height: 100%;">
  <div
    bind:this={tablist}
    class={className}
    data-tab-rail-scroll
    role="tablist"
    aria-label="Panels"
    tabindex="-1"
    style="width: 100%; height: 100%; overflow-x: auto; scrollbar-width: none;"
  >
    {#each tabs as tab, index (tab.panelId)}
      <div data-pomegranate-panel-tab={tab.panelIdAttribute}>
        <button
          type="button"
          data-pom-part="button.surface"
          role="tab"
          id={tab.tabId}
          aria-controls={tab.surfaceId}
          aria-selected={tab.selected}
          aria-describedby="panel-tab-options-description"
          aria-keyshortcuts="Shift+F10"
          tabindex={tab.selected ? 0 : -1}
          onclick={(event) => activate(tab.panelId, event.currentTarget)}
          onfocus={() => reveal(tab.panelId)}
          onkeydown={(event) => handleKey(event, tab.panelId, index)}
          oncontextmenu={(event) => context(event, tab.panelId, 'pointer')}
          ondragstart={(event) => event.preventDefault()}
        >{tab.name}</button>
      </div>
    {/each}
  </div>
  <span data-tab-rail-edge="before" aria-hidden="true"></span>
  <span data-tab-rail-edge="after" aria-hidden="true"></span>
</div>
<span id="panel-tab-options-description" class="visually-hidden">Right-click or press Shift+F10 for tab options.</span>

{#if onreorderrequest}
  <button
    class="panel-tabs-reorder"
    type="button"
    data-pom-part="button.surface"
    data-tab-order-trigger
    onclick={requestReorder}
  >Reorder Panels</button>
{/if}
