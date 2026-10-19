import { buildExamTypeDetailPath } from '@/app/configs/Routes';
import TestByCollection from '../../../collections/[collectionId]/TestByCollection';
import { examCollectionMetadata, requireExamType } from '../../../_lib/examTypeRoute';

type Props = { params: Promise<{ group: string; exam: string; collectionId: string }> };

export async function generateMetadata({ params }: Props) {
  const { group, exam, collectionId } = await params;
  return examCollectionMetadata([group, exam], collectionId);
}

export default async function Page({ params }: Props) {
  const { group, exam, collectionId } = await params;
  const examType = await requireExamType([group, exam], collectionId);
  return <TestByCollection examTypeId={examType.examTypeId} examHref={buildExamTypeDetailPath(examType)} />;
}
