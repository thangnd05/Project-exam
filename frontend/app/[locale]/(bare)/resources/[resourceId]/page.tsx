import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { RecoveryResourceResponse } from '@/app/types';
import { fetchPublicResource } from '@/app/utils/serverApi';
import { PRIVATE_ROBOTS } from '@/app/i18n/metadata';
import { routing } from '@/app/i18n/routing';
import RecoveryResourceView from './RecoveryResourceView';

// Theo bảng SEO: tiêu đề cố định, không mô tả, noindex và không có trong sitemap.
export async function generateMetadata({ params }: PageProps<'/[locale]/resources/[resourceId]'>) {
  const { locale: raw } = await params;
  const locale = hasLocale(routing.locales, raw) ? raw : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'Resources.detailMeta' });

  return { title: t('title'), description: null, robots: PRIVATE_ROBOTS };
}

export default async function Page({ params }: PageProps<'/[locale]/resources/[resourceId]'>) {
  const { resourceId } = await params;
  const res = await fetchPublicResource<RecoveryResourceResponse>(
    `/api/recovery-resources/${encodeURIComponent(resourceId)}`,
  );
  if (!res.ok && res.missing) notFound();

  return <RecoveryResourceView />;
}
