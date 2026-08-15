'use client';

import { useMutation } from '@tanstack/react-query';
import { generatePracticeQuestion } from '@/app/apis/practiceQuestionApi';

export function useGeneratePracticeQuestion(albumId, options = {}) {
  return useMutation({
    mutationFn: () => generatePracticeQuestion(albumId),
    ...options,
  });
}
