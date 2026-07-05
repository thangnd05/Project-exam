import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {createSkill, deleteSkill, getSkills, updateSkill} from '~/api/skillApi';

export const skillKeys = {
  list: () => ['admin-skills'],
};

const mapSkillFromApi = (skill) => ({
  skill_id: String(skill.skillId),
  name: skill.name || '',
  description: skill.description || '',
});

const normalizeSkills = (data) =>
  (Array.isArray(data) ? data : data?.content ?? []).map(mapSkillFromApi);

export function useSkills() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({queryKey: skillKeys.list()});

  const skillsQuery = useQuery({
    queryKey: skillKeys.list(),
    queryFn: getSkills,
    select: normalizeSkills,
  });

  const createMutation = useMutation({
    mutationFn: createSkill,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({skillId, payload}) => updateSkill(skillId, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSkill,
    onSuccess: invalidate,
  });

  return {
    skillList: skillsQuery.data ?? [],
    isLoading: skillsQuery.isLoading,
    isError: skillsQuery.isError,
    createSkill: createMutation.mutateAsync,
    updateSkill: updateMutation.mutateAsync,
    deleteSkill: deleteMutation.mutateAsync,
  };
}
