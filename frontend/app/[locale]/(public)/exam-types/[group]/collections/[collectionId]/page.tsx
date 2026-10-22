import { buildExamTypeDetailPath } from '@/app/configs/Routes';
import TestByCollection from '@/app/[locale]/(public)/exam-types/[group]/_components/TestByCollection';
import { examCollectionMetadata, requireExamType } from '@/app/[locale]/(public)/exam-types/[group]/_lib/examTypeRoute';

type Props = PageProps<'/[locale]/exam-types/[group]/collections/[collectionId]'>;

export async function generateMetadata({ params }: Props) {
  const { locale, group, collectionId } = await params;
  return examCollectionMetadata([group], locale, collectionId);
}

export default async function Page({ params }: Props) {
  const { locale, group, collectionId } = await params;
  const examType = await requireExamType([group], locale, collectionId);
  return <TestByCollection examTypeId={examType.examTypeId} examHref={buildExamTypeDetailPath(examType)} />;
}
