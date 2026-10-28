import type { Metadata } from 'next';
import { hasLocale, type Messages } from 'next-intl';
import { getTranslations } from 'next-intl/server';
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

type PrivatePageKey = keyof Messages['Metadata']['private'];

/**
 * generateMetadata cho trang cá nhân / trang trong luồng học (dashboard, làm bài, kết quả, lộ trình, mục tiêu): chỉ đặt tiêu đề.
 * noindex và bỏ mô tả đặt chung ở layout của nhóm route; trang dưới /dashboard được bảo vệ bằng đăng nhập ở proxy.ts.
 */
export function privatePageMetadata(key: PrivatePageKey) {
  return async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale: raw } = await params;
    const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
    const t = await getTranslations({ locale, namespace: 'Metadata.private' });
    return { title: t(key) };
  };
}

// Trang cần đăng nhập hoặc chỉ mang dữ liệu riêng: không đưa vào kết quả tìm kiếm nhưng vẫn cho đi theo link.
export const PRIVATE_ROBOTS: Metadata['robots'] = { index: false, follow: true };

export const OG_LOCALES: Record<Locale, string> = {
  vi: 'vi_VN',
  en: 'en_US',
};
