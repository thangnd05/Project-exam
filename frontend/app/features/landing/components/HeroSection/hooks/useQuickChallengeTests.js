'use client';

import {useQuery} from '@tanstack/react-query';

import {getQuickChallengeTests} from '@/app/apis/testApi';

export const quickChallengeKeys = {
  all: ['quick-challenge-tests'],
};

const normalizeTests = (data) => (Array.isArray(data) ? data : []);

export function useQuickChallengeTests() {
  const query = useQuery({
    queryKey: quickChallengeKeys.all,
    queryFn: getQuickChallengeTests,
    select: normalizeTests,
  });

  return {
    quickTests: query.data ?? [],
    isLoading: query.isLoading,
  };
}
