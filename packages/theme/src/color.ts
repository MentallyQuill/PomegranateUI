const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export interface HsvColor {
  readonly hue: number;
  readonly saturation: number;
  readonly value: number;
}

function parseHex(hex: string): readonly [number, number, number] {
  if (!HEX_COLOR.test(hex)) throw new TypeError(`Expected an exact #RRGGBB color, received '${hex}'.`);
  return [
    Number.parseInt(hex.slice(1, 3), 16),
    Number.parseInt(hex.slice(3, 5), 16),
    Number.parseInt(hex.slice(5, 7), 16)
  ];
}

function channel(value: number): string {
  return Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0');
}

export function hexToHsv(hex: string): HsvColor {
  const [redByte, greenByte, blueByte] = parseHex(hex);
  const red = redByte / 255;
  const green = greenByte / 255;
  const blue = blueByte / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta !== 0) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (maximum === green) hue = 60 * (((blue - red) / delta) + 2);
    else hue = 60 * (((red - green) / delta) + 4);
  }
  if (hue < 0) hue += 360;
  return Object.freeze({
    hue,
    saturation: maximum === 0 ? 0 : delta / maximum,
    value: maximum
  });
}

export function hsvToHex(color: HsvColor): string {
  if (![color.hue, color.saturation, color.value].every(Number.isFinite)) {
    throw new TypeError('HSV channels must be finite numbers.');
  }
  if (color.saturation < 0 || color.saturation > 1 || color.value < 0 || color.value > 1) {
    throw new RangeError('HSV saturation and value must be between zero and one.');
  }
  const hue = ((color.hue % 360) + 360) % 360;
  const chroma = color.value * color.saturation;
  const sector = hue / 60;
  const intermediate = chroma * (1 - Math.abs((sector % 2) - 1));
  const [redPrime, greenPrime, bluePrime] = sector < 1 ? [chroma, intermediate, 0]
    : sector < 2 ? [intermediate, chroma, 0]
      : sector < 3 ? [0, chroma, intermediate]
        : sector < 4 ? [0, intermediate, chroma]
          : sector < 5 ? [intermediate, 0, chroma]
            : [chroma, 0, intermediate];
  const match = color.value - chroma;
  return `#${channel((redPrime + match) * 255)}${channel((greenPrime + match) * 255)}${channel((bluePrime + match) * 255)}`;
}

export function mixHex(left: string, right: string, amount: number): string {
  const leftRgb = parseHex(left);
  const rightRgb = parseHex(right);
  if (!Number.isFinite(amount) || amount < 0 || amount > 1) throw new RangeError('Mix amount must be between zero and one.');
  return `#${leftRgb.map((value, index) => channel(value + (rightRgb[index]! - value) * amount)).join('')}`;
}

function linear(channelValue: number): number {
  const normalized = channelValue / 255;
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHex(hex);
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

export function bestContrastingText(background: string): '#000000' | '#FFFFFF' {
  const luminance = relativeLuminance(background);
  const blackContrast = (luminance + 0.05) / 0.05;
  const whiteContrast = 1.05 / (luminance + 0.05);
  return blackContrast >= whiteContrast ? '#000000' : '#FFFFFF';
}
