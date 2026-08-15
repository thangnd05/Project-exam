'use client';

import {createSkill, deleteSkill, getSkills, updateSkill} from '@/app/apis/skillApi';
import {useAdminCrud} from '@/app/hooks/useAdminCrud';
import type {SkillRequest, SkillResponse} from '@/app/types';

export const skillKeys = {
  list: () => ['admin-skills'],
};

export type SkillItem = {
  skill_id: string;
  name: string;
  description: string;
};

const mapSkillFromApi = (skill: SkillResponse): SkillItem => ({
  skill_id: String(skill.skillId),
  name: skill.name || '',
  description: skill.description || '',
});

export function useSkills() {
  const crud = useAdminCrud({
    queryKey: skillKeys.list(),
    list: getSkills,
    create: (payload: SkillRequest) => createSkill(payload),
    update: ({skillId, payload}: {skillId: string; payload: SkillRequest}) => updateSkill(skillId, payload),
    remove: (skillId: string) => deleteSkill(skillId),
    mapItem: mapSkillFromApi,
  });

  return {
    skillList: crud.items as SkillItem[],
    isLoading: crud.isLoading,
    isError: crud.isError,
    createSkill: crud.createMutation.mutateAsync,
    updateSkill: crud.updateMutation.mutateAsync,
    deleteSkill: crud.deleteMutation.mutateAsync,
  };
}
