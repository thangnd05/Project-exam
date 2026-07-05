import { useQuery } from '@tanstack/react-query';
import { getStandardExamTypes } from '~/api/examTypeApi';
import { getExamParts } from '~/api/examPartApi';
import { getSkills } from '~/api/skillApi';
import { getScoringConversions } from '~/api/scoringConversionApi';
import { getMilestones } from '~/api/milestoneApi';
import { sortByPartOrder } from '~/utils/partOrder';

export const userTargetKeys = {
  examTypes: ['standard-exam-types'],
  examParts: ['exam-parts'],
  skills: ['skills'],
  scoringConversions: ['scoring-conversions'],
  milestones: (examTypeId) => ['milestones', examTypeId],
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
