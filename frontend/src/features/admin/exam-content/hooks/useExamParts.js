import { useQuery } from '@tanstack/react-query';

import { useAdminCrud } from '~/features/admin/hooks/useAdminCrud';
import {
  createExamPart,
  deleteExamPart,
  getExamParts,
  updateExamPart,
} from '~/shared/api/examPartApi';
import { getExamTypes } from '~/shared/api/examTypeApi';
import { getSkills } from '~/shared/api/skillApi';

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
  const crud = useAdminCrud({
    queryKey: examPartsKeys.examParts,
    list: getExamParts,
    mapItem: mapExamPartFromApi,
    create: (payload) => createExamPart(payload),
    update: ({ id, payload }) => updateExamPart(id, payload),
    remove: (id) => deleteExamPart(id),
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

  return {
    examParts: crud.items,
    examTypes: examTypesQuery.data ?? [],
    skills: skillsQuery.data ?? [],
    isLoading:
      crud.isLoading || examTypesQuery.isLoading || skillsQuery.isLoading,
    isError: crud.isError || examTypesQuery.isError || skillsQuery.isError,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}
