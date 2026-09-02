import type { WidgetType } from '@pomegranate-ui/contracts';

const LAB_WIDGET_TITLES: Readonly<Record<string, string>> = Object.freeze({
  'story.characters': 'Characters (Story)',
  'story.personas': 'Personas',
  'settings.connections': 'AI Connections',
  'settings.custom-theme': 'Custom Theme',
  'settings.theme-colors': 'Theme Colors',
  'settings.theme-materials': 'Theme Materials',
  'settings.theme-canvas': 'Theme Canvas',
  'settings.theme-ambient': 'Ambient Light'
});

const LAB_WIDGET_METADATA: Readonly<Record<string, string>> = Object.freeze({
  'story.characters': '4 / 7',
  'systems.world-state': 'Frame 3',
  'settings.connections': 'Ready',
  'settings.custom-theme': 'Ready',
  'settings.theme-colors': 'Ready',
  'settings.theme-materials': 'Ready',
  'settings.theme-canvas': 'Ready',
  'settings.theme-ambient': 'Ready'
});

export function resolveLabWidgetTitle(type: WidgetType, fallback: string): string {
  return LAB_WIDGET_TITLES[type] ?? fallback;
}

export function resolveLabWidgetMeta(type: WidgetType): string | undefined {
  return LAB_WIDGET_METADATA[type];
}
