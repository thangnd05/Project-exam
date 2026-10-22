import TestByExamType from './TestByExamType';
import { examTypeMetadata, requireExamType } from './_lib/examTypeRoute';

// Một đoạn: nhóm cha (/exam-types/aws), kỳ thi không có cha (/exam-types/toeic) hoặc link cũ /exam-types/<uuid>.
type Props = PageProps<'/[locale]/exam-types/[group]'>;

export async function generateMetadata({ params }: Props) {
  const { locale, group } = await params;
  return examTypeMetadata([group], locale);
}

export default async function Page({ params }: Props) {
  const { locale, group } = await params;
  const examType = await requireExamType([group], locale);
  return <TestByExamType examTypeId={examType.examTypeId} examSlug={examType.slug} />;
}
