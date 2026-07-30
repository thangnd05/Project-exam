import { useQuery } from '@tanstack/react-query';

import { useCrudMutations } from '~/features/admin/hooks/useAdminCrud';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import { getExamParts } from '~/shared/api/examPartApi';
import { getSkills } from '~/shared/api/skillApi';
import { getScoringConversions } from '~/shared/api/scoringConversionApi';
import {
  createMilestone as apiCreateMilestone,
  deleteMilestone as apiDeleteMilestone,
  getMilestones,
  updateMilestone as apiUpdateMilestone,
} from '~/shared/api/milestoneApi';

export const milestonesKeys = {
  examTypes: ['admin-milestones', 'exam-types'],
  examParts: ['admin-milestones', 'exam-parts'],
  skills: ['admin-milestones', 'skills'],
  scoring: ['admin-milestones', 'scoring'],
  list: (examTypeId) => ['admin-milestones', 'list', examTypeId],
};

const normalizeArray = (data) =>
  Array.isArray(data) ? data : data?.content ?? [];

export function useMilestones(examTypeFilter) {
  const examTypesQuery = useQuery({
    queryKey: milestonesKeys.examTypes,
    queryFn: getStandardExamTypes,
    select: normalizeArray,
  });

  const examPartsQuery = useQuery({
    queryKey: milestonesKeys.examParts,
    queryFn: getExamParts,
    select: normalizeArray,
  });

  const skillsQuery = useQuery({
    queryKey: milestonesKeys.skills,
    queryFn: getSkills,
    select: normalizeArray,
  });

  const scoringQuery = useQuery({
    queryKey: milestonesKeys.scoring,
    queryFn: getScoringConversions,
    select: normalizeArray,
  });

  const milestonesQuery = useQuery({
    queryKey: milestonesKeys.list(examTypeFilter),
    queryFn: () => getMilestones(examTypeFilter),
    enabled: !!examTypeFilter,
    select: normalizeArray,
  });

  const { createMutation, updateMutation, deleteMutation } = useCrudMutations({
    queryKey: ['admin-milestones', 'list'],
    create: (payload) => apiCreateMilestone(payload),
    update: ({ id, payload }) => apiUpdateMilestone(id, payload),
    remove: (id) => apiDeleteMilestone(id),
  });

  const loadErrorText = examTypesQuery.isError
    ? 'Không thể tải danh sách loại kỳ thi.'
    : examPartsQuery.isError
    ? 'Không thể tải danh sách phần thi.'
    : milestonesQuery.isError
    ? 'Không thể tải danh sách mốc điểm.'
    : '';

  return {
    milestones: milestonesQuery.data ?? [],
    examTypes: examTypesQuery.data ?? [],
    examParts: examPartsQuery.data ?? [],
    skills: skillsQuery.data ?? [],
    scoringConversions: scoringQuery.data ?? [],
    isLoading: milestonesQuery.isLoading,
    loadErrorText,
    createMilestone: createMutation.mutateAsync,
    updateMilestone: (id, payload) =>
      updateMutation.mutateAsync({ id, payload }),
    deleteMilestone: deleteMutation.mutateAsync,
  };
}
