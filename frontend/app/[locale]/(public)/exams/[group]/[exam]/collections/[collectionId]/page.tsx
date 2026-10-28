import { buildExamTypeDetailPath } from '@/app/configs/Routes';
import TestByCollection from '@/app/[locale]/(public)/exams/[group]/_components/TestByCollection';
import { examCollectionMetadata, requireExamType } from '@/app/[locale]/(public)/exams/[group]/_lib/examTypeRoute';

type Props = PageProps<'/[locale]/exams/[group]/[exam]/collections/[collectionId]'>;

export async function generateMetadata({ params }: Props) {
  const { locale, group, exam, collectionId } = await params;
  return examCollectionMetadata([group, exam], locale, collectionId);
}

export default async function Page({ params }: Props) {
  const { locale, group, exam, collectionId } = await params;
  const examType = await requireExamType([group, exam], locale, collectionId);
  return <TestByCollection examTypeId={examType.examTypeId} examHref={buildExamTypeDetailPath(examType)} />;
}
