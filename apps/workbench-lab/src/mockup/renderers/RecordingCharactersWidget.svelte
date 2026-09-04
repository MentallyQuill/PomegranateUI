<script lang="ts">
  import type { LabCharacterPortraitAtlas } from '../showcase-media.js';

  let { portraitAtlas, portraits }: {
    portraitAtlas?: LabCharacterPortraitAtlas | undefined;
    portraits?: readonly [string, string, string, string] | undefined;
  } = $props();
  let portraitScale = $state(2);
  let expandedCharacter = $state<string | null>(null);

  const characters = [
    {
      initials: 'AR',
      name: 'Aven Rook',
      synopsis: 'Aven is a measured traveler attuned to patterns beneath the waterline. He is following the warning that drew the cast toward the reservoir.'
    },
    {
      initials: 'MV',
      name: 'Mara Venn',
      synopsis: 'Mara is a cartographer whose voice reached Aven through the glass. Her warning about the reservoir bell still guides his search.'
    },
    {
      initials: 'IL',
      name: 'Ilex',
      synopsis: 'Ilex is a signal operator Aven has encountered. Their interrupted transmission remains unexplained.'
    },
    {
      initials: 'QD',
      name: 'The Quiet Diver',
      synopsis: 'The Quiet Diver is a masked figure encountered during the descent. Their identity and intentions remain unknown.'
    }
  ] as const;

  function changePortraitScale(delta: number) {
    portraitScale = Math.max(1, Math.min(3, portraitScale + delta));
  }

  function toggleCharacter(name: string) {
    expandedCharacter = expandedCharacter === name ? null : name;
  }
</script>

<section class="recording-characters" aria-label="Characters">
  <header>
    <span>Story cast</span>
    <div data-pom-control-group="joined" role="group" aria-label="Character portrait size">
      <button
        type="button"
        data-pom-part="button.icon"
        data-pom-control-segment="start"
        aria-label="Decrease character portrait size"
        disabled={portraitScale === 1}
        onclick={() => changePortraitScale(-1)}
      >−</button>
      <button
        type="button"
        data-pom-part="button.icon"
        data-pom-control-segment="end"
        aria-label="Increase character portrait size"
        disabled={portraitScale === 3}
        onclick={() => changePortraitScale(1)}
      >+</button>
    </div>
  </header>

  <ul aria-label="Characters roster" data-portrait-scale={portraitScale}>
    {#each characters as character, index (character.name)}
      <li
        class:is-current={index === 0}
        class:is-expanded={expandedCharacter === character.name}
        data-pom-part="row.surface"
      >
        <button
          type="button"
          class="recording-character-toggle"
          aria-label={character.name}
          aria-expanded={expandedCharacter === character.name}
          aria-controls={expandedCharacter === character.name ? `character-details-${index}` : undefined}
          onclick={() => toggleCharacter(character.name)}
        >
          {#if portraitScale > 1}
            <span class="recording-character-portrait" data-character-portrait>
              {#if portraits?.[index]}
                <img class="is-direct" src={portraits[index]} alt={`Portrait of ${character.name}`} />
              {:else if portraitAtlas}
                <img
                  src={portraitAtlas.source}
                  alt={`Portrait of ${character.name}`}
                  style={`--portrait-column:${index % portraitAtlas.columns};--portrait-row:${Math.floor(index / portraitAtlas.columns)}`}
                />
              {:else}
                <span class="recording-character-fallback" role="img" aria-label={`Portrait of ${character.name}`}>
                  {character.initials}
                </span>
              {/if}
            </span>
          {/if}
          <span class="recording-character-copy">
            <strong>{character.name}</strong>
          </span>
        </button>
        {#if expandedCharacter === character.name}
          <div class="recording-character-synopsis" id={`character-details-${index}`}>
            <p>{character.synopsis}</p>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</section>
