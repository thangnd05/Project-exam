import { buildExamTypeDetailPath } from '@/app/configs/Routes';
import TestByCollection from '@/app/(public)/exam-types/[group]/_components/TestByCollection';
import { examCollectionMetadata, requireExamType } from '@/app/(public)/exam-types/[group]/_lib/examTypeRoute';

type Props = { params: Promise<{ group: string; collectionId: string }> };

export async function generateMetadata({ params }: Props) {
  const { group, collectionId } = await params;
  return examCollectionMetadata([group], collectionId);
}

export default async function Page({ params }: Props) {
  const { group, collectionId } = await params;
  const examType = await requireExamType([group], collectionId);
  return <TestByCollection examTypeId={examType.examTypeId} examHref={buildExamTypeDetailPath(examType)} />;
}
