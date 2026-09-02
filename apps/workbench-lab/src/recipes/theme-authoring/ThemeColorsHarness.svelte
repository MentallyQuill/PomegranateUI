<script lang="ts">
  import type { LabThemeController, ThemeDraftEditResult, ThemeDraftSaveResult } from '../../themes/controller.js';
  import CustomTheme from './CustomTheme.svelte';
  import ThemeColors from './ThemeColors.svelte';
  import type { EyeDropperPort, ThemeAuthoringPort } from './types.js';

  let { controller, eyedropper }: { controller: LabThemeController; eyedropper: EyeDropperPort } = $props();
  // svelte-ignore state_referenced_locally -- the harness intentionally snapshots its fixed controller prop
  let authoring = $state(controller.getAuthoringSnapshot());

  function use(result: ThemeDraftEditResult): ThemeDraftEditResult {
    authoring = result.authoring;
    return result;
  }

  const theme: ThemeAuthoringPort = $derived({
    authoring,
    editDraft: (next: unknown) => use(controller.editDraft(next)),
    editColorHex: (role, value) => use(controller.editColorHex(role, value)),
    editColorRgb: (role, channel, value) => use(controller.editColorRgb(role, channel, value)),
    resetDraft: () => use(controller.resetDraft()),
    saveDraft: async (): Promise<ThemeDraftSaveResult> => {
      const pending = controller.saveDraft();
      authoring = controller.getAuthoringSnapshot();
      const result = await pending;
      authoring = result.authoring;
      return result;
    }
  });
</script>

<section aria-label="Primary colors"><ThemeColors {theme} {eyedropper} /></section>
<section aria-label="Secondary colors"><ThemeColors {theme} {eyedropper} /></section>
<section aria-label="Theme overview"><CustomTheme {theme} /></section>
