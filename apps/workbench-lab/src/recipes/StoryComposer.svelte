<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: {
    children: Snippet;
  } = $props();
</script>

<section class="story-composer" data-story-composer aria-label="Story composer instrument">
  {@render children()}
</section>
