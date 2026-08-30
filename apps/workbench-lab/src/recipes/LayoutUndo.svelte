<script lang="ts">
  import type { WorkbenchState } from '@pomegranate-ui/contracts';
  import type { WorkbenchStore } from '@pomegranate-ui/core';
  let { store }: { store: WorkbenchStore } = $props();
  let state = $state<WorkbenchState>();
  $effect(() => {
    state = store.getState();
    return store.subscribe((next) => { state = next; });
  });
</script>
<button type="button" data-layout-undo disabled={!state || !store.canUndo()} onclick={() => store.dispatch({ type: 'layout.undo' })}>Undo layout</button>
