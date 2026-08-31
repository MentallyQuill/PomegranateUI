import type { WidgetType } from '@pomegranate-ui/contracts';

const LAB_WIDGET_TITLES: Readonly<Record<string, string>> = Object.freeze({
  'story.characters': 'Characters (Story)',
  'story.personas': 'Personas',
  'settings.connections': 'AI Connections',
  'settings.custom-theme': 'Custom Theme'
});

const LAB_WIDGET_METADATA: Readonly<Record<string, string>> = Object.freeze({
  'story.characters': '4 / 7',
  'systems.world-state': 'Frame 3',
  'settings.connections': 'Ready',
  'settings.custom-theme': 'Ready'
});

export function resolveLabWidgetTitle(type: WidgetType, fallback: string): string {
  return LAB_WIDGET_TITLES[type] ?? fallback;
}

export function resolveLabWidgetMeta(type: WidgetType): string | undefined {
  return LAB_WIDGET_METADATA[type];
}
