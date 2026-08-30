<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<section class="story-composer" data-story-composer data-pom-part="widget.content" aria-label="Story composer instrument">
  {@render children()}
</section>
