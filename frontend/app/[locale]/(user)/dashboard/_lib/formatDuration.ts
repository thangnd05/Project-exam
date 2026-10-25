import type { useTranslations } from 'next-intl';

export type DashboardT = ReturnType<typeof useTranslations<'Dashboard'>>;

export const formatDuration = (minutes: unknown, t: DashboardT) => {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h > 0) return m > 0 ? t('duration.hoursMinutes', { h, m }) : t('duration.hours', { h });
  return t('duration.minutes', { m });
};
