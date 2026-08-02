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

export function useMyClasses() {
  return useQuery({
    queryKey: myClassesKeys.all,
    queryFn: getMyClasses,
    select: normalizeMyClasses,
  });
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
