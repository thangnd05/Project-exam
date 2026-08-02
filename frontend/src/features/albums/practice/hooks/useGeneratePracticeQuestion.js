import { useMutation } from '@tanstack/react-query';
import { generatePracticeQuestion } from '~/shared/api/practiceQuestionApi';

export function useGeneratePracticeQuestion(albumId, options = {}) {
  return useMutation({
    mutationFn: () => generatePracticeQuestion(albumId),
    ...options,
  });
}
