import {createSkill, deleteSkill, getSkills, updateSkill} from '~/shared/api/skillApi';
import {useAdminCrud} from '~/features/admin/hooks/useAdminCrud';

export const skillKeys = {
  list: () => ['admin-skills'],
};

const mapSkillFromApi = (skill) => ({
  skill_id: String(skill.skillId),
  name: skill.name || '',
  description: skill.description || '',
});

export function useSkills() {
  const crud = useAdminCrud({
    queryKey: skillKeys.list(),
    list: getSkills,
    create: createSkill,
    update: ({skillId, payload}) => updateSkill(skillId, payload),
    remove: deleteSkill,
    mapItem: mapSkillFromApi,
  });

  return {
    skillList: crud.items,
    isLoading: crud.isLoading,
    isError: crud.isError,
    createSkill: crud.createMutation.mutateAsync,
    updateSkill: crud.updateMutation.mutateAsync,
    deleteSkill: crud.deleteMutation.mutateAsync,
  };
}
