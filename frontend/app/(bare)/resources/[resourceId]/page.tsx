import { notFound } from 'next/navigation';
import type { RecoveryResourceResponse } from '@/app/types';
import { fetchPublicJson, fetchPublicResource } from '@/app/utils/serverApi';
import { toMetaDescription } from '@/app/utils/seo';
import RecoveryResourceView from './RecoveryResourceView';

export async function generateMetadata({ params }: PageProps<'/resources/[resourceId]'>) {
  const { resourceId } = await params;
  const resource = await fetchPublicJson<RecoveryResourceResponse>(
    `/api/recovery-resources/${encodeURIComponent(resourceId)}`,
  );
  if (!resource?.title) return {};

  const title = resource.title;
  const description =
    toMetaDescription(resource.description) ||
    [resource.examTypeName, resource.examPartName].filter(Boolean).join(' — ') ||
    undefined;

  return {
    title,
    description,
    openGraph: { type: 'article', title, description },
  };
}

export default async function Page({ params }: PageProps<'/resources/[resourceId]'>) {
  const { resourceId } = await params;
  const res = await fetchPublicResource<RecoveryResourceResponse>(
    `/api/recovery-resources/${encodeURIComponent(resourceId)}`,
  );
  if (!res.ok && res.missing) notFound();

  return <RecoveryResourceView />;
}
