import TestByExamType from '@/app/(public)/exam-types/[group]/TestByExamType';
import { examTypeMetadata, requireExamType } from '@/app/(public)/exam-types/[group]/_lib/examTypeRoute';

// Kỳ thi thuộc nhóm cha: /exam-types/aws/saa-c03.
type Props = { params: Promise<{ group: string; exam: string }> };

export async function generateMetadata({ params }: Props) {
  const { group, exam } = await params;
  return examTypeMetadata([group, exam]);
}

export default async function Page({ params }: Props) {
  const { group, exam } = await params;
  const examType = await requireExamType([group, exam]);
  return <TestByExamType examTypeId={examType.examTypeId} examSlug={examType.slug} />;
}
