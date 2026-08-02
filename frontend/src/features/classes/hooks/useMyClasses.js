import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyClasses, joinClass } from '~/shared/api/classMemberApi';
import { createClass, updateClass, deleteClass } from '~/shared/api/classApi';

export const myClassesKeys = {
  all: ['my-classes'],
};

const normalizeMyClasses = (data) => ({
  teachingClasses: data?.teachingClasses || [],
  learningClasses: data?.learningClasses || [],
  message: data?.message || '',
});

/** Domain-unwrapped hook (prefer this shape for feature hooks). */
export function useMyClasses() {
  const classesQuery = useQuery({
    queryKey: myClassesKeys.all,
    queryFn: getMyClasses,
    select: normalizeMyClasses,
  });

  return {
    teachingClasses: classesQuery.data?.teachingClasses ?? [],
    learningClasses: classesQuery.data?.learningClasses ?? [],
    message: classesQuery.data?.message || '',
    isLoading: classesQuery.isLoading,
    isError: classesQuery.isError,
    refetch: classesQuery.refetch,
  };
}

export function useCreateClass({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createClass(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: myClassesKeys.all });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useUpdateClass({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, payload }) => updateClass(classId, payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: myClassesKeys.all });
      onSuccess?.(...args);
    },
    onError,
  });
}

export function useJoinClass({ onSuccess, onError } = {}) {
  const qc = useQueryClient();
  return useMutation({
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
  return useMutation({
    mutationFn: (classId) => deleteClass(classId),
    onSuccess: () => qc.invalidateQueries({ queryKey: myClassesKeys.all }),
  });
}
