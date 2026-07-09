import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createExamPart,
  deleteExamPart,
  getExamParts,
  updateExamPart,
} from '~/api/examPartApi';
import { getExamTypes } from '~/api/examTypeApi';
import { getSkills } from '~/api/skillApi';

export const examPartsKeys = {
  examParts: ['exam-parts'],
  examTypes: ['exam-types'],
  skills: ['skills'],
};

const toArray = (data) => (Array.isArray(data) ? data : data?.content ?? []);

const mapExamPartFromApi = (item) => ({
  exam_part_id: String(item.examPartId),
  exam_type_id: String(item.examTypeId),
  skill_id: item.skillId ? String(item.skillId) : null,
  name: item.name || '',
  description: item.description || '',
  default_num_questions: item.defaultNumQuestions,
  display_order: item.displayOrder ?? 999,
});

const mapExamTypeFromApi = (item) => ({
  exam_type_id: String(item.examTypeId),
  name: item.name || '',
});

const mapSkillFromApi = (item) => ({
  skill_id: String(item.skillId),
  name: item.name || '',
});

export function useExamParts() {
  const qc = useQueryClient();

  const examPartsQuery = useQuery({
    queryKey: examPartsKeys.examParts,
    queryFn: getExamParts,
    select: (data) => toArray(data).map(mapExamPartFromApi),
  });

  const examTypesQuery = useQuery({
    queryKey: examPartsKeys.examTypes,
    queryFn: getExamTypes,
    select: (data) => toArray(data).map(mapExamTypeFromApi),
  });

  const skillsQuery = useQuery({
    queryKey: examPartsKeys.skills,
    queryFn: getSkills,
    select: (data) => toArray(data).map(mapSkillFromApi),
  });

  const invalidateExamParts = () =>
    qc.invalidateQueries({ queryKey: examPartsKeys.examParts });

  const createMutation = useMutation({
    mutationFn: (payload) => createExamPart(payload),
    onSuccess: invalidateExamParts,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateExamPart(id, payload),
    onSuccess: invalidateExamParts,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteExamPart(id),
    onSuccess: invalidateExamParts,
  });

  return {
    examParts: examPartsQuery.data ?? [],
    examTypes: examTypesQuery.data ?? [],
    skills: skillsQuery.data ?? [],
    isLoading:
      examPartsQuery.isLoading ||
      examTypesQuery.isLoading ||
      skillsQuery.isLoading,
    isError:
      examPartsQuery.isError || examTypesQuery.isError || skillsQuery.isError,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}
