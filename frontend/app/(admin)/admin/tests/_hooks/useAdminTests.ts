'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminTests, updateTest, deleteTest } from '@/app/apis/testApi';
import { getExamTypes } from '@/app/apis/examTypeApi';
import { getUsers } from '@/app/apis/userApi';
import type {
  CreateTestRequest,
  ExamTypeResponse,
  PageResponse,
  TestAdminResponse,
  UserResponse,
} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

const USERS_PARAMS = { page: 0, size: 200 };

export const adminTestsKeys = {
  tests: ['admin-tests'],
  examTypes: ['admin-exam-types'],
  users: (params: typeof USERS_PARAMS) => ['admin-users', params],
};

const toArray = <T,>(data: T[]): T[] => (Array.isArray(data) ? data : []);
const toUsers = (data: PageResponse<UserResponse>): UserResponse[] =>
  Array.isArray(data?.content) ? data.content : [];

export function useAdminTests() {
  const qc = useQueryClient();

  const testsQuery = useQuery({
    queryKey: adminTestsKeys.tests,
    queryFn: getAdminTests,
    select: toArray<TestAdminResponse>,
  });
  const examTypesQuery = useQuery({
    queryKey: adminTestsKeys.examTypes,
    queryFn: getExamTypes,
    select: toArray<ExamTypeResponse>,
  });
  const usersQuery = useQuery({
    queryKey: adminTestsKeys.users(USERS_PARAMS),
    queryFn: () => getUsers(USERS_PARAMS),
    select: toUsers,
  });

  const invalidateTests = () =>
    qc.invalidateQueries({ queryKey: adminTestsKeys.tests });

  const updateMutation = useMutation({
    mutationFn: ({ testId, payload }: { testId: string; payload: CreateTestRequest }) =>
      updateTest(testId, payload),
    onSuccess: invalidateTests,
  });

  const deleteMutation = useMutation({
    mutationFn: (testId: string) => deleteTest(testId),
    onSuccess: invalidateTests,
  });

  return {
    tests: testsQuery.data ?? EMPTY_LIST,
    examTypes: examTypesQuery.data ?? EMPTY_LIST,
    users: usersQuery.data ?? EMPTY_LIST,
    isLoading:
      testsQuery.isLoading || examTypesQuery.isLoading || usersQuery.isLoading,
    isError:
      testsQuery.isError || examTypesQuery.isError || usersQuery.isError,
    updateTest: updateMutation.mutateAsync,
    deleteTest: deleteMutation.mutateAsync,
    isMutating: updateMutation.isPending || deleteMutation.isPending,
  };
}
