import type { JsonObject } from '@pomegranate-ui/contracts';

export interface SonderShapedProjection extends JsonObject {
  readonly active_story_id: string;
  readonly capabilities: readonly string[];
}

export interface PomegranateHostContext {
  readonly storyId: string;
  readonly capabilities: readonly string[];
}

export function adaptSonderProjection(source: SonderShapedProjection): PomegranateHostContext {
  return Object.freeze({
    storyId: source.active_story_id,
    capabilities: Object.freeze([...source.capabilities])
  });
}
