import { useQuery } from '@tanstack/react-query';
import { getQuestionCollections } from '~/shared/api/questionCollectionApi';

export const questionCollectionKeys = {
  list: ['question-collections'],
};

const normalizeCollections = (data) =>
  Array.isArray(data) ? data : data?.data || data?.content || [];

export function useQuestionCollections() {
  const query = useQuery({
    queryKey: questionCollectionKeys.list,
    queryFn: getQuestionCollections,
    select: normalizeCollections,
  });

  return {
    questionCollections: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
