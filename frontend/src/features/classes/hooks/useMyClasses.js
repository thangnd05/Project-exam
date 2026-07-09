import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyClasses } from '~/features/classes/api/classMemberApi';
import { deleteClass } from '~/shared/api/classApi';

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

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId) => deleteClass(classId),
    onSuccess: () => qc.invalidateQueries({ queryKey: myClassesKeys.all }),
  });
}
