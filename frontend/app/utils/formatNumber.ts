// `locale` là mã next-intl ('vi' | 'en'); tiếng Việt dùng dấu phẩy thập phân (59,9M), tiếng Anh dấu chấm (59.9M).
const intlLocale = (locale: string) => (locale === 'en' ? 'en-US' : 'vi-VN');

export function formatCompactNumber(value: number | string | null | undefined, locale = 'vi'): string {
  const decimal = locale === 'en' ? '.' : ',';
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return '0';
  }

  if (n < 10_000) {
    return Math.round(n).toLocaleString(intlLocale(locale));
  }

  if (n < 1_000_000) {
    const k = n / 1_000;
    if (k >= 100) {
      return `${Math.round(k)}K`;
    }
    const oneDec = Math.floor(k * 10) / 10;
    return `${String(oneDec).replace('.', decimal)}K`;
  }

  const m = n / 1_000_000;
  if (m >= 100) {
    return `${Math.round(m)}M`;
  }
  const oneDec = Math.floor(m * 10) / 10;
  return `${String(oneDec).replace('.', decimal)}M`;
}

export function formatFullNumber(value: number | string | null | undefined, locale = 'vi'): string {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return '0';
  }
  return Math.round(n).toLocaleString(intlLocale(locale));
}
