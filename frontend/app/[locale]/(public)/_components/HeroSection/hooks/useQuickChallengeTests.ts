'use client';

import {useQuery} from '@tanstack/react-query';

import {getQuickChallengeTests} from '@/app/apis/testApi';
import type {QuickChallengeCardResponse} from '@/app/types/test';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const quickChallengeKeys = {
  all: ['quick-challenge-tests'],
};

const normalizeTests = (data: QuickChallengeCardResponse[]): QuickChallengeCardResponse[] =>
  Array.isArray(data) ? data : [];

export function useQuickChallengeTests() {
  const query = useQuery({
    queryKey: quickChallengeKeys.all,
    queryFn: getQuickChallengeTests,
    select: normalizeTests,
  });

  return {
    quickTests: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
  };
}
