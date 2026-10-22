import { notFound } from 'next/navigation';
import type { RecoveryResourceResponse } from '@/app/types';
import { fetchPublicJson, fetchPublicResource } from '@/app/utils/serverApi';
import { toMetaDescription } from '@/app/utils/seo';
import { localeAlternates } from '@/app/i18n/metadata';
import RecoveryResourceView from './RecoveryResourceView';

export async function generateMetadata({ params }: PageProps<'/[locale]/resources/[resourceId]'>) {
  const { locale, resourceId } = await params;
  const resource = await fetchPublicJson<RecoveryResourceResponse>(
    `/api/recovery-resources/${encodeURIComponent(resourceId)}`,
  );
  if (!resource?.title) return {};

  const title = resource.title;
  const description =
    toMetaDescription(resource.description) ||
    [resource.examTypeName, ...(resource.examPartNames ?? [])].filter(Boolean).join(' - ') ||
    undefined;

  return {
    title,
    description,
    alternates: localeAlternates(locale, `/resources/${resourceId}`),
    openGraph: { type: 'article', title, description },
  };
}

export default async function Page({ params }: PageProps<'/[locale]/resources/[resourceId]'>) {
  const { resourceId } = await params;
  const res = await fetchPublicResource<RecoveryResourceResponse>(
    `/api/recovery-resources/${encodeURIComponent(resourceId)}`,
  );
  if (!res.ok && res.missing) notFound();

  return <RecoveryResourceView />;
}
