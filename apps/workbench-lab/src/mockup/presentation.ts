import type { WidgetType } from '@pomegranate-ui/contracts';

const LAB_WIDGET_TITLES: Readonly<Record<string, string>> = Object.freeze({
  'story.characters': 'Characters',
  'story.room-ambience': 'Scene Effects',
  'story.personas': 'Personas',
  'settings.connections': 'AI Connections',
  'settings.custom-theme': 'Custom Theme'
});

export function resolveLabWidgetTitle(type: WidgetType, fallback: string): string {
  return LAB_WIDGET_TITLES[type] ?? fallback;
}
