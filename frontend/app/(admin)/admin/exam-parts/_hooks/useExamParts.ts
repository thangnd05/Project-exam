'use client';

import { useQuery } from '@tanstack/react-query';

import { useAdminCrud } from '@/app/hooks/useAdminCrud';
import {
  createExamPart,
  deleteExamPart,
  getExamParts,
  updateExamPart,
} from '@/app/apis/examPartApi';
import { getExamTypes } from '@/app/apis/examTypeApi';
import { getSkills } from '@/app/apis/skillApi';
import type { ExamPartRequest, ExamPartResponse, ExamTypeResponse, SkillResponse } from '@/app/types';

export const examPartsKeys = {
  examParts: ['exam-parts'],
  examTypes: ['exam-types'],
  skills: ['skills'],
};

export type ExamPartItem = {
  exam_part_id: string;
  exam_type_id: string;
  skill_id: string | null;
  name: string;
  description: string;
  default_num_questions: number | undefined;
  display_order: number;
};

export type ExamPartExamTypeOption = {
  exam_type_id: string;
  name: string;
};

export type ExamPartSkillOption = {
  skill_id: string;
  name: string;
};

const toArray = <T,>(data: T[] | { content?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : data?.content ?? [];

const mapExamPartFromApi = (item: ExamPartResponse): ExamPartItem => ({
  exam_part_id: String(item.examPartId),
  exam_type_id: String(item.examTypeId),
  skill_id: item.skillId ? String(item.skillId) : null,
  name: item.name || '',
  description: item.description || '',
  default_num_questions: item.defaultNumQuestions,
  display_order: item.displayOrder ?? 999,
});

const mapExamTypeFromApi = (item: ExamTypeResponse): ExamPartExamTypeOption => ({
  exam_type_id: String(item.examTypeId),
  name: item.name || '',
});

const mapSkillFromApi = (item: SkillResponse): ExamPartSkillOption => ({
  skill_id: String(item.skillId),
  name: item.name || '',
});

export function useExamParts() {
  const crud = useAdminCrud({
    queryKey: examPartsKeys.examParts,
    list: getExamParts,
    mapItem: mapExamPartFromApi,
    create: (payload: ExamPartRequest) => createExamPart(payload),
    update: ({ id, payload }: { id: string; payload: ExamPartRequest }) => updateExamPart(id, payload),
    remove: (id: string) => deleteExamPart(id),
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
    examParts: crud.items as ExamPartItem[],
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
