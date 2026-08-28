import type { WidgetManifest } from '@pomegranate-ui/contracts';
import { asWidgetType } from '@pomegranate-ui/contracts';
import type { WidgetRegistry } from '@pomegranate-ui/core';
import type {
  WidgetRendererProps,
  WidgetRendererRegistry
} from '@pomegranate-ui/react';

export interface LabHostContext {
  readonly storyId: string;
  readonly systemStatus: string;
}

export const STORY_SUMMARY_TYPE = asWidgetType('story.summary');
export const SYSTEM_STATUS_TYPE = asWidgetType('system.status');

const manifests: readonly WidgetManifest[] = Object.freeze([
  {
    type: STORY_SUMMARY_TYPE,
    version: '1.0.0',
    title: 'Story Summary',
    capabilities: ['story.read'],
    defaultConfiguration: { density: 'compact' },
    defaultPlacement: { kind: 'docked', edge: 'left', shelfId: 'primary' }
  },
  {
    type: SYSTEM_STATUS_TYPE,
    version: '1.0.0',
    title: 'System Status',
    capabilities: ['system.read'],
    defaultConfiguration: { showRevision: true },
    defaultPlacement: { kind: 'docked', edge: 'main', shelfId: 'primary' }
  }
]);

function StorySummary({ hostContext, capabilities }: WidgetRendererProps<LabHostContext>) {
  return (
    <div className="sample-widget">
      <strong>{hostContext.storyId}</strong>
      <span>Capabilities: {capabilities.join(', ')}</span>
      <p>A backend-neutral story projection supplied by the Lab.</p>
    </div>
  );
}

function SystemStatus({ hostContext, instance }: WidgetRendererProps<LabHostContext>) {
  return (
    <div className="sample-widget">
      <strong>{hostContext.systemStatus}</strong>
      <span>Instance: {instance.id}</span>
      <p>The host owns this status; the layout snapshot does not.</p>
    </div>
  );
}

export function registerLabWidgets(
  registry: WidgetRegistry,
  renderers: WidgetRendererRegistry<LabHostContext>
): void {
  for (const manifest of manifests) registry.register(manifest);
  renderers.register(STORY_SUMMARY_TYPE, StorySummary);
  renderers.register(SYSTEM_STATUS_TYPE, SystemStatus);
}
