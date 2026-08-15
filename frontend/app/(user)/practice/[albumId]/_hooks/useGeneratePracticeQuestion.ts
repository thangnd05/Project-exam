'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { generatePracticeQuestion } from '@/app/apis/practiceQuestionApi';
import type { PracticeQuestionResponse } from '@/app/types';

// TError = any có chủ đích: lỗi Axios (BE không có type lỗi)
type UseGeneratePracticeQuestionOptions = Omit<
  UseMutationOptions<PracticeQuestionResponse | null, any, void>,
  'mutationFn'
>;

export function useGeneratePracticeQuestion(albumId?: string, options: UseGeneratePracticeQuestionOptions = {}) {
  return useMutation({
    // albumId! an toàn: trang practice chỉ render khi có albumId trên route
    mutationFn: () => generatePracticeQuestion(albumId!),
    ...options,
  });
}
