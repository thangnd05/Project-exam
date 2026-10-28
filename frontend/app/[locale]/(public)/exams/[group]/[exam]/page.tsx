import TestByExamType from '@/app/[locale]/(public)/exams/[group]/TestByExamType';
import { examTypeMetadata, requireExamType } from '@/app/[locale]/(public)/exams/[group]/_lib/examTypeRoute';

// Kỳ thi thuộc nhóm cha: /exams/aws/saa-c03.
type Props = PageProps<'/[locale]/exams/[group]/[exam]'>;

export async function generateMetadata({ params }: Props) {
  const { locale, group, exam } = await params;
  return examTypeMetadata([group, exam], locale);
}

export default async function Page({ params }: Props) {
  const { locale, group, exam } = await params;
  const examType = await requireExamType([group, exam], locale);
  return <TestByExamType examTypeId={examType.examTypeId} examSlug={examType.slug} examParentSlug={examType.parentSlug} />;
}
