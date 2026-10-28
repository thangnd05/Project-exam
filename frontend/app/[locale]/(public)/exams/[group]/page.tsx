import TestByExamType from './TestByExamType';
import { examTypeMetadata, requireExamType } from './_lib/examTypeRoute';

// Một đoạn: nhóm cha (/exams/aws), kỳ thi không có cha (/exams/toeic) hoặc link cũ /exams/<uuid>.
type Props = PageProps<'/[locale]/exams/[group]'>;

export async function generateMetadata({ params }: Props) {
  const { locale, group } = await params;
  return examTypeMetadata([group], locale);
}

export default async function Page({ params }: Props) {
  const { locale, group } = await params;
  const examType = await requireExamType([group], locale);
  return <TestByExamType examTypeId={examType.examTypeId} examSlug={examType.slug} examParentSlug={examType.parentSlug} />;
}
