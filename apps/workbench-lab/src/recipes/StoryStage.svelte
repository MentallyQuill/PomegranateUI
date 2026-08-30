<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<section class="story-stage" data-story-stage aria-label="Story reading stage">
  {@render children()}
</section>
