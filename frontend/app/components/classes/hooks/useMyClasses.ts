'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationOptions } from '@tanstack/react-query';
import { getMyClasses, joinClass } from '@/app/apis/classMemberApi';
import { createClass, updateClass, deleteClass } from '@/app/apis/classApi';
import type {
  ClassMemberJoinRequest,
  ClassMemberResponse,
  ClassRequest,
  ClassResponse,
  MyClassesResponse,
} from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const myClassesKeys = {
  all: ['my-classes'],
};

const normalizeMyClasses = (data: MyClassesResponse) => ({
  teachingClasses: data?.teachingClasses || EMPTY_LIST,
  learningClasses: data?.learningClasses || EMPTY_LIST,
  message: (data as { message?: string })?.message || '',
});

export function useMyClasses() {
  const classesQuery = useQuery({
    queryKey: myClassesKeys.all,
    queryFn: getMyClasses,
    select: normalizeMyClasses,
  });

  return {
    teachingClasses: classesQuery.data?.teachingClasses ?? EMPTY_LIST,
    learningClasses: classesQuery.data?.learningClasses ?? EMPTY_LIST,
    message: classesQuery.data?.message || '',
    isLoading: classesQuery.isLoading,
    isError: classesQuery.isError,
    refetch: classesQuery.refetch,
  };
}

type MutationCallbacks<TData, TVariables> = Pick<
  UseMutationOptions<TData, any, TVariables>,
  'onSuccess' | 'onError'
>;

export function useCreateClass(
  { onSuccess, onError }: MutationCallbacks<ClassResponse, ClassRequest> = {},
) {
  const qc = useQueryClient();
  return useMutation<ClassResponse, any, ClassRequest>({
    mutationFn: (payload) => createClass(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: myClassesKeys.all });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useUpdateClass(
  {
    onSuccess,
    onError,
  }: MutationCallbacks<ClassResponse, { classId: string; payload: ClassRequest }> = {},
) {
  const qc = useQueryClient();
  return useMutation<ClassResponse, any, { classId: string; payload: ClassRequest }>({
    mutationFn: ({ classId, payload }) => updateClass(classId, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: myClassesKeys.all });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useJoinClass(
  { onSuccess, onError }: MutationCallbacks<ClassMemberResponse, ClassMemberJoinRequest> = {},
) {
  const qc = useQueryClient();
  return useMutation<ClassMemberResponse, any, ClassMemberJoinRequest>({
    mutationFn: (payload) => joinClass(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: myClassesKeys.all });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation<void, any, string>({
    mutationFn: (classId) => deleteClass(classId),
    onSuccess: () => qc.invalidateQueries({ queryKey: myClassesKeys.all }),
  });
}
