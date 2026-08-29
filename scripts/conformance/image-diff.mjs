import { PNG } from 'pngjs';

export function createImageDiff(referenceBuffer, actualBuffer) {
  const referenceImage = PNG.sync.read(referenceBuffer);
  const actualImage = PNG.sync.read(actualBuffer);
  const reference = Object.freeze({ width: referenceImage.width, height: referenceImage.height });
  const actual = Object.freeze({ width: actualImage.width, height: actualImage.height });

  if (reference.width !== actual.width || reference.height !== actual.height) {
    return Object.freeze({
      summary: Object.freeze({
        compatible: false,
        reference,
        actual,
        differingPixels: null,
        maximumChannelDelta: null
      })
    });
  }

  const overlayImage = new PNG({ width: reference.width, height: reference.height });
  const diffImage = new PNG({ width: reference.width, height: reference.height });
  let differingPixels = 0;
  let maximumChannelDelta = 0;

  for (let offset = 0; offset < referenceImage.data.length; offset += 4) {
    let pixelDiffers = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const referenceChannel = referenceImage.data[offset + channel];
      const actualChannel = actualImage.data[offset + channel];
      const delta = Math.abs(referenceChannel - actualChannel);
      overlayImage.data[offset + channel] = Math.round((referenceChannel + actualChannel) / 2);
      maximumChannelDelta = Math.max(maximumChannelDelta, delta);
      pixelDiffers ||= delta > 0;
      if (channel < 3) diffImage.data[offset + channel] = delta;
    }
    diffImage.data[offset + 3] = 255;
    if (pixelDiffers) differingPixels += 1;
  }

  return Object.freeze({
    summary: Object.freeze({
      compatible: true,
      reference,
      actual,
      differingPixels,
      maximumChannelDelta
    }),
    overlay: PNG.sync.write(overlayImage),
    diff: PNG.sync.write(diffImage)
  });
}
