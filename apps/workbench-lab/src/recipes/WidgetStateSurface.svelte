<script lang="ts">
  import { SURFACE_STATE_COPY, type SurfaceState } from '../mockup/surface-fixtures.js';

  let { state }: { state: SurfaceState } = $props();
  const copy = $derived(state === 'ready' ? null : SURFACE_STATE_COPY[state]);
</script>

{#if copy}
  <section
    class="surface-state"
    class:is-busy={state === 'loading' || state === 'saving' || state === 'running'}
    class:is-warning={state === 'stale' || state === 'dirty' || state === 'review' || state === 'partial'}
    class:is-danger={state === 'failure' || state === 'conflict' || state === 'refused'}
    data-pom-part="row.surface"
    aria-live="polite"
    aria-busy={state === 'loading' || state === 'saving' || state === 'running'}
    role={state === 'failure' || state === 'conflict' ? 'alert' : 'status'}
  >
    <span aria-hidden="true"></span>
    <div><strong>{copy[0]}</strong><small>{copy[1]}</small></div>
  </section>
{/if}
