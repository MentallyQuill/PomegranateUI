export interface LabHostContext {
  readonly storyId: string;
  readonly storyTitle: string;
  readonly frameLabel: string;
  readonly location: string;
  readonly timeLabel: string;
  readonly systemStatus: string;
}

export const LAB_HOST_CONTEXT: LabHostContext = Object.freeze({
  storyId: 'story-lab-reservoir',
  storyTitle: 'The Reservoir at Blue Hour',
  frameLabel: 'Present frame · Turn 42',
  location: 'Reservoir Concourse',
  timeLabel: 'Blue hour · rain easing',
  systemStatus: 'Local fixture ready'
});
