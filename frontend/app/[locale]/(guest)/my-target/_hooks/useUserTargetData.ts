'use client';

import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { getExamParts } from '@/app/apis/examPartApi';
import { getSkills } from '@/app/apis/skillApi';
import { getScoringConversions } from '@/app/apis/scoringConversionApi';
import { getMilestones } from '@/app/apis/milestoneApi';
import { getUserTarget } from '@/app/apis/userTargetApi';
import { sortByPartOrder } from '@/app/features/exam-types/partOrder';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import {examTypeKeys, examPartKeys, skillKeys, scoringConversionKeys, milestoneKeys, userTargetKeys as targetKeys} from '@/app/configs/queryKeys';
import { toList } from '@/app/utils/toList';

export const userTargetKeys = {
  examTypes: examTypeKeys.standard,
  examParts: examPartKeys.all,
  skills: skillKeys.all,
  scoringConversions: scoringConversionKeys.list,
  milestones: milestoneKeys.list,
  current: targetKeys.byExamType,
};

export function useUserTargetData(selectedExamTypeId?: string) {
  const examTypesQuery = useQuery({
    queryKey: userTargetKeys.examTypes,
    queryFn: getStandardExamTypes,
    select: toList,
  });
  const examPartsQuery = useQuery({
    queryKey: userTargetKeys.examParts,
    queryFn: getExamParts,
    select: (data) => sortByPartOrder(toList(data)),
  });
  const skillsQuery = useQuery({
    queryKey: userTargetKeys.skills,
    queryFn: getSkills,
    select: toList,
  });
  const scoringConversionsQuery = useQuery({
    queryKey: userTargetKeys.scoringConversions,
    queryFn: getScoringConversions,
    select: toList,
  });
  const milestonesQuery = useQuery({
    queryKey: userTargetKeys.milestones(selectedExamTypeId),
    queryFn: () => getMilestones(selectedExamTypeId),
    enabled: !!selectedExamTypeId,
    select: toList,
  });

  return {
    examTypes: examTypesQuery.data ?? EMPTY_LIST,
    examParts: examPartsQuery.data ?? EMPTY_LIST,
    skills: skillsQuery.data ?? EMPTY_LIST,
    scoringConversions: scoringConversionsQuery.data ?? EMPTY_LIST,
    milestones: milestonesQuery.data ?? EMPTY_LIST,
  };
}

export function useCurrentUserTarget(selectedExamTypeId?: string, enabled = true) {
  const query = useQuery({
    queryKey: userTargetKeys.current(selectedExamTypeId),
    queryFn: () => getUserTarget(selectedExamTypeId),
    enabled: enabled && !!selectedExamTypeId,
  });

  return {
    target: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
