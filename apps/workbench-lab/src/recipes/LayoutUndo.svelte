<script lang="ts">
  import type { WorkbenchState } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';
  import IconAction from './IconAction.svelte';
  let { store }: { store: WorkbenchStore } = $props();
  let state = $state<WorkbenchState>();
  $effect(() => {
    state = store.getState();
    return store.subscribe((next) => { state = next; });
  });
</script>
<IconAction
  class="layout-undo-action"
  label="Undo layout"
  action="undo-layout"
  disabled={!state || !store.canUndo()}
  onclick={() => store.dispatch({ type: 'layout.undo' })}
/>
