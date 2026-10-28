'use client';

import NextLink from 'next/link';
import { usePathname as useNextPathname, useRouter as useNextRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCallback, useMemo, type ComponentProps } from 'react';
import { localizeHref, routing, splitLocale, type Locale } from './routing';

// Bản thay cho next/link, useRouter, usePathname: cả app import từ đây để link/điều hướng tự giữ
// ngôn ngữ đang xem (/en/...) mà code gọi vẫn viết đường dẫn trơn như cũ ('/dashboard').
// Không dùng bản của next-intl vì khi đổi sang ngôn ngữ mặc định nó ép tiền tố /vi rồi proxy phải redirect.

export default function Link({ href, ...rest }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const localized =
    typeof href === 'string'
      ? localizeHref(href, locale)
      : { ...href, pathname: href.pathname ? localizeHref(href.pathname, locale) : href.pathname };
  return <NextLink href={localized} {...rest} />;
}

type NextRouter = ReturnType<typeof useNextRouter>;

export function useRouter(): NextRouter {
  const router = useNextRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href, options) => router.push(localizeHref(href, locale), options),
      replace: (href, options) => router.replace(localizeHref(href, locale), options),
      prefetch: (href, options) => router.prefetch(localizeHref(href, locale), options),
    }),
    [router, locale],
  );
}

// Pathname không kèm tiền tố ngôn ngữ ('/en/exams' -> '/exams'), để so khớp route như trước.
export function usePathname(): string {
  return splitLocale(useNextPathname()).pathname;
}

// Dùng khi phải tự dựng URL tuyệt đối hoặc gán window.location.
export function useLocalizeHref() {
  const locale = useLocale();
  return useCallback((href: string) => localizeHref(href, locale), [locale]);
}

// Đường dẫn của trang hiện tại ở từng ngôn ngữ, cho nút đổi ngôn ngữ.
// Giữ nguyên query/hash (vd. /coming-soon?provider=oracle); đọc lúc bấm nên không cần useSearchParams + Suspense.
export function useLanguageSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const hrefFor = useCallback(
    (target: Locale) => {
      const suffix = typeof window === 'undefined' ? '' : `${window.location.search}${window.location.hash}`;
      if (target === routing.defaultLocale) return `${pathname}${suffix}`;
      return pathname === '/' ? `/${target}${suffix}` : `/${target}${pathname}${suffix}`;
    },
    [pathname],
  );
  return { locale, locales: routing.locales, hrefFor };
}
