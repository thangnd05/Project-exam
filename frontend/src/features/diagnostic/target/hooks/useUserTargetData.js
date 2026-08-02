import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import { getExamParts } from '~/shared/api/examPartApi';
import { getSkills } from '~/shared/api/skillApi';
import { getScoringConversions } from '~/shared/api/scoringConversionApi';
import { getMilestones } from '~/shared/api/milestoneApi';
import { getUserTarget } from '~/shared/api/userTargetApi';
import { sortByPartOrder } from '~/shared/utils/partOrder';

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
  return useQuery({
    queryKey: userTargetKeys.current(selectedExamTypeId),
    queryFn: () => getUserTarget(selectedExamTypeId),
    enabled: !!selectedExamTypeId,
  });
}
