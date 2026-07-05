import { useQuery } from '@tanstack/react-query';
import { getQuestionCollections } from '~/api/questionCollectionApi';

export const questionCollectionKeys = {
  list: ['question-collections'],
};

const normalizeCollections = (data) =>
  Array.isArray(data) ? data : data?.data || data?.content || [];

export function useQuestionCollections() {
  return useQuery({
    queryKey: questionCollectionKeys.list,
    queryFn: getQuestionCollections,
    select: normalizeCollections,
  });
}
