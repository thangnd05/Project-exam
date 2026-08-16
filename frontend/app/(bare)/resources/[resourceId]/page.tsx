import type { RecoveryResourceResponse } from '@/app/types';
import { fetchPublicJson } from '@/app/utils/serverApi';
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

export default function Page() {
  return <RecoveryResourceView />;
}
