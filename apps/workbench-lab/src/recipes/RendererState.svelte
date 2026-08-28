<script lang="ts">
  let {
    title,
    state,
    onretry
  }: {
    title: string;
    state: 'unavailable' | 'failed';
    onretry?: () => void;
  } = $props();
</script>

{#if state === 'unavailable'}
  <p role="status" aria-label={`${title} renderer unavailable`}>
    Renderer unavailable for {title}.
  </p>
{:else}
  <div role="alert" aria-label={`${title} renderer failed`}>
    <p>{title} failed to render.</p>
    {#if onretry}<button type="button" onclick={onretry}>Retry {title}</button>{/if}
  </div>
{/if}
