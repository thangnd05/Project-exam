import { routing, splitLocale, type Locale } from '@/app/i18n/routing';
import viSystem from '@/app/i18n/messages/vi/System.json';
import enSystem from '@/app/i18n/messages/en/System.json';

type ApiErrorLike = {
  // `detail` là trường của ProblemDetail (Spring) mà các endpoint import/preview trả về.
  response?: { data?: { message?: string; detail?: string; error?: string } };
};

const DEFAULT_FALLBACK: Record<Locale, string> = {
  vi: viSystem.apiError.fallback,
  en: enSystem.apiError.fallback,
};

// Hàm thuần nên không gọi được hook dịch: câu mặc định lấy theo ngôn ngữ trên URL hiện tại.
const defaultFallback = (): string => {
  const locale = typeof window === 'undefined' ? routing.defaultLocale : splitLocale(window.location.pathname).locale;
  return DEFAULT_FALLBACK[locale];
};

export function getApiErrorMessage(error: unknown, fallback: string = defaultFallback()): string {
  const err = error as ApiErrorLike | null | undefined;
  return (
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.response?.data?.error ||
    fallback
  );
}

export default getApiErrorMessage;
