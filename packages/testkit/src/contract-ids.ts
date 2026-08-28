export const FIRST_SLICE_CONTRACT_IDS = Object.freeze([
  'POM-PANEL-07856BFE9A',
  'POM-PANEL-DF4EC7C581',
  'POM-PANEL-0C32491298',
  'POM-PANEL-E6D6A0E64B',
  'POM-PERSIST-842D422EB3',
  'POM-PERSIST-9FA69F9FC1',
  'POM-PERSIST-28DFDC9A8F',
  'POM-PERSIST-D50D69D3C4'
] as const);

export type FirstSliceContractId = typeof FIRST_SLICE_CONTRACT_IDS[number];

export const RENDERER_CONTRACT_IDS = Object.freeze({
  panelTabs: 'POM-RENDER-4E5A79B301',
  panelRelationships: 'POM-RENDER-5F6B8AC412',
  panelActivation: 'POM-RENDER-607C9BD523',
  panelReorder: 'POM-RENDER-718DACF634',
  widgetPlacement: 'POM-RENDER-829EBD0745',
  unavailableRenderer: 'POM-RENDER-93AFCE1856',
  rendererFailure: 'POM-RENDER-A4B0DF2967',
  keyboardFocus: 'POM-RENDER-B5C1E03A78'
} as const);

export type RendererContractId = typeof RENDERER_CONTRACT_IDS[keyof typeof RENDERER_CONTRACT_IDS];
