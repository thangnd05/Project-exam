import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {getExamTypes} from '~/api/examTypeApi';
import {
  createScoringConversion,
  createScoringConversionsBulk,
  deleteScoringConversion,
  getScoringConversions,
  getScoringConversionsBySkill,
} from '~/api/scoringConversionApi';
import {getSkills} from '~/api/skillApi';

export const scoringConversionKeys = {
  examTypes: ['scoring-conversion', 'exam-types'],
  skills: ['scoring-conversion', 'skills'],
  rules: (skillId, examTypeId) => [
    'scoring-conversion',
    'rules',
    skillId ?? 'all',
    examTypeId ?? 'all',
  ],
};

const mapExamTypeFromApi = (item) => ({
  exam_type_id: String(item.examTypeId),
  name: item.name || '',
});

const mapSkillFromApi = (item) => ({
  skill_id: String(item.skillId),
  name: item.name || '',
});

const mapScoringRuleFromApi = (item) => ({
  conversion_id: String(item.conversionId),
  exam_type_id: String(item.examTypeId),
  skill_id: String(item.skillId),
  num_correct: item.numCorrect || 0,
  converted_score: item.convertedScore || 0,
});

const normalizeExamTypes = (data) =>
  Array.isArray(data) ? data.map(mapExamTypeFromApi) : [];
const normalizeSkills = (data) =>
  Array.isArray(data) ? data.map(mapSkillFromApi) : [];
const normalizeRules = (data) =>
  Array.isArray(data) ? data.map(mapScoringRuleFromApi) : [];

export function useScoringConversion(activeSkillId, examTypeFilter) {
  const queryClient = useQueryClient();

  const examTypesQuery = useQuery({
    queryKey: scoringConversionKeys.examTypes,
    queryFn: getExamTypes,
    select: normalizeExamTypes,
  });

  const skillsQuery = useQuery({
    queryKey: scoringConversionKeys.skills,
    queryFn: getSkills,
    select: normalizeSkills,
  });

  const rulesQuery = useQuery({
    queryKey: scoringConversionKeys.rules(activeSkillId, examTypeFilter),
    queryFn: () =>
      activeSkillId && activeSkillId !== 'all'
        ? getScoringConversionsBySkill(activeSkillId, examTypeFilter)
        : getScoringConversions(),
    select: normalizeRules,
  });

  const invalidateRules = () =>
    queryClient.invalidateQueries({queryKey: ['scoring-conversion', 'rules']});

  const createMutation = useMutation({
    mutationFn: createScoringConversion,
    onSuccess: invalidateRules,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteScoringConversion,
    onSuccess: invalidateRules,
  });

  const bulkCreateMutation = useMutation({
    mutationFn: createScoringConversionsBulk,
    onSuccess: invalidateRules,
  });

  return {
    examTypes: examTypesQuery.data ?? [],
    skills: skillsQuery.data ?? [],
    scoringRules: rulesQuery.data ?? [],
    isLoading:
      examTypesQuery.isLoading || skillsQuery.isLoading || rulesQuery.isLoading,
    createMutation,
    deleteMutation,
    bulkCreateMutation,
  };
}
