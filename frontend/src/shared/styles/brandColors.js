/**
 * Bảng màu thương hiệu cho các chỗ BẮT BUỘC dùng JS (Recharts, react-simple-maps,
 * SVG inline, <input type="color">) — nơi không viết được var(--...) trong CSS.
 *
 * KHÔNG khai màu ở đây. Giá trị đọc thẳng từ các primitive `--brand-*-rgb`
 * trong GlobalStyles.module.scss, nên đổi tông vẫn chỉ sửa đúng một file.
 * Các hằng dưới đây chỉ là phao cứu sinh khi chưa có DOM (test, SSR).
 */

const FALLBACK = {
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

const cache = new Map();

/** Đọc `--<token>-rgb` (dạng "201 168 75") từ :root và đổi sang hex. */
function readToken(token) {
  if (cache.has(token)) return cache.get(token);
  let hex = FALLBACK[token];
  if (typeof window !== 'undefined' && window.document) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(`--${token}-rgb`);
    const channels = raw.match(/\d+/g);
    if (channels && channels.length >= 3) {
      hex = '#' + channels.slice(0, 3).map((c) => Number(c).toString(16).padStart(2, '0')).join('');
      cache.set(token, hex); // chỉ nhớ khi đọc được thật, tránh đóng băng giá trị dự phòng
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
};

export const brandColors = Object.defineProperties(
  {},
  Object.fromEntries(
    Object.entries(ALIASES).map(([key, token]) => [
      key,
      { get: () => readToken(token), enumerable: true },
    ]),
  ),
);

export default brandColors;
