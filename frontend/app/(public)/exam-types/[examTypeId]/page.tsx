import { notFound } from 'next/navigation';
import type { ExamTypeResponse } from '@/app/types';
import { fetchPublicJson, fetchPublicResource } from '@/app/utils/serverApi';
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

export default async function Page({ params }: PageProps<'/exam-types/[examTypeId]'>) {
  const { examTypeId } = await params;
  const res = await fetchPublicResource<ExamTypeResponse>(
    `/api/exam-types/${encodeURIComponent(examTypeId)}`,
  );
  if (!res.ok && res.missing) notFound();

  return <TestByExamType />;
}
