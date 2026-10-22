import type { Metadata } from 'next';
import { routing, type Locale } from './routing';

// canonical + hreflang cho trang đã dịch. `path` là đường dẫn không tiền tố ngôn ngữ ('/about').
export function localeAlternates(locale: string, path: string): Metadata['alternates'] {
  const href = (l: Locale) => (l === routing.defaultLocale ? path : path === '/' ? `/${l}` : `/${l}${path}`);
  return {
    canonical: href(locale as Locale),
    languages: {
      ...Object.fromEntries(routing.locales.map((l) => [l, href(l)])),
      'x-default': href(routing.defaultLocale),
    },
  };
}

export const OG_LOCALES: Record<Locale, string> = {
  vi: 'vi_VN',
  en: 'en_US',
};
