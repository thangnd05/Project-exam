import type { ExamTypeResponse } from '@/app/types';
import { fetchPublicJson } from '@/app/utils/serverApi';
import { toMetaDescription } from '@/app/utils/seo';
import TestByExamType from './TestByExamType';

export async function generateMetadata({ params }: PageProps<'/exam-types/[examTypeId]'>) {
  const { examTypeId } = await params;
  const examType = await fetchPublicJson<ExamTypeResponse>(
    `/api/exam-types/${encodeURIComponent(examTypeId)}`,
  );
  if (!examType?.name) return {};

  const title = `Đề thi ${examType.name}`;
  const description =
    toMetaDescription(examType.description) ||
    `Danh sách đề thi thử ${examType.name}: làm bài online, chấm điểm tự động và xem đáp án chi tiết.`;
  const cover = examType.imageUrl || undefined;
  const images = cover ? [{ url: cover }] : undefined;

  return {
    title,
    description,
    openGraph: { type: 'website', title, description, images },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: cover ? [cover] : undefined,
    },
  };
}

export default function Page() {
  return <TestByExamType />;
}
