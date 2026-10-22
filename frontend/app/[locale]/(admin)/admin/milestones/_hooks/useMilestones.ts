'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useCrudMutations } from '@/app/[locale]/(admin)/_hooks/useAdminCrud';
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
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import {examTypeKeys, examPartKeys, skillKeys, scoringConversionKeys, milestoneKeys} from '@/app/configs/queryKeys';

export const milestonesKeys = {
  examTypes: examTypeKeys.standard,
  examParts: examPartKeys.all,
  skills: skillKeys.all,
  scoring: scoringConversionKeys.list,
  list: milestoneKeys.list,
};

const normalizeArray = <T,>(data: T[] | { content?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : data?.content ?? [];

export function useMilestones(examTypeFilter: string) {
  const t = useTranslations('AdminUsers');

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
    queryKey: milestoneKeys.all,
    create: (payload: MilestoneRequest) => apiCreateMilestone(payload),
    update: ({ id, payload }: { id: string; payload: MilestoneRequest }) => apiUpdateMilestone(id, payload),
    remove: (id: string) => apiDeleteMilestone(id),
  });

  const loadErrorText = examTypesQuery.isError
    ? t('milestones.errors.loadExamTypes')
    : examPartsQuery.isError
    ? t('milestones.errors.loadExamParts')
    : milestonesQuery.isError
    ? t('milestones.errors.loadMilestones')
    : '';

  return {
    milestones: milestonesQuery.data ?? EMPTY_LIST,
    examTypes: examTypesQuery.data ?? EMPTY_LIST,
    examParts: examPartsQuery.data ?? EMPTY_LIST,
    skills: skillsQuery.data ?? EMPTY_LIST,
    scoringConversions: scoringQuery.data ?? EMPTY_LIST,
    isLoading: milestonesQuery.isLoading,
    loadErrorText,
    createMilestone: createMutation.mutateAsync,
    updateMilestone: (id: string, payload: MilestoneRequest) =>
      updateMutation.mutateAsync({ id, payload }),
    deleteMilestone: deleteMutation.mutateAsync,
  };
}
