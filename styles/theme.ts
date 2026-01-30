import { createTheme, rem } from '@mantine/core';

const FONT_FAMILY = 'Poppins, sans-serif';

type Rgb = { r: number; g: number; b: number };
type MantineColor = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
];

const hexToRgb = (hex: string): Rgb => {
  const normalized = hex.replace('#', '');
  const value =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => char + char)
          .join('')
      : normalized;
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return { r, g, b };
};

const rgbToHex = ({ r, g, b }: Rgb): string =>
  `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;

const mix = (base: string, target: string, amount: number): string => {
  const b = hexToRgb(base);
  const t = hexToRgb(target);
  const clamp = (value: number): number => Math.max(0, Math.min(255, value));
  return rgbToHex({
    r: clamp(Math.round(b.r + (t.r - b.r) * amount)),
    g: clamp(Math.round(b.g + (t.g - b.g) * amount)),
    b: clamp(Math.round(b.b + (t.b - b.b) * amount)),
  });
};

const createScale = (hex: string): MantineColor => [
  mix(hex, '#ffffff', 0.9),
  mix(hex, '#ffffff', 0.75),
  mix(hex, '#ffffff', 0.6),
  mix(hex, '#ffffff', 0.45),
  mix(hex, '#ffffff', 0.3),
  hex,
  mix(hex, '#000000', 0.1),
  mix(hex, '#000000', 0.2),
  mix(hex, '#000000', 0.3),
  mix(hex, '#000000', 0.4),
];

const GRAFITE = '#0D0D0C';
const CHAMONIX = '#EEEDEB';
const SPROUT = '#95B354';
const MOSS = '#757263';
const CLOUD = '#C3CED9';
const COGNAC = '#824529';
const PATCH = '#E0CCBE';

export const grupperaTheme = createTheme({
  fontFamily: FONT_FAMILY,
  headings: {
    fontFamily: FONT_FAMILY,
    sizes: {
      h1: { fontSize: rem(52) },
      h2: { fontSize: rem(36) },
      h3: { fontSize: rem(28) },
      h4: { fontSize: rem(22) },
      h5: { fontSize: rem(18) },
      h6: { fontSize: rem(16) },
    },
  },
  fontSizes: {
    xs: rem(12),
    sm: rem(14),
    md: rem(15),
    lg: rem(16),
    xl: rem(18),
  },
  colors: {
    grafite: createScale(GRAFITE),
    chamonix: createScale(CHAMONIX),
    sprout: createScale(SPROUT),
    moss: createScale(MOSS),
    cloud: createScale(CLOUD),
    cognac: createScale(COGNAC),
    patch: createScale(PATCH),
    dark: createScale(GRAFITE),
  },
  primaryColor: 'sprout',
  black: GRAFITE,
  white: CHAMONIX,
  defaultRadius: 'md',
  radius: {
    md: rem(12),
  },
});
