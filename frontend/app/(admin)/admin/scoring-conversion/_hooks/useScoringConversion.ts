'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {getExamTypes} from '@/app/apis/examTypeApi';
import {
  createScoringConversion,
  createScoringConversionsBulk,
  deleteScoringConversion,
  getScoringConversions,
  getScoringConversionsBySkill,
} from '@/app/apis/scoringConversionApi';
import {getSkills} from '@/app/apis/skillApi';
import type {
  ExamTypeResponse,
  ScoringConversionRequest,
  ScoringConversionResponse,
  SkillResponse,
} from '@/app/types';

export const scoringConversionKeys = {
  examTypes: ['scoring-conversion', 'exam-types'],
  skills: ['scoring-conversion', 'skills'],
  rules: (skillId?: string, examTypeId?: string) => [
    'scoring-conversion',
    'rules',
    skillId ?? 'all',
    examTypeId ?? 'all',
  ],
};

export type ScoringExamTypeOption = {
  exam_type_id: string;
  name: string;
};

export type ScoringSkillOption = {
  skill_id: string;
  name: string;
};

export type ScoringRuleItem = {
  conversion_id: string;
  exam_type_id: string;
  skill_id: string;
  num_correct: number;
  converted_score: number;
};

const mapExamTypeFromApi = (item: ExamTypeResponse): ScoringExamTypeOption => ({
  exam_type_id: String(item.examTypeId),
  name: item.name || '',
});

const mapSkillFromApi = (item: SkillResponse): ScoringSkillOption => ({
  skill_id: String(item.skillId),
  name: item.name || '',
});

const mapScoringRuleFromApi = (item: ScoringConversionResponse): ScoringRuleItem => ({
  conversion_id: String(item.conversionId),
  exam_type_id: String(item.examTypeId),
  skill_id: String(item.skillId),
  num_correct: item.numCorrect || 0,
  converted_score: item.convertedScore || 0,
});

const normalizeExamTypes = (data: ExamTypeResponse[]): ScoringExamTypeOption[] =>
  Array.isArray(data) ? data.map(mapExamTypeFromApi) : [];
const normalizeSkills = (data: SkillResponse[]): ScoringSkillOption[] =>
  Array.isArray(data) ? data.map(mapSkillFromApi) : [];
const normalizeRules = (data: ScoringConversionResponse[]): ScoringRuleItem[] =>
  Array.isArray(data) ? data.map(mapScoringRuleFromApi) : [];

export function useScoringConversion(activeSkillId: string, examTypeFilter: string) {
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
    mutationFn: (payload: ScoringConversionRequest) => createScoringConversion(payload),
    onSuccess: invalidateRules,
  });

  const deleteMutation = useMutation({
    mutationFn: (conversionId: string) => deleteScoringConversion(conversionId),
    onSuccess: invalidateRules,
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (payload: ScoringConversionRequest[]) => createScoringConversionsBulk(payload),
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
