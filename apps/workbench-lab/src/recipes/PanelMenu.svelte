<script lang="ts">
  import type { PanelState } from '@pomegranate-ui/contracts';
  import { asPanelId, asWidgetInstanceId } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';
  let {
    panel,
    store,
    moveLeft,
    moveRight,
    moveLeftDisabled = false,
    moveRightDisabled = false
  }: {
    panel: PanelState;
    store: WorkbenchStore;
    moveLeft: () => void;
    moveRight: () => void;
    moveLeftDisabled?: boolean;
    moveRightDisabled?: boolean;
  } = $props();
  let name = $state('');
  $effect(() => { name = panel.name; });

  function duplicate() {
    const state = store.getState();
    const suffix = state.revision + 1;
    const widgetIds: Record<string, ReturnType<typeof asWidgetInstanceId>> = {};
    const shelfIds: Record<string, string> = {};
    const groupIds: Record<string, string> = {};
    for (const shelf of state.shelves.filter((candidate) => candidate.panelId === panel.id)) shelfIds[shelf.id] = `${shelf.id}-copy-${suffix}`;
    for (const [instanceId, placement] of Object.entries(state.placements)) {
      if (placement.panelId !== panel.id) continue;
      widgetIds[instanceId] = asWidgetInstanceId(`${instanceId}-copy-${suffix}`);
      const visible = placement.kind === 'shelved' ? placement.lastVisible : placement;
      if (visible.kind === 'docked' && visible.group) groupIds[visible.group.id] = `${visible.group.id}-copy-${suffix}`;
    }
    store.dispatch({
      type: 'panel.duplicate', panelId: panel.id, name: `${panel.name} Copy`,
      ids: { panelId: asPanelId(`panel-copy-${suffix}`), shelfIds, widgetIds, groupIds }
    });
  }

  function destructive(type: 'panel.clear' | 'panel.delete') {
    if (window.confirm(`${type === 'panel.clear' ? 'Clear' : 'Delete'} ${panel.name}?`)) store.dispatch({ type, panelId: panel.id });
  }
</script>

<details class="panel-menu">
  <summary aria-label={`Manage ${panel.name}`}>•••</summary>
  <div role="group" aria-label={`${panel.name} Panel actions`}>
    <button type="button" aria-label={`Move ${panel.name} left`} disabled={moveLeftDisabled} onclick={moveLeft}>Move left</button>
    <button type="button" aria-label={`Move ${panel.name} right`} disabled={moveRightDisabled} onclick={moveRight}>Move right</button>
    <label>Panel name<input bind:value={name} /></label>
    <button type="button" onclick={() => store.dispatch({ type: 'panel.rename', panelId: panel.id, name: name.trim() || panel.name })}>Rename</button>
    <button type="button" onclick={duplicate}>Duplicate</button>
    <button type="button" onclick={() => store.dispatch({ type: 'panel.reset', panelId: panel.id })}>Reset</button>
    <button type="button" onclick={() => destructive('panel.clear')}>Clear</button>
    <button type="button" onclick={() => destructive('panel.delete')}>Delete</button>
  </div>
</details>
