'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminTests, updateTest, deleteTest } from '@/app/apis/testApi';
import { getExamTypes } from '@/app/apis/examTypeApi';
import { getUsers } from '@/app/apis/userApi';

const USERS_PARAMS = { page: 0, size: 200 };

export const adminTestsKeys = {
  tests: ['admin-tests'],
  examTypes: ['admin-exam-types'],
  users: (params) => ['admin-users', params],
};

const toArray = (data) => (Array.isArray(data) ? data : []);
const toUsers = (data) => (Array.isArray(data?.content) ? data.content : []);

export function useAdminTests() {
  const qc = useQueryClient();

  const testsQuery = useQuery({
    queryKey: adminTestsKeys.tests,
    queryFn: getAdminTests,
    select: toArray,
  });
  const examTypesQuery = useQuery({
    queryKey: adminTestsKeys.examTypes,
    queryFn: getExamTypes,
    select: toArray,
  });
  const usersQuery = useQuery({
    queryKey: adminTestsKeys.users(USERS_PARAMS),
    queryFn: () => getUsers(USERS_PARAMS),
    select: toUsers,
  });

  const invalidateTests = () =>
    qc.invalidateQueries({ queryKey: adminTestsKeys.tests });

  const updateMutation = useMutation({
    mutationFn: ({ testId, payload }) => updateTest(testId, payload),
    onSuccess: invalidateTests,
  });

  const deleteMutation = useMutation({
    mutationFn: (testId) => deleteTest(testId),
    onSuccess: invalidateTests,
  });

  return {
    tests: testsQuery.data ?? [],
    examTypes: examTypesQuery.data ?? [],
    users: usersQuery.data ?? [],
    isLoading:
      testsQuery.isLoading || examTypesQuery.isLoading || usersQuery.isLoading,
    isError:
      testsQuery.isError || examTypesQuery.isError || usersQuery.isError,
    updateTest: updateMutation.mutateAsync,
    deleteTest: deleteMutation.mutateAsync,
    isMutating: updateMutation.isPending || deleteMutation.isPending,
  };
}
