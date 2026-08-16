'use client';

import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { generatePracticeQuestion } from '@/app/apis/practiceQuestionApi';
import type { PracticeQuestionResponse } from '@/app/types';

type UseGeneratePracticeQuestionOptions = Omit<
  UseMutationOptions<PracticeQuestionResponse | null, any, void>,
  'mutationFn'
>;

export function useGeneratePracticeQuestion(albumId?: string, options: UseGeneratePracticeQuestionOptions = {}) {
  return useMutation({
    mutationFn: () => generatePracticeQuestion(albumId!),
    ...options,
  });
}
