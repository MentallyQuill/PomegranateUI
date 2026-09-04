<script lang="ts">
  import type { Snippet } from 'svelte';

  let { storyTitle, currentScene, children }: {
    storyTitle: string;
    currentScene: string;
    children: Snippet;
  } = $props();
</script>

<section class="story-stage" data-story-stage aria-label="Story reading stage">
  <header class="story-context-heading">
    <h1>{storyTitle}</h1>
    <p><span class="visually-hidden">Current scene:</span>{' '}{currentScene}</p>
  </header>
  {@render children()}
</section>
