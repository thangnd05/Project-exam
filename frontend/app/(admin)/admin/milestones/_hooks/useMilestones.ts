'use client';

import { useQuery } from '@tanstack/react-query';

import { useCrudMutations } from '@/app/hooks/useAdminCrud';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { getExamParts } from '@/app/apis/examPartApi';
import { getSkills } from '@/app/apis/skillApi';
import { getScoringConversions } from '@/app/apis/scoringConversionApi';
import {
  createMilestone as apiCreateMilestone,
  deleteMilestone as apiDeleteMilestone,
  getMilestones,
  updateMilestone as apiUpdateMilestone,
} from '@/app/apis/milestoneApi';
import type { MilestoneRequest } from '@/app/types';

export const milestonesKeys = {
  examTypes: ['admin-milestones', 'exam-types'] as const,
  examParts: ['admin-milestones', 'exam-parts'] as const,
  skills: ['admin-milestones', 'skills'] as const,
  scoring: ['admin-milestones', 'scoring'] as const,
  list: (examTypeId?: string) => ['admin-milestones', 'list', examTypeId] as const,
};

const normalizeArray = <T,>(data: T[] | { content?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : data?.content ?? [];

export function useMilestones(examTypeFilter: string) {
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
    create: (payload: MilestoneRequest) => apiCreateMilestone(payload),
    update: ({ id, payload }: { id: string; payload: MilestoneRequest }) => apiUpdateMilestone(id, payload),
    remove: (id: string) => apiDeleteMilestone(id),
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
    updateMilestone: (id: string, payload: MilestoneRequest) =>
      updateMutation.mutateAsync({ id, payload }),
    deleteMilestone: deleteMutation.mutateAsync,
  };
}
