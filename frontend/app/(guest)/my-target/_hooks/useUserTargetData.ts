'use client';

import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { getExamParts } from '@/app/apis/examPartApi';
import { getSkills } from '@/app/apis/skillApi';
import { getScoringConversions } from '@/app/apis/scoringConversionApi';
import { getMilestones } from '@/app/apis/milestoneApi';
import { getUserTarget } from '@/app/apis/userTargetApi';
import { sortByPartOrder } from '@/app/utils/partOrder';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

export const userTargetKeys = {
  examTypes: ['standard-exam-types'],
  examParts: ['exam-parts'],
  skills: ['skills'],
  scoringConversions: ['scoring-conversions'],
  milestones: (examTypeId?: string) => ['milestones', examTypeId],
  current: (examTypeId?: string) => ['user-target', examTypeId],
};

const asArray = <T>(data: T[] | { content?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

export function useUserTargetData(selectedExamTypeId?: string) {
  const examTypesQuery = useQuery({
    queryKey: userTargetKeys.examTypes,
    queryFn: getStandardExamTypes,
    select: asArray,
  });
  const examPartsQuery = useQuery({
    queryKey: userTargetKeys.examParts,
    queryFn: getExamParts,
    select: (data) => sortByPartOrder(asArray(data)),
  });
  const skillsQuery = useQuery({
    queryKey: userTargetKeys.skills,
    queryFn: getSkills,
    select: asArray,
  });
  const scoringConversionsQuery = useQuery({
    queryKey: userTargetKeys.scoringConversions,
    queryFn: getScoringConversions,
    select: asArray,
  });
  const milestonesQuery = useQuery({
    queryKey: userTargetKeys.milestones(selectedExamTypeId),
    queryFn: () => getMilestones(selectedExamTypeId),
    enabled: !!selectedExamTypeId,
    select: asArray,
  });

  return {
    examTypes: examTypesQuery.data ?? EMPTY_LIST,
    examParts: examPartsQuery.data ?? EMPTY_LIST,
    skills: skillsQuery.data ?? EMPTY_LIST,
    scoringConversions: scoringConversionsQuery.data ?? EMPTY_LIST,
    milestones: milestonesQuery.data ?? EMPTY_LIST,
  };
}

export function useCurrentUserTarget(selectedExamTypeId?: string) {
  const query = useQuery({
    queryKey: userTargetKeys.current(selectedExamTypeId),
    queryFn: () => getUserTarget(selectedExamTypeId),
    enabled: !!selectedExamTypeId,
  });

  return {
    target: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
