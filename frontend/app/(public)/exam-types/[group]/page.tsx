import TestByExamType from './TestByExamType';
import { examTypeMetadata, requireExamType } from './_lib/examTypeRoute';

// Một đoạn: nhóm cha (/exam-types/aws), kỳ thi không có cha (/exam-types/toeic) hoặc link cũ /exam-types/<uuid>.
type Props = { params: Promise<{ group: string }> };

export async function generateMetadata({ params }: Props) {
  const { group } = await params;
  return examTypeMetadata([group]);
}

export default async function Page({ params }: Props) {
  const { group } = await params;
  const examType = await requireExamType([group]);
  return <TestByExamType examTypeId={examType.examTypeId} />;
}
