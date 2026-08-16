
const FALLBACK: Record<string, string> = {
  'brand-50': '#faf7f0',
  'brand-100': '#f3ebda',
  'brand-150': '#f0e4c4',
  'brand-200': '#e8d5a3',
  'brand-300': '#e8d5a3',
  'brand-400': '#dcc07a',
  'brand-500': '#c9a84b',
  'brand-600': '#a88b3a',
  'brand-700': '#7d672c',
  'brand-800': '#3f3420',
  'brand-900': '#14110d',
};

const cache = new Map<string, string>();

function readToken(token: string): string {
  if (cache.has(token)) return cache.get(token)!;
  let hex = FALLBACK[token];
  if (typeof window !== 'undefined' && window.document) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${token}-rgb`);
    const channels = raw.match(/\d+/g);
    if (channels && channels.length >= 3) {
      hex = '#' + channels.slice(0, 3).map((c) => Number(c).toString(16).padStart(2, '0')).join('');
      cache.set(token, hex);
    }
  }
  return hex;
}

const ALIASES = {
  primary: 'brand-500',
  primaryHover: 'brand-600',
  accent: 'brand-200',
  unique: 'brand-200',
  uniqueHover: 'brand-400',
  heroBg: 'brand-900',
  footerBg: 'brand-900',
  brand50: 'brand-50',
  brand100: 'brand-100',
  brand200: 'brand-200',
  brand300: 'brand-300',
  brand400: 'brand-400',
  brand500: 'brand-500',
  brand600: 'brand-600',
  brand700: 'brand-700',
  brand800: 'brand-800',
  brand900: 'brand-900',
} as const;

export type BrandColorKey = keyof typeof ALIASES;

export type BrandColors = Record<BrandColorKey, string>;

export const brandColors = Object.defineProperties(
  {},
  Object.fromEntries(
    Object.entries(ALIASES).map(([key, token]) => [
      key,
      { get: () => readToken(token), enumerable: true },
    ]),
  ),
) as BrandColors;

export default brandColors;
