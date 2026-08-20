import { notFound } from 'next/navigation';
import type { ExamTypeResponse } from '@/app/types';
import { fetchPublicJson, fetchPublicResource } from '@/app/utils/serverApi';
import TestByCollection from './TestByCollection';

export async function generateMetadata({
  params,
}: PageProps<'/exam-types/[examTypeId]/collections/[collectionId]'>) {
  const { examTypeId } = await params;
  const examType = await fetchPublicJson<ExamTypeResponse>(
    `/api/exam-types/${encodeURIComponent(examTypeId)}`,
  );
  if (!examType?.name) return {};

  const title = `Bộ đề ${examType.name}`;
  const description = `Các đề thi thử ${examType.name} trong bộ đề: làm bài online, chấm điểm tự động và xem đáp án chi tiết.`;

  return {
    title,
    description,
    openGraph: { type: 'website', title, description },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function Page({
  params,
}: PageProps<'/exam-types/[examTypeId]/collections/[collectionId]'>) {
  const { examTypeId } = await params;
  const res = await fetchPublicResource<ExamTypeResponse>(
    `/api/exam-types/${encodeURIComponent(examTypeId)}`,
  );
  if (!res.ok && res.missing) notFound();

  return <TestByCollection />;
}
