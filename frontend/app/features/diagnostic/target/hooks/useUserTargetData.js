'use client';

import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import { getExamParts } from '@/app/apis/examPartApi';
import { getSkills } from '@/app/apis/skillApi';
import { getScoringConversions } from '@/app/apis/scoringConversionApi';
import { getMilestones } from '@/app/apis/milestoneApi';
import { getUserTarget } from '@/app/apis/userTargetApi';
import { sortByPartOrder } from '@/app/utils/partOrder';

export const userTargetKeys = {
  examTypes: ['standard-exam-types'],
  examParts: ['exam-parts'],
  skills: ['skills'],
  scoringConversions: ['scoring-conversions'],
  milestones: (examTypeId) => ['milestones', examTypeId],
  current: (examTypeId) => ['user-target', examTypeId],
};

const asArray = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];

export function useUserTargetData(selectedExamTypeId) {
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
    examTypes: examTypesQuery.data ?? [],
    examParts: examPartsQuery.data ?? [],
    skills: skillsQuery.data ?? [],
    scoringConversions: scoringConversionsQuery.data ?? [],
    milestones: milestonesQuery.data ?? [],
  };
}

export function useCurrentUserTarget(selectedExamTypeId) {
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
