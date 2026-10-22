import TestByExamType from '@/app/[locale]/(public)/exam-types/[group]/TestByExamType';
import { examTypeMetadata, requireExamType } from '@/app/[locale]/(public)/exam-types/[group]/_lib/examTypeRoute';

// Kỳ thi thuộc nhóm cha: /exam-types/aws/saa-c03.
type Props = PageProps<'/[locale]/exam-types/[group]/[exam]'>;

export async function generateMetadata({ params }: Props) {
  const { locale, group, exam } = await params;
  return examTypeMetadata([group, exam], locale);
}

export default async function Page({ params }: Props) {
  const { locale, group, exam } = await params;
  const examType = await requireExamType([group, exam], locale);
  return <TestByExamType examTypeId={examType.examTypeId} examSlug={examType.slug} />;
}
